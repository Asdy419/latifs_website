import type { TvShow } from './TvOverlay'
import { drawColorGrid } from '../utils/pixelArt'

/*
 * The sleepy Zs: the main menu TV's picture while Exit is highlighted (the user's call: the sleepy
 * cat that used to be here is gone; "just a bunch of big zs floating around after the room goes
 * dark"). On the GitHub hop's grey, with a floor, nothing stirs for a moment; then the grey fades
 * slowly to a really dark grey (not black), the floor with it, and once it's fully dark Zs drift
 * slowly up from low on the left towards the screen's top right corner, each along its own arc so
 * the paths fan out, swaying as they go and growing the higher they float (the user's calls),
 * each dim as it appears, bright through the middle of its life and dim again before it goes.
 * Only the Zs loop; the room darkens again
 * only when the TV tunes back to Exit. Flat pixel art with dark outlines, like the other shows.
 * With reduced motion: the dark room with a few Zs, still.
 *
 * Drawn in code, one pixel per art pixel like the TV's static; the Zs are drawn once per size and tone.
 */

const GREY = [0xaf, 0xb8, 0xc1] // the GitHub hop's (GithubHop.ts)
const NIGHT = [0x1e, 0x20, 0x24] // what it fades to: a really dark grey
/** The floor, fading with the rest: its colour, its line at the wall and boards. */
const FLOOR = { fill: [[0x9a, 0xa3, 0xad], [0x17, 0x19, 0x1c]], line: [[0x86, 0x8f, 0x99], [0x10, 0x11, 0x14]] }
const OUT = '#15171b'
/** A Z's tones: dim as it appears and goes, bright between. */
const TONES = ['#6d7690', '#e8eeff']
/** The Zs' sizes (px square), small to big: each Z grows through them as it rises. */
const SIZES = [10, 14, 18, 22, 26, 30, 34, 38]
/** The floor's top row on the TV's 330 × 180 screen (visible: rows 11–168, columns 37 to 337 − row). */
const FLOOR_TOP = 116

/** In ms: the grey room, then its slow fade to the dark, then the Zs. */
const AWAKE = 1300, FADE = 2600
const DARK = AWAKE + FADE
/** One Z every Z_EVERY ms, each rising for Z_LIFE ms (slowly: the user's call), dim for its first and last DIM_FOR. */
const Z_EVERY = 1100, Z_LIFE = 7500, DIM_FOR = 900

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export class SleepyZs implements TvShow {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D | null
  /** The Z sprites, by size then tone. */
  private readonly zs = SIZES.map(n => TONES.map(tone => zCanvas(n, tone)))
  private frame = 0
  private started = 0

  /** `screen`: the TV's screen in art px (the canvas's size). */
  constructor(screen: { width: number; height: number }) {
    this.canvas.width = screen.width
    this.canvas.height = screen.height
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
  }

  /** Plays from the top (the grey room); with reduced motion, the dark room with its Zs, still. */
  start(): void {
    this.stop()
    if (reducedMotion.matches) return this.drawAt(DARK + 2600)
    this.started = performance.now()
    this.drawAt(0)
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
    const t = Math.max(0, ms)
    // the grey, fading slowly to the dark grey; the floor fading with it
    const dark = Math.min(1, Math.max(0, (t - AWAKE) / FADE))
    const shade = (pair: number[][]) => `rgb(${pair[0].map((v, i) => Math.round(v + (pair[1][i] - v) * dark)).join(', ')})`
    const { width, height } = this.canvas
    ctx.fillStyle = shade([GREY, NIGHT])
    ctx.fillRect(0, 0, width, FLOOR_TOP)
    ctx.fillStyle = shade(FLOOR.fill)
    ctx.fillRect(0, FLOOR_TOP, width, height - FLOOR_TOP)
    ctx.fillStyle = shade(FLOOR.line)
    for (const y of [FLOOR_TOP, FLOOR_TOP + 18, FLOOR_TOP + 40]) ctx.fillRect(0, y, width, 1)
    // the Zs, once it's dark: each rises slowly from low on the screen, swaying, growing as it
    // goes, dim at both ends of its life
    if (t < DARK) return
    const newest = Math.floor((t - DARK) / Z_EVERY)
    for (let k = Math.max(0, newest - Math.ceil(Z_LIFE / Z_EVERY)); k <= newest; k++) {
      const age = t - DARK - k * Z_EVERY
      if (age < 0 || age >= Z_LIFE) continue
      const u = age / Z_LIFE
      const step = Math.min(SIZES.length - 1, Math.floor(u * SIZES.length))
      const sprite = this.zs[step][age < DIM_FOR || age > Z_LIFE - DIM_FOR ? 0 : 1]
      // from low on the left to the screen's top right corner (about (326, 11)), each along its
      // own arc, bowing one way or the other of the straight line so the paths fan out towards
      // the corner (the user's call), with a little sway
      const x0 = 45 + hash(k * 3 + 2) * 70, y0 = 160, x1 = 288 + hash(k * 3 + 1) * 25, y1 = 14
      const bend = (hash(k * 7 + 5) - 0.5) * 130
      const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len
      const px = (x0 + x1) / 2 + nx * bend, py = (y0 + y1) / 2 + ny * bend // the arc's control point
      const w0 = (1 - u) * (1 - u), w1 = 2 * (1 - u) * u, w2 = u * u
      const cx = w0 * x0 + w1 * px + w2 * x1 + Math.sin(u * 7 + hash(k * 3 + 3) * 6.3) * 5
      const cy = w0 * y0 + w1 * py + w2 * y1
      ctx.drawImage(sprite, Math.round(cx - sprite.width / 2), Math.round(cy - sprite.height / 2))
    }
  }
}

/** A deterministic 0–1 number for `n` (the same Zs every time). */
function hash(n: number): number {
  let h = (n * 2654435761) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 2246822519) >>> 0
  h ^= h >>> 13
  return h / 4294967296
}

/** A chunky Z `n` pixels square in `tone`, its strokes about a fifth of it thick, outlined in dark. */
function zCanvas(n: number, tone: string): HTMLCanvasElement {
  const t = Math.max(3, Math.round(n / 5))
  const grid: (string | null)[][] = Array.from({ length: n + 2 }, () => Array<string | null>(n + 2).fill(null))
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const bar = y < t || y >= n - t
    const diagonal = Math.abs(x - (n - 1 - y)) <= t * 0.62
    if (bar || diagonal) grid[y + 1][x + 1] = tone
  }
  const filled = grid.map(row => row.map(c => c !== null))
  for (let y = 0; y < n + 2; y++) for (let x = 0; x < n + 2; x++) {
    if (!filled[y][x] && (filled[y - 1]?.[x] || filled[y + 1]?.[x] || filled[y][x - 1] || filled[y][x + 1])) grid[y][x] = OUT
  }
  const canvas = document.createElement('canvas')
  canvas.width = n + 2
  canvas.height = n + 2
  const ctx = canvas.getContext('2d')
  if (ctx) drawColorGrid(ctx, grid, 1)
  return canvas
}
