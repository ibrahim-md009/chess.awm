import { useState, memo } from 'react';
import { ar } from '../i18n/ar.js';

function ImportPanel({ onLoadPgn, onLoadFen }) {
  const [tab, setTab] = useState('pgn');
  const [texts, setTexts] = useState({ pgn: '', fen: '' });
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }

  const switchTab = (next) => {
    setTab(next);
    setMessage(null);
  };

  const setText = (value) => setTexts((prev) => ({ ...prev, [tab]: value }));

  const handleLoad = () => {
    const text = texts[tab];
    if (!text.trim()) {
      setMessage({ type: 'error', text: ar.errors.empty });
      return;
    }

    let result;
    try {
      result = tab === 'pgn' ? onLoadPgn(text) : onLoadFen(text);
    } catch {
      result = { ok: false, error: 'unknown' };
    }

    if (!result.ok) {
      setMessage({ type: 'error', text: ar.errors[result.error] || ar.errors.unknown });
      return;
    }
    setMessage({
      type: 'success',
      text: tab === 'pgn' ? ar.import.loadedPgn(result.moveCount) : ar.import.loadedFen,
    });
  };

  const handleClear = () => {
    setText('');
    setMessage(null);
  };

  const isPgn = tab === 'pgn';

  return (
    <section className="panel import-panel" aria-label={ar.import.title}>
      <h2 className="panel-title">{ar.import.title}</h2>

      <div className="tabs" role="tablist">
        {['pgn', 'fen'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`tab${tab === t ? ' is-active' : ''}`}
            onClick={() => switchTab(t)}
          >
            {t === 'pgn' ? ar.import.tabPgn : ar.import.tabFen}
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="import-text">
        {isPgn ? ar.import.pgnLabel : ar.import.fenLabel}
      </label>
      <textarea
        id="import-text"
        className="textarea"
        dir="ltr"
        spellCheck={false}
        rows={isPgn ? 7 : 3}
        value={texts[tab]}
        placeholder={isPgn ? ar.import.pgnPlaceholder : ar.import.fenPlaceholder}
        onChange={(e) => {
          setText(e.target.value);
          if (message) setMessage(null);
        }}
      />
      {isPgn && <p className="muted hint">{ar.import.singleGameHint}</p>}

      <div className="import-actions">
        <button type="button" className="btn btn-primary" onClick={handleLoad}>
          {ar.import.load}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleClear}>
          {ar.import.clear}
        </button>
      </div>

      {message && (
        <p
          className={`message message-${message.type}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

export default memo(ImportPanel);
