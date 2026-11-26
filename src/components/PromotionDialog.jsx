import { useEffect } from 'react';
import { ar } from '../i18n/ar.js';

// Unicode chess glyphs: white set for white, black set for black.
const GLYPHS = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞' },
};

const ORDER = ['q', 'r', 'b', 'n'];

export default function PromotionDialog({ color, onSelect, onCancel }) {
  // Escape closes the dialog without promoting.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="promo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ar.promotion.title}
      onClick={onCancel}
    >
      <div className="promo-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="promo-title">{ar.promotion.title}</h3>
        <div className="promo-options">
          {ORDER.map((type) => (
            <button
              key={type}
              type="button"
              className="promo-btn"
              onClick={() => onSelect(type)}
              aria-label={ar.promotion[type]}
            >
              <span className="promo-glyph" aria-hidden="true">
                {GLYPHS[color][type]}
              </span>
              <span className="promo-name">{ar.promotion[type]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost promo-cancel" onClick={onCancel}>
          {ar.promotion.cancel}
        </button>
      </div>
    </div>
  );
}
