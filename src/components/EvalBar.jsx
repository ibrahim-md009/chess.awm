import { memo } from 'react';
import { formatScore, scoreToWhitePercent } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

/**
 * Horizontal evaluation bar under the title, with the score written on it. The colour of
 * the player at the bottom of the board is on the left. It keeps the last evaluation
 * (dimmed) while a new position is searched and shows the result when the game is over.
 */
function EvalBar({ line, stale, status, orientation, enabled, phase, pausedByReview }) {
  let pct = 50;
  let label = '';
  let description = ar.evalBar.off;

  if (status.checkmate) {
    // The side to move is the one that has been mated.
    pct = status.turn === 'b' ? 100 : 0;
    label = pct === 100 ? '1-0' : '0-1';
    description = label;
  } else if (status.stalemate || status.insufficient) {
    label = '½';
    description = label;
  } else if (line) {
    pct = scoreToWhitePercent(line);
    label = formatScore(line);
    description = `${ar.evalBar.label}: ${label}`;
  } else if (phase === 'loading') {
    description = ar.evalBar.loading;
  }
  if (pausedByReview) description = `${description} — ${ar.evalBar.pausedByReview}`;

  const whiteLeft = orientation === 'white';
  const whiteLeads = pct >= 50;
  // The label sits at the outer end of the side that is ahead.
  const labelOnLeft = whiteLeads ? whiteLeft : !whiteLeft;

  const classes = ['eval-bar'];
  if (line && (stale || phase !== 'ready' || pausedByReview)) classes.push('is-stale');
  if (!enabled && !pausedByReview) classes.push('is-off');

  return (
    <div className={classes.join(' ')} role="img" aria-label={description} title={description}>
      <div className="eval-fill" style={{ width: `${pct}%`, [whiteLeft ? 'left' : 'right']: 0 }} />
      {label && (
        <span
          className={`eval-label ${labelOnLeft ? 'at-left' : 'at-right'} ${
            whiteLeads ? 'on-white' : 'on-black'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default memo(EvalBar);
