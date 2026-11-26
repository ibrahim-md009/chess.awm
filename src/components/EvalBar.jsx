import { memo } from 'react';
import { formatScore, scoreToWhitePercent } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

/**
 * Thin vertical evaluation bar on the left edge of the board. It keeps showing the
 * last known evaluation (dimmed) while a new position is searched, follows board
 * flipping, and the exact score is in the engine line below the board.
 */
function EvalBar({ line, stale, status, orientation, enabled, phase, pausedByReview }) {
  let pct = 50;
  let description = ar.evalBar.off;

  if (status.checkmate) {
    // The side to move is the one that has been mated.
    pct = status.turn === 'b' ? 100 : 0;
    description = pct === 100 ? '1-0' : '0-1';
  } else if (status.stalemate || status.insufficient) {
    description = '½';
  } else if (line) {
    pct = scoreToWhitePercent(line);
    description = `${ar.evalBar.label}: ${formatScore(line)}`;
  } else if (phase === 'loading') {
    description = ar.evalBar.loading;
  }

  const live = enabled && phase === 'ready';
  if (pausedByReview) description = `${description} — ${ar.evalBar.pausedByReview}`;

  const whiteAtBottom = orientation === 'white';
  const classes = ['eval-bar'];
  if (Boolean(line) && (stale || !live)) classes.push('is-stale');
  if (!enabled && !pausedByReview) classes.push('is-off');

  return (
    <div className={classes.join(' ')} role="img" aria-label={description} title={description}>
      <div
        className="eval-fill"
        style={{ height: `${pct}%`, [whiteAtBottom ? 'bottom' : 'top']: 0 }}
      />
    </div>
  );
}

export default memo(EvalBar);
