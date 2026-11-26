# مراجعة مباريات الشطرنج — Chess Game Review

An Arabic (RTL), dark-themed chess game review app built with React + Vite.
Import a game, watch Stockfish evaluate every position live, and run a full-game review with
move classifications (Brilliant … Blunder), per-player accuracy and statistics.
Everything runs in the browser.

**Status: Phase 6 follow-up (mobile layout modelled on the Chess.com app screenshot), version 1.2.0.**

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
(`base: './'`). Make sure the host serves `.wasm` files as `application/wasm`. The engine is
single-threaded, so no special headers (COOP/COEP) are needed.

## The interface

One column, board first, laid out like the Chess.com mobile analysis screen (dark `#262522`
background, wood board, green accents). Top to bottom:

- **Top bar** (icons only): import (left, opens the PGN / FEN dialog), title, settings (right).
- **Engine line**: score, depth, best move; also loading / error + retry / paused-during-review and
  check / game-over messages.
- **Player strip**, the **board** (edge to edge, wood colours, coordinates inside the squares),
  **player strip**. A 6 px evaluation bar is drawn over the board's left edge, so the board keeps
  the full width. It follows the live engine and board flipping.
- **Move strip**: one row with a chevron at each end that scrolls it. The current move is kept in
  view. After a review, marks appear on the moves and a one-line verdict (with previous / next
  mistake buttons) appears under the strip.
- **Bottom bar**: **Options** (flip board, undo, first move, last move), **New** (new game), the
  raised green **review** button (opens the game-review dialog; shows the percentage while a review
  runs), **Back** and **Forward** (press and hold to scrub through the game).

One Stockfish engine analyses continuously at depth 18 and follows every position.

### Import dialog

Paste a PGN (the first game is used) or a FEN, or choose a `.pgn` / `.txt` file, then press
«استيراد» (or Ctrl + Enter). Errors are shown inside the dialog in Arabic.

### Settings

Saved in this browser (localStorage):

| Setting | Default | Notes |
|---|---|---|
| Show best-move arrow | **off** | Display only. The engine keeps analysing and the evaluation bar keeps updating whether the arrow is shown or not. |
| Board colours | Wood | Wood, Ocean, Classic, Walnut, Slate |

### Keyboard

Left = previous move, Right = next move, Home / End = first / last move,
Esc closes dialogs and the promotion picker.

## Features

**Board and game**
- Responsive `react-chessboard` + `chess.js`: legal moves only, drag and drop or click-to-move,
  legal-destination hints, last-move and check highlights, Arabic promotion dialog
- Undo, board flipping, new game, first / previous / next / last navigation, clickable move list
- Status: check, checkmate, stalemate, draws
- FEN and PGN import (BOM and Windows line endings handled, several pasted games → first one,
  200,000-character limit)
- Playing a different move from an earlier position asks for confirmation, because it deletes the
  rest of the game

**Live analysis (Stockfish 19, lite, single-threaded WASM, in a Web Worker)**
- Starts automatically and analyses continuously (depth 18) as moves are played or navigated
- UCI wrapper with init timeout, error handling and retry
- Evaluation (White's point of view, `#3` for mate), depth, speed, best move, principal variations
- Retry button if the engine fails to start

**Game review**
- Full-game analysis at a fixed depth (fast 10 / balanced 14 / accurate 18, 2 lines) with its own
  engine instance; live analysis pauses meanwhile and **resumes automatically** afterwards
- Progress bar with estimated time left, and a cancel button; changing the game cancels the review
  and says so
- Centipawn loss, move classification, player accuracy, statistics
- Classification badges on the destination square of the move being viewed, and marks in the
  move strip

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

- The layout, colours, spacing and icon style follow the reference screenshot, but the chess pieces are
  the board library's default set and the icons are simple open-source-style glyphs, so they are close
  to, not identical with, the Chess.com originals.

- Classification, Brilliant / Great detection and accuracy are **our own approximations** of the
  Lichess / Chess.com ideas, computed at a fixed depth with a small WASM engine. Numbers will not
  match those sites exactly. There is no opening-book detection.
- The lite single-threaded engine is much weaker and slower than desktop Stockfish. High depths
  (especially 18+ on long games) can take minutes in a browser; you can cancel at any time.
- Only the main line is kept: there are no variations. PGN comments and variations are ignored.
- The review covers the current move list; any change to it discards the review.
- Only standard chess (no Chess960).
- The evaluation graph was removed in Phase 6. In 1.1.1 the manual depth / line-count controls, the
  engine start / stop switch, the "auto-start" setting and the on-screen FEN box were removed with the
  panels. Live analysis is always on at depth 18.

## Troubleshooting

- **«تعذّر تحميل ملفات المحرك»**: run `npm install`, check that `public/engine/` contains
  `engine.json` and a `stockfish-…-lite-single.js` + `.wasm` pair, then restart `npm run dev`.
  On a deployed site, check that the `engine/` folder was uploaded and `.wasm` has the right MIME type.
  Until the engine loads, the evaluation bar stays neutral.
- **Engine start-up timeout**: slow connection or device; press «إعادة المحاولة» in the engine line.
- **A blank page**: an error boundary shows an Arabic message with a reload button; details are in
  the browser console.

## Project structure

```
scripts/copy-engine.mjs        copies engine files into public/engine
src/
  main.jsx                     entry (error boundary, styles)
  App.jsx                      composition, keyboard, live-analysis <-> review hand-off
  components/
    AppBar, PlayerBar, EvalBar (thin), ChessBoard, EngineLine, MoveList (horizontal),
    MoveFeedback, BottomBar, OptionsModal, SquareBadge, PromotionDialog, ReviewPanel,
    Modal, ImportModal, SettingsModal, ErrorBoundary, icons
  engine/stockfishEngine.js    Web Worker + UCI wrapper, info-line parser
  engine/gameReview.js         full-game position evaluation (own engine, abortable)
  hooks/useChessGame.js        game state (reducer)
  hooks/useStockfish.js        live-analysis state (auto-start, retained evaluation)
  hooks/useGameReview.js       review state (start, progress, cancel, result)
  hooks/useSettings.js         personal settings (localStorage)
  utils/chess.js               FEN/PGN parsing, move records, status helpers
  utils/analysis.js            score formatting, PV to SAN
  utils/review.js              win%, centipawn loss, classification, accuracy, stats
  utils/classification.js      symbols / colours per class, mistake navigation
  i18n/ar.js                   all Arabic strings
  styles/                      base.css (tokens), layout.css, components.css
```

## Roadmap

1. Foundation and chessboard ✔
2. Stockfish integration ✔
3. Game review engine ✔
4. Game review interface ✔
5. Final integration and polish ✔
6. UI/UX redesign ✔
6.1 Simplified, board-first mobile layout ✔
6.2 Chess.com-app-style layout (this release)

## License note

Stockfish is licensed under GPL v3, and the `stockfish` npm package is GPL-3.0. If you distribute
this app, make sure you comply with that license.

## Testing note

This project was written and reviewed by reading the code only (plus syntax parsing and static
checks that all imports, Arabic string keys and CSS classes resolve). It has **not** been installed,
built or run by its author. The engine-loading path, the review scoring and all browser
interactions (drag and drop, press-and-hold stepping, the evaluation bar, the horizontal move strip,
modals, settings persistence, mobile layout and board size) are therefore untested. Please report anything that
fails after `npm install` / `npm run dev`.
