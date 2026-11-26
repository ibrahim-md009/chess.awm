import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChessGame } from './hooks/useChessGame.js';
import { useStockfish } from './hooks/useStockfish.js';
import { useGameReview } from './hooks/useGameReview.js';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import ReviewNavigator from './components/ReviewNavigator.jsx';
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
  const { goPrev, goNext, goFirst, goLast, reset, moves } = game;

  // Engine analysis is skipped when the side to move has no legal moves.
  const noLegalMoves = game.status.checkmate || game.status.stalemate;
  const engine = useStockfish(game.fen, noLegalMoves);
  const review = useGameReview(game.startFen, moves);
  const [livePaused, setLivePaused] = useState(false);

  const { enabled: liveEnabled, toggle: toggleLive } = engine;
  const { start: startReviewRun } = review;

  // The review uses its own engine; pause live analysis so they don't compete for the CPU.
  const startReview = useCallback(() => {
    if (liveEnabled) {
      toggleLive();
      setLivePaused(true);
    } else {
      setLivePaused(false);
    }
    startReviewRun();
  }, [liveEnabled, toggleLive, startReviewRun]);

  // The review result only counts while it still matches the move list on screen.
  const reviewResult =
    review.status === 'done' && review.result && review.result.moves.length === moves.length
      ? review.result
      : null;

  const marks = useMemo(
    () => (reviewResult ? reviewResult.moves.map((m) => m.classification) : null),
    [reviewResult],
  );

  // Classification badge on the destination square of the move being viewed.
  // Memoised on primitives so the board is not re-rendered by unrelated updates.
  const badgeSquare = reviewResult && game.ply > 0 && game.lastMove ? game.lastMove.to : null;
  const badgeClass =
    reviewResult && game.ply > 0 ? reviewResult.moves[game.ply - 1].classification : null;
  const badge = useMemo(
    () => (badgeSquare && badgeClass ? { square: badgeSquare, classification: badgeClass } : null),
    [badgeSquare, badgeClass],
  );

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

  const movesCount = moves.length;
  const handleReset = useCallback(() => {
    if (movesCount > 0 && !window.confirm(ar.confirmReset)) return;
    reset();
  }, [movesCount, reset]);

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
            badge={badge}
          />
          <NavControls
            canPrev={game.canPrev}
            canNext={game.canNext}
            canUndo={game.canUndo}
            onFirst={goFirst}
            onPrev={goPrev}
            onNext={goNext}
            onLast={goLast}
            onFlip={game.flip}
            onUndo={game.undo}
            onReset={handleReset}
          />
          <ReviewNavigator
            result={reviewResult}
            ply={game.ply}
            startFullmove={game.startFullmove}
            onSeek={game.goTo}
          />
        </section>

        <aside className="side-column">
          <ReviewPanel
            review={review}
            onStart={startReview}
            headers={game.headers}
            hasMoves={movesCount > 0}
            liveWasPaused={livePaused}
          />
          <AnalysisPanel fen={game.fen} engine={engine} />
          <MoveList
            moves={moves}
            marks={marks}
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
