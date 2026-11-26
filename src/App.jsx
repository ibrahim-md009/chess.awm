import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChessGame } from './hooks/useChessGame.js';
import { useStockfish } from './hooks/useStockfish.js';
import { useGameReview } from './hooks/useGameReview.js';
import { BOARD_THEMES, useSettings } from './hooks/useSettings.js';
import AppBar from './components/AppBar.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import StatusBanner from './components/StatusBanner.jsx';
import EvalBar from './components/EvalBar.jsx';
import ChessBoard from './components/ChessBoard.jsx';
import NavControls from './components/NavControls.jsx';
import SidePanel from './components/SidePanel.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import MoveFeedback from './components/MoveFeedback.jsx';
import MoveList from './components/MoveList.jsx';
import FenBox from './components/FenBox.jsx';
import ImportModal from './components/ImportModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { ar } from './i18n/ar.js';

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || el.isContentEditable;
}

export default function App() {
  const { settings, update: updateSettings } = useSettings();
  const game = useChessGame();
  const { goPrev, goNext, goFirst, goLast, reset, moves } = game;

  // Live analysis runs continuously and follows the board. It is skipped only when the
  // side to move has no legal moves. (The best-move arrow setting never affects it.)
  const noLegalMoves = game.status.checkmate || game.status.stalemate;
  const engine = useStockfish(game.fen, noLegalMoves, { autoStart: settings.autoAnalysis });
  const review = useGameReview(game.startFen, moves);

  const [modal, setModal] = useState(null); // null | 'import' | 'settings'
  const [tab, setTab] = useState('analysis');
  const [toast, setToast] = useState(null);
  const [livePaused, setLivePaused] = useState(false);
  const toastTimer = useRef(null);

  /* ---------------- live analysis <-> review ---------------- */

  const { enabled: liveEnabled, setRunning: setLiveRunning } = engine;
  const { start: startReviewRun } = review;

  // The review uses its own engine; pause live analysis meanwhile so they don't compete
  // for the CPU. It resumes automatically when the review finishes or is cancelled.
  const startReview = useCallback(() => {
    if (liveEnabled) {
      setLiveRunning(false);
      setLivePaused(true);
    } else {
      setLivePaused(false);
    }
    startReviewRun();
  }, [liveEnabled, setLiveRunning, startReviewRun]);

  useEffect(() => {
    if (livePaused && review.status !== 'running') {
      setLivePaused(false);
      setLiveRunning(true);
    }
  }, [livePaused, review.status, setLiveRunning]);

  // When a review finishes, show the move list (with its marks and feedback).
  const previousReviewStatus = useRef(review.status);
  useEffect(() => {
    if (previousReviewStatus.current === 'running' && review.status === 'done') setTab('moves');
    previousReviewStatus.current = review.status;
  }, [review.status]);

  /* ---------------- review result for the board / list ---------------- */

  // The result only counts while it still matches the move list on screen.
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

  /* ---------------- modals, toast, reset ---------------- */

  const openImport = useCallback(() => setModal('import'), []);
  const openSettings = useCallback(() => setModal('settings'), []);
  const closeModal = useCallback(() => setModal(null), []);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const movesCount = moves.length;
  const handleReset = useCallback(() => {
    if (movesCount > 0 && !window.confirm(ar.confirmReset)) return;
    reset();
  }, [movesCount, reset]);

  /* ---------------- keyboard ---------------- */

  // The page is RTL, so the right arrow goes back in the game and left goes forward.
  const modalOpen = modal !== null;
  useEffect(() => {
    const onKey = (e) => {
      if (modalOpen || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      // Arrow keys on the tab strip move between tabs instead.
      if (e.target && e.target.closest && e.target.closest('[role="tablist"]')) return;
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
  }, [modalOpen, goPrev, goNext, goFirst, goLast]);

  /* ---------------- derived view data ---------------- */

  const { headers, orientation, status } = game;
  const gameOver = status.checkmate || status.stalemate || status.insufficient;
  const topColor = orientation === 'white' ? 'b' : 'w';
  const bottomColor = topColor === 'w' ? 'b' : 'w';
  const nameOf = (c) => (c === 'w' ? headers.White || ar.white : headers.Black || ar.black);
  const eloOf = (c) => (c === 'w' ? headers.WhiteElo : headers.BlackElo);
  const isActive = (c) => !gameOver && status.turn === c;
  const meta = [headers.Event, headers.Date, headers.Result].filter(Boolean).join(' · ');

  const reviewBadge =
    review.status === 'running' && review.progress.total
      ? `${Math.round((review.progress.done / review.progress.total) * 100)}%`
      : null;
  const tabs = useMemo(
    () => [
      { id: 'analysis', label: ar.tabs.analysis },
      { id: 'moves', label: ar.tabs.moves },
      { id: 'review', label: ar.tabs.review, badge: reviewBadge },
    ],
    [reviewBadge],
  );

  const theme = BOARD_THEMES[settings.boardTheme];
  // Display option only: when off, the engine still analyses and the eval bar still updates.
  const arrow = settings.showBestArrow ? engine.arrow : null;

  return (
    <div className="app">
      <AppBar onImport={openImport} onNewGame={handleReset} onSettings={openSettings} />

      <main className="layout">
        <section className="stage">
          <PlayerBar
            color={topColor}
            name={nameOf(topColor)}
            elo={eloOf(topColor)}
            active={isActive(topColor)}
          />

          <div className="board-row">
            <EvalBar
              line={engine.evalLine}
              stale={engine.evalStale}
              status={status}
              orientation={orientation}
              enabled={engine.enabled}
              phase={engine.phase}
              pausedByReview={livePaused}
            />
            <ChessBoard
              fen={game.fen}
              orientation={orientation}
              lastMove={game.lastMove}
              status={status}
              onMove={game.makeMove}
              arrow={arrow}
              badge={badge}
              theme={theme}
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
            />
          </div>

          <PlayerBar
            color={bottomColor}
            name={nameOf(bottomColor)}
            elo={eloOf(bottomColor)}
            active={isActive(bottomColor)}
          />
          <StatusBanner status={status} />
        </section>

        <aside className="side">
          <SidePanel tabs={tabs} active={tab} onChange={setTab}>
            {tab === 'analysis' && (
              <AnalysisPanel fen={game.fen} engine={engine} pausedByReview={livePaused} />
            )}

            {tab === 'moves' && (
              <>
                {reviewResult && (
                  <MoveFeedback result={reviewResult} ply={game.ply} onSeek={game.goTo} />
                )}
                {meta && <p className="muted game-meta" dir="auto">{meta}</p>}
                <MoveList
                  moves={moves}
                  marks={marks}
                  ply={game.ply}
                  startFullmove={game.startFullmove}
                  onSelect={game.goTo}
                />
                <FenBox fen={game.fen} />
              </>
            )}

            {tab === 'review' && (
              <ReviewPanel
                review={review}
                onStart={startReview}
                headers={headers}
                hasMoves={movesCount > 0}
                liveWasPaused={livePaused}
              />
            )}
          </SidePanel>
        </aside>
      </main>

      {modal === 'import' && (
        <ImportModal
          onClose={closeModal}
          onLoadPgn={game.loadPgn}
          onLoadFen={game.loadFen}
          onImported={showToast}
        />
      )}
      {modal === 'settings' && (
        <SettingsModal settings={settings} onChange={updateSettings} onClose={closeModal} />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
