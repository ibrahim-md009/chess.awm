import { memo } from 'react';
import { ar } from '../i18n/ar.js';

function PlayerChip({ color, name, active }) {
  return (
    <div className={`player-chip${active ? ' is-active' : ''}`}>
      <span className={`player-dot player-dot-${color}`} aria-hidden="true" />
      <span className="player-name" dir="auto">{name}</span>
    </div>
  );
}

function GameStatus({ status, headers, orientation, fen }) {
  const sideName = (c) => (c === 'w' ? ar.white : ar.black);

  let text;
  let tone = 'normal';
  if (status.checkmate) {
    // The side to move is the one that has been mated.
    text = ar.status.checkmate(sideName(status.turn === 'w' ? 'b' : 'w'));
    tone = 'end';
  } else if (status.stalemate) {
    text = ar.status.stalemate;
    tone = 'end';
  } else if (status.insufficient) {
    text = ar.status.insufficient;
    tone = 'end';
  } else if (status.fiftyMove) {
    text = ar.status.fiftyMove;
    tone = 'end';
  } else if (status.check) {
    text = ar.status.check(sideName(status.turn));
    tone = 'check';
  } else {
    text = ar.status.turn(sideName(status.turn));
  }

  const whiteName = headers.White || ar.player.defaultWhite;
  const blackName = headers.Black || ar.player.defaultBlack;
  const topColor = orientation === 'white' ? 'b' : 'w';
  const bottomColor = topColor === 'w' ? 'b' : 'w';
  const nameOf = (c) => (c === 'w' ? whiteName : blackName);
  const activeColor = status.turn;
  const gameEnded = tone === 'end';

  const metaParts = [headers.Event, headers.Date, headers.Result].filter(Boolean);

  return (
    <div className="status-block">
      <PlayerChip color={topColor} name={nameOf(topColor)} active={!gameEnded && activeColor === topColor} />

      <div className={`status-banner status-${tone}`} role="status" aria-live="polite">
        {text}
      </div>

      <PlayerChip
        color={bottomColor}
        name={nameOf(bottomColor)}
        active={!gameEnded && activeColor === bottomColor}
      />

      {metaParts.length > 0 && (
        <p className="muted game-meta" dir="auto">{metaParts.join(' · ')}</p>
      )}

      <details className="fen-details">
        <summary>{ar.status.currentFen}</summary>
        <code className="fen-code" dir="ltr">{fen}</code>
      </details>
    </div>
  );
}

export default memo(GameStatus);
