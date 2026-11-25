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
 * The engine is loaded lazily the first time the user starts it, and kept alive
 * (idle) when they stop it, so restarting is instant.
 *
 * phase: 'idle' (no engine yet) | 'loading' | 'ready' | 'error'
 *
 * @param {string} fen       position to analyse
 * @param {boolean} terminal true when the position has no legal moves
 */
export function useStockfish(fen, terminal) {
  const [enabled, setEnabled] = useState(false);
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

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      return;
    }
    if (phase === 'error') setPhase('idle'); // retry from scratch
    setError(null);
    setEnabled(true);
  }, [enabled, phase]);

  const lines = useMemo(() => (analysis.fen === fen ? analysis.lines : []), [analysis, fen]);

  const searching =
    enabled && phase === 'ready' && !terminal && (analysis.fen !== fen || analysis.searching);

  const arrow = useMemo(() => {
    const top = lines[0];
    return top ? parseUciMove(top.pv[0]) : null;
  }, [lines]);

  return {
    enabled,
    phase,
    error,
    depth,
    setDepth,
    multiPv,
    setMultiPv,
    toggle,
    lines,
    searching,
    terminal,
    arrow,
  };
}
