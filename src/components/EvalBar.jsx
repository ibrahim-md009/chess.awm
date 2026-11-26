import { memo } from 'react';
import { formatScore, scoreToWhitePercent } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

/** Short label for the bar: pawns with one decimal ("0.4", "12"), or "M3" for mate. */
function shortLabel(line) {
  if (line.mate !== null && line.mate !== undefined) return `M${Math.abs(line.mate)}`;
  const pawns = Math.abs(line.cp) / 100;
  return pawns >= 10 ? String(Math.round(pawns)) : pawns.toFixed(1);
}

/**
 * Vertical evaluation bar, always visible beside the board. White's share fills
 * from White's side of the board (it follows board flipping). It keeps showing the
 * last known evaluation while a new position is being searched (dimmed), so it
 * never jumps back to "equal".
 */
function EvalBar({ line, stale, status, orientation, enabled, phase, pausedByReview }) {
  let pct = 50;
  let label = '—';
  let whiteAhead = true;
  let centered = true;
  let description = ar.evalBar.off;

  if (status.checkmate) {
    // The side to move is the one that has been mated.
    whiteAhead = status.turn === 'b';
    pct = whiteAhead ? 100 : 0;
    label = whiteAhead ? '1-0' : '0-1';
    centered = false;
    description = label;
  } else if (status.stalemate || status.insufficient) {
    label = '½';
    description = label;
  } else if (line) {
    pct = scoreToWhitePercent(line);
    whiteAhead = pct >= 50;
    label = shortLabel(line);
    centered = false;
    description = `${ar.evalBar.label}: ${formatScore(line)}`;
  } else if (phase === 'loading') {
    label = '…';
    description = ar.evalBar.loading;
  }

  const live = enabled && phase === 'ready';
  let note = '';
  if (pausedByReview) note = ar.evalBar.pausedByReview;
  else if (!enabled && phase !== 'loading') note = ar.evalBar.off;
  else if (stale && line) note = ar.evalBar.stale;

  const whiteAtBottom = orientation === 'white';
  const labelAtBottom = whiteAhead === whiteAtBottom;
  const dim = Boolean(line) && (stale || !live);

  const classes = ['eval-bar'];
  if (dim) classes.push('is-stale');
  if (!enabled && !pausedByReview) classes.push('is-off');
  if (live && !stale) classes.push('is-live');

  return (
    <div
      className={classes.join(' ')}
      role="img"
      aria-label={note ? `${description} — ${note}` : description}
      title={note ? `${description} — ${note}` : description}
    >
      <div
        className="eval-fill"
        style={{ height: `${pct}%`, [whiteAtBottom ? 'bottom' : 'top']: 0 }}
      />
      <span
        className={[
          'eval-label',
          centered ? 'is-center' : labelAtBottom ? 'at-bottom' : 'at-top',
          whiteAhead && !centered ? 'on-white' : 'on-black',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}

export default memo(EvalBar);
