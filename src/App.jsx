import { useEffect, useState } from 'react';
import { useChessGame } from './hooks/useChessGame.js';
import { useStockfish } from './hooks/useStockfish.js';
import { useGameReview } from './hooks/useGameReview.js';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import ChessBoard from './components/ChessBoard.jsx';
import GameStatus from './components/GameStatus.jsx';
import NavControls from './components/NavControls.jsx';
import MoveList from './components/MoveList.jsx';
import ImportPanel from './components/ImportPanel.jsx';
import { ar } from './i18n/ar.js';

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || el.isContentEditable;
}

export default function App() {
  const game = useChessGame();
  // Engine analysis is skipped when the side to move has no legal moves.
  const noLegalMoves = game.status.checkmate || game.status.stalemate;
  const engine = useStockfish(game.fen, noLegalMoves);
  const review = useGameReview(game.startFen, game.moves);
  const [livePaused, setLivePaused] = useState(false);

  // The review uses its own engine; pause live analysis so they don't compete for the CPU.
  const startReview = () => {
    if (engine.enabled) {
      engine.toggle();
      setLivePaused(true);
    } else {
      setLivePaused(false);
    }
    review.start();
  };
  const { goPrev, goNext, goFirst, goLast, reset, moves } = game;

  // Keyboard navigation. The page is RTL, so the right arrow goes back in the
  // game (toward the right-hand start of the reading order) and left goes forward.
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goNext();
          break;
        case 'Home':
          e.preventDefault();
          goFirst();
          break;
        case 'End':
          e.preventDefault();
          goLast();
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, goFirst, goLast]);

  const handleReset = () => {
    if (moves.length > 0 && !window.confirm(ar.confirmReset)) return;
    reset();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-logo" aria-hidden="true">♞</span>
          {ar.appTitle}
        </h1>
      </header>

      <main className="layout">
        <section className="board-column">
          <GameStatus
            status={game.status}
            headers={game.headers}
            orientation={game.orientation}
            fen={game.fen}
          />
          <ChessBoard
            fen={game.fen}
            orientation={game.orientation}
            lastMove={game.lastMove}
            status={game.status}
            onMove={game.makeMove}
            arrow={engine.arrow}
          />
          <NavControls
            canPrev={game.canPrev}
            canNext={game.canNext}
            canUndo={game.canUndo}
            onFirst={game.goFirst}
            onPrev={game.goPrev}
            onNext={game.goNext}
            onLast={game.goLast}
            onFlip={game.flip}
            onUndo={game.undo}
            onReset={handleReset}
          />
        </section>

        <aside className="side-column">
          <ReviewPanel
            review={{ ...review, start: startReview }}
            headers={game.headers}
            hasMoves={game.moves.length > 0}
            liveWasPaused={livePaused}
          />
          <AnalysisPanel fen={game.fen} engine={engine} />
          <MoveList
            moves={game.moves}
            ply={game.ply}
            startFullmove={game.startFullmove}
            onSelect={game.goTo}
          />
          <ImportPanel onLoadPgn={game.loadPgn} onLoadFen={game.loadFen} />
        </aside>
      </main>
    </div>
  );
}
