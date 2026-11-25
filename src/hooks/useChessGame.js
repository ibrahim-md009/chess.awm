import { useCallback, useMemo, useReducer } from 'react';
import { Chess } from 'chess.js';
import {
  START_FEN,
  createMoveRecord,
  fenAtPly,
  getGameStatus,
  getStartFullmove,
  parseFen,
  parsePgn,
} from '../utils/chess.js';

/**
 * Single source of truth for the game.
 *
 * state = {
 *   startFen,     // position the game starts from
 *   moves,        // [{ san, from, to, color, piece, captured, promotion, fen }]
 *   headers,      // PGN headers (cleaned), {} when not imported from PGN
 *   ply,          // how many half-moves are currently shown (0..moves.length)
 *   orientation,  // 'white' | 'black'
 * }
 *
 * Move legality is validated inside the reducer, so a stale or duplicated
 * dispatch can never corrupt the move list.
 */
const initialState = {
  startFen: START_FEN,
  moves: [],
  headers: {},
  ply: 0,
  orientation: 'white',
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        startFen: action.startFen,
        moves: action.moves,
        headers: action.headers,
        ply: 0,
      };

    case 'RESET':
      return { ...initialState, orientation: state.orientation };

    case 'PLAY': {
      const { from, to, promotion } = action;

      // Re-playing the next move of the current line just advances.
      const next = state.moves[state.ply];
      if (
        next &&
        next.from === from &&
        next.to === to &&
        (next.promotion || null) === (promotion || null)
      ) {
        return { ...state, ply: state.ply + 1 };
      }

      // Otherwise validate against the position currently shown.
      let result = null;
      try {
        const chess = new Chess(fenAtPly(state, state.ply));
        result = chess.move({ from, to, promotion });
      } catch {
        return state; // illegal move
      }
      if (!result) return state;

      // Playing a different move from an earlier position replaces the rest
      // of the line (there is no variation tree in Phase 1).
      return {
        ...state,
        moves: [...state.moves.slice(0, state.ply), createMoveRecord(result)],
        ply: state.ply + 1,
      };
    }

    case 'UNDO': {
      if (state.moves.length === 0) return state;
      const moves = state.moves.slice(0, -1);
      return { ...state, moves, ply: Math.min(state.ply, moves.length) };
    }

    case 'GOTO': {
      const ply = Math.max(0, Math.min(action.ply, state.moves.length));
      return ply === state.ply ? state : { ...state, ply };
    }
    case 'FIRST':
      return state.ply === 0 ? state : { ...state, ply: 0 };
    case 'PREV':
      return state.ply === 0 ? state : { ...state, ply: state.ply - 1 };
    case 'NEXT':
      return state.ply >= state.moves.length
        ? state
        : { ...state, ply: state.ply + 1 };
    case 'LAST':
      return state.ply === state.moves.length
        ? state
        : { ...state, ply: state.moves.length };

    case 'FLIP':
      return {
        ...state,
        orientation: state.orientation === 'white' ? 'black' : 'white',
      };

    default:
      return state;
  }
}

export function useChessGame() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { startFen, moves, headers, ply, orientation } = state;

  const fen = fenAtPly(state, ply);
  const lastMove = ply > 0 ? moves[ply - 1] : null;
  const status = useMemo(() => getGameStatus(fen), [fen]);
  const startFullmove = useMemo(() => getStartFullmove(startFen), [startFen]);

  /* ---- actions ---- */

  /** Returns true when the move is legal (used by the board for feedback). */
  const makeMove = useCallback(
    (from, to, promotion) => {
      try {
        const probe = new Chess(fen);
        if (!probe.move({ from, to, promotion })) return false;
      } catch {
        return false;
      }
      dispatch({ type: 'PLAY', from, to, promotion });
      return true;
    },
    [fen],
  );

  const goTo = useCallback((p) => dispatch({ type: 'GOTO', ply: p }), []);
  const goFirst = useCallback(() => dispatch({ type: 'FIRST' }), []);
  const goPrev = useCallback(() => dispatch({ type: 'PREV' }), []);
  const goNext = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const goLast = useCallback(() => dispatch({ type: 'LAST' }), []);
  const flip = useCallback(() => dispatch({ type: 'FLIP' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  /** @returns {{ok:boolean,error?:string}} */
  const loadFen = useCallback((text) => {
    const parsed = parseFen(text);
    if (!parsed.ok) return parsed;
    dispatch({
      type: 'LOAD',
      startFen: parsed.startFen,
      moves: [],
      headers: {},
    });
    return { ok: true };
  }, []);

  /** @returns {{ok:boolean,error?:string,moveCount?:number}} */
  const loadPgn = useCallback((text) => {
    const parsed = parsePgn(text);
    if (!parsed.ok) return parsed;
    dispatch({
      type: 'LOAD',
      startFen: parsed.startFen,
      moves: parsed.moves,
      headers: parsed.headers,
    });
    return { ok: true, moveCount: parsed.moves.length };
  }, []);

  return {
    // state
    fen,
    startFen,
    moves,
    headers,
    ply,
    orientation,
    lastMove,
    status,
    startFullmove,
    // derived flags
    canPrev: ply > 0,
    canNext: ply < moves.length,
    canUndo: moves.length > 0,
    // actions
    makeMove,
    goTo,
    goFirst,
    goPrev,
    goNext,
    goLast,
    flip,
    undo,
    reset,
    loadFen,
    loadPgn,
  };
}
