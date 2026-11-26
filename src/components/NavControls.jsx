import { memo, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

const HOLD_DELAY_MS = 380;
const HOLD_REPEAT_MS = 90;

/**
 * Navigation button. With `repeat`, holding the button keeps stepping (press and hold to
 * scrub through the game); a quick tap steps once. Keyboard activation (Enter /
 * Space) goes through the normal click handler.
 */
function NavButton({ icon, label, onClick, disabled, className = '', repeat = false }) {
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
      className={`nav-btn ${className}`}
      disabled={disabled}
      title={label}
      aria-label={label}
      {...repeatProps}
    >
      <Icon name={icon} size={28} />
    </button>
  );
}

/**
 * One row under the move list: flip, first, previous, next, last, undo. Left to right
 * like the board. Press and hold previous / next to scrub through the game.
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
    <div className="navbar" role="group" aria-label={ar.nav.groupLabel}>
      <NavButton className="nav-tool" icon="flip" label={ar.nav.flip} onClick={onFlip} />
      <NavButton icon="first" label={ar.nav.first} onClick={onFirst} disabled={!canPrev} />
      <NavButton className="nav-main" icon="prev" label={ar.nav.prev} onClick={onPrev} disabled={!canPrev} repeat />
      <NavButton className="nav-main" icon="next" label={ar.nav.next} onClick={onNext} disabled={!canNext} repeat />
      <NavButton icon="last" label={ar.nav.last} onClick={onLast} disabled={!canNext} />
      <NavButton className="nav-tool" icon="undo" label={ar.nav.undo} onClick={onUndo} disabled={!canUndo} />
    </div>
  );
}

export default memo(NavControls);
