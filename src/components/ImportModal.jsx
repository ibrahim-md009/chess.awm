import { useRef, useState } from 'react';
import Modal from './Modal.jsx';
import { MAX_INPUT_CHARS } from '../utils/chess.js';
import { ar } from '../i18n/ar.js';

/**
 * Import dialog: paste a PGN (or FEN), or pick a .pgn file. On success the dialog
 * closes and `onImported(message)` lets the app confirm with a toast.
 */
export default function ImportModal({ onClose, onLoadPgn, onLoadFen, onImported }) {
  const [tab, setTab] = useState('pgn');
  const [texts, setTexts] = useState({ pgn: '', fen: '' });
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const isPgn = tab === 'pgn';

  const switchTab = (next) => {
    setTab(next);
    setError(null);
  };

  const setText = (value) => {
    setTexts((prev) => ({ ...prev, [tab]: value }));
    if (error) setError(null);
  };

  const submit = () => {
    const text = texts[tab];
    if (!text.trim()) {
      setError(ar.errors.empty);
      return;
    }
    let result;
    try {
      result = isPgn ? onLoadPgn(text) : onLoadFen(text);
    } catch {
      result = { ok: false, error: 'unknown' };
    }
    if (!result.ok) {
      setError(ar.errors[result.error] || ar.errors.unknown);
      return;
    }
    onImported(isPgn ? ar.import.loadedPgn(result.moveCount) : ar.import.loadedFen);
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    if (file.size > MAX_INPUT_CHARS * 4) {
      setError(ar.errors.tooLarge);
      return;
    }
    try {
      const text = await file.text();
      if (text.length > MAX_INPUT_CHARS) {
        setError(ar.errors.tooLarge);
        return;
      }
      setTab('pgn');
      setTexts((prev) => ({ ...prev, pgn: text }));
      setFileName(file.name);
      setError(null);
    } catch {
      setError(ar.importModal.fileError);
    }
  };

  return (
    <Modal
      title={ar.importModal.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {ar.importModal.cancel}
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            {ar.importModal.submit}
          </button>
        </>
      }
    >
      <div className="segmented" role="tablist" aria-label={ar.importModal.tabs}>
        {['pgn', 'fen'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`segment${tab === t ? ' is-active' : ''}`}
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
        autoFocus
        rows={isPgn ? 10 : 3}
        value={texts[tab]}
        placeholder={isPgn ? ar.import.pgnPlaceholder : ar.import.fenPlaceholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
      />

      <div className="import-tools">
        {isPgn && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pgn,.txt,text/plain"
              className="visually-hidden"
              onChange={handleFile}
              tabIndex={-1}
            />
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current.click()}>
              {ar.importModal.file}
            </button>
            {fileName && <span className="muted file-name" dir="auto">{ar.importModal.fileName(fileName)}</span>}
          </>
        )}
        <button
          type="button"
          className="btn btn-sm btn-ghost import-clear"
          onClick={() => {
            setText('');
            setFileName('');
          }}
        >
          {ar.import.clear}
        </button>
      </div>

      {isPgn && <p className="muted hint">{ar.import.singleGameHint}</p>}
      <p className="muted hint">{ar.importModal.shortcut}</p>

      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
