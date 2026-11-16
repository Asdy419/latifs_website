import './TitleScreen.css'
import { Scene, transitionTo } from '../core/Scene'
import { sfx, playSfx, durationOf, loadSounds } from '../utils/audio'
import { startMusic } from '../utils/music'
import { hideNowPlaying } from '../components/NowPlaying'
import { PixelCanvas } from '../components/PixelCanvas'
import { TitleBackground, TITLE_BACKGROUND } from '../components/TitleBackground'
import { emblemArt } from '../components/titleEmblem'
import { pressArt } from '../components/pressArt'
import { Menu } from './Menu'

/**
 * "Press any button" screen, after Sonic Mania's title: the medal (wings, the user's pfp in a
 * ring, LATIF on a ribbon) over an island spinning in the sea (TitleBackground), and "PRESS ANY
 * BUTTON" lettered like the reference's. Any key or click goes to the main menu.
 */
export class TitleScreen extends Scene {
  protected readonly background = TITLE_BACKGROUND

  protected render(): string {
    return `
      <div id="title-emblem"></div>
      <div id="press-btn"></div>
    `
  }

  protected onMount(): void {
    // Coming back from the menu, its "Now Playing" may still be on screen: the
    // title screen goes over it (this runs while the fade is fully black).
    hideNowPlaying()

    new TitleBackground().mount(this.app, this.signal)
    this.app.querySelector('#title-emblem')!.append(new PixelCanvas(emblemArt(), "Latif's Portfolio").element)
    // "PRESS ANY BUTTON", one cell per art pixel
    const press = pressArt()
    const prompt = this.app.querySelector<HTMLElement>('#press-btn')!
    prompt.style.width = `calc(${press.width} * var(--art-px))`
    prompt.style.height = `calc(${press.height} * var(--art-px))`
    prompt.append(new PixelCanvas(press, 'Press any button').element)

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
