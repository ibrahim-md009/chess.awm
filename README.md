# مراجعة مباريات الشطرنج — Chess Game Review

Arabic RTL dark-themed chess app built with React + Vite.
**Current status: Phase 3 of 5** (game review engine).

## Requirements

- Node.js 18 or newer
- npm
- A modern browser with WebAssembly and Web Workers

## Install and run

```bash
npm install
npm run dev
```

Then open the address Vite prints (default `http://localhost:5173`).

`npm install` also runs `scripts/copy-engine.mjs`, which copies the Stockfish engine
files from `node_modules/stockfish/bin` into `public/engine/`. The same script runs
automatically before `npm run dev` and `npm run build`, so you normally don't need to
do anything. To run it by hand: `npm run copy-engine`.

Production build:

```bash
npm run build
npm run preview
```

## Features

### Phase 1 (unchanged)

- Responsive Arabic RTL dark interface (desktop and mobile)
- `react-chessboard` + `chess.js`: legal moves only, drag and drop or click-to-move,
  legal-destination hints, last-move and check highlights, Arabic promotion dialog
- Undo, board flipping, new game
- Move navigation: first / previous / next / last buttons, clickable move list,
  keyboard shortcuts (Right = back, Left = forward, Home, End; reversed for RTL)
- Game status: turn, check, checkmate, stalemate, draws
- FEN and PGN import with Arabic validation messages

### Phase 2 (new)

- **Stockfish 19 (lite, single-threaded WASM)** running in a Web Worker
- **UCI communication** with a small wrapper (`src/engine/stockfishEngine.js`):
  `uci` → `uciok`, `isready` → `readyok`, `position fen`, `go depth`, `stop`, `bestmove`
- **Lazy loading**: the engine is downloaded and started only when you press
  «تشغيل المحرك» for the first time. Stopping keeps it loaded, so restarting is instant.
- **Live analysis** that follows the board: it restarts when you move, undo, navigate
  or import a position, and it never mixes results of an old position into a new one
- **Evaluation** (from White's point of view: `+0.35`, `-1.20`, `#3` for mate) with an
  evaluation bar, current depth and engine speed
- **Best move** in SAN and **principal variations** (1–3 lines) with move numbers
- **Best-move arrow** on the board (top line)
- **Depth slider** (8–30, default 16) and **number of lines** (1–3)
- **Start / stop** button
- **Error handling** with Arabic messages: missing engine files, unsupported browser,
  start-up timeout, engine crash (with a retry button)
- Positions with no legal moves (checkmate / stalemate) are not sent to the engine

### Phase 3 (new): game review engine

Press «بدء مراجعة المباراة» to analyse the whole game (the current move list).

- **Full-game analysis** (`src/engine/gameReview.js`): every position is evaluated at a
  fixed depth (fast 10 / balanced 14 / accurate 18) with 2 lines, using a **separate
  engine instance** so it never disturbs live analysis. Live analysis is paused while a
  review runs. Checkmate / stalemate positions are scored without a search.
- **Centipawn loss** per move: how much the mover's evaluation dropped compared with the
  engine's best move (mates and extremes are capped at ±1000).
- **Move classification** (`src/utils/review.js`), based on the drop in the mover's
  winning chances (win% points, Lichess' logistic model):

  | Class | Rule |
  |---|---|
  | Brilliant | Loses ≤ 2 points, leaves a piece capturable for a net loss of ≥ 2 pawns after recaptures (sacrifice), and the mover is not worse afterwards (≥ 45%) nor already winning before (≤ 90%) |
  | Great | The engine's best move, and the second-best line is ≥ 12 points worse ("only move"); obvious recaptures and forced single moves are excluded |
  | Best | The engine's top choice |
  | Excellent | Loses ≤ 2 points |
  | Good | Loses ≤ 5 points |
  | Inaccuracy | Loses ≤ 10 points |
  | Mistake | Loses ≤ 20 points |
  | Blunder | Loses more than 20 points |

- **Player accuracy**: per-move accuracy `103.1668·e^(−0.04354·loss) − 3.1669`, combined as the
  average of a volatility-weighted mean and a harmonic mean (the idea Lichess uses).
- **Statistics**: accuracy, average centipawn loss, move count and a count per class for each side.

These are our own approximations of the Lichess / Chess.com ideas, computed at a fixed
depth with a small WASM engine, so numbers will not match those sites exactly. There is no
opening-book detection. The full per-move data (best move, cp loss, win%) is already
produced for Phase 4 (graph, board icons, move-list marks); this phase only shows the
summary. A cancel button and richer progress display arrive in Phase 4; for now changing
the game (a move, undo, import, reset) aborts a running review.

## Why the lite single-threaded engine

It is small (about 1.7 MB) and works on any static host with no special headers.
The multi-threaded builds need cross-origin isolation (COOP/COEP headers), which
would complicate hosting. A stronger engine can be considered in Phase 5 if wanted.

## Troubleshooting

- **«تعذّر تحميل ملفات المحرك»**: run `npm install`, confirm `public/engine/` contains
  `engine.json` and a `stockfish-…-lite-single.js` + `.wasm` pair, then restart `npm run dev`.
- **The engine seems slow at high depth**: lower the depth slider; depth 30 can take a
  long time in a browser. You can press «إيقاف المحرك» at any moment.

## Project structure

```
scripts/copy-engine.mjs   copies engine files into public/engine
src/
  main.jsx                entry
  App.jsx                 layout and keyboard shortcuts
  components/             ChessBoard, PromotionDialog, MoveList, NavControls,
                          ImportPanel, GameStatus, AnalysisPanel, ReviewPanel
  engine/stockfishEngine.js   Web Worker + UCI wrapper, info-line parser
  hooks/useChessGame.js   game state (reducer)
  engine/gameReview.js    full-game position evaluation (own engine, abortable)
  hooks/useStockfish.js   live-analysis state
  hooks/useGameReview.js  review state (start, progress, result)
  utils/chess.js          FEN/PGN parsing, move records, status helpers
  utils/analysis.js       score formatting, PV to SAN
  utils/review.js         win%, centipawn loss, classification, accuracy, stats
  i18n/ar.js              Arabic strings
  styles/                 base.css, components.css
```

## Roadmap

1. Foundation and chessboard ✔
2. Stockfish integration ✔
3. Game review engine ✔ (this release)
4. Game review interface
5. Final integration and polish

## License note

Stockfish is licensed under GPL v3, and the `stockfish` npm package is GPL-3.0.
If you distribute this app, make sure you comply with that license.

## Testing note

This release was written and reviewed by reading the code only. It has not been
installed, built, or run by its author, so please report anything that fails
after `npm install` / `npm run dev`. In particular, the engine-loading path
(`public/engine`, the Web Worker and the UCI exchange) and the review scoring (thresholds, Brilliant / Great heuristics, accuracy) have not been exercised.
