import { memo } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

/** Top bar: import on one side, title in the middle, settings on the other. */
function AppBar({ onImport, onSettings }) {
  return (
    <header className="appbar">
      <button
        type="button"
        className="appbar-btn"
        onClick={onImport}
        title={ar.appBar.importTitle}
        aria-label={ar.appBar.import}
      >
        <Icon name="importGame" size={28} />
      </button>

      <h1 className="brand-title">
        <span className="brand-mark" aria-hidden="true">♞</span>
        {ar.appTitle}
      </h1>

      <button
        type="button"
        className="appbar-btn"
        onClick={onSettings}
        title={ar.appBar.settings}
        aria-label={ar.appBar.settings}
      >
        <Icon name="settings" size={28} />
      </button>
    </header>
  );
}

export default memo(AppBar);
