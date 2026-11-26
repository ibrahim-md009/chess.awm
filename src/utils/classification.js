// Display metadata for move classifications, shared by the board badge, the move
// list, the graph and the review panel. Colours are CSS variables (components.css).

export const CLASS_META = {
  brilliant: { symbol: '!!', color: 'var(--c-brilliant)' },
  great: { symbol: '!', color: 'var(--c-great)' },
  best: { symbol: '★', color: 'var(--c-best)' },
  excellent: { symbol: '✓', color: 'var(--c-excellent)' },
  good: { symbol: '•', color: 'var(--c-good)' },
  inaccuracy: { symbol: '?!', color: 'var(--c-inaccuracy)' },
  mistake: { symbol: '?', color: 'var(--c-mistake)' },
  blunder: { symbol: '??', color: 'var(--c-blunder)' },
};

/** Classes the "previous / next mistake" buttons jump between. */
export const MISTAKE_CLASSES = ['mistake', 'blunder'];

/** Classes marked with a dot on the evaluation graph. */
export const GRAPH_MARKED_CLASSES = ['brilliant', 'great', 'mistake', 'blunder'];

/**
 * Find the nearest move (as a ply number, 1-based) before / after `ply` whose
 * classification is one of `classes`. Returns null when there is none.
 */
export function findMoveByClass(reviewMoves, ply, classes, direction) {
  if (direction > 0) {
    for (let p = ply + 1; p <= reviewMoves.length; p += 1) {
      if (classes.includes(reviewMoves[p - 1].classification)) return p;
    }
  } else {
    for (let p = ply - 1; p >= 1; p -= 1) {
      if (classes.includes(reviewMoves[p - 1].classification)) return p;
    }
  }
  return null;
}
