import './pageTransition.css'
import { lockInput } from './inputLock'

/**
 * Slanted three-panel wipe used between HTML pages:
 *  - navigateTo(url): panels slide in to cover the screen, then the browser navigates
 *  - pageReveal():    on arrival, panels start covering the screen and slide away
 */

function createPanels(mode: 'entering' | 'revealing'): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.id = 'panel-transition'
  wrap.className = mode
  for (let i = 0; i < 3; i++) {
    const panel = document.createElement('div')
    panel.className = `trans-panel trans-panel-${i}`
    wrap.appendChild(panel)
  }
  document.body.appendChild(wrap)
  return wrap
}

/** Calls `done` once all three panels have finished animating. */
function onPanelsDone(wrap: HTMLElement, done: () => void): void {
  let finished = 0
  wrap.addEventListener('animationend', () => {
    if (++finished === 3) done()
  })
}

/**
 * Wipe to another page. `replace: true` swaps this page out of the browser
 * history instead of adding to it (used by BACK, so the browser's own back
 * button doesn't ping-pong between the menu and a page).
 */
export function navigateTo(url: string, { replace = false } = {}): void {
  const unlock = lockInput() // no double-navigation while the panels slide in
  // Coming back with the browser's back button restores this page from the
  // bfcache mid-transition, so give input back then.
  window.addEventListener('pageshow', e => { if (e.persisted) unlock() }, { once: true })

  const wrap = createPanels('entering')
  onPanelsDone(wrap, () => {
    if (replace) window.location.replace(url)
    else window.location.href = url
  })
}

/** The main menu (index.html skips the title screen when it sees this hash). */
export const MENU_URL = '/#menu'

/** Slides the panels away. Resolves once the page is fully revealed. */
export function pageReveal(): Promise<void> {
  // Pages arrived at by a wipe ship with the panels already covering the screen
  // (injected into the HTML by vite.config.ts) so the first paint continues the
  // wipe — reuse them.
  const existing = document.querySelector<HTMLDivElement>('#panel-transition.covering')
  let wrap: HTMLDivElement
  if (existing) {
    wrap = existing
    wrap.className = 'revealing'
  } else {
    wrap = createPanels('revealing')
  }
  return new Promise(resolve => onPanelsDone(wrap, () => { wrap.remove(); resolve() }))
}
