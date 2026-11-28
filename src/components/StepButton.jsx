import { memo, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';

const HOLD_DELAY_MS = 380;
const HOLD_REPEAT_MS = 90;

/**
 * Chevron at either end of the move strip: one step per tap, and holding it keeps
 * stepping (press and hold to scrub through the game). Keyboard activation (Enter /
 * Space) goes through the normal click handler.
 */
function StepButton({ icon, label, onClick, disabled }) {
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

  return (
    <button
      type="button"
      className="moves-arrow"
      disabled={disabled}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={handleClick}
    >
      <Icon name={icon} size={30} />
    </button>
  );
}

export default memo(StepButton);
