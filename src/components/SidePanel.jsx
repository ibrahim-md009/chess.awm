import { useRef } from 'react';
import { ar } from '../i18n/ar.js';

/**
 * Tabbed side panel (analysis / moves / review). On phones it sits under the board.
 * Accessible tabs: roving tabindex, Left / Right (Home / End) move between tabs.
 *
 * @param {{id:string,label:string,badge?:string|null}[]} tabs
 */
export default function SidePanel({ tabs, active, onChange, children }) {
  const buttonRefs = useRef({});

  const focusTab = (id) => {
    onChange(id);
    const el = buttonRefs.current[id];
    if (el) el.focus();
  };

  const handleKeyDown = (e) => {
    const index = tabs.findIndex((t) => t.id === active);
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(index - 1 + tabs.length) % tabs.length]; // RTL: right = previous
    else if (e.key === 'ArrowLeft') next = tabs[(index + 1) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      focusTab(next.id);
    }
  };

  return (
    <div className="side-card">
      <div className="tabs" role="tablist" aria-label={ar.tabs.groupLabel} onKeyDown={handleKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            ref={(el) => {
              buttonRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className={`tab${active === t.id ? ' is-active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {t.badge && <span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>
      <div
        className="tab-body"
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
