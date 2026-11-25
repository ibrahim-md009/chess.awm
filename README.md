# مراجعة مباريات الشطرنج — Chess Game Review

Arabic RTL dark-themed chess app built with React + Vite.
**Current status: Phase 1 of 5** (foundation and chessboard).

## Requirements

- Node.js 18 or newer
- npm

## Install and run

```bash
npm install
npm run dev
```

Then open the address Vite prints (default `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Phase 1 features

- React 18 + Vite project, Arabic RTL dark interface, responsive for desktop and mobile
- Chessboard using `react-chessboard` (default clean piece set) with `chess.js` for rules
- Legal moves only: drag and drop, or click a piece then a destination
- Legal-destination hints, last-move highlight, check highlight
- Arabic pawn-promotion dialog
- Undo, board flipping, new game
- Move navigation: first / previous / next / last buttons, clickable move list,
  keyboard shortcuts (Right = back, Left = forward, Home, End; reversed to match RTL)
- Game status: side to move, check, checkmate, stalemate, draw conditions
- FEN import (missing trailing fields are filled in) and PGN import (first game only),
  with Arabic validation messages

## Behaviour notes

- Playing a different move from an earlier position replaces the rest of the line
  (no variation tree in this phase).
- "Undo" removes the last move of the game.
- Arabic text is used for the interface; move notation (SAN) stays Latin.

## Project structure

```
src/
  main.jsx              entry
  App.jsx               layout and keyboard shortcuts
  components/           ChessBoard, PromotionDialog, MoveList, NavControls,
                        ImportPanel, GameStatus
  hooks/useChessGame.js game state (reducer)
  utils/chess.js        FEN/PGN parsing, move records, status helpers
  i18n/ar.js            Arabic strings
  styles/               base.css, components.css
```

## Roadmap

1. Foundation and chessboard (this release)
2. Stockfish integration
3. Game review engine
4. Game review interface
5. Final integration and polish

## Testing note

This release was written and reviewed by reading the code only. It has not been
installed, built, or run by its author, so please report anything that fails
after `npm install` / `npm run dev`.
