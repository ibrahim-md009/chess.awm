import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChessGame } from './hooks/useChessGame.js';
import { useStockfish } from './hooks/useStockfish.js';
import { soundKind, useMoveSound } from './hooks/useMoveSound.js';
import { useGameReview } from './hooks/useGameReview.js';
import { BOARD_THEMES, useSettings } from './hooks/useSettings.js';
import AppBar from './components/AppBar.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import EvalBar from './components/EvalBar.jsx';
import ChessBoard from './components/ChessBoard.jsx';
import BottomBar from './components/BottomBar.jsx';
import OptionsModal from './components/OptionsModal.jsx';
import EngineLine from './components/EngineLine.jsx';
import Modal from './components/Modal.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import MoveFeedback from './components/MoveFeedback.jsx';
import MoveList from './components/MoveList.jsx';
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
  const engine = useStockfish(game.fen, noLegalMoves, { autoStart: settings.analysis });
  const review = useGameReview(game.startFen, moves);

  const [modal, setModal] = useState(null); // null | 'import' | 'settings' | 'review' | 'options'
  const [toast, setToast] = useState(null);
  const [livePaused, setLivePaused] = useState(false);
  const livePausedRef = useRef(false);
  livePausedRef.current = livePaused;
  const toastTimer = useRef(null);

  /* ---------------- live analysis <-> review ---------------- */

  const { enabled: liveEnabled, setRunning: setLiveRunning, setDepth: setLiveDepth } = engine;

  // Settings -> live engine: depth, and the analysis switch (only on change; the initial
  // value was given to the engine as autoStart).
  useEffect(() => {
    setLiveDepth(settings.engineDepth);
  }, [settings.engineDepth, setLiveDepth]);

  const analysisSetting = useRef(settings.analysis);
  useEffect(() => {
    if (analysisSetting.current === settings.analysis) return;
    analysisSetting.current = settings.analysis;
    if (!livePausedRef.current) setLiveRunning(settings.analysis);
  }, [settings.analysis, setLiveRunning]);
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
      setLiveRunning(settings.analysis);
    }
  }, [livePaused, review.status, setLiveRunning, settings.analysis]);

  /* ---------------- move sounds ---------------- */

  const playSound = useMoveSound(settings.sound);
  const prevPly = useRef(game.ply);
  useEffect(() => {
    const delta = game.ply - prevPly.current;
    prevPly.current = game.ply;
    if (delta === 1) {
      const m = moves[game.ply - 1];
      if (m) playSound(soundKind(m.san));
    } else if (delta === -1) {
      playSound('move');
    } // bigger jumps (import, first / last, a new game) are silent
  }, [game.ply, moves, playSound]);

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
  const openReview = useCallback(() => setModal('review'), []);
  const openOptions = useCallback(() => setModal('options'), []);
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

  // Same direction as the on-screen buttons and the board: left = back, right = forward.
  const modalOpen = modal !== null;
  useEffect(() => {
    const onKey = (e) => {
      if (modalOpen || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
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
  const theme = BOARD_THEMES[settings.boardTheme];
  // Display option only: when off, the engine still analyses and the eval bar still updates.
  const arrow = settings.showBestArrow ? engine.arrow : null;

  const reviewPercent =
    review.status === 'running' && review.progress.total
      ? Math.round((review.progress.done / review.progress.total) * 100)
      : null;

  return (
    <div className="app">
      <AppBar onSettings={openSettings} />

      <main className="screen">
        <EvalBar
          line={engine.evalLine}
          stale={engine.evalStale}
          status={status}
          orientation={orientation}
          enabled={engine.enabled}
          phase={engine.phase}
          pausedByReview={livePaused}
        />

        <EngineLine fen={game.fen} engine={engine} status={status} pausedByReview={livePaused} />

        <PlayerBar
          color={topColor}
          name={nameOf(topColor)}
          elo={eloOf(topColor)}
          active={isActive(topColor)}
        />

        <div className="board-row">
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
        </div>

        <PlayerBar
          color={bottomColor}
          name={nameOf(bottomColor)}
          elo={eloOf(bottomColor)}
          active={isActive(bottomColor)}
        />

        {reviewResult && <MoveFeedback result={reviewResult} ply={game.ply} onSeek={game.goTo} />}

        <MoveList
          moves={moves}
          marks={marks}
          ply={game.ply}
          startFullmove={game.startFullmove}
          onSelect={game.goTo}
          canPrev={game.canPrev}
          canNext={game.canNext}
          onPrev={goPrev}
          onNext={goNext}
        />

        <BottomBar
          reviewPercent={reviewPercent}
          onOptions={openOptions}
          onNew={handleReset}
          onReview={openReview}
          onImport={openImport}
        />
      </main>

      {modal === 'import' && (
        <ImportModal
          onClose={closeModal}
          onLoadPgn={game.loadPgn}
          onLoadFen={game.loadFen}
          onImported={showToast}
        />
      )}
      {modal === 'options' && (
        <OptionsModal
          canPrev={game.canPrev}
          canNext={game.canNext}
          canUndo={game.canUndo}
          actions={{ flip: game.flip, undo: game.undo, first: goFirst, last: goLast }}
          onClose={closeModal}
        />
      )}
      {modal === 'review' && (
        <Modal title={ar.review.title} onClose={closeModal}>
          <ReviewPanel
            review={review}
            onStart={startReview}
            headers={headers}
            hasMoves={movesCount > 0}
            liveWasPaused={livePaused}
          />
        </Modal>
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
