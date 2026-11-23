import './screenGuard.css'
import { lockInput } from './inputLock'
import { PixelLabel } from '../components/PixelText'

/**
 * Full-screen blocking message shown when the site can't be used as designed:
 *  - phones/tablets must be in landscape
 *  - very small landscape screens aren't supported
 *  - on desktop (mouse) the browser window must be maximised or full screen
 *
 * While it's up, input is blocked and the page underneath isn't rendered (the `screen-blocked`
 * class on <html>, which the rings and the title backdrop read too). Its text is in the
 * references' small text font (PixelLabel).
 *
 * Judging the window: a check that runs while the page is hidden (minimised, another tab, the
 * display asleep) or in the middle of a transition (going full screen, a display waking up, a
 * window being restored) can read sizes that are stale, zero or half-way, and a verdict taken
 * then used to stand until the next resize event, which a restore doesn't always fire: the user
 * saw the "maximise" message with the tab in full screen until they refreshed. So the check
 * waits while the page is hidden and runs when it shows again, runs a second time a moment
 * after any change (sizes settle a frame or two after the event), listens to every signal that
 * can change the answer (resize, visibility, focus, the Fullscreen API, bfcache restores, the
 * orientation and pointer media queries) and, while the message is up, looks again every second
 * regardless, so it can never stay up for long once the window is right.
 */

type Problem = 'maximise' | 'rotate' | 'too-small'

const MESSAGES: Record<Problem, string> = {
  'maximise':  'Please maximise your browser window to continue.',
  'rotate':    'Please rotate your device to landscape.',
  'too-small': 'Your screen is too small to play. Try a larger device.',
}

const portrait    = matchMedia('(orientation: portrait)')
const tooNarrow   = matchMedia('(orientation: landscape) and (max-width: 479px)')
const mouseDevice = matchMedia('(hover: hover) and (pointer: fine)')

/** Fraction of the screen a desktop window's frame must cover to count as maximised. */
const MIN_SCREEN_COVERAGE = 0.95
/**
 * Failing the frame, how much of the screen's height the window's viewport must cover (its width
 * still MIN_SCREEN_COVERAGE): a maximised browser's viewport is the screen's width and all of
 * its height but the browser's own toolbars.
 */
const MIN_VIEWPORT_HEIGHT = 0.7
/** While the message is up, how often to look again whether or not anything fired. */
const RECHECK_MS = 1000
/** After a change, how long until the follow-up check. */
const SETTLE_MS = 400

/**
 * Whether `w` x `h` covers the screen's available area, `minW` of its width and `minH` of its
 * height, either way round: some browsers (iOS) report the screen in portrait whatever the
 * orientation, and a desktop monitor can stand in portrait.
 */
function coversScreen(w: number, h: number, minW: number, minH: number): boolean {
  const sw = screen.availWidth, sh = screen.availHeight
  return (w >= sw * minW && h >= sh * minH) || (w >= sh * minW && h >= sw * minH)
}

function windowFillsScreen(): boolean {
  if (document.fullscreenElement) return true
  // The window's frame covers the screen (maximised, or the browser's own full screen, F11)…
  if (coversScreen(window.outerWidth, window.outerHeight, MIN_SCREEN_COVERAGE, MIN_SCREEN_COVERAGE)) return true
  // …or its viewport does. The frame's size is what browsers get wrong between states (stale,
  // zero), and a tablet with a trackpad has no frame to speak of; the viewport's size is what
  // the resize event is about, so the two never disagree for long. (The viewport is in CSS px,
  // which page zoom shrinks, and the frame isn't: zoomed-in windows pass on the frame.)
  return coversScreen(window.innerWidth, window.innerHeight, MIN_SCREEN_COVERAGE, MIN_VIEWPORT_HEIGHT)
}

function currentProblem(): Problem | null {
  if (mouseDevice.matches && !windowFillsScreen()) return 'maximise'
  if (portrait.matches)  return 'rotate'
  if (tooNarrow.matches) return 'too-small'
  return null
}

export function installScreenGuard(): void {
  const guard = document.createElement('div')
  guard.id = 'screen-guard'
  guard.innerHTML = `
    <div id="screen-guard-msg"></div>
    <button id="screen-guard-fullscreen" type="button" data-input-lock-exempt>Go full screen</button>
  `
  document.body.append(guard)

  const msg = new PixelLabel('', { wrap: true })
  guard.querySelector('#screen-guard-msg')!.append(msg.element)
  const fullscreenBtn = guard.querySelector('button')!
  fullscreenBtn.replaceChildren(new PixelLabel('Go full screen').element)
  fullscreenBtn.addEventListener('click', e => {
    e.stopPropagation() // don't let the click reach the page underneath
    document.documentElement.requestFullscreen?.().catch(() => {})
  })

  let unlock: (() => void) | null = null
  let shown: Problem | null = null
  let recheck = 0 // the interval while the message is up
  let settle = 0  // the follow-up check after a change

  const update = () => {
    // Judged only while the page shows: hidden, the sizes can be stale or zero, and the answer
    // is taken afresh when it shows again (visibilitychange).
    if (document.hidden) return
    const problem = currentProblem()
    document.documentElement.classList.toggle('screen-blocked', problem !== null)
    if (problem) {
      if (problem !== shown) msg.setText(MESSAGES[problem])
      fullscreenBtn.hidden = !(problem === 'maximise' && document.fullscreenEnabled)
      unlock ??= lockInput()
      recheck ||= window.setInterval(update, RECHECK_MS)
    } else {
      unlock?.()
      unlock = null
      clearInterval(recheck)
      recheck = 0
    }
    shown = problem
  }
  // now, and again once the browser has settled
  const changed = () => {
    update()
    clearTimeout(settle)
    settle = window.setTimeout(update, SETTLE_MS)
  }

  update()
  window.addEventListener('resize', changed)
  document.addEventListener('fullscreenchange', changed)
  document.addEventListener('visibilitychange', changed)
  window.addEventListener('focus', changed)
  window.addEventListener('pageshow', changed)
  for (const query of [portrait, tooNarrow, mouseDevice]) query.addEventListener('change', changed)
  screen.orientation?.addEventListener('change', changed)
}
