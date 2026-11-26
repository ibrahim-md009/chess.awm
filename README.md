# مراجعة مباريات الشطرنج — Chess Game Review

An Arabic (RTL), dark-themed chess game review app built with React + Vite.
Import a game, let Stockfish analyse it, and see an evaluation graph, move classifications
(Brilliant … Blunder), per-player accuracy and statistics. Everything runs in the browser.

**Status: Phase 5 of 5, version 1.0.0** (final integration and polish).

## Requirements

- Node.js 18 or newer, and npm
- A modern browser with WebAssembly and Web Workers (current Chrome, Edge, Firefox, Safari)

## Install and run

```bash
npm install
npm run dev
```

Open the address Vite prints (default `http://localhost:5173`).

`npm install` also runs `scripts/copy-engine.mjs`, which copies the Stockfish engine files from
`node_modules/stockfish/bin` into `public/engine/`. The same script runs automatically before
`npm run dev` and `npm run build`. To run it by hand: `npm run copy-engine`.

### Production build

```bash
npm run build      # output in dist/
npm run preview    # serve dist/ locally
```

`dist/` is a plain static site and works on any static host, including under a sub-path
(`base: './'`). Make sure the host serves `.wasm` files as `application/wasm`. The engine used
is single-threaded, so no special headers (COOP/COEP) are needed.

## How to use

1. **Load a game**: paste a PGN (first game is used) or a FEN in the «استيراد» panel, or just play
   moves on the board.
2. **Analyse live**: «تشغيل المحرك» analyses the position on the board (evaluation, best move,
   1–3 lines, arrow). Use the depth slider and line count to tune it.
3. **Review the whole game**: «بدء مراجعة المباراة» analyses every position, then shows accuracy,
   per-class statistics, the evaluation graph, badges on the board and marks in the move list.

Keyboard: Right = previous move, Left = next move (mirrored for RTL), Home / End = first / last
move, Esc closes the promotion dialog.

## Features

**Board and game**
- Responsive `react-chessboard` + `chess.js`: legal moves only, drag and drop or click-to-move,
  legal-destination hints, last-move and check highlights, Arabic promotion dialog
- Undo, board flipping, new game, first / previous / next / last navigation, clickable move list
- Status: turn, check, checkmate, stalemate, draws
- FEN and PGN import with Arabic validation messages (BOM and Windows line endings handled,
  several pasted games → first one, 200,000-character limit)
- Playing a different move from an earlier position asks for confirmation, because it deletes
  the rest of the game

**Live analysis (Stockfish 19, lite, single-threaded WASM, in a Web Worker)**
- UCI wrapper with init timeout, error handling and retry; engine is loaded lazily
- Evaluation (White's point of view, `#3` for mate) with bar, depth, speed
- Best move, principal variations (SAN with move numbers), best-move arrow
- Depth slider (8–30), 1–3 lines, start / stop

**Game review**
- Full-game analysis at a fixed depth (fast 10 / balanced 14 / accurate 18, 2 lines) with its own
  engine instance; live analysis is paused meanwhile
- Progress bar with estimated time left, and a cancel button; changing the game cancels the
  review and says so
- Centipawn loss, move classification, player accuracy, statistics
- Interactive evaluation graph (hover tooltip, click / tap / drag to jump; the starting position
  is on the right, matching the RTL arrows), classification badges on the destination square,
  marks in the move list, feedback card, and previous / next mistake buttons

### How moves are classified

Based on the drop in the mover's winning chances (win% points, Lichess' logistic model):

| Class | Rule |
|---|---|
| Brilliant | Loses ≤ 2 points, leaves a piece capturable for a net loss of ≥ 2 pawns after recaptures (a sacrifice), and the mover is not worse afterwards (≥ 45%) nor already winning before (≤ 90%) |
| Great | The engine's best move, and the second-best line is ≥ 12 points worse ("only move"); obvious recaptures and forced single moves are excluded |
| Best | The engine's top choice |
| Excellent | Loses ≤ 2 points |
| Good | Loses ≤ 5 points |
| Inaccuracy | Loses ≤ 10 points |
| Mistake | Loses ≤ 20 points |
| Blunder | Loses more than 20 points |

**Accuracy**: per-move accuracy `103.1668·e^(−0.04354·loss) − 3.1669`, combined as the average of a
volatility-weighted mean and a harmonic mean (the idea Lichess uses).

## Limitations

- Classification, Brilliant / Great detection and accuracy are **our own approximations** of the
  Lichess / Chess.com ideas, computed at a fixed depth with a small WASM engine. Numbers will not
  match those sites exactly. There is no opening-book detection.
- The lite single-threaded engine is much weaker and slower than desktop Stockfish. High depths
  (especially 18+ on long games) can take minutes in a browser; you can cancel at any time.
- Only the main line is kept: there are no variations. PGN comments and variations are ignored.
- The review covers the current move list; any change to it discards the review.
- Only standard chess (no Chess960).

## Troubleshooting

- **«تعذّر تحميل ملفات المحرك»**: run `npm install`, check that `public/engine/` contains
  `engine.json` and a `stockfish-…-lite-single.js` + `.wasm` pair, then restart `npm run dev`.
  On a deployed site, check that the `engine/` folder was uploaded and `.wasm` has the right MIME type.
- **Engine start-up timeout**: slow connection or device; press the button again.
- **A blank page**: an error boundary shows an Arabic message with a reload button; the details are
  in the browser console.

## Project structure

```
scripts/copy-engine.mjs        copies engine files into public/engine
src/
  main.jsx                     entry (error boundary)
  App.jsx                      layout, keyboard shortcuts, wiring
  components/                  ChessBoard, PromotionDialog, SquareBadge, MoveList, NavControls,
                               ImportPanel, GameStatus, AnalysisPanel, ReviewPanel,
                               ReviewNavigator (EvalGraph + MoveFeedback), ErrorBoundary
  engine/stockfishEngine.js    Web Worker + UCI wrapper, info-line parser
  engine/gameReview.js         full-game position evaluation (own engine, abortable)
  hooks/useChessGame.js        game state (reducer)
  hooks/useStockfish.js        live-analysis state
  hooks/useGameReview.js       review state (start, progress, cancel, result)
  utils/chess.js               FEN/PGN parsing, move records, status helpers
  utils/analysis.js            score formatting, PV to SAN
  utils/review.js              win%, centipawn loss, classification, accuracy, stats
  utils/classification.js      symbols / colours per class, mistake navigation
  i18n/ar.js                   all Arabic strings
  styles/                      base.css, components.css
```

## Roadmap (all done)

1. Foundation and chessboard ✔
2. Stockfish integration ✔
3. Game review engine ✔
4. Game review interface ✔
5. Final integration and polish ✔

## License note

Stockfish is licensed under GPL v3, and the `stockfish` npm package is GPL-3.0. If you distribute
this app, make sure you comply with that license.

## Testing note

This project was written and reviewed by reading the code only (plus syntax parsing and a static
check that all imports and Arabic string keys resolve). It has **not** been installed, built or run
by its author. The engine-loading path, the review scoring and all browser interactions (drag and
drop, graph scrubbing, board badges, mobile layout) are therefore untested. Please report anything
that fails after `npm install` / `npm run dev`.
