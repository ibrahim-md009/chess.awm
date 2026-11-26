import Modal from './Modal.jsx';
import { BOARD_THEMES } from '../hooks/useSettings.js';
import { ar } from '../i18n/ar.js';

function Switch({ id, checked, onChange, label, hint }) {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <label className="setting-label" htmlFor={id}>
          {label}
        </label>
        <p className="muted setting-hint" id={`${id}-hint`}>
          {hint}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-hint`}
        className={`switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

/** Personal settings, remembered in this browser. */
export default function SettingsModal({ settings, onChange, onClose }) {
  return (
    <Modal
      title={ar.settings.title}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {ar.settings.done}
        </button>
      }
    >
      <section className="settings-section" aria-labelledby="settings-board">
        <h3 className="settings-heading" id="settings-board">
          {ar.settings.boardSection}
        </h3>
        <p className="setting-label">{ar.settings.theme}</p>
        <div className="theme-grid" role="radiogroup" aria-label={ar.settings.theme}>
          {Object.entries(BOARD_THEMES).map(([key, colors]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={settings.boardTheme === key}
              className={`theme-option${settings.boardTheme === key ? ' is-active' : ''}`}
              onClick={() => onChange({ boardTheme: key })}
            >
              <span
                className="theme-swatch"
                style={{
                  background: `linear-gradient(135deg, ${colors.light} 50%, ${colors.dark} 50%)`,
                }}
                aria-hidden="true"
              />
              <span>{ar.settings.themes[key]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="settings-analysis">
        <h3 className="settings-heading" id="settings-analysis">
          {ar.settings.analysisSection}
        </h3>
        <Switch
          id="set-arrow"
          checked={settings.showBestArrow}
          onChange={(v) => onChange({ showBestArrow: v })}
          label={ar.settings.arrow}
          hint={ar.settings.arrowHint}
        />
      </section>

      <p className="muted hint">{ar.settings.saved}</p>
    </Modal>
  );
}
