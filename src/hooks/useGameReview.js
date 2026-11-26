import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluatePositions } from '../engine/gameReview.js';
import { analyzeGame } from '../utils/review.js';

export const REVIEW_DEPTHS = [10, 14, 18];
export const DEFAULT_REVIEW_DEPTH = 14;

const IDLE = { status: 'idle', progress: { done: 0, total: 0 }, result: null, error: null };

/**
 * Full-game review of the CURRENT move list.
 *
 * status: 'idle' | 'running' | 'done' | 'error'
 *
 * If the game changes (new move, undo, import, reset) while a review is running
 * it is aborted, and a finished result is discarded, because it would no longer
 * describe the game on screen.
 */
export function useGameReview(startFen, moves) {
  const [state, setState] = useState(IDLE);
  const [depth, setDepth] = useState(DEFAULT_REVIEW_DEPTH);
  const controllerRef = useRef(null);

  const gameKey = useMemo(
    () => `${startFen}|${moves.map((m) => `${m.from}${m.to}${m.promotion || ''}`).join(',')}`,
    [startFen, moves],
  );

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Game changed: abort anything running and drop stale results.
  useEffect(() => {
    cancel();
    setState(IDLE);
  }, [gameKey, cancel]);

  // Abort on unmount.
  useEffect(() => cancel, [cancel]);

  const start = useCallback(async () => {
    if (moves.length === 0 || controllerRef.current) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    const fens = [startFen, ...moves.map((m) => m.fen)];

    setState({ status: 'running', progress: { done: 0, total: fens.length }, result: null, error: null });

    try {
      const positions = await evaluatePositions({
        fens,
        depth,
        signal: controller.signal,
        onProgress: (done, total) => {
          if (controller.signal.aborted) return;
          setState((s) => (s.status === 'running' ? { ...s, progress: { done, total } } : s));
        },
      });
      if (controller.signal.aborted) return;

      const result = analyzeGame({ startFen, moves, positions });
      setState({ status: 'done', progress: { done: fens.length, total: fens.length }, result, error: null });
    } catch (err) {
      if (controller.signal.aborted || err.name === 'AbortError') return;
      setState({ ...IDLE, status: 'error', error: err.code || 'unknown' });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [moves, startFen, depth]);

  return {
    status: state.status,
    progress: state.progress,
    result: state.result,
    error: state.error,
    depth,
    setDepth,
    start,
    cancel, // used internally for now; a cancel button arrives with the Phase 4 interface
  };
}
