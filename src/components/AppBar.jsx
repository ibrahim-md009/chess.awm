import { memo } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

/** Top bar: brand on one side; import, new game and settings on the other. */
function AppBar({ onImport, onNewGame, onSettings }) {
  return (
    <header className="appbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">♞</span>
        <h1 className="brand-title">{ar.appTitle}</h1>
      </div>

      <div className="appbar-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onImport}
          title={ar.appBar.importTitle}
        >
          <Icon name="importGame" size={20} />
          <span className="btn-label">{ar.appBar.import}</span>
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onNewGame}
          title={ar.appBar.newGame}
          aria-label={ar.appBar.newGame}
        >
          <Icon name="reset" />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onSettings}
          title={ar.appBar.settings}
          aria-label={ar.appBar.settings}
        >
          <Icon name="settings" />
        </button>
      </div>
    </header>
  );
}

export default memo(AppBar);
