import { useMemo, useRef, useState } from 'react';
import { winPercent } from '../utils/review.js';
import { CLASS_META, GRAPH_MARKED_CLASSES } from '../utils/classification.js';
import { formatScore } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

const W = 600;
const H = 150;
const PAD = 10;

/**
 * Evaluation graph. The time axis follows the RTL interface: the starting
 * position is on the RIGHT and the game progresses to the left (same direction
 * as the arrow buttons). White's advantage fills from the bottom.
 *
 * Interaction: hover (mouse) shows a tooltip; press / drag (mouse, touch, pen)
 * jumps to the move under the pointer.
 */
export default function EvalGraph({ result, ply, startFullmove, onSeek }) {
  const n = result.moves.length;
  const wrapRef = useRef(null);
  const draggingRef = useRef(false);
  const [hover, setHover] = useState(null);

  const xFor = (i) => (n === 0 ? W / 2 : W - PAD - (i / n) * (W - 2 * PAD));
  const yFor = (pct) => H - (pct / 100) * H;

  const { linePath, areaPath, marks } = useMemo(() => {
    const pts = result.positions.map((pos, i) => ({
      x: W - PAD - (i / n) * (W - 2 * PAD),
      y: H - (winPercent(pos) / 100) * H,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
    const dots = result.moves
      .filter((m) => GRAPH_MARKED_CLASSES.includes(m.classification))
      .map((m) => ({ ply: m.ply, x: pts[m.ply].x, y: pts[m.ply].y, cls: m.classification }));
    return { linePath: line, areaPath: area, marks: dots };
  }, [result, n]);

  const plyFromEvent = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    if (rect.width === 0) return 0;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((W - PAD - x) / (W - 2 * PAD)) * n);
    return Math.max(0, Math.min(n, i));
  };

  const handleDown = (e) => {
    draggingRef.current = true;
    try {
      wrapRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* capture is optional */
    }
    const p = plyFromEvent(e);
    setHover(p);
    onSeek(p);
  };

  const handleMove = (e) => {
    const p = plyFromEvent(e);
    setHover(p);
    if (draggingRef.current) onSeek(p);
  };

  const handleUp = (e) => {
    draggingRef.current = false;
    try {
      wrapRef.current.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
    if (e.pointerType !== 'mouse') setHover(null);
  };

  const handleLeave = () => {
    if (!draggingRef.current) setHover(null);
  };

  const labelFor = (i) => {
    if (i === 0) return ar.review.startPosition;
    const m = result.moves[i - 1];
    const firstIsBlack = result.moves[0].color === 'b';
    const number = startFullmove + Math.floor((i - 1 + (firstIsBlack ? 1 : 0)) / 2);
    return m.color === 'w' ? `${number}. ${m.san}` : `${number}... ${m.san}`;
  };

  const hoverX = hover === null ? 0 : (xFor(hover) / W) * 100;
  const hoverMove = hover !== null && hover > 0 ? result.moves[hover - 1] : null;

  return (
    <div className="graph-wrap">
      <div
        ref={wrapRef}
        className="graph-area"
        role="slider"
        tabIndex={0}
        aria-label={ar.review.graphLabel}
        aria-valuemin={0}
        aria-valuemax={n}
        aria-valuenow={ply}
        aria-valuetext={labelFor(ply)}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleLeave}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <rect x="0" y="0" width={W} height={H} className="graph-bg" />
          <path d={areaPath} className="graph-area-fill" />
          <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="graph-mid" />
          <path d={linePath} className="graph-line" vectorEffect="non-scaling-stroke" />
          <line x1={xFor(ply)} x2={xFor(ply)} y1="0" y2={H} className="graph-cursor" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Dots are HTML (not SVG) so they stay round when the graph is stretched. */}
        {marks.map((d) => (
          <span
            key={d.ply}
            className="graph-dot"
            style={{
              left: `${(d.x / W) * 100}%`,
              top: `${(d.y / H) * 100}%`,
              background: CLASS_META[d.cls].color,
            }}
          />
        ))}

        <span
          className="graph-current"
          style={{
            left: `${(xFor(ply) / W) * 100}%`,
            top: `${(yFor(winPercent(result.positions[ply])) / H) * 100}%`,
          }}
        />

        {hover !== null && (
          <div
            className="graph-tooltip"
            style={{ left: `${Math.max(14, Math.min(86, hoverX))}%` }}
            role="presentation"
          >
            <strong dir="ltr">{labelFor(hover)}</strong>
            {hoverMove && (
              <span
                className="graph-tooltip-class"
                style={{ color: CLASS_META[hoverMove.classification].color }}
              >
                {CLASS_META[hoverMove.classification].symbol}{' '}
                {ar.review.classifications[hoverMove.classification]}
              </span>
            )}
            <span dir="ltr" className="graph-tooltip-eval">
              {formatScore(result.positions[hover])}
            </span>
          </div>
        )}
      </div>
      <p className="muted hint">{ar.review.graphHint}</p>
    </div>
  );
}
