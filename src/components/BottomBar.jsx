import { memo } from 'react';
import { Icon } from './icons.jsx';
import { ar } from '../i18n/ar.js';

function BarButton({ icon, label, onClick, className = '' }) {
  return (
    <button type="button" className={`bar-btn ${className}`} onClick={onClick} aria-label={label}>
      <Icon name={icon} size={30} />
      <span className="bar-label">{label}</span>
    </button>
  );
}

/**
 * Bottom bar (same structure as the reference): three small buttons and one wide green
 * button. Options (flip / undo / first / last), New game, Review (shows its progress while
 * a review runs) and the green PGN import button.
 */
function BottomBar({ reviewPercent, onOptions, onNew, onReview, onImport }) {
  return (
    <nav className="bottombar" aria-label={ar.nav.groupLabel}>
      <BarButton icon="menu" label={ar.bottomBar.options} onClick={onOptions} />
      <BarButton icon="plus" label={ar.bottomBar.new} onClick={onNew} />
      <BarButton
        icon="review"
        label={reviewPercent !== null ? `${reviewPercent}%` : ar.bottomBar.review}
        onClick={onReview}
        className={reviewPercent !== null ? 'is-running' : ''}
      />
      <button type="button" className="pgn-btn" onClick={onImport} title={ar.appBar.importTitle}>
        {ar.appBar.import}
      </button>
    </nav>
  );
}

export default memo(BottomBar);
