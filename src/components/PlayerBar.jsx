import { memo } from 'react';

/** One player's strip above / below the board. */
function PlayerBar({ color, name, elo, active }) {
  return (
    <div className={`player-bar${active ? ' is-active' : ''}`}>
      <span className={`player-dot player-dot-${color}`} aria-hidden="true" />
      <span className="player-name" dir="auto">{name}</span>
      {elo && <span className="player-elo" dir="ltr">{elo}</span>}
    </div>
  );
}

export default memo(PlayerBar);
