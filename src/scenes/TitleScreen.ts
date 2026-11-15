import './TitleScreen.css'
import pressAnyButton from '../assets/title/press_any_button.png'
import { COLORS } from '../config'
import { Scene, transitionTo } from '../core/Scene'
import { sfx, playSfx, durationOf, loadSounds } from '../utils/audio'
import { startMusic } from '../utils/music'
import { hideNowPlaying } from '../components/NowPlaying'
import { Menu } from './Menu'

/** "Press any button" screen. Any key or click goes to the main menu. */
export class TitleScreen extends Scene {
  protected readonly background = COLORS.blue

  protected render(): string {
    return `<img src="${pressAnyButton}" id="press-btn" fetchpriority="high" />`
  }

  protected onMount(): void {
    // Coming back from the menu, its "Now Playing" may still be on screen: the
    // blue screen goes over it (this runs while the fade is fully black).
    hideNowPlaying()

    // Use the idle time on this screen to fetch what comes next, in order of
    // need so nothing competes for bandwidth: this screen's image → the confirm
    // sounds (needed on the first key press) → the menu's assets.
    const title = this.app.querySelector<HTMLImageElement>('#press-btn')!
    title.decode().catch(() => {})
      .then(() => loadSounds())
      .then(() => Menu.preload())

    let started = false
    const start = () => {
      if (started) return
      started = true
      playSfx(sfx.accept)
      // Start the menu music right here, inside the key press/tap: iOS only
      // lets audio start from a user gesture. It fades in under the transition.
      startMusic()
      // Fade out for as long as the confirm sound plays, then the menu fades in
      transitionTo(new Menu(), durationOf(sfx.accept, 0.67))
    }

    document.addEventListener('keydown', start, { signal: this.signal })
    document.addEventListener('click',   start, { signal: this.signal })
  }
}
