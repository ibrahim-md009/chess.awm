# مراجعة مباريات الشطرنج — Chess Game Review

Arabic RTL dark-themed chess app built with React + Vite.
**Current status: Phase 2 of 5** (Stockfish integration and live analysis).

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
                          ImportPanel, GameStatus, AnalysisPanel
  engine/stockfishEngine.js   Web Worker + UCI wrapper, info-line parser
  hooks/useChessGame.js   game state (reducer)
  hooks/useStockfish.js   live-analysis state
  utils/chess.js          FEN/PGN parsing, move records, status helpers
  utils/analysis.js       score formatting, PV to SAN
  i18n/ar.js              Arabic strings
  styles/                 base.css, components.css
```

## Roadmap

1. Foundation and chessboard ✔
2. Stockfish integration ✔ (this release)
3. Game review engine
4. Game review interface
5. Final integration and polish

## License note

Stockfish is licensed under GPL v3, and the `stockfish` npm package is GPL-3.0.
If you distribute this app, make sure you comply with that license.

## Testing note

This release was written and reviewed by reading the code only. It has not been
installed, built, or run by its author, so please report anything that fails
after `npm install` / `npm run dev`. In particular, the engine-loading path
(`public/engine`, the Web Worker and the UCI exchange) has not been exercised.
