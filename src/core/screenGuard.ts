import './screenGuard.css'
import { lockInput } from './inputLock'
import { PixelLabel } from '../components/PixelText'

/**
 * Full-screen blocking message shown when the site can't be used as designed:
 *  - phones/tablets must be in landscape
 *  - very small landscape screens aren't supported
 *  - on desktop (mouse) the browser window must be maximised or full screen
 *
 * While it's up, input is blocked and the page underneath isn't rendered.
 * Its text is in the references' small text font (PixelLabel).
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

/** Fraction of the screen a desktop window must cover to count as maximised. */
const MIN_SCREEN_COVERAGE = 0.95

function windowFillsScreen(): boolean {
  if (document.fullscreenElement) return true
  // Some browsers (iOS) always report the screen in portrait, so compare
  // long side with long side.
  const long  = Math.max(screen.availWidth, screen.availHeight)
  const short = Math.min(screen.availWidth, screen.availHeight)
  return window.outerWidth  >= long  * MIN_SCREEN_COVERAGE &&
         window.outerHeight >= short * MIN_SCREEN_COVERAGE
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

  const update = () => {
    const problem = currentProblem()
    document.documentElement.classList.toggle('screen-blocked', problem !== null)
    if (problem) {
      msg.setText(MESSAGES[problem])
      fullscreenBtn.hidden = !(problem === 'maximise' && document.fullscreenEnabled)
      unlock ??= lockInput()
    } else {
      unlock?.()
      unlock = null
    }
  }

  update()
  window.addEventListener('resize', update)
  document.addEventListener('fullscreenchange', update)
}
