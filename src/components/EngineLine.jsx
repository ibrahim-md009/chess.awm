import { memo, useMemo } from 'react';
import { formatPv, formatScore } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

/** One-line description of a finished / special game state, or null. */
function statusText(status) {
  const sideName = (c) => (c === 'w' ? ar.white : ar.black);
  if (status.checkmate) return ar.status.checkmate(sideName(status.turn === 'w' ? 'b' : 'w'));
  if (status.stalemate) return ar.status.stalemate;
  if (status.insufficient) return ar.status.insufficient;
  if (status.fiftyMove) return ar.status.fiftyMove;
  if (status.check) return ar.status.check(sideName(status.turn));
  return null;
}

/**
 * Single compact line between the board and the move list: live score, depth and the
 * engine's best move. Also carries the (rare) messages: loading, error + retry,
 * paused during a review, and the game-over / check text.
 */
function EngineLine({ fen, engine, status, pausedByReview }) {
  const { phase, error, enabled, lines, evalLine, evalStale, searching, setRunning } = engine;

  const top = lines[0] || null;
  const bestSan = useMemo(
    () => (top && top.pv.length ? formatPv(fen, top.pv, 1).firstSan : null),
    [fen, top],
  );

  const over = status.checkmate || status.stalemate || status.insufficient;
  const note = statusText(status);

  let body;
  if (phase === 'error') {
    body = (
      <>
        <span className="engine-msg is-error">
          {ar.engine.errors[error] || ar.engine.errors.unknown}
        </span>
        <button type="button" className="btn engine-retry" onClick={() => setRunning(true)}>
          {ar.engine.retry}
        </button>
      </>
    );
  } else if (pausedByReview) {
    body = <span className="engine-msg">{ar.engine.pausedByReview}</span>;
  } else if (phase !== 'ready' || !enabled) {
    body = <span className="engine-msg">{ar.engine.loading}</span>;
  } else if (!over && evalLine) {
    body = (
      <>
        <span className={`engine-score${evalStale ? ' is-stale' : ''}`} dir="ltr">
          {formatScore(evalLine)}
        </span>
        <span className="engine-meta-line">
          <span>Stockfish</span>
          <span>
            {ar.engine.depthShort(evalLine.depth)}
            {searching ? ' …' : ''}
          </span>
        </span>
        {bestSan && (
          <span className="engine-best" dir="ltr" title={ar.engine.bestMove}>
            {bestSan}
          </span>
        )}
      </>
    );
  } else if (!over) {
    body = <span className="engine-msg">{ar.engine.searching}</span>;
  } else {
    body = null;
  }

  return (
    <div className="engine-line" aria-live="off">
      {body}
      {note && <span className={`engine-note${over ? ' is-end' : ''}`}>{note}</span>}
    </div>
  );
}

export default memo(EngineLine);
