import './TitleScreen.css'
import pressAnyButton from '../assets/title/press_any_button.png'
import titleBackground from '../assets/title/80ef3821-2967-4d50-991e-4a0b15633311.png'
import titleLogo from '../assets/title/LATIF Vaporwave Pixel Logo.png'
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
    return `
      <img src="${titleBackground}" id="title-background" alt="" draggable="false" fetchpriority="high" />
      <img src="${titleLogo}" id="title-logo" alt="Latif" draggable="false" fetchpriority="high" />
      <img src="${pressAnyButton}" id="press-btn" alt="Press any button" fetchpriority="high" />
    `
  }

  protected onMount(): void {
    // Coming back from the menu, its "Now Playing" may still be on screen: the
    // title screen goes over it (this runs while the fade is fully black).
    hideNowPlaying()

    // Use the idle time on this screen to fetch what comes next, in order of
    // need so nothing competes for bandwidth: this screen's images → the confirm
    // sounds (needed on the first key press) → the menu's assets.
    const images = this.app.querySelectorAll<HTMLImageElement>('img')
    Promise.all([...images].map(image => image.decode().catch(() => {})))
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
