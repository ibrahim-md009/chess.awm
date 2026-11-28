import ClassIcon from './ClassIcon.jsx';

/**
 * Classification badge drawn on the top-right corner of a board square.
 * It is an overlay positioned from the square name and the board orientation,
 * so it keeps working when the board is flipped or resized.
 */
export default function SquareBadge({ square, orientation, classification }) {
  if (!classification || !square) return null;

  const file = 'abcdefgh'.indexOf(square[0]);
  const rank = Number(square[1]);
  if (file < 0 || !(rank >= 1 && rank <= 8)) return null;

  const white = orientation === 'white';
  const col = white ? file : 7 - file;
  const row = white ? 8 - rank : rank - 1;

  return (
    <div
      className="square-badge-cell"
      style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }}
      aria-hidden="true"
    >
      <ClassIcon classification={classification} size={64} className="square-badge" />
    </div>
  );
}
