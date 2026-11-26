import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StockfishEngine } from '../engine/stockfishEngine.js';
import { parseUciMove } from '../utils/analysis.js';

export const MIN_DEPTH = 8;
export const MAX_DEPTH = 30;
export const DEFAULT_DEPTH = 16;
export const MAX_LINES = 3;

const EMPTY = { fen: null, lines: [], searching: false };
const INFO_THROTTLE_MS = 120;
const START_DEBOUNCE_MS = 150;

/**
 * Live analysis of the position currently shown on the board.
 *
 * By default the engine starts automatically when the app opens (`autoStart`) and
 * keeps analysing every position as it changes. It is kept alive (idle) when
 * stopped, so restarting is instant.
 *
 * phase: 'idle' (no engine yet) | 'loading' | 'ready' | 'error'
 *
 * @param {string} fen       position to analyse
 * @param {boolean} terminal true when the position has no legal moves
 * @param {{autoStart?: boolean}} [options] read once, on first render
 */
export function useStockfish(fen, terminal, { autoStart = true } = {}) {
  const [enabled, setEnabled] = useState(autoStart);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState(null);
  const [depth, setDepth] = useState(DEFAULT_DEPTH);
  const [multiPv, setMultiPv] = useState(1);
  const [analysis, setAnalysis] = useState(EMPTY);

  const engineRef = useRef(null);
  const jobIdRef = useRef(0);
  const latestInfoRef = useRef(null);
  const throttleRef = useRef(null);

  const clearThrottle = () => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
    latestInfoRef.current = null;
  };

  /* ---- load the engine the first time it is enabled ---- */
  useEffect(() => {
    if (!enabled || phase !== 'idle') return;

    setPhase('loading');
    setError(null);

    const engine = new StockfishEngine({
      onInfo: (lines, job) => {
        if (job.id !== jobIdRef.current) return;
        latestInfoRef.current = { lines, job };
        if (throttleRef.current) return;
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
          const latest = latestInfoRef.current;
          latestInfoRef.current = null;
          if (latest && latest.job.id === jobIdRef.current) {
            setAnalysis({ fen: latest.job.fen, lines: latest.lines, searching: true });
          }
        }, INFO_THROTTLE_MS);
      },
      onBestMove: (job, _best, lines) => {
        if (job.id !== jobIdRef.current) return;
        clearThrottle();
        setAnalysis({ fen: job.fen, lines, searching: false });
      },
      onError: (err) => {
        clearThrottle();
        engine.terminate();
        if (engineRef.current === engine) engineRef.current = null;
        setError(err.code || 'unknown');
        setPhase('error');
        setEnabled(false);
        setAnalysis((a) => ({ ...a, searching: false }));
      },
    });
    engineRef.current = engine;

    engine
      .init()
      .then(() => {
        if (engineRef.current === engine) setPhase('ready');
      })
      .catch((err) => {
        if (engineRef.current !== engine) return;
        engine.terminate();
        engineRef.current = null;
        setError(err.code || 'unknown');
        setPhase('error');
        setEnabled(false);
      });
  }, [enabled, phase]);

  /* ---- (re)start analysis when position / settings change ---- */
  useEffect(() => {
    const engine = engineRef.current;

    if (!enabled || phase !== 'ready' || !engine) {
      if (engine && phase === 'ready') engine.stop();
      // Keep results only for the position they belong to.
      setAnalysis((a) => {
        if (a.fen !== fen) return EMPTY;
        return a.searching ? { ...a, searching: false } : a;
      });
      return undefined;
    }

    if (terminal) {
      engine.stop();
      jobIdRef.current += 1;
      clearThrottle();
      setAnalysis({ fen, lines: [], searching: false });
      return undefined;
    }

    // Small debounce so rapidly stepping through moves doesn't thrash the engine.
    const timer = setTimeout(() => {
      jobIdRef.current += 1;
      clearThrottle();
      setAnalysis({ fen, lines: [], searching: true });
      engine.go({ id: jobIdRef.current, fen, depth, multiPv });
    }, START_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [enabled, phase, fen, depth, multiPv, terminal]);

  /* ---- cleanup on unmount ---- */
  useEffect(
    () => () => {
      clearThrottle();
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
    },
    [],
  );

  /** Start (true) or stop (false) live analysis. Starting after an error retries from scratch. */
  const setRunning = useCallback(
    (on) => {
      if (!on) {
        setEnabled(false);
        return;
      }
      if (phase === 'error') setPhase('idle');
      setError(null);
      setEnabled(true);
    },
    [phase],
  );

  const toggle = useCallback(() => setRunning(!enabled), [enabled, setRunning]);

  const lines = useMemo(() => (analysis.fen === fen ? analysis.lines : []), [analysis, fen]);

  const searching =
    enabled && phase === 'ready' && !terminal && (analysis.fen !== fen || analysis.searching);

  // Keyed on the move string so the arrow object only changes when the best move
  // does (not on every engine update); that keeps the board from re-rendering.
  // The arrow is only COMPUTED here; whether it is drawn is a user setting, and
  // hiding it never affects the analysis itself.
  const topMove = lines[0] ? lines[0].pv[0] : null;
  const arrow = useMemo(() => parseUciMove(topMove), [topMove]);

  // The evaluation bar must never flash back to "equal" while a new position is
  // being searched: keep showing the last known evaluation, flagged as stale.
  const retainedLineRef = useRef(null);
  if (lines[0]) retainedLineRef.current = lines[0];
  const evalLine = lines[0] || retainedLineRef.current;
  const evalStale = !lines[0];

  return {
    enabled,
    phase,
    error,
    depth,
    setDepth,
    multiPv,
    setMultiPv,
    toggle,
    setRunning,
    lines,
    searching,
    terminal,
    arrow,
    evalLine,
    evalStale,
  };
}
