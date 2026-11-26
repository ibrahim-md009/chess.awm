import { memo } from 'react';
import { ar } from '../i18n/ar.js';

/*
 * Icons are drawn with `direction: ltr` arrows on purpose: in an RTL page the
 * "previous" move should still point toward the start of the game, which we
 * keep visually on the right (RTL reading order) — so the arrows are mirrored
 * explicitly below rather than relying on automatic flipping.
 */
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path d={d} fill="currentColor" />
  </svg>
);

// Paths point "backwards" (toward game start) = right-pointing in RTL layout.
const ICONS = {
  first: 'M7 6h2v12H7zM11 12l8-6v12z', // |◀ mirrored below via transform
  prev: 'M15 6l-8 6 8 6z',
  next: 'M9 6l8 6-8 6z',
  last: 'M15 6h2v12h-2zM13 12L5 6v12z',
  flip: 'M7 4l-4 4h3v7h2V8h3zm10 16l4-4h-3V9h-2v7h-3z',
  undo: 'M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62A7.96 7.96 0 0 1 12.5 10c3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 10.75 17.19 8 12.5 8z',
  reset: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
};

function NavControls({
  canPrev,
  canNext,
  canUndo,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onFlip,
  onUndo,
  onReset,
}) {
  /*
   * RTL order (right → left): first, previous, next, last.
   * In an RTL flex row the first DOM child sits on the right, so DOM order
   * matches reading order. Arrow glyphs are mirrored with scaleX(-1) so that
   * "previous" points right (toward the start) and "next" points left.
   */
  return (
    <div className="controls" role="group" aria-label={ar.nav.groupLabel}>
      <div className="controls-row">
        <button
          type="button"
          className="btn btn-icon"
          onClick={onFirst}
          disabled={!canPrev}
          title={ar.nav.first}
          aria-label={ar.nav.first}
        >
          <span className="mirror"><Icon d={ICONS.first} /></span>
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onPrev}
          disabled={!canPrev}
          title={ar.nav.prev}
          aria-label={ar.nav.prev}
        >
          <span className="mirror"><Icon d={ICONS.prev} /></span>
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onNext}
          disabled={!canNext}
          title={ar.nav.next}
          aria-label={ar.nav.next}
        >
          <span className="mirror"><Icon d={ICONS.next} /></span>
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onLast}
          disabled={!canNext}
          title={ar.nav.last}
          aria-label={ar.nav.last}
        >
          <span className="mirror"><Icon d={ICONS.last} /></span>
        </button>
      </div>

      <div className="controls-row controls-secondary">
        <button
          type="button"
          className="btn"
          onClick={onFlip}
          title={ar.nav.flip}
          aria-label={ar.nav.flip}
        >
          <Icon d={ICONS.flip} />
          <span>{ar.nav.flip}</span>
        </button>
        <button
          type="button"
          className="btn"
          onClick={onUndo}
          disabled={!canUndo}
          title={ar.nav.undo}
          aria-label={ar.nav.undo}
        >
          <span className="mirror"><Icon d={ICONS.undo} /></span>
          <span>تراجع</span>
        </button>
        <button
          type="button"
          className="btn"
          onClick={onReset}
          title={ar.nav.reset}
          aria-label={ar.nav.reset}
        >
          <Icon d={ICONS.reset} />
          <span>{ar.nav.reset}</span>
        </button>
      </div>
    </div>
  );
}

export default memo(NavControls);
