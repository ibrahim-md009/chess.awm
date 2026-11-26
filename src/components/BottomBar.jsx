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
function BarButton({ icon, label, onClick, disabled, className = '', repeat = false, children }) {
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
      className={`bar-btn ${className}`}
      disabled={disabled}
      aria-label={label}
      {...repeatProps}
    >
      {children || <Icon name={icon} size={30} />}
      <span className="bar-label">{label}</span>
    </button>
  );
}

/** Chess.com-style star: white disc with a green star cut into it. */
function ReviewStar() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <path
        d="M12 5.2l1.9 4 4.4.55-3.2 3.05.82 4.35L12 14.95 8.08 17.15l.82-4.35-3.2-3.05 4.4-.55z"
        fill="#81b64c"
      />
    </svg>
  );
}

/**
 * Bottom bar (same layout as the reference): Options, New, the raised green review
 * button in the middle, Back, Forward. Press and hold Back / Forward to scrub.
 */
function BottomBar({ canPrev, canNext, reviewPercent, onOptions, onNew, onReview, onPrev, onNext }) {
  return (
    <nav className="bottombar" aria-label={ar.nav.groupLabel}>
      <BarButton icon="menu" label={ar.bottomBar.options} onClick={onOptions} />
      <BarButton icon="plus" label={ar.bottomBar.new} onClick={onNew} />
      <button
        type="button"
        className="review-fab"
        onClick={onReview}
        aria-label={ar.bottomBar.review}
        title={ar.bottomBar.review}
      >
        {reviewPercent !== null ? <span className="fab-percent">{reviewPercent}%</span> : <ReviewStar />}
      </button>
      <BarButton icon="prev" label={ar.bottomBar.back} onClick={onPrev} disabled={!canPrev} repeat />
      <BarButton icon="next" label={ar.bottomBar.forward} onClick={onNext} disabled={!canNext} repeat />
    </nav>
  );
}

export default memo(BottomBar);
