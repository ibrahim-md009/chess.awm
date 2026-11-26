/*
 * Thin UCI wrapper around the Stockfish Web Worker.
 *
 * - Loads public/engine/engine.json (written by scripts/copy-engine.mjs) to find
 *   the engine file name, then starts it as a classic Web Worker.
 * - Runs one search at a time. Starting a new search while one is running sends
 *   `stop` first and only starts the new search after the old `bestmove`
 *   arrives, so results of an old search can never leak into a new one.
 * - Scores are converted to WHITE's point of view (UCI reports them from the
 *   side to move).
 */

const INIT_TIMEOUT_MS = 30000;
const READY_TIMEOUT_MS = 10000;
const MAX_MULTIPV = 3;

export class EngineError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

function engineUrl(file) {
  return new URL(`${import.meta.env.BASE_URL}engine/${file}`, document.baseURI).href;
}

/**
 * Parse one UCI "info" line. Returns null for lines that carry no usable
 * score + principal variation (e.g. "info string ...", "info currmove ...",
 * or bound-only scores).
 */
export function parseInfoLine(line, turn) {
  const t = line.trim().split(/\s+/);
  if (t[0] !== 'info') return null;
  if (t.includes('lowerbound') || t.includes('upperbound')) return null;

  const pvIdx = t.indexOf('pv');
  const scoreIdx = t.indexOf('score');
  if (pvIdx === -1 || scoreIdx === -1) return null;

  const kind = t[scoreIdx + 1];
  const value = parseInt(t[scoreIdx + 2], 10);
  if ((kind !== 'cp' && kind !== 'mate') || !Number.isFinite(value)) return null;

  const num = (key, fallback = null) => {
    const i = t.indexOf(key);
    if (i === -1) return fallback;
    const n = Number(t[i + 1]);
    return Number.isFinite(n) ? n : fallback;
  };

  const sign = turn === 'w' ? 1 : -1;
  const pv = t.slice(pvIdx + 1).filter((m) => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m));
  if (pv.length === 0) return null;

  return {
    multipv: num('multipv', 1),
    depth: num('depth', 0),
    seldepth: num('seldepth'),
    nodes: num('nodes'),
    nps: num('nps'),
    cp: kind === 'cp' ? value * sign : null,
    mate: kind === 'mate' ? value * sign : null,
    pv,
  };
}

export class StockfishEngine {
  /**
   * @param {object} handlers
   * @param {(lines:object[], job:object)=>void} handlers.onInfo
   * @param {(job:object, bestMove:string|null, lines:object[])=>void} handlers.onBestMove
   * @param {(err:EngineError)=>void} handlers.onError  runtime failures after init
   */
  constructor({ onInfo, onBestMove, onError }) {
    this.onInfo = onInfo;
    this.onBestMove = onBestMove;
    this.onError = onError;

    this.worker = null;
    this.ready = false;
    this.searching = false;
    this.superseded = false;
    this.current = null;
    this.pending = null;
    this.lines = new Map();
    this.multiPv = 1;
    this.waiters = [];
  }

  /* ---------------- lifecycle ---------------- */

  async init() {
    if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
      throw new EngineError('unsupported');
    }

    let manifest;
    try {
      const res = await fetch(engineUrl('engine.json'), { cache: 'no-cache' });
      if (!res.ok) throw new Error('missing');
      manifest = await res.json(); // throws if the dev server answered with HTML
      if (!manifest || typeof manifest.file !== 'string') throw new Error('bad manifest');
    } catch {
      throw new EngineError('engineMissing');
    }

    try {
      this.worker = new Worker(engineUrl(manifest.file));
    } catch {
      throw new EngineError('engineMissing');
    }

    this.worker.onmessage = (ev) => this._onMessage(ev.data);
    this.worker.onerror = (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      this._fail(new EngineError(this.ready ? 'crashed' : 'engineMissing'));
    };

    try {
      const uciok = this._waitFor('uciok', INIT_TIMEOUT_MS);
      this._send('uci');
      await uciok;

      this._send('setoption name Hash value 32');
      const readyok = this._waitFor('readyok', READY_TIMEOUT_MS);
      this._send('isready');
      await readyok;
    } catch (err) {
      this.terminate();
      throw err instanceof EngineError ? err : new EngineError('unknown');
    }

    this.ready = true;
  }

  terminate() {
    this.ready = false;
    this.searching = false;
    this.pending = null;
    this.current = null;
    this.superseded = false;
    const waiters = this.waiters;
    this.waiters = [];
    // Reject (not just drop) pending init waiters so an aborted init never hangs.
    waiters.forEach((w) => {
      clearTimeout(w.timer);
      w.reject(new EngineError('unknown', 'Engine terminated'));
    });
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      try {
        this.worker.terminate();
      } catch {
        /* already gone */
      }
      this.worker = null;
    }
  }

  /* ---------------- searching ---------------- */

  /**
   * Start analysing a position. If a search is running it is stopped first.
   * @param {{id:number,fen:string,depth:number,multiPv:number}} job
   */
  go(job) {
    if (!this.ready) return;
    if (this.searching) {
      this.pending = job;
      this.superseded = true;
      this._send('stop');
    } else {
      this._start(job);
    }
  }

  /** Stop the running search (its final result is still reported). */
  stop() {
    this.pending = null;
    if (this.searching) this._send('stop');
  }

  _start(job) {
    const multiPv = Math.min(MAX_MULTIPV, Math.max(1, job.multiPv || 1));
    this.current = { ...job, turn: job.fen.split(' ')[1] === 'b' ? 'b' : 'w' };
    this.lines = new Map();
    this.searching = true;
    this.superseded = false;

    if (multiPv !== this.multiPv) {
      this._send(`setoption name MultiPV value ${multiPv}`);
      this.multiPv = multiPv;
    }
    this._send(`position fen ${job.fen}`);
    this._send(`go depth ${Math.max(1, Math.floor(job.depth))}`);
  }

  /* ---------------- messages ---------------- */

  _send(cmd) {
    if (this.worker) this.worker.postMessage(cmd);
  }

  _sortedLines() {
    return Array.from(this.lines.values()).sort((a, b) => a.multipv - b.multipv);
  }

  _onMessage(data) {
    if (typeof data !== 'string') return;
    const line = data.trim();
    if (!line) return;

    // Resolve any init waiters ("uciok" / "readyok").
    for (let i = this.waiters.length - 1; i >= 0; i -= 1) {
      const w = this.waiters[i];
      if (line === w.token) {
        clearTimeout(w.timer);
        this.waiters.splice(i, 1);
        w.resolve();
      }
    }

    if (line.startsWith('info ')) {
      if (!this.searching || !this.current) return;
      const parsed = parseInfoLine(line, this.current.turn);
      if (!parsed) return;
      this.lines.set(parsed.multipv, parsed);
      this.onInfo(this._sortedLines(), this.current);
      return;
    }

    if (line.startsWith('bestmove')) {
      const job = this.current;
      const wasSuperseded = this.superseded;
      const lines = this._sortedLines();
      const parts = line.split(/\s+/);
      const best = parts[1] && parts[1] !== '(none)' ? parts[1] : null;

      this.searching = false;
      this.superseded = false;
      this.current = null;

      if (job && !wasSuperseded) this.onBestMove(job, best, lines);

      if (this.pending) {
        const next = this.pending;
        this.pending = null;
        this._start(next);
      }
    }
  }

  _waitFor(token, ms) {
    return new Promise((resolve, reject) => {
      const waiter = { token, resolve, reject: null, timer: null };
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter((w) => w !== waiter);
        reject(new EngineError('timeout'));
      }, ms);
      waiter.reject = reject;
      this.waiters.push(waiter);
    });
  }

  _fail(err) {
    if (!this.ready) {
      // Failure during init: reject whatever init is waiting for.
      const waiters = this.waiters;
      this.waiters = [];
      waiters.forEach((w) => {
        clearTimeout(w.timer);
        w.reject(err);
      });
      return;
    }
    this.onError(err);
  }
}
