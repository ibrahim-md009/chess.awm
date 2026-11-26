import { useEffect, useMemo, useState, memo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import PromotionDialog from './PromotionDialog.jsx';
import SquareBadge from './SquareBadge.jsx';

const DEFAULT_THEME = { light: '#e3ebf2', dark: '#6f93b3' };

const LAST_MOVE_BG = 'rgba(255, 213, 74, 0.45)';
const SELECTED_BG = 'rgba(255, 213, 74, 0.7)';
const CHECK_BG =
  'radial-gradient(circle, rgba(235,64,52,0.95) 0%, rgba(235,64,52,0.55) 45%, rgba(235,64,52,0) 75%)';
const HINT_DOT =
  'radial-gradient(circle, rgba(20,20,20,0.35) 22%, transparent 24%)';
const HINT_CAPTURE =
  'radial-gradient(circle, transparent 58%, rgba(20,20,20,0.35) 60%, rgba(20,20,20,0.35) 74%, transparent 76%)';

function isPromotionMove(fen, from, to) {
  try {
    const chess = new Chess(fen);
    const piece = chess.get(from);
    if (!piece || piece.type !== 'p') return false;
    const rank = to[1];
    if (!((piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1'))) {
      return false;
    }
    // Only a promotion if the move is actually legal.
    return chess.moves({ square: from, verbose: true }).some((m) => m.to === to);
  } catch {
    return false;
  }
}

// Drawn only when the user enables "show best-move arrow" in Settings (the app passes `arrow`).
const ARROW_COLOR = 'rgba(61, 219, 176, 0.9)';

function ChessBoard({ fen, orientation, lastMove, status, onMove, arrow, badge, theme = DEFAULT_THEME }) {
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }

  // Any change of position invalidates selection / pending promotion.
  useEffect(() => {
    setSelected(null);
    setPendingPromotion(null);
  }, [fen]);

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    try {
      return new Chess(fen).moves({ square: selected, verbose: true });
    } catch {
      return [];
    }
  }, [fen, selected]);

  const squareStyles = useMemo(() => {
    const styles = {};
    if (lastMove) {
      styles[lastMove.from] = { background: LAST_MOVE_BG };
      styles[lastMove.to] = { background: LAST_MOVE_BG };
    }
    if (status.kingSquare) {
      styles[status.kingSquare] = { background: CHECK_BG };
    }
    if (selected) {
      styles[selected] = { ...(styles[selected] || {}), background: SELECTED_BG };
    }
    legalTargets.forEach((m) => {
      const base = styles[m.to] || {};
      const hint = m.captured ? HINT_CAPTURE : HINT_DOT;
      styles[m.to] = {
        ...base,
        background: base.background ? `${hint}, ${base.background}` : hint,
      };
    });
    return styles;
  }, [lastMove, status.kingSquare, selected, legalTargets]);

  const tryMove = (from, to) => {
    if (isPromotionMove(fen, from, to)) {
      setPendingPromotion({ from, to });
      setSelected(null);
      return false; // the piece is only moved after a promotion choice
    }
    const ok = onMove(from, to);
    setSelected(null);
    return ok;
  };

  const sideToMove = status.turn; // 'w' | 'b'

  const handleSquareClick = (square) => {
    if (pendingPromotion) return;

    if (selected && legalTargets.some((m) => m.to === square)) {
      tryMove(selected, square);
      return;
    }

    try {
      const piece = new Chess(fen).get(square);
      if (piece && piece.color === sideToMove && square !== selected) {
        setSelected(square);
        return;
      }
    } catch {
      /* fall through */
    }
    setSelected(null);
  };

  const handlePieceDrop = (from, to) => {
    if (pendingPromotion || from === to) return false;
    return tryMove(from, to);
  };

  const handleDragBegin = (_piece, square) => {
    if (pendingPromotion) return;
    try {
      const p = new Chess(fen).get(square);
      setSelected(p && p.color === sideToMove ? square : null);
    } catch {
      setSelected(null);
    }
  };

  const choosePromotion = (pieceType) => {
    if (!pendingPromotion) return;
    onMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    setPendingPromotion(null);
  };

  const gameOver = status.checkmate || status.stalemate || status.insufficient;

  return (
    <div className="board-square">
        <Chessboard
          id="main-board"
          position={fen}
          boardOrientation={orientation}
          arePiecesDraggable={!gameOver && !pendingPromotion}
          animationDuration={150}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          onPieceDragBegin={handleDragBegin}
          customSquareStyles={squareStyles}
          customLightSquareStyle={{ backgroundColor: theme.light }}
          customDarkSquareStyle={{ backgroundColor: theme.dark }}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
          }}
          areArrowsAllowed={false}
          customArrows={arrow ? [[arrow.from, arrow.to, ARROW_COLOR]] : []}
        />
        {badge && (
          <SquareBadge
            square={badge.square}
            orientation={orientation}
            classification={badge.classification}
          />
        )}
        {pendingPromotion && (
          <PromotionDialog
            color={sideToMove}
            onSelect={choosePromotion}
            onCancel={() => setPendingPromotion(null)}
          />
        )}
    </div>
  );
}

export default memo(ChessBoard);
