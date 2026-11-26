import { memo } from 'react';
import EvalGraph from './EvalGraph.jsx';
import MoveFeedback from './MoveFeedback.jsx';
import { ar } from '../i18n/ar.js';

/** Panel under the board: evaluation graph + feedback for the current move. */
function ReviewNavigator({ result, ply, startFullmove, onSeek }) {
  if (!result || result.moves.length === 0) return null;
  return (
    <section className="panel navigator-panel" aria-label={ar.review.graphTitle}>
      <h2 className="panel-title">{ar.review.graphTitle}</h2>
      <EvalGraph result={result} ply={ply} startFullmove={startFullmove} onSeek={onSeek} />
      <MoveFeedback result={result} ply={ply} onSeek={onSeek} />
    </section>
  );
}

export default memo(ReviewNavigator);
