import { Chess } from 'chess.js';

/** Score text from White's point of view: "+0.35", "-1.20", "#3", "-#2". */
export function formatScore(line) {
  if (!line) return '—';
  if (line.mate !== null && line.mate !== undefined) {
    return `${line.mate < 0 ? '-' : ''}#${Math.abs(line.mate)}`;
  }
  const pawns = line.cp / 100;
  const text = Math.abs(pawns).toFixed(2);
  if (pawns > 0) return `+${text}`;
  if (pawns < 0) return `-${text}`;
  return text;
}

/** White's share of the evaluation bar (0..100). */
export function scoreToWhitePercent(line) {
  if (!line) return 50;
  if (line.mate !== null && line.mate !== undefined) return line.mate > 0 ? 100 : 0;
  const win = 2 / (1 + Math.exp(-0.00368208 * line.cp)) - 1; // -1..1
  return Math.min(100, Math.max(0, 50 + 50 * win));
}

/** Convert a UCI move ("e2e4", "e7e8q") to { from, to, promotion }. */
export function parseUciMove(uci) {
  if (!uci || uci.length < 4) return null;
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined };
}

/**
 * Turn a UCI principal variation into SAN text with move numbers, replaying it
 * from `fen`. Stops at the first move that is not legal (defensive: never
 * throws) or after `maxPlies` moves.
 *
 * @returns {{ text: string, firstSan: string|null }}
 */
export function formatPv(fen, uciMoves, maxPlies = 10) {
  let chess;
  try {
    chess = new Chess(fen);
  } catch {
    return { text: '', firstSan: null };
  }

  const parts = [];
  let firstSan = null;

  for (let i = 0; i < Math.min(uciMoves.length, maxPlies); i += 1) {
    const mv = parseUciMove(uciMoves[i]);
    if (!mv) break;
    const number = chess.moveNumber();
    const turn = chess.turn();
    let played;
    try {
      played = chess.move(mv);
    } catch {
      break;
    }
    if (!played) break;

    if (i === 0) firstSan = played.san;
    if (turn === 'w') parts.push(`${number}. ${played.san}`);
    else if (i === 0) parts.push(`${number}... ${played.san}`);
    else parts.push(played.san);
  }

  return { text: parts.join(' '), firstSan };
}
