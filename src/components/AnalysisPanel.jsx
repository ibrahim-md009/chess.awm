import { useMemo } from 'react';
import { MAX_DEPTH, MAX_LINES, MIN_DEPTH } from '../hooks/useStockfish.js';
import { formatPv, formatScore, scoreToWhitePercent } from '../utils/analysis.js';
import { ar } from '../i18n/ar.js';

function verdict(line) {
  if (!line) return null;
  if (line.mate !== null) return line.mate > 0 ? ar.engine.whiteAhead : ar.engine.blackAhead;
  if (line.cp > 30) return ar.engine.whiteAhead;
  if (line.cp < -30) return ar.engine.blackAhead;
  return ar.engine.equal;
}

export default function AnalysisPanel({ fen, engine }) {
  const {
    enabled,
    phase,
    error,
    depth,
    setDepth,
    multiPv,
    setMultiPv,
    toggle,
    lines,
    searching,
    terminal,
  } = engine;

  const top = lines[0] || null;
  const loading = phase === 'loading';

  // Convert each principal variation to SAN once per update.
  const formatted = useMemo(
    () => lines.map((line) => ({ line, pv: formatPv(fen, line.pv, 10) })),
    [lines, fen],
  );

  const bestSan = formatted[0]?.pv.firstSan || null;
  const whitePct = scoreToWhitePercent(top);

  let statusText = null;
  if (loading) statusText = ar.engine.loading;
  else if (terminal && enabled) statusText = ar.engine.terminal;
  else if (enabled && phase === 'ready' && !top) statusText = ar.engine.waiting;
  else if (!enabled && phase === 'ready') statusText = top ? ar.engine.paused : ar.engine.idleHint;
  else if (!enabled && phase === 'idle') statusText = ar.engine.idleHint;

  const buttonLabel = enabled ? ar.engine.stop : phase === 'error' ? ar.engine.retry : ar.engine.start;

  return (
    <section className="panel analysis-panel" aria-label={ar.engine.title}>
      <div className="analysis-head">
        <h2 className="panel-title">
          {ar.engine.title} <span className="muted analysis-sub" dir="ltr">{ar.engine.subtitle}</span>
        </h2>
        <button
          type="button"
          className={`btn ${enabled ? '' : 'btn-primary'} analysis-toggle`}
          onClick={toggle}
          aria-pressed={enabled}
        >
          {buttonLabel}
        </button>
      </div>

      {phase === 'error' && error && (
        <p className="message message-error" role="alert">
          {ar.engine.errors[error] || ar.engine.errors.unknown}
        </p>
      )}

      <div className="engine-settings">
        <div className="setting">
          <label className="field-label" htmlFor="depth-slider">
            {ar.engine.depthLabel}: <strong className="setting-value">{depth}</strong>
          </label>
          <input
            id="depth-slider"
            className="slider"
            type="range"
            min={MIN_DEPTH}
            max={MAX_DEPTH}
            step={1}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </div>

        <div className="setting">
          <span className="field-label" id="lines-label">{ar.engine.linesLabel}</span>
          <div className="segmented" role="group" aria-labelledby="lines-label">
            {Array.from({ length: MAX_LINES }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`segment${multiPv === n ? ' is-active' : ''}`}
                aria-pressed={multiPv === n}
                onClick={() => setMultiPv(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {statusText && <p className="muted engine-status">{statusText}</p>}

      {top && !terminal && (
        <>
          <div className="eval-block">
            <div className="eval-row">
              <span className="eval-score" dir="ltr">{formatScore(top)}</span>
              <span className="eval-verdict">{verdict(top)}</span>
            </div>
            <div
              className="eval-bar"
              role="img"
              aria-label={`${ar.engine.evaluation}: ${formatScore(top)}`}
            >
              <div className="eval-bar-white" style={{ width: `${whitePct}%` }} />
            </div>
            <div className="engine-meta muted">
              <span>{ar.engine.reached(top.depth, depth)}</span>
              {top.nps ? <span>{ar.engine.speed(Math.round(top.nps / 1000))}</span> : null}
              {searching && <span className="searching-dot">{ar.engine.searching}</span>}
            </div>
          </div>

          {bestSan && (
            <p className="best-move">
              {ar.engine.bestMove}: <strong dir="ltr">{bestSan}</strong>
            </p>
          )}

          <h3 className="sub-title">{ar.engine.lineTitle}</h3>
          <ol className="pv-list">
            {formatted.map(({ line, pv }) => (
              <li className={`pv-item${line.multipv === 1 ? ' is-best' : ''}`} key={line.multipv}>
                <span className="pv-score" dir="ltr">{formatScore(line)}</span>
                <span className="pv-moves" dir="ltr">{pv.text}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
