import { memo, useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

/** Current position as FEN, with a copy button. */
function FenBox({ fen }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (e.g. insecure context): the text can still be selected */
    }
  };

  return (
    <div className="fen-box">
      <div className="fen-head">
        <span className="field-label">{ar.status.currentFen}</span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={copy}>
          <Icon name="copy" size={16} />
          {copied ? ar.fen.copied : ar.fen.copy}
        </button>
      </div>
      <code className="fen-code" dir="ltr">{fen}</code>
    </div>
  );
}

export default memo(FenBox);
