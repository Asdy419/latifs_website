import './TvOverlay.css'
import { staticCanvas, TUNE_MS } from './TvStatic'

/*
 * The TV, in its box (#tv-wrap, which the scene's CSS puts on whole art pixels): the screen at its
 * top left, one pixel per art pixel (the static's canvas and the shows'), inside a black frame.
 * Both run straight along the top, the bottom and the left (off the window's edge anyway) and step
 * down their 45° right edge a pixel a row, like the menu's buttons (the user's call: the old frame
 * image sloped smoothly). The screen shows rows 11–168 and, on row y, columns up to 337 − y (what
 * the shows are laid out for); the frame is 2 px round it, 3 across the slant (as thick, at 45°).
 */
const SCREEN = { top: 11, bottom: 168, left: 13 }
/** The first column past the screen on row y. */
const screenEnd = (y: number) => 338 - y

/** A clip-path: rows `top`–`bottom`, from `left` to end(y) on each, so the right edge steps a pixel a row. */
function stepped(top: number, bottom: number, left: number, end: (y: number) => number): string {
  const px = (v: number) => `calc(${v} * var(--art-px))`
  const points = [`${px(left)} ${px(top)}`]
  for (let y = top; y <= bottom; y++) points.push(`${px(end(y))} ${px(y)}`, `${px(end(y))} ${px(y + 1)}`)
  points.push(`${px(left)} ${px(bottom + 1)}`)
  return `polygon(${points.join(', ')})`
}
const FRAME_SHAPE = stepped(SCREEN.top - 2, SCREEN.bottom + 2, SCREEN.left - 2, y => screenEnd(y) + 3)
const SCREEN_SHAPE = stepped(SCREEN.top, SCREEN.bottom, SCREEN.left, screenEnd)

/** Something the TV can show instead of static (GithubHop): a canvas the size of the screen. */
export interface TvShow {
  readonly canvas: HTMLCanvasElement
  /** Plays it from the top. */
  start(): void
  stop(): void
}

/**
 * TV-shaped frame with static rolling on its screen: the site's TV static
 * (TvStatic.ts, the same as the Projects pop-up's TV), one speckle per art pixel.
 * `tune()` puts a show on it instead. Position it from the scene's CSS via #tv-wrap.
 */
export class TvOverlay {
  /** The screen's size in art pixels, which is the static's resolution. */
  private readonly screen: { width: number; height: number }
  private noise: HTMLElement | null = null
  private showBox: HTMLElement | null = null
  private playing: TvShow | null = null
  /** Counts tunings, so a late one can't override a newer one. */
  private tuning = 0

  constructor(screen: { width: number; height: number }) {
    this.screen = screen
  }

  markup(): string {
    const { width, height } = this.screen
    return `
      <div id="tv-wrap">
        <div id="tv-frame" style="clip-path: ${FRAME_SHAPE}"></div>
        <div id="tv-white" style="width: calc(${width} * var(--art-px)); height: calc(${height} * var(--art-px)); clip-path: ${SCREEN_SHAPE}">
          <div class="tv-static rolling"></div><div class="tv-show" hidden></div>
        </div>
      </div>
    `
  }

  /** Puts the static on the screen (once the markup is in the page). A show stops when `signal` aborts. */
  mount(root: ParentNode, signal?: AbortSignal): void {
    this.noise = root.querySelector<HTMLElement>('#tv-white .tv-static')
    this.showBox = root.querySelector<HTMLElement>('#tv-white .tv-show')
    this.noise?.append(staticCanvas(this.screen.width, this.screen.height))
    signal?.addEventListener('abort', () => {
      this.tuning++
      this.playing?.stop()
      this.playing = null
    })
  }

  /**
   * Tunes the TV to `show`, or to static (null). Like a real set, and like the Projects pop-up's
   * TV: rolling static for `minimum` ms first, then the show from the top.
   */
  tune(show: TvShow | null, minimum = TUNE_MS): void {
    const noise = this.noise, box = this.showBox
    if (!noise || !box) return
    const token = ++this.tuning
    this.playing?.stop()
    this.playing = null
    box.hidden = true
    noise.classList.add('rolling')
    if (!show) return
    setTimeout(() => {
      if (token !== this.tuning) return // tuned elsewhere meanwhile, or the menu's gone
      if (show.canvas.parentElement !== box) box.replaceChildren(show.canvas)
      show.start()
      box.hidden = false
      noise.classList.remove('rolling') // under the show: no need to keep it rolling
      this.playing = show
    }, minimum)
  }
}
