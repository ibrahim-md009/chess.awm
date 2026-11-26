import { Chess } from 'chess.js';

export const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/* ------------------------------------------------------------------ */
/* Move records                                                        */
/* ------------------------------------------------------------------ */

/**
 * Convert a chess.js verbose move into the plain record stored in app state.
 * `fen` is the position AFTER the move, which lets us jump to any ply without
 * replaying the game.
 */
export function createMoveRecord(m) {
  return {
    san: m.san,
    from: m.from,
    to: m.to,
    color: m.color,
    piece: m.piece,
    captured: m.captured ?? null,
    promotion: m.promotion ?? null,
    fen: m.after,
  };
}

/** FEN of the position after `ply` half-moves (0 = start position). */
export function fenAtPly(game, ply) {
  return ply <= 0 ? game.startFen : game.moves[ply - 1].fen;
}

/** Full-move number of the start position (1 for a normal game). */
export function getStartFullmove(startFen) {
  const n = parseInt(startFen.split(' ')[5], 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Group the flat move list into rows of { num, w, b } where w / b are indexes
 * into `moves` (or null). Handles games that start with Black to move.
 */
export function buildMoveRows(moves, startFullmove = 1) {
  const rows = [];
  let num = startFullmove;
  let current = null;

  moves.forEach((m, i) => {
    if (m.color === 'w') {
      current = { num, w: i, b: null };
      rows.push(current);
    } else {
      if (!current) {
        current = { num, w: null, b: i };
        rows.push(current);
      } else {
        current.b = i;
      }
      current = null;
      num += 1;
    }
  });

  return rows;
}

/* ------------------------------------------------------------------ */
/* FEN                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Be forgiving about incomplete FEN strings: if trailing fields are missing
 * (e.g. only the piece placement was pasted) fill in neutral defaults.
 */
export function normalizeFen(raw) {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  const defaults = ['', 'w', '-', '-', '0', '1'];
  for (let i = parts.length; i < 6; i += 1) parts.push(defaults[i]);
  return parts.slice(0, 6).join(' ');
}

/** Upper bound for pasted FEN / PGN text (protects the UI from huge pastes). */
export const MAX_INPUT_CHARS = 200000;

/** @returns {{ok:true,startFen:string}|{ok:false,error:string}} */
export function parseFen(raw) {
  if (!raw || !raw.trim()) return { ok: false, error: 'empty' };
  if (raw.length > MAX_INPUT_CHARS) return { ok: false, error: 'tooLarge' };
  try {
    const chess = new Chess(normalizeFen(raw));
    return { ok: true, startFen: chess.fen() };
  } catch {
    return { ok: false, error: 'invalidFen' };
  }
}

/* ------------------------------------------------------------------ */
/* PGN                                                                 */
/* ------------------------------------------------------------------ */

function cleanHeaders(rawHeaders) {
  const out = {};
  Object.entries(rawHeaders || {}).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    const v = value.trim();
    if (!v || v === '?' || v === '????.??.??' || v === '*') return;
    out[key] = v;
  });
  return out;
}

/** Strip a BOM and normalise line endings (files saved on Windows / by some editors). */
function normalizePgnText(raw) {
  return raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
}

/**
 * When several games are pasted together, keep only the first one: cut the text
 * at the second "[Event " tag. (Assumes the usual PGN layout where each game
 * starts with its Event tag.)
 */
function firstGameOnly(text) {
  const re = /^\[Event\s/gm;
  re.exec(text); // the first game's Event tag
  const second = re.exec(text);
  return second ? text.slice(0, second.index).trim() : text;
}

/**
 * Parse a PGN string (first game only).
 * @returns {{ok:true,startFen:string,moves:object[],headers:object}|{ok:false,error:string}}
 */
export function parsePgn(raw) {
  if (!raw || !raw.trim()) return { ok: false, error: 'empty' };
  if (raw.length > MAX_INPUT_CHARS) return { ok: false, error: 'tooLarge' };

  const chess = new Chess();
  try {
    chess.loadPgn(firstGameOnly(normalizePgnText(raw)));
  } catch {
    return { ok: false, error: 'invalidPgn' };
  }

  const history = chess.history({ verbose: true });
  const rawHeaders = chess.header();
  const hasFenHeader = Boolean(rawHeaders && rawHeaders.FEN);

  if (history.length === 0 && !hasFenHeader) {
    return { ok: false, error: 'noMoves' };
  }

  const startFen = history.length > 0 ? history[0].before : chess.fen();

  return {
    ok: true,
    startFen,
    moves: history.map(createMoveRecord),
    headers: cleanHeaders(rawHeaders),
  };
}

/* ------------------------------------------------------------------ */
/* Position status                                                     */
/* ------------------------------------------------------------------ */

/**
 * Describe a position: whose turn it is, check / mate / draw flags and the
 * square of the king in check (for highlighting).
 */
export function getGameStatus(fen) {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const check = chess.inCheck();
  const checkmate = chess.isCheckmate();
  const halfmoveClock = parseInt(fen.split(' ')[4], 10) || 0;

  let kingSquare = null;
  if (check) {
    for (const row of chess.board()) {
      for (const sq of row) {
        if (sq && sq.type === 'k' && sq.color === turn) kingSquare = sq.square;
      }
    }
  }

  return {
    turn,
    check,
    checkmate,
    stalemate: chess.isStalemate(),
    insufficient: chess.isInsufficientMaterial(),
    fiftyMove: halfmoveClock >= 100 && !checkmate,
    kingSquare,
  };
}
