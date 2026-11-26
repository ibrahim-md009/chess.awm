import { useEffect, useMemo, useRef, memo } from 'react';
import { buildMoveRows } from '../utils/chess.js';
import { CLASS_META } from '../utils/classification.js';
import { ar } from '../i18n/ar.js';

// Move text is chess notation (Latin letters); keep it LTR inside the RTL page.
function MoveCell({ index, move, mark, active, onSelect, cellRef }) {
  if (!move) {
    return <span className="move-cell move-cell-empty">{ar.moves.placeholderCell}</span>;
  }
  const meta = mark ? CLASS_META[mark] : null;
  return (
    <button
      type="button"
      ref={active ? cellRef : null}
      className={`move-cell move-btn${active ? ' is-active' : ''}`}
      onClick={() => onSelect(index + 1)}
      aria-current={active ? 'true' : undefined}
      aria-label={meta ? `${move.san} — ${ar.review.classifications[mark]}` : undefined}
      dir="ltr"
    >
      {move.san}
      {meta && (
        <span
          className="move-mark"
          style={{ background: meta.color }}
          title={ar.review.classifications[mark]}
          aria-hidden="true"
        >
          {meta.symbol}
        </span>
      )}
    </button>
  );
}

/**
 * @param {object[]|null} marks  optional classification per move (same indexes as `moves`),
 *                               present only while a review result matches the game
 */
function MoveList({ moves, marks, ply, startFullmove, onSelect }) {
  const rows = useMemo(() => buildMoveRows(moves, startFullmove), [moves, startFullmove]);
  const activeRef = useRef(null);
  const containerRef = useRef(null);

  // Keep the active move centred in the strip without scrolling the page.
  useEffect(() => {
    const el = activeRef.current;
    const box = containerRef.current;
    if (!box) return;
    if (!el) {
      if (ply === 0) box.scrollLeft = 0;
      return;
    }
    box.scrollLeft = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
  }, [ply, moves.length]);

  const markAt = (i) => (marks && i !== null && marks[i] ? marks[i] : null);

  return (
    <div className="moves" role="region" aria-label={ar.moves.title}>
      {rows.length === 0 ? (
        <p className="muted moves-empty">{ar.moves.empty}</p>
      ) : (
        <ol className="moves-strip" ref={containerRef} dir="ltr">
          {rows.map((row) => (
            <li className="move-pair" key={`${row.num}-${row.w ?? 'x'}-${row.b ?? 'x'}`}>
              <span className="move-num">{row.num}.</span>
              <MoveCell
                index={row.w}
                move={row.w !== null ? moves[row.w] : null}
                mark={markAt(row.w)}
                active={row.w !== null && row.w + 1 === ply}
                onSelect={onSelect}
                cellRef={activeRef}
              />
              <MoveCell
                index={row.b}
                move={row.b !== null ? moves[row.b] : null}
                mark={markAt(row.b)}
                active={row.b !== null && row.b + 1 === ply}
                onSelect={onSelect}
                cellRef={activeRef}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default memo(MoveList);
