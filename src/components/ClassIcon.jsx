import { memo } from 'react';
import { ar } from '../i18n/ar.js';

/** Classification badge image (public/badges/<class>.svg). */
function ClassIcon({ classification, size = 20, className = '' }) {
  if (!classification) return null;
  return (
    <img
      className={`class-icon ${className}`}
      src={`${import.meta.env.BASE_URL}badges/${classification}.svg`}
      width={size}
      height={size}
      alt=""
      title={ar.review.classifications[classification]}
      draggable="false"
    />
  );
}

export default memo(ClassIcon);
