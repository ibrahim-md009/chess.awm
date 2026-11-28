import Modal from './Modal.jsx';
import { BOARD_THEMES } from '../hooks/useSettings.js';
import { MAX_DEPTH, MIN_DEPTH } from '../hooks/useStockfish.js';
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
          id="set-analysis"
          checked={settings.analysis}
          onChange={(v) => onChange({ analysis: v })}
          label={ar.settings.analysis}
          hint={ar.settings.analysisHint}
        />
        <div className="setting-slider">
          <div className="setting-slider-head">
            <label className="setting-label" htmlFor="set-depth">
              {ar.settings.depth}
            </label>
            <span className="setting-value" dir="ltr">
              {ar.settings.depthValue(settings.engineDepth)}
            </span>
          </div>
          <input
            id="set-depth"
            type="range"
            className="range"
            min={MIN_DEPTH}
            max={MAX_DEPTH}
            step="1"
            value={settings.engineDepth}
            onChange={(e) => onChange({ engineDepth: Number(e.target.value) })}
            aria-describedby="set-depth-hint"
          />
          <p className="muted setting-hint" id="set-depth-hint">
            {ar.settings.depthHint}
          </p>
        </div>
        <Switch
          id="set-arrow"
          checked={settings.showBestArrow}
          onChange={(v) => onChange({ showBestArrow: v })}
          label={ar.settings.arrow}
          hint={ar.settings.arrowHint}
        />
      </section>

      <section className="settings-section" aria-labelledby="settings-sound">
        <h3 className="settings-heading" id="settings-sound">
          {ar.settings.soundSection}
        </h3>
        <Switch
          id="set-sound"
          checked={settings.sound}
          onChange={(v) => onChange({ sound: v })}
          label={ar.settings.sound}
          hint={ar.settings.soundHint}
        />
      </section>

      <p className="muted hint">{ar.settings.saved}</p>
    </Modal>
  );
}
