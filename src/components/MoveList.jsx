import { useEffect, useMemo, useRef } from 'react';
import { buildMoveRows } from '../utils/chess.js';
import { ar } from '../i18n/ar.js';

// Move text is chess notation (Latin letters); keep it LTR inside the RTL page.
function MoveCell({ index, move, active, onSelect, cellRef }) {
  if (!move) {
    return <span className="move-cell move-cell-empty">{ar.moves.placeholderCell}</span>;
  }
  return (
    <button
      type="button"
      ref={active ? cellRef : null}
      className={`move-cell move-btn${active ? ' is-active' : ''}`}
      onClick={() => onSelect(index + 1)}
      aria-current={active ? 'true' : undefined}
      dir="ltr"
    >
      {move.san}
    </button>
  );
}

export default function MoveList({ moves, ply, startFullmove, onSelect }) {
  const rows = useMemo(() => buildMoveRows(moves, startFullmove), [moves, startFullmove]);
  const activeRef = useRef(null);
  const containerRef = useRef(null);

  // Keep the active move visible without scrolling the whole page.
  useEffect(() => {
    const el = activeRef.current;
    const box = containerRef.current;
    if (!el || !box) {
      if (box && ply === 0) box.scrollTop = 0;
      return;
    }
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top - 8;
    else if (bottom > box.scrollTop + box.clientHeight) {
      box.scrollTop = bottom - box.clientHeight + 8;
    }
  }, [ply, moves.length]);

  return (
    <section className="panel moves-panel" aria-label={ar.moves.title}>
      <h2 className="panel-title">{ar.moves.title}</h2>
      {rows.length === 0 ? (
        <p className="muted moves-empty">{ar.moves.empty}</p>
      ) : (
        <div className="moves-scroll" ref={containerRef}>
          <ol className="moves-table">
            {rows.map((row) => (
              <li className="move-row" key={`${row.num}-${row.w ?? 'x'}-${row.b ?? 'x'}`}>
                <span className="move-num">{row.num}.</span>
                <MoveCell
                  index={row.w}
                  move={row.w !== null ? moves[row.w] : null}
                  active={row.w !== null && row.w + 1 === ply}
                  onSelect={onSelect}
                  cellRef={activeRef}
                />
                <MoveCell
                  index={row.b}
                  move={row.b !== null ? moves[row.b] : null}
                  active={row.b !== null && row.b + 1 === ply}
                  onSelect={onSelect}
                  cellRef={activeRef}
                />
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
