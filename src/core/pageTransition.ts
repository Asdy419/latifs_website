import { lockInput } from './inputLock'
import { fadeOutEffects } from '../utils/audio'

/**
 * The three-band wipe used between HTML pages (copied from the reference clip:
 * see pageTransition.css, which vite.config.ts inlines into every page):
 *  - navigateTo(url): the bands sweep in to cover the screen, then the browser navigates
 *  - pageReveal():    on arrival, the bands start covering the screen and sweep away
 */

/**
 * The beat between confirming and the wipe, from the reference clip (0:26):
 * the selected label blinks for 10 frames (1/3 s) while the confirm sound
 * plays its loud start, then the bands sweep in, and the next screen comes in
 * while the sound's quiet tail rings out.
 */
const WIPE_DELAY_MS = 333
/** How long the bands take to cover the screen (pageTransition.css: three 133ms sweeps, 67ms apart). */
const COVER_MS = 267
/**
 * Leaving the page stops its sounds, so the confirm sound's quiet tail (about
 * -20 dB by then) is faded out over the end of the wipe instead of being cut.
 */
const SOUND_FADE_MS = 120

function createPanels(mode: 'entering' | 'revealing' | 'covering'): HTMLDivElement {
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
  wrap.addEventListener('animationend', e => {
    if (e.pseudoElement) return // each panel's band (::before) animates alongside it
    if (++finished === 3) done()
  })
}

/**
 * Wipe to another page, timed like the reference: WIPE_DELAY_MS after the
 * press (the confirm flash and sound), the bands sweep in, and the browser
 * navigates as soon as they cover the screen. `replace: true` swaps this page
 * out of the browser history instead of adding to it (used by BACK, so the
 * browser's own back button doesn't ping-pong between the menu and a page).
 */
export function navigateTo(url: string, { replace = false } = {}): void {
  const unlock = lockInput() // no double-navigation during the beat and while the panels slide in
  // Coming back with the browser's back button restores this page from the
  // bfcache mid-transition, so give input back then.
  window.addEventListener('pageshow', e => { if (e.persisted) unlock() }, { once: true })

  let gone = false
  const go = () => {
    if (gone) return
    gone = true
    if (replace) window.location.replace(url)
    else window.location.href = url
  }
  setTimeout(() => {
    onPanelsDone(createPanels('entering'), go)
    setTimeout(() => fadeOutEffects(SOUND_FADE_MS), COVER_MS - SOUND_FADE_MS)
  }, WIPE_DELAY_MS)
  // Backup: animations don't run in a background tab (or may never report
  // finishing), so leave anyway once the wipe should have covered the screen.
  setTimeout(go, WIPE_DELAY_MS + 800)
}

/** The main menu (index.html skips the title screen when it sees this hash). */
export const MENU_URL = '/#menu'

/**
 * Sweeps the panels away once the page is ready (see pageSettled). Resolves
 * once the page is fully revealed.
 */
export function pageReveal(): Promise<void> {
  // Pages arrived at by a wipe ship with the panels already covering the screen
  // (injected into the HTML by vite.config.ts) so the first paint continues the
  // wipe — reuse them.
  const wrap = document.querySelector<HTMLDivElement>('#panel-transition.covering') ?? createPanels('covering')
  return pageSettled().then(() => new Promise<void>(resolve => {
    wrap.className = 'revealing'
    onPanelsDone(wrap, () => { wrap.remove(); resolve() })
  }))
}

/** Longest the cover waits for a slow device before revealing anyway. */
const MAX_HOLD_MS = 1500
/** A device is keeping up once this many frames in a row each take at most… */
const SMOOTH_FRAMES = 3
/** …this long (ms): under 25fps counts as struggling (30fps power-saving is fine). */
const SMOOTH_FRAME_MS = 40

/**
 * Resolves when the new page can be shown smoothly: its images have decoded
 * and the browser has then drawn a few frames in a row without stalling.
 * A device that keeps up gets there within a few frames, so the wipe plays
 * straight through; a struggling one (e.g. a phone still decoding the banner
 * and starting the rings) keeps the cover up until it catches up, so the
 * reveal doesn't stutter. Never longer than MAX_HOLD_MS.
 */
function pageSettled(): Promise<void> {
  const ready = nextFrame() // let the page finish building first
    .then(() => Promise.all(Array.from(document.images, img => img.decode().catch(() => {}))))
    .then(smoothFrames)
  const timeout = new Promise<void>(resolve => setTimeout(resolve, MAX_HOLD_MS))
  return Promise.race([ready, timeout])
}

const nextFrame = () => new Promise<number>(resolve => requestAnimationFrame(resolve))

function smoothFrames(): Promise<void> {
  return new Promise(resolve => {
    let last = -1
    let good = 0
    const tick = (time: number) => {
      if (last >= 0) good = time - last <= SMOOTH_FRAME_MS ? good + 1 : 0
      last = time
      if (good >= SMOOTH_FRAMES) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}
