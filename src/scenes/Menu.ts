import './Menu.css'
import menuLogo from '../assets/menu/menu_logo.png'
import { SUBPAGES } from '../config'
import { Scene, transitionTo } from '../core/Scene'
import { navigateTo } from '../core/pageTransition'
import { ButtonMenu } from '../components/ButtonMenu'
import { CameraFlash } from '../components/CameraFlash'
import { SleepyCat } from '../components/SleepyCat'
import { SocialDrift } from '../components/SocialDrift'
import { CircleAnimation } from '../components/CircleAnimation'
import { GithubHop } from '../components/GithubHop'
import { Hud, HUD_IMAGES } from '../components/Hud'
import { TvOverlay, type TvShow } from '../components/TvOverlay'
import { OPEN_TUNE_MS, prepareStatic } from '../components/TvStatic'
import { showNowPlaying } from '../components/NowPlaying'
import { sfx, playSfx } from '../utils/audio'
import { startMusic, stopMusic } from '../utils/music'
import { TitleScreen } from './TitleScreen'

/** How long after the menu appears the "Now Playing" pop-up slides in. */
const NOW_PLAYING_DELAY_MS = 1000

/**
 * The TV's screen in art px, the static's resolution (one speckle per art
 * pixel), and the shows': at the top left of #tv-wrap (Menu.css), which
 * TvOverlay.ts draws the stepped screen and frame in.
 */
const TV_SCREEN = { width: 330, height: 180 }

/**
 * The button you picked to leave for a sub-page, so BACK returns to it (per
 * tab). Coming from the title screen always starts on the first button.
 */
const SELECTION_KEY = 'menu-selection'
const saveSelection = (index: number) => {
  try { sessionStorage.setItem(SELECTION_KEY, String(index)) } catch { /* storage blocked: start at the top */ }
}
const savedSelection = (): number => {
  try { return Number(sessionStorage.getItem(SELECTION_KEY) ?? 0) } catch { return 0 }
}

// Keeps preloaded images referenced so the browser holds on to the decoded copies.
const preloaded: HTMLImageElement[] = []

/** Main menu: one button per sub-page (from config.ts) plus Exit, and the corner HUD. */
export class Menu extends Scene {
  /**
   * Start downloading + decoding the menu's images ahead of time (called from
   * the title screen) so the menu doesn't pop in piece by piece on slow phones.
   */
  static preload(): void {
    if (preloaded.length) return
    const decoded = [menuLogo, ...HUD_IMAGES].map(src => { // the menu buttons and the TV are drawn in code
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      preloaded.push(img)
      return img.decode().catch(() => {})
    })
    // Then work out the TV static while the browser is idle, so the menu only copies it
    // (Safari has no requestIdleCallback).
    const prepare = () => prepareStatic(TV_SCREEN.width, TV_SCREEN.height)
    Promise.all(decoded).then(() => 'requestIdleCallback' in window ? requestIdleCallback(prepare) : setTimeout(prepare, 200))
  }

  private readonly circles = new CircleAnimation()
  private readonly tv      = new TvOverlay(TV_SCREEN)
  private readonly hop     = new GithubHop(TV_SCREEN)
  private readonly camera  = new CameraFlash(TV_SCREEN)
  private readonly drift   = new SocialDrift(TV_SCREEN)
  private readonly cat     = new SleepyCat(TV_SCREEN)
  private readonly hud     = new Hud()
  private readonly buttons: ButtonMenu

  /** `returning`: back from a sub-page, so the button you left on stays selected. */
  constructor({ returning = false } = {}) {
    super()
    this.buttons = new ButtonMenu([
      ...SUBPAGES.map((page, i) => ({
        label: page.label,
        onSelect: () => {
          saveSelection(i)
          stopMusic() // fades out under the page wipe; the page starts its own track
          navigateTo(`/${page.id}.html`)
        },
      })),
      { label: 'Exit', onSelect: () => this.exitToTitle() },
    ], { selected: returning ? savedSelection() : 0 })
  }

  protected render(): string {
    return `
      <div id="menu">
        ${this.circles.markup()}
        <img src="${menuLogo}" id="menu-logo" class="page-banner" decoding="async" />
        ${this.tv.markup()}
        <ul id="menu-buttons"></ul>
        ${this.hud.markup()}
      </div>
    `
  }

  protected onMount(): void {
    const { signal } = this
    const list = this.app.querySelector<HTMLUListElement>('#menu-buttons')!

    this.circles.start()
    this.tv.mount(this.app, signal)
    this.buttons.mount(list, signal)

    // The TV previews the highlighted button, as in the game's menu (the user's picks): Projects has
    // the GitHub hop, Socials the logo drift, Photo Gallery the camera flash, Exit (after the
    // sub-pages) the cat falling asleep; About me static for now
    const shows: Partial<Record<string, TvShow>> = { projects: this.hop, socials: this.drift, gallery: this.camera }
    const preview = (i: number) => (i === SUBPAGES.length ? this.cat : shows[SUBPAGES[i]?.id ?? ''] ?? null)
    this.buttons.onChange = i => this.tv.tune(preview(i))
    this.tv.tune(preview(this.buttons.selected), OPEN_TUNE_MS)

    // [↵] CONFIRM = Enter (the button list handles the key itself);
    // [B] BACK / B / Escape = back to the title screen, like Exit
    this.hud.mount({
      onBack: () => {
        playSfx(sfx.accept)
        this.exitToTitle()
      },
      onConfirm: () => this.buttons.confirmSelection(),
    }, signal)
    // CONFIRM hides while a menu button slides over it
    this.hud.confirm.hideWhenCovered(this.buttons.coverShapes, list, signal)

    // Music started on the title screen's key press (see TitleScreen); show
    // "Now Playing" once the fade into the menu has mostly cleared.
    this.playMusic(NOW_PLAYING_DELAY_MS)
    // The browser's back button returns to a cached copy of this page with the music stopped
    window.addEventListener('pageshow', e => { if (e.persisted) this.playMusic(0) }, { signal })
  }

  private exitToTitle(): void {
    stopMusic()
    transitionTo(new TitleScreen())
  }

  /** Start/resume the music and pop up "Now Playing" (unless muted or the menu has gone). */
  private playMusic(popupDelayMs: number): void {
    const asked = performance.now()
    startMusic().then(title => {
      if (!title || this.signal.aborted) return
      const wait = Math.max(0, popupDelayMs - (performance.now() - asked))
      setTimeout(() => { if (!this.signal.aborted) showNowPlaying(title) }, wait)
    })
  }
}
