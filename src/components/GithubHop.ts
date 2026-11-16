import type { TvShow } from './TvOverlay'
import { drawColorGrid } from '../utils/pixelArt'
import { pfpGrid } from './pfpArt'

/*
 * The GitHub hop: the main menu TV's picture while Projects is highlighted (the user's pick, from
 * the video they approved, reference/github-hop.mp4). The user's pfp (their GitHub picture, a Metal
 * Sonic sprite) in a circle, as GitHub shows it, hops along a row of GitHub's contribution squares
 * on a light grey screen. It only moves up and down while the squares scroll left (the user's
 * call). It lands on a grey (no commits) square, pauses, and the square fades up through GitHub's
 * greens to the darkest (the most). One hop is one seamless loop, starting stood on green.
 *
 * Drawn in code, one pixel per art pixel like the TV's static, and redrawn only when something
 * has moved.
 */

type Rgb = readonly [number, number, number]
const rgb = (hex: string): Rgb => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
const mix = (a: Rgb, b: Rgb, k: number): Rgb => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k)) as unknown as Rgb

/** GitHub's contribution colours (light theme), none to the most: a square fades up through them in turn. */
const LEVELS = ['#eff2f5', '#aceebb', '#4ac26b', '#2da44e', '#116329'].map(rgb)
const EMPTY = LEVELS[0], GREEN = LEVELS[LEVELS.length - 1]
/** The screen: a grey from GitHub's scale, dark enough for the pale squares to stand out (the user's call). */
const BACKGROUND = '#afb8c1'
/** Each square's faint edge, as GitHub draws it: its colour with a little of GitHub's ink. */
const INK = rgb('#1f2328'), EDGE_SHADE = 0.08
/** The avatar as GitHub shows it: a thin ring round the pfp (a step darker than the screen), on the checkerboard it sits on. */
const RING = rgb('#8c959f')
const CHECKER = [rgb('#ffffff'), rgb('#eeeeee')]

/*
 * Layout, in pixels of the TV's 330 × 180 screen (one per art pixel). Not all of it shows: rows
 * 11–168, from column 37 (the window's left edge) to the TV's slanted right edge, column 337 − row
 * (measured at five window sizes: the same at each). The row sits in the middle of those rows; the
 * squares further ahead go off under the slant, like a TV's edge.
 */
const SQUARE = 32, CORNER = 5, GAP = 8 // GitHub's proportions
const PITCH = SQUARE + GAP
const RADIUS = 25 // the avatar's disc (50 across), the 40-row sprite filling 80% of it, as on GitHub
const AVATAR = 2 * RADIUS + 2 // with its ring, outside the disc
/** Where the sprite sits in the avatar: head centred, 6 rows clear above it and 4 below (as on GitHub). */
const SPRITE_AT = { x: 10, y: 7 }
const AVATAR_LEFT = 87 // its middle at column 113
const SQUARES_TOP = 113
const AVATAR_TOP = SQUARES_TOP - AVATAR // stood on a square
const JUMP = 26
/** The square it's stood on: centred under it. */
const SQUARE_LEFT = AVATAR_LEFT + AVATAR / 2 - SQUARE / 2

/** One hop, in ms: stood on green, the jump, landed (a pause), then the square fades to green. */
const STAND = 200, AIR = 500, PAUSE = 200, FADE = 300
const CYCLE = STAND + AIR + PAUSE + FADE

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export class GithubHop implements TvShow {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly avatar = avatarCanvas()
  private readonly green = squareCanvas(GREEN)
  private readonly empty = squareCanvas(EMPTY)
  /** The square it lands on, repainted as it fades. */
  private readonly landing = squareCanvas(EMPTY)
  private landingColour = EMPTY
  /** What's on the canvas, so an unchanged frame isn't redrawn. */
  private shown = ''
  private frame = 0
  private started = 0

  /** `screen`: the TV's screen in art px (the canvas's size). */
  constructor(screen: { width: number; height: number }) {
    this.canvas.width = screen.width
    this.canvas.height = screen.height
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
  }

  /** Plays from the top of a hop (stood on green), looping; with reduced motion, just that frame. */
  start(): void {
    this.stop()
    this.started = performance.now()
    this.shown = ''
    this.drawAt(0)
    if (reducedMotion.matches) return
    const tick = () => {
      this.drawAt(performance.now() - this.started)
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  stop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  private drawAt(ms: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const t = ((ms % CYCLE) + CYCLE) % CYCLE
    let scroll = 0, rise = 0, next = EMPTY // next: the square it's hopping to
    if (t >= STAND && t < STAND + AIR) {
      const u = (t - STAND) / AIR
      scroll = Math.round(PITCH * u) // whole pixels, so everything stays on the art grid
      rise = Math.round(4 * JUMP * u * (1 - u))
    } else if (t >= STAND + AIR) {
      scroll = PITCH // landed: grey through the pause, then fading to green
      next = fadeTo((t - STAND - AIR - PAUSE) / FADE)
    }
    const key = `${scroll} ${rise} ${next}`
    if (key === this.shown) return
    this.shown = key
    if (next !== this.landingColour) {
      paintSquare(this.landing, next)
      this.landingColour = next
    }
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    for (let k = -3; ; k++) { // behind it (green), under it, then ahead (grey)
      const left = SQUARE_LEFT + k * PITCH - scroll
      if (left >= this.canvas.width) break
      if (left + SQUARE <= 0) continue
      ctx.drawImage(k <= 0 ? this.green : k === 1 ? this.landing : this.empty, left, SQUARES_TOP)
    }
    ctx.drawImage(this.avatar, AVATAR_LEFT, AVATAR_TOP - rise)
  }
}

/** A colour part-way up GitHub's scale: 0 none, 1 the most. */
function fadeTo(f: number): Rgb {
  if (f <= 0) return EMPTY
  const s = Math.min(f, 1) * (LEVELS.length - 1)
  const i = Math.min(Math.floor(s), LEVELS.length - 2)
  return mix(LEVELS[i], LEVELS[i + 1], s - i)
}

/** A square's pixels: its faint edge (true), its inside (false), or outside its rounded corners (null). */
const SQUARE_PIXELS: (boolean | null)[] = (() => {
  const inside = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= SQUARE || y >= SQUARE) return false
    const cx = Math.min(Math.max(x, CORNER), SQUARE - 1 - CORNER), cy = Math.min(Math.max(y, CORNER), SQUARE - 1 - CORNER)
    return Math.hypot(x - cx, y - cy) <= CORNER + 0.3
  }
  const pixels: (boolean | null)[] = []
  for (let y = 0; y < SQUARE; y++) for (let x = 0; x < SQUARE; x++) {
    pixels.push(inside(x, y) ? !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1) : null)
  }
  return pixels
})()

function squareCanvas(fill: Rgb): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SQUARE
  paintSquare(canvas, fill)
  return canvas
}

function paintSquare(canvas: HTMLCanvasElement, fill: Rgb): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const image = ctx.createImageData(SQUARE, SQUARE)
  const edge = mix(fill, INK, EDGE_SHADE)
  SQUARE_PIXELS.forEach((onEdge, i) => {
    if (onEdge !== null) image.data.set([...(onEdge ? edge : fill), 255], i * 4)
  })
  ctx.putImageData(image, 0, 0)
}

/**
 * The avatar: the checkerboard in a disc, a ring just outside it, the sprite on top (pfpArt.ts:
 * the checkerboard also fills the bits walled in between its legs and beside its right arm).
 */
function avatarCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = AVATAR
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(AVATAR, AVATAR)
  const c = AVATAR / 2
  const inDisc = (x: number, y: number) => (x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2 <= RADIUS * RADIUS
  for (let y = 0; y < AVATAR; y++) for (let x = 0; x < AVATAR; x++) {
    const colour = inDisc(x, y) ? CHECKER[(x + y) % 2]
      : inDisc(x - 1, y) || inDisc(x + 1, y) || inDisc(x, y - 1) || inDisc(x, y + 1) ? RING : null
    if (colour) image.data.set([...colour, 255], (y * AVATAR + x) * 4)
  }
  ctx.putImageData(image, 0, 0)
  drawColorGrid(ctx, pfpGrid(), 1, SPRITE_AT.x, SPRITE_AT.y)
  return canvas
}
