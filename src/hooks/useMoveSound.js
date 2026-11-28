import { useCallback, useRef } from 'react';

// public/sounds/*.mp3 (Lichess "sfx" set, see public/sounds/LICENSE.txt)
const FILES = { move: 'move.mp3', capture: 'capture.mp3', check: 'check.mp3' };
const cache = {};

function audioFor(kind) {
  if (!cache[kind]) {
    const a = new Audio(`${import.meta.env.BASE_URL}sounds/${FILES[kind]}`);
    a.preload = 'auto';
    cache[kind] = a;
  }
  return cache[kind];
}

/** Which sound a move makes, from its SAN: check / mate, capture, or a plain move. */
export function soundKind(san) {
  if (/[+#]/.test(san)) return 'check';
  if (san.includes('x')) return 'capture';
  return 'move';
}

/**
 * Returns play(kind). Does nothing when sound is off. Browsers only allow audio after a
 * touch / click, which is always the case here (a move, a button or a key); failures
 * (autoplay blocked, no audio device) are ignored. Very rapid calls (press-and-hold
 * scrubbing) are throttled.
 */
export function useMoveSound(enabled) {
  const last = useRef(0);
  return useCallback(
    (kind) => {
      if (!enabled) return;
      const now = performance.now();
      if (now - last.current < 45) return;
      last.current = now;
      try {
        const a = audioFor(kind);
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      } catch {
        /* sound is a nicety, never an error */
      }
    },
    [enabled],
  );
}
