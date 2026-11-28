import { memo } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

/** Top bar: the title and the settings button (nothing else, like the reference). */
function AppBar({ onSettings }) {
  return (
    <header className="appbar">
      <span aria-hidden="true" />
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
        <Icon name="settings" size={30} />
      </button>
    </header>
  );
}

export default memo(AppBar);
