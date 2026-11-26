import { memo, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

const HOLD_DELAY_MS = 380;
const HOLD_REPEAT_MS = 90;

/**
 * Rail button. With `repeat`, holding the button keeps stepping (press and hold to
 * scrub through the game); a quick tap steps once. Keyboard activation (Enter /
 * Space) goes through the normal click handler.
 */
function RailButton({ icon, label, onClick, disabled, className = '', repeat = false }) {
  const timers = useRef({ delay: null, interval: null });
  const usedPointer = useRef(false);

  const stop = () => {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.interval);
    timers.current.delay = null;
    timers.current.interval = null;
  };

  useEffect(() => stop, []);
  useEffect(() => {
    if (disabled) stop(); // reached the start / end of the game while holding
  }, [disabled]);

  // After a pointer interaction, forget it shortly (the synthesized click arrives first).
  const release = () => {
    stop();
    setTimeout(() => {
      usedPointer.current = false;
    }, 60);
  };

  const handlePointerDown = (e) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    usedPointer.current = true;
    onClick();
    stop();
    timers.current.delay = setTimeout(() => {
      timers.current.interval = setInterval(onClick, HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  };

  const handleClick = () => {
    if (usedPointer.current) {
      usedPointer.current = false; // already handled on pointer down
      return;
    }
    onClick(); // keyboard activation
  };

  const repeatProps = repeat
    ? {
        onPointerDown: handlePointerDown,
        onPointerUp: release,
        onPointerLeave: release,
        onPointerCancel: release,
        onClick: handleClick,
      }
    : { onClick };

  return (
    <button
      type="button"
      className={`rail-btn ${className}`}
      disabled={disabled}
      title={label}
      aria-label={label}
      {...repeatProps}
    >
      <Icon name={icon} size={26} />
    </button>
  );
}

/**
 * Vertical control rail placed on the RIGHT of the board (easy to reach with the
 * right thumb). Top to bottom: first, previous, next, last, then flip and undo.
 * "Up" goes back in the game, "down" goes forward. New game lives in the top bar.
 */
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
}) {
  return (
    <div className="rail" role="group" aria-label={ar.nav.groupLabel}>
      <div className="rail-main">
        <RailButton className="rail-minor" icon="first" label={ar.nav.first} onClick={onFirst} disabled={!canPrev} />
        <RailButton className="rail-major" icon="prev" label={ar.nav.prev} onClick={onPrev} disabled={!canPrev} repeat />
        <RailButton className="rail-major" icon="next" label={ar.nav.next} onClick={onNext} disabled={!canNext} repeat />
        <RailButton className="rail-minor" icon="last" label={ar.nav.last} onClick={onLast} disabled={!canNext} />
      </div>
      <div className="rail-extra">
        <RailButton className="rail-tool" icon="flip" label={ar.nav.flip} onClick={onFlip} />
        <RailButton className="rail-tool" icon="undo" label={ar.nav.undo} onClick={onUndo} disabled={!canUndo} />
      </div>
    </div>
  );
}

export default memo(NavControls);
