/*
 * Pure game-review logic: no engine, no React. Given the engine's evaluation of
 * every position in a game it produces centipawn loss, a classification for
 * every move, per-player accuracy and statistics.
 *
 * IMPORTANT: the thresholds and the Brilliant / Great heuristics below are our
 * own approximations of the ideas used by Lichess and Chess.com. They are not
 * identical to either site, so results will differ from theirs.
 *
 * Conventions
 *  - Engine lines are stored from WHITE's point of view: { cp, mate }.
 *  - "mover" values are from the point of view of the side that played the move.
 *  - Win percentages are 0..100.
 */

import { Chess } from 'chess.js';

export const CLASSIFICATIONS = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
];

/** Maximum win-percentage points lost for each class (when not Best/Great/Brilliant). */
export const THRESHOLDS = {
  excellent: 2,
  good: 5,
  inaccuracy: 10,
  mistake: 20, // anything above is a blunder
};

const GREAT_MIN_GAP = 12; // best move vs. second-best line, in win% points
const BRILLIANT_MIN_SACRIFICE = 2; // net pawns given up (a knight for a pawn = 2)
const BRILLIANT_MIN_AFTER = 45; // mover must not be worse after the move
const BRILLIANT_MAX_BEFORE = 90; // ...and must not already be winning
const CP_CAP = 1000;
const FINAL_CP = 10000; // synthetic score for a checkmated position

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

/** White's winning chances, 0..100 (Lichess' logistic model). */
export function winPercent(line) {
  if (!line) return 50;
  if (line.mate !== null && line.mate !== undefined) return line.mate > 0 ? 100 : 0;
  const cp = line.cp ?? 0;
  if (cp >= FINAL_CP) return 100;
  if (cp <= -FINAL_CP) return 0;
  const c = Math.max(-CP_CAP, Math.min(CP_CAP, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

/** Centipawn value of a line, mates and extremes capped to ±1000. */
export function cpValue(line) {
  if (!line) return 0;
  if (line.mate !== null && line.mate !== undefined) return line.mate > 0 ? CP_CAP : -CP_CAP;
  return Math.max(-CP_CAP, Math.min(CP_CAP, line.cp ?? 0));
}

const moverPct = (whitePct, color) => (color === 'w' ? whitePct : 100 - whitePct);
const moverCp = (line, color) => (color === 'w' ? cpValue(line) : -cpValue(line));

/** Per-move accuracy (0..100) from win-percentage points lost (Lichess formula). */
export function moveAccuracy(winLoss) {
  const acc = 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

/* ------------------------------------------------------------------ */
/* Sacrifice detection (for Brilliant)                                 */
/* ------------------------------------------------------------------ */

/**
 * Static exchange: the best material the side to move can win by capturing on
 * `square` (it may also stop, so the result is never negative). Uses legal
 * moves, so pins and checks are respected.
 */
function exchangeGain(chess, square, depth) {
  if (depth === 0) return 0;
  let best = 0;
  for (const m of chess.moves({ verbose: true })) {
    if (m.to !== square || !m.captured) continue;
    const captured = PIECE_VALUE[m.captured] + (m.promotion ? PIECE_VALUE[m.promotion] - 1 : 0);
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const gain = captured - exchangeGain(chess, square, depth - 1);
    chess.undo();
    if (gain > best) best = gain;
  }
  return best;
}

/**
 * Heuristic: did the move leave the moved piece on a square where the opponent
 * wins at least BRILLIANT_MIN_SACRIFICE pawns net, after accounting for what
 * the move itself captured and for recaptures?
 */
function isSacrifice(afterFen, move) {
  if (move.piece === 'k' || move.promotion) return false;
  let chess;
  try {
    chess = new Chess(afterFen);
  } catch {
    return false;
  }
  const gain = exchangeGain(chess, move.to, 6);
  const captured = move.captured ? PIECE_VALUE[move.captured] : 0;
  return gain - captured >= BRILLIANT_MIN_SACRIFICE;
}

/* ------------------------------------------------------------------ */
/* Classification                                                      */
/* ------------------------------------------------------------------ */

function classifyByLoss(winLoss) {
  if (winLoss <= THRESHOLDS.excellent) return 'excellent';
  if (winLoss <= THRESHOLDS.good) return 'good';
  if (winLoss <= THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (winLoss <= THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

function bestSanFor(fen, uci) {
  if (!uci) return null;
  try {
    const chess = new Chess(fen);
    return chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Accuracy                                                            */
/* ------------------------------------------------------------------ */

/**
 * Volatility weight for each move: moves played in sharp, swingy stretches of
 * the game count more than moves in quiet ones (idea taken from Lichess).
 */
function volatilityWeights(winSeries) {
  const n = winSeries.length - 1;
  const size = Math.max(2, Math.min(8, Math.floor(winSeries.length / 10)));
  const weights = [];
  for (let i = 0; i < n; i += 1) {
    const window = winSeries.slice(i, i + size);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
    weights.push(Math.max(0.5, Math.min(12, Math.sqrt(variance))));
  }
  return weights;
}

/** Average of the volatility-weighted mean and the harmonic mean. */
function combineAccuracy(items) {
  if (items.length === 0) return null;
  const weightSum = items.reduce((s, it) => s + it.weight, 0);
  const weighted = items.reduce((s, it) => s + it.accuracy * it.weight, 0) / weightSum;
  const harmonic = items.length / items.reduce((s, it) => s + 1 / Math.max(it.accuracy, 0.5), 0);
  return Math.max(0, Math.min(100, (weighted + harmonic) / 2));
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {object} input
 * @param {string} input.startFen
 * @param {object[]} input.moves      move records (see utils/chess.js createMoveRecord)
 * @param {object[]} input.positions  engine result per position, length moves.length + 1:
 *   { cp, mate, depth, pv: string[], second: {cp,mate}|null, final: boolean }
 */
export function analyzeGame({ startFen, moves, positions }) {
  if (positions.length !== moves.length + 1) {
    throw new Error('positions must contain one entry per position (moves + 1)');
  }

  const winSeries = positions.map(winPercent);
  const weights = volatilityWeights(winSeries);

  const results = moves.map((move, i) => {
    const color = move.color;
    const beforeFen = i === 0 ? startFen : moves[i - 1].fen;
    const before = positions[i];
    const after = positions[i + 1];

    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;
    const bestUci = before.pv && before.pv.length > 0 ? before.pv[0] : null;
    const playedIsBest = bestUci !== null && bestUci === playedUci;

    const pctBefore = moverPct(winSeries[i], color);
    const pctAfter = moverPct(winSeries[i + 1], color);
    const winLoss = playedIsBest ? 0 : Math.max(0, pctBefore - pctAfter);
    const cpLoss = playedIsBest
      ? 0
      : Math.max(0, Math.round(moverCp(before, color) - moverCp(after, color)));

    // Gap between the best and the second-best option (win% points, mover view).
    let gap = null;
    if (before.second) {
      gap = pctBefore - moverPct(winPercent(before.second), color);
    }

    const obviousRecapture =
      i > 0 && Boolean(moves[i - 1].captured) && moves[i - 1].to === move.to;

    let classification;
    if (
      winLoss <= THRESHOLDS.excellent &&
      pctAfter >= BRILLIANT_MIN_AFTER &&
      pctBefore <= BRILLIANT_MAX_BEFORE &&
      isSacrifice(move.fen, move)
    ) {
      classification = 'brilliant';
    } else if (playedIsBest && gap !== null && gap >= GREAT_MIN_GAP && !obviousRecapture) {
      classification = 'great';
    } else if (playedIsBest) {
      classification = 'best';
    } else {
      classification = classifyByLoss(winLoss);
    }

    return {
      ply: i + 1,
      san: move.san,
      color,
      uci: playedUci,
      bestUci,
      bestSan: bestSanFor(beforeFen, bestUci),
      playedIsBest,
      cpLoss,
      winLoss,
      winBefore: pctBefore,
      winAfter: pctAfter,
      accuracy: moveAccuracy(winLoss),
      weight: weights[i],
      classification,
    };
  });

  const summary = {};
  ['w', 'b'].forEach((color) => {
    const mine = results.filter((r) => r.color === color);
    const counts = Object.fromEntries(CLASSIFICATIONS.map((c) => [c, 0]));
    mine.forEach((r) => {
      counts[r.classification] += 1;
    });
    summary[color] = {
      moveCount: mine.length,
      accuracy: combineAccuracy(mine.map((r) => ({ accuracy: r.accuracy, weight: r.weight }))),
      avgCpLoss: mine.length ? mine.reduce((s, r) => s + r.cpLoss, 0) / mine.length : null,
      counts,
    };
  });

  return { moves: results, positions, summary };
}
