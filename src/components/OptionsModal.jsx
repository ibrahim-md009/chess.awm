import Modal from './Modal.jsx';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

/** The "Options" sheet: the board actions that have no button of their own. */
export default function OptionsModal({ canPrev, canNext, canUndo, actions, onClose }) {
  const items = [
    { icon: 'flip', label: ar.nav.flip, run: actions.flip, enabled: true },
    { icon: 'undo', label: ar.nav.undo, run: actions.undo, enabled: canUndo },
    { icon: 'first', label: ar.nav.first, run: actions.first, enabled: canPrev },
    { icon: 'last', label: ar.nav.last, run: actions.last, enabled: canNext },
  ];
  return (
    <Modal title={ar.optionsMenu.title} onClose={onClose}>
      <ul className="option-list">
        {items.map((it) => (
          <li key={it.icon}>
            <button
              type="button"
              className="option-item"
              disabled={!it.enabled}
              onClick={() => {
                onClose();
                it.run();
              }}
            >
              <Icon name={it.icon} size={24} />
              <span>{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
