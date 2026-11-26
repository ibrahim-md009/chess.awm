import { useMemo } from 'react';
import { CLASS_META, MISTAKE_CLASSES, findMoveByClass } from '../utils/classification.js';
import { formatScore } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

/** Verdict for the move on the board, plus previous / next mistake navigation. */
export default function MoveFeedback({ result, ply, onSeek }) {
  const move = ply > 0 ? result.moves[ply - 1] : null;

  const hasMistakes = useMemo(
    () => result.moves.some((m) => MISTAKE_CLASSES.includes(m.classification)),
    [result],
  );
  const prev = findMoveByClass(result.moves, ply, MISTAKE_CLASSES, -1);
  const next = findMoveByClass(result.moves, ply, MISTAKE_CLASSES, 1);

  return (
    <div className="feedback">
      <div className="feedback-card" aria-live="polite">
        {move ? (
          <>
            <div className="feedback-title">
              <span
                className="feedback-badge"
                style={{ background: CLASS_META[move.classification].color }}
                aria-hidden="true"
              >
                {CLASS_META[move.classification].symbol}
              </span>
              <strong dir="ltr">{move.san}</strong>
              <span className="feedback-class">{ar.review.classifications[move.classification]}</span>
            </div>
            <p className="feedback-line">
              {move.playedIsBest || !move.bestSan ? (
                ar.review.playedBest
              ) : (
                <>
                  {ar.review.bestWas} <strong dir="ltr">{move.bestSan}</strong>
                  {move.cpLoss > 0 && <> · {ar.review.cpLoss(move.cpLoss)}</>}
                </>
              )}
            </p>
            <p className="feedback-line muted">
              {ar.review.evalAfter}:{' '}
              <span dir="ltr" className="feedback-eval">{formatScore(result.positions[ply])}</span>
            </p>
          </>
        ) : (
          <p className="feedback-line muted">{ar.review.startPosition}</p>
        )}
      </div>

      <div className="feedback-nav">
        <button
          type="button"
          className="btn"
          onClick={() => onSeek(prev)}
          disabled={prev === null}
        >
          {ar.review.prevMistake}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onSeek(next)}
          disabled={next === null}
        >
          {ar.review.nextMistake}
        </button>
      </div>
      <p className="muted hint">
        {hasMistakes ? ar.review.mistakeNavHint : ar.review.noMistakes}
      </p>
    </div>
  );
}
