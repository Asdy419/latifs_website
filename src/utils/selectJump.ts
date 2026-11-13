/**
 * The jump a menu button (or project box) does when it's selected, copied from
 * the reference menu clip: positions every 1/30s (one video frame), in art px,
 * joined by straight lines. The bar jumps up-left from its resting -2, the
 * highlight under it dips down-right from +2, and the label hops on top of the
 * bar's jump: up first, down last.
 *
 * Played with the Web Animations API in plain px, worked out when it plays.
 * Safari draws CSS keyframes that use calc(var(--art-px)) at the wrong size
 * (the pink highlight ended up over the next button's text), so never put
 * var() in transform keyframes.
 */
const JUMP = {
  bar:       { ms: 233, steps: [-2, -2, -5, -6, -7, -6, -3, -2] },
  highlight: { ms: 233, steps: [2, 2, 4, 5, 6, 5, 3, 2] },
  hop:       { ms: 267, steps: [0, -2, -4, -7, -7, -7, -6, -4, 0] },
}
/** Start a frame in: browsers show a change a frame after the key press, the game on the next. */
const DELAY_MS = -17

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

interface JumpParts {
  /** Moves up-left with the bar (the bar itself, and the label's sideways wrapper). */
  bar: Element[]
  highlight?: Element
  /** The label's own up-and-down wrapper. */
  hop?: Element
}

/** Plays the jump; `px` is one art pixel in CSS px. Cancel the returned animations to stop it. */
export function playSelectJump({ bar, highlight, hop }: JumpParts, px: number): Animation[] {
  if (reducedMotion.matches) return []
  const play = (target: Element, { ms, steps }: { ms: number; steps: number[] }, diagonal: boolean) =>
    target.animate(
      steps.map(v => ({ transform: `translate(${diagonal ? v * px : 0}px, ${v * px}px)` })),
      { duration: ms, delay: DELAY_MS, easing: 'linear' },
    )
  return [
    ...bar.map(el => play(el, JUMP.bar, true)),
    ...(highlight ? [play(highlight, JUMP.highlight, true)] : []),
    ...(hop ? [play(hop, JUMP.hop, false)] : []),
  ]
}
