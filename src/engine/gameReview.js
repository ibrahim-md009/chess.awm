/*
 * Evaluates every position of a game with Stockfish, one after the other, using
 * a DEDICATED engine instance (so it never interferes with the live-analysis
 * engine). Results are returned in the shape expected by utils/review.js.
 */

import { Chess } from 'chess.js';
import { EngineError, StockfishEngine } from './stockfishEngine.js';

const REVIEW_MULTIPV = 2; // second line is needed to detect "only moves" (Great)
const FINAL_CP = 10000;

export class AbortError extends Error {
  constructor() {
    super('Review aborted');
    this.name = 'AbortError';
  }
}

const lite = (line) =>
  line
    ? { cp: line.cp, mate: line.mate, depth: line.depth, pv: line.pv.slice(0, 8) }
    : null;

/** Evaluate positions that need no search (checkmate, stalemate, dead draw). */
function terminalEvaluation(fen) {
  let chess;
  try {
    chess = new Chess(fen);
  } catch {
    return null;
  }
  if (chess.isCheckmate()) {
    // The side to move is mated; scores are from White's point of view.
    const whiteMated = chess.turn() === 'w';
    return { cp: whiteMated ? -FINAL_CP : FINAL_CP, mate: null, depth: 0, pv: [], second: null, final: true };
  }
  if (chess.isStalemate() || chess.isInsufficientMaterial()) {
    return { cp: 0, mate: null, depth: 0, pv: [], second: null, final: true };
  }
  return null;
}

/**
 * @param {object} options
 * @param {string[]} options.fens     positions in game order (start position first)
 * @param {number} options.depth      fixed search depth per position
 * @param {AbortSignal} options.signal
 * @param {(done:number,total:number)=>void} [options.onProgress]
 * @returns {Promise<object[]>} one evaluation per FEN
 */
export async function evaluatePositions({ fens, depth, signal, onProgress }) {
  if (signal.aborted) throw new AbortError();

  // The engine is only needed if at least one position requires a search.
  const terminals = fens.map(terminalEvaluation);
  const needsEngine = terminals.some((t) => t === null);

  let current = null; // { id, resolve, reject }
  let nextId = 0;
  let engine = null;

  const onAbort = () => {
    const pending = current;
    current = null;
    if (engine) engine.terminate();
    if (pending) pending.reject(new AbortError());
  };
  signal.addEventListener('abort', onAbort);

  try {
    if (needsEngine) {
      engine = new StockfishEngine({
        onInfo: () => {},
        onBestMove: (job, _best, lines) => {
          if (current && job.id === current.id) {
            const pending = current;
            current = null;
            pending.resolve(lines);
          }
        },
        onError: (err) => {
          const pending = current;
          current = null;
          if (pending) pending.reject(err);
        },
      });
      await engine.init();
      if (signal.aborted) throw new AbortError();
    }

    const search = (fen) =>
      new Promise((resolve, reject) => {
        nextId += 1;
        current = { id: nextId, resolve, reject };
        engine.go({ id: nextId, fen, depth, multiPv: REVIEW_MULTIPV });
      });

    const cache = new Map();
    const results = [];

    for (let i = 0; i < fens.length; i += 1) {
      if (signal.aborted) throw new AbortError();
      const fen = fens[i];

      let evaluation = terminals[i] || cache.get(fen);
      if (!evaluation) {
        const lines = await search(fen);
        if (signal.aborted) throw new AbortError();
        if (!lines || lines.length === 0) throw new EngineError('unknown');
        evaluation = { ...lite(lines[0]), second: lite(lines[1]), final: false };
        cache.set(fen, evaluation);
      }

      results.push(evaluation);
      if (onProgress) onProgress(i + 1, fens.length);
    }

    return results;
  } finally {
    signal.removeEventListener('abort', onAbort);
    if (engine) engine.terminate();
  }
}
