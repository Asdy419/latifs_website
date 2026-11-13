import backIcon from '../assets/shared/back_btn.png'
import backLabel from '../assets/shared/back_txt.png'
import muteIcon from '../assets/menu/mute.png'
import muteLabel from '../assets/menu/mute_btn.png'
import unmuteLabel from '../assets/menu/unmute_btn.png'
import confirmIcon from '../assets/menu/confirm.png'
import confirmLabel from '../assets/menu/confirm_btn.png'
import { HudButton } from './HudButton'
import { showNowPlaying } from './NowPlaying'
import { isMuted, toggleMute } from '../utils/audio'
import { startMusic, pauseMusic } from '../utils/music'

/** Every HUD image, for preloading. */
export const HUD_IMAGES = [backIcon, backLabel, muteIcon, muteLabel, unmuteLabel, confirmIcon, confirmLabel]

/** The label for the action available right now: MUTE while music plays, UNMUTE while muted. */
const muteLabelNow = () => (isMuted() ? unmuteLabel : muteLabel)

interface HudActions {
  /** [B] BACK, the B key or Escape. */
  onBack: () => void
  /** [↵] CONFIRM clicked (and Enter, if `enterConfirms`). */
  onConfirm?: () => void
  /** Also confirm on Enter. Off on the menu, whose button list handles Enter itself. */
  enterConfirms?: boolean
}

/**
 * The corner HUD on every page: [B] BACK with [M] MUTE under it top-left,
 * [↵] CONFIRM top-right. Layout lives in HudButton.css.
 *
 *   const hud = new Hud()
 *   html += hud.markup()
 *   hud.mount({ onBack, onConfirm }, signal)
 *
 * `labelLeft` is where each icon's bar starts (% of the cropped icon's width).
 */
export class Hud {
  readonly back    = new HudButton({ id: 'back-btn',    icon: backIcon,    label: backLabel,      labelLeft: 19.86 })
  readonly mute    = new HudButton({ id: 'mute-btn',    icon: muteIcon,    label: muteLabelNow(), labelLeft: 20 })
  readonly confirm = new HudButton({ id: 'confirm-btn', icon: confirmIcon, label: confirmLabel,   labelLeft: 31.84 })

  markup(): string {
    return `
      <div class="hud hud-left">${this.back.markup()}${this.mute.markup()}</div>
      <div class="hud hud-right">${this.confirm.markup()}</div>
    `
  }

  mount({ onBack, onConfirm, enterConfirms = false }: HudActions, signal?: AbortSignal): void {
    this.back.onClick(onBack, signal)
    if (onConfirm) this.confirm.onClick(onConfirm, signal)
    this.mute.onClick(() => this.toggleMusic(signal), signal)

    document.addEventListener('keydown', e => {
      if (e.key === 'm' || e.key === 'M') this.toggleMusic(signal)
      else if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') onBack()
      else if (e.key === 'Enter' && enterConfirms) onConfirm?.()
    }, { signal })
  }

  /**
   * [M] MUTE: music only (sound effects always play), remembered across pages
   * and visits. The label shows the action available; unmuting resumes the
   * track and shows "Now Playing" again.
   */
  private toggleMusic(signal?: AbortSignal): void {
    const muted = toggleMute()
    this.mute.setLabel(muteLabelNow())
    if (muted) {
      pauseMusic()
    } else {
      // inside the tap/key press, so iOS allows the audio to start
      startMusic().then(title => { if (title && !signal?.aborted) showNowPlaying(title) })
    }
  }
}
