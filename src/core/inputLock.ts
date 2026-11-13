/**
 * Stops keyboard/mouse input reaching the page — used during scene and page
 * transitions and while the screen guard is up.
 *
 * Works by swallowing events in the capture phase on `window`, before any
 * page listener sees them. Browser shortcuts (F11, Ctrl+R…) still work because
 * nothing calls preventDefault. Clicks on elements marked
 * `data-input-lock-exempt` are let through (e.g. the "Go full screen" button).
 */

const BLOCKED_EVENTS = ['keydown', 'keyup', 'click'] as const
let locks = 0

function block(e: Event): void {
  if (locks === 0) return
  if (e.type === 'click' && e.target instanceof Element && e.target.closest('[data-input-lock-exempt]')) return
  e.stopImmediatePropagation()
}

for (const type of BLOCKED_EVENTS) window.addEventListener(type, block, true)

/** Blocks input until the returned release function is called (calling it twice is harmless). */
export function lockInput(): () => void {
  locks++
  let released = false
  return () => {
    if (released) return
    released = true
    locks--
  }
}
