import { memo } from 'react';
import { ar } from '../i18n/ar.js';

/**
 * Shown only when something notable happens: check, or the end of the game.
 * (Whose turn it is is already shown on the player strips.)
 */
function StatusBanner({ status }) {
  const sideName = (c) => (c === 'w' ? ar.white : ar.black);

  let text = null;
  let tone = 'check';
  if (status.checkmate) {
    // The side to move is the one that has been mated.
    text = ar.status.checkmate(sideName(status.turn === 'w' ? 'b' : 'w'));
    tone = 'end';
  } else if (status.stalemate) {
    text = ar.status.stalemate;
    tone = 'end';
  } else if (status.insufficient) {
    text = ar.status.insufficient;
    tone = 'end';
  } else if (status.fiftyMove) {
    text = ar.status.fiftyMove;
    tone = 'end';
  } else if (status.check) {
    text = ar.status.check(sideName(status.turn));
  }

  if (!text) return null;
  return (
    <div className={`status-banner status-${tone}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}

export default memo(StatusBanner);
