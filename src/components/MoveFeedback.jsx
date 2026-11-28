import ClassIcon from './ClassIcon.jsx';
import { MISTAKE_CLASSES, findMoveByClass } from '../utils/classification.js';
import { formatScore } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

/**
 * Compact one-row verdict for the move on the board (after a review), with
 * previous / next mistake buttons.
 */
export default function MoveFeedback({ result, ply, onSeek }) {
  const move = ply > 0 ? result.moves[ply - 1] : null;
  const prev = findMoveByClass(result.moves, ply, MISTAKE_CLASSES, -1);
  const next = findMoveByClass(result.moves, ply, MISTAKE_CLASSES, 1);

  return (
    <div className="feedback">
      <div className="feedback-card" aria-live="polite">
        {move ? (
          <>
            <ClassIcon classification={move.classification} size={26} />
            <span className="feedback-text">
              <strong dir="ltr">{move.san}</strong> {ar.review.classifications[move.classification]}
              <span className="muted">
                {' · '}
                {move.playedIsBest || !move.bestSan ? (
                  ar.review.playedBest
                ) : (
                  <>
                    {ar.review.bestWas} <strong dir="ltr">{move.bestSan}</strong>
                  </>
                )}
                {' · '}
                <span dir="ltr">{formatScore(result.positions[ply])}</span>
              </span>
            </span>
          </>
        ) : (
          <span className="muted">{ar.review.startPosition}</span>
        )}
      </div>
      <div className="feedback-nav">
        <button type="button" className="btn" onClick={() => onSeek(prev)} disabled={prev === null}>
          {ar.review.prevMistake}
        </button>
        <button type="button" className="btn" onClick={() => onSeek(next)} disabled={next === null}>
          {ar.review.nextMistake}
        </button>
      </div>
    </div>
  );
}
