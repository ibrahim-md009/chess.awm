import { REVIEW_DEPTHS } from '../hooks/useGameReview.js';
import { CLASSIFICATIONS } from '../utils/review.js';
import { ar } from '../i18n/ar.js';

const fmtAccuracy = (v) => (v === null || v === undefined ? '—' : `${v.toFixed(1)}%`);
const fmtCpl = (v) => (v === null || v === undefined ? '—' : Math.round(v));

/** Estimated time left, from the average time per position so far. */
function etaText(startedAt, done, total) {
  if (!startedAt || done < 2) return ar.review.etaCalculating;
  const perPosition = (Date.now() - startedAt) / done;
  const seconds = Math.max(1, Math.round((perPosition * (total - done)) / 1000));
  if (seconds < 60) return ar.review.etaSeconds(seconds);
  return ar.review.etaMinutes(Math.floor(seconds / 60), seconds % 60);
}

export default function ReviewPanel({ review, headers, hasMoves, liveWasPaused }) {
  const { status, progress, result, error, startedAt, depth, setDepth, start, cancel } = review;
  const running = status === 'running';
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const whiteName = headers.White || ar.white;
  const blackName = headers.Black || ar.black;

  return (
    <section className="panel review-panel" aria-label={ar.review.title}>
      <h2 className="panel-title">{ar.review.title}</h2>

      <div className="setting">
        <label className="field-label" htmlFor="review-depth">
          {ar.review.depthLabel}
        </label>
        <select
          id="review-depth"
          className="select"
          value={depth}
          disabled={running}
          onChange={(e) => setDepth(Number(e.target.value))}
        >
          {REVIEW_DEPTHS.map((d) => (
            <option key={d} value={d}>
              {ar.review.depthNames[d]} ({d})
            </option>
          ))}
        </select>
      </div>

      {running ? (
        <button type="button" className="btn review-start" onClick={cancel}>
          {ar.review.cancel}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary review-start"
          onClick={start}
          disabled={!hasMoves}
        >
          {status === 'done' ? ar.review.rerun : ar.review.start}
        </button>
      )}

      {!hasMoves && <p className="muted engine-status">{ar.review.noMoves}</p>}
      {hasMoves && status === 'idle' && <p className="muted engine-status">{ar.review.note}</p>}
      {status === 'cancelled' && <p className="muted engine-status">{ar.review.cancelled}</p>}

      {running && (
        <div className="review-progress" role="status" aria-live="polite">
          <progress className="progress" max={100} value={percent} aria-label={ar.review.running} />
          <div className="engine-meta muted">
            <span>
              {ar.review.progress(progress.done, progress.total)} ({percent}%)
            </span>
            <span>{etaText(startedAt, progress.done, progress.total)}</span>
          </div>
          {liveWasPaused && <p className="muted engine-status">{ar.review.livePaused}</p>}
        </div>
      )}

      {status === 'error' && error && (
        <p className="message message-error" role="alert">
          {ar.engine.errors[error] || ar.engine.errors.unknown}
        </p>
      )}

      {status === 'done' && result && (
        <div className="review-results">
          <h3 className="sub-title">{ar.review.resultsTitle}</h3>

          <table className="review-table">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col" dir="auto">{whiteName}</th>
                <th scope="col" dir="auto">{blackName}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-accuracy">
                <th scope="row">{ar.review.accuracy}</th>
                <td>{fmtAccuracy(result.summary.w.accuracy)}</td>
                <td>{fmtAccuracy(result.summary.b.accuracy)}</td>
              </tr>
              <tr>
                <th scope="row">{ar.review.avgCpLoss}</th>
                <td>{fmtCpl(result.summary.w.avgCpLoss)}</td>
                <td>{fmtCpl(result.summary.b.avgCpLoss)}</td>
              </tr>
              <tr>
                <th scope="row">{ar.review.moves}</th>
                <td>{result.summary.w.moveCount}</td>
                <td>{result.summary.b.moveCount}</td>
              </tr>
              <tr className="row-heading">
                <th scope="colgroup" colSpan={3}>{ar.review.classification}</th>
              </tr>
              {CLASSIFICATIONS.map((c) => (
                <tr key={c}>
                  <th scope="row" className="class-name">
                    <span className={`class-dot class-${c}`} aria-hidden="true" />
                    {ar.review.classifications[c]}
                  </th>
                  <td>{result.summary.w.counts[c]}</td>
                  <td>{result.summary.b.counts[c]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="muted hint">{ar.review.approx}</p>
        </div>
      )}
    </section>
  );
}
