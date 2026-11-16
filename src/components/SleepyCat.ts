import type { TvShow } from './TvOverlay'
import { drawColorGrid } from '../utils/pixelArt'

/*
 * The sleepy cat: the main menu TV's picture while Exit is highlighted (the user's idea). On the
 * GitHub hop's grey, an orange cat sits awake in the middle, its body side on but its face turned
 * to the screen, swishing its tail. The grey fades slowly to a really dark grey (not black); only
 * once it's fully dark does the cat yawn, crouch and lie down, resting its head forward on its
 * paws, side on, asleep, breathing, Zs drifting slowly up out of it (all the user's calls). Only
 * the sleeping (the Zs) loops; the whole thing starts again only when the TV tunes back to it
 * (another button, then Exit again). Flat pixel art with dark outlines, like the other shows.
 * With reduced motion: asleep, still, one Z.
 *
 * Drawn in code, one pixel per art pixel like the TV's static; the cat's poses are drawn once.
 */

const GREY = [0xaf, 0xb8, 0xc1] // the GitHub hop's (GithubHop.ts)
const NIGHT = [0x1e, 0x20, 0x24] // what it fades to: a really dark grey
/** The floor (the user asked for one), fading with the rest: its colour, its line at the wall and boards, the cat's shadow on it (light, then dark). */
const FLOOR = { fill: [[0x9a, 0xa3, 0xad], [0x17, 0x19, 0x1c]], line: [[0x86, 0x8f, 0x99], [0x10, 0x11, 0x14]], shadow: [[0x84, 0x8c, 0x96], [0x0f, 0x10, 0x12]] }
const OUT = '#15171b'
const CAT = { O: '#f39a3c', S: '#c8661c', W: '#fff3e1', P: '#ff8fa8', K: '#2a201b', G: '#ffffff' }
const Z_COLOUR = '#e8eeff'

/**
 * The cat's poses are designed on a 64 × 56 grid (its body facing left, its feet on row 52) and
 * drawn F times that size, one pixel per art pixel: each shape is tested in the design's units, so
 * the cat is bigger but its outline and details stay single art pixels. (The user had it doubled,
 * pixel for pixel, then wanted it smaller again: 1.4 sits between.)
 */
const F = 1.4
const DESIGN = { w: 64, h: 56 }
const GRID = { w: Math.ceil(DESIGN.w * F), h: Math.ceil(DESIGN.h * F) }
/** The grid's top left on the TV's 330 × 180 screen (visible: rows 11–168, columns 37 to 337 − row): the cat in the middle. */
const AT = { x: 88, y: 52 }
/** The floor's top row on the TV: a little above the cat's feet, so it stands (and lies) on it. */
const FLOOR_TOP = AT.y + Math.round(46 * F)

/** The intro, in ms: awake on the grey, still awake as it fades (slowly) to the dark grey, then, in the dark, the yawn, crouch, lying down, sleep. */
const AWAKE = 1300, FADE = 2600
const DARK = AWAKE + FADE
const YAWN = DARK + 200, CROUCH = YAWN + 400, LIE = CROUCH + 350, SLEEP = LIE + 400
/** Once it's asleep, the Zs: one every Z_EVERY ms, each drifting up for Z_LIFE ms (slowly: the user's call). */
const INTRO = SLEEP + 300, Z_EVERY = 1100, Z_LIFE = 3000
/** The sleeping cat breathes in and out every BREATH ms. */
const BREATH = 1200

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export class SleepyCat implements TvShow {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly art = sprites()
  private frame = 0
  private started = 0

  /** `screen`: the TV's screen in art px (the canvas's size). */
  constructor(screen: { width: number; height: number }) {
    this.canvas.width = screen.width
    this.canvas.height = screen.height
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
  }

  /** Plays from the top (the cat awake); with reduced motion, asleep, still. */
  start(): void {
    this.stop()
    if (reducedMotion.matches) return this.drawAt(INTRO + 900)
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
    const a = this.art
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
    // its shadow under it, wider once it's lying down
    const lying = t >= LIE
    fillEllipse(ctx, AT.x + (lying ? 31 : 35) * F, AT.y + (lying ? 55 : 52) * F, (lying ? 25 : 15) * F, 2.6, shade(FLOOR.shadow))
    const draw = (sprite: HTMLCanvasElement) => ctx.drawImage(sprite, AT.x, AT.y)
    // the cat: awake (tail swishing, blinking now and then) until it's dark, then settling down
    if (t < YAWN) {
      draw(a.tails[[0, 1, 2, 1][Math.floor(t / 260) % 4]])
      draw(t % 2600 >= 600 && t % 2600 < 720 ? a.sitBlink : a.sit)
    } else if (t < CROUCH) {
      draw(a.tails[1])
      draw(a.sitYawn)
    } else if (t < LIE) draw(a.crouch)
    else if (t < SLEEP) draw(a.lie)
    else draw(Math.floor((t - SLEEP) / BREATH) % 2 ? a.sleepIn : a.sleep)
    // the Zs, drifting up out of its head, growing as they go
    if (t >= INTRO) {
      const newest = Math.floor((t - INTRO) / Z_EVERY)
      for (let k = Math.max(0, newest - Math.ceil(Z_LIFE / Z_EVERY)); k <= newest; k++) {
        const age = t - INTRO - k * Z_EVERY
        if (age < 0 || age >= Z_LIFE) continue
        const u = age / Z_LIFE
        const z = u < 0.33 ? a.zSmall : u < 0.66 ? a.zMid : a.zBig
        const x = AT.x + Z_FROM.x * F + u * 34 + Math.sin(u * 6.3) * 2
        const y = AT.y + Z_FROM.y * F - u * 60
        ctx.drawImage(z, Math.round(x - z.width / 2), Math.round(y - z.height / 2))
      }
    }
  }
}

/** Fills the pixels whose middles are inside the ellipse round (cx, cy), a row at a time. */
function fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, colour: string): void {
  ctx.fillStyle = colour
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry
    if (dy * dy > 1) continue
    const w = rx * Math.sqrt(1 - dy * dy)
    const x0 = Math.ceil(cx - 0.5 - w), x1 = Math.floor(cx - 0.5 + w)
    if (x1 >= x0) ctx.fillRect(x0, y, x1 - x0 + 1, 1)
  }
}

// ── The cat's poses, drawn once ──────────────────────────────────────────────

type Grid = (string | null)[][]
type Eyes = 'open' | 'half' | 'closed' | 'yawn'

/** Where the Zs start, in the design's units: just above the sleeping cat's head. */
const Z_FROM = { x: 22, y: 26 }

function blank(): Grid {
  return Array.from({ length: GRID.h }, () => Array<string | null>(GRID.w).fill(null))
}
/** Colours every pixel whose middle, in the design's units, is `inside`. */
function each(g: Grid, inside: (x: number, y: number) => boolean, c: string): void {
  for (let y = 0; y < GRID.h; y++) for (let x = 0; x < GRID.w; x++) if (inside((x + 0.5) / F, (y + 0.5) / F)) g[y][x] = c
}
const ellipse = (g: Grid, cx: number, cy: number, rx: number, ry: number, c: string) =>
  each(g, (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, c)
/** The design's cells x0–x1, y0–y1. */
const rect = (g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) =>
  each(g, (x, y) => x >= x0 && x < x1 + 1 && y >= y0 && y < y1 + 1, c)
/** One of the design's cells (a stripe, an eye's glint, the nose). */
const put = (g: Grid, x: number, y: number, c: string) => rect(g, x, y, x, y, c)
function triangle(g: Grid, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, c: string): void {
  const side = (x: number, y: number, px: number, py: number, qx: number, qy: number) => (x - qx) * (py - qy) - (px - qx) * (y - qy)
  each(g, (x, y) => {
    const d1 = side(x, y, ax, ay, bx, by), d2 = side(x, y, bx, by, cx, cy), d3 = side(x, y, cx, cy, ax, ay)
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
  }, c)
}
/** A rounded band `r` thick along `points` (a tail, a foreleg). */
function band(g: Grid, points: [number, number][], r: number, c: string): void {
  each(g, (x, y) => points.slice(1).some(([bx, by], i) => {
    const [ax, ay] = points[i]
    const dx = bx - ax, dy = by - ay
    const s = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    return Math.hypot(x - ax - s * dx, y - ay - s * dy) <= r
  }), c)
}
/** A tail along `points`, its last stretch the darker tip. */
function tailBand(g: Grid, points: [number, number][]): void {
  band(g, points, 1.8, CAT.O)
  band(g, points.slice(-2), 1.8, CAT.S)
  band(g, points.slice(0, -1), 1.8, CAT.O)
}

/**
 * The head facing the screen (while it's up: the body is side on; the user's call), its middle at
 * (hx, hy): both ears, the round face with tabby stripes, the white muzzle, the pink nose, the
 * eyes as asked.
 */
function frontHead(g: Grid, hx: number, hy: number, eyes: Eyes): void {
  triangle(g, hx - 10.5, hy - 5, hx - 8, hy - 16.5, hx - 2, hy - 8, CAT.O)
  triangle(g, hx + 10.5, hy - 5, hx + 8, hy - 16.5, hx + 2, hy - 8, CAT.O)
  triangle(g, hx - 8, hy - 8, hx - 7, hy - 13.5, hx - 3.5, hy - 8.5, CAT.P)
  triangle(g, hx + 8, hy - 8, hx + 7, hy - 13.5, hx + 3.5, hy - 8.5, CAT.P)
  ellipse(g, hx, hy, 11.5, 9.5, CAT.O)
  for (const [x, y] of [[-1, -8], [0, -8], [-1, -7], [0, -7], [-4, -7], [3, -7], [-11, 0], [-10, 1], [10, 0], [9, 1]]) put(g, hx + x, hy + y, CAT.S)
  ellipse(g, hx, hy + 4.5, 4.5, 3, CAT.W)
  put(g, hx - 1, hy + 2, CAT.P); put(g, hx, hy + 2, CAT.P)
  if (eyes === 'open') {
    rect(g, hx - 6, hy - 2, hx - 5, hy, CAT.K); put(g, hx - 6, hy - 2, CAT.G)
    rect(g, hx + 4, hy - 2, hx + 5, hy, CAT.K); put(g, hx + 4, hy - 2, CAT.G)
  } else if (eyes === 'half') {
    rect(g, hx - 6, hy, hx - 5, hy, CAT.K)
    rect(g, hx + 4, hy, hx + 5, hy, CAT.K)
  } else { // closed (and yawning): little curves, like smiles
    for (const [x, y] of [[-7, -1], [-6, 0], [-5, 0], [-4, -1], [3, -1], [4, 0], [5, 0], [6, -1]]) put(g, hx + x, hy + y, CAT.K)
    if (eyes === 'yawn') { ellipse(g, hx, hy + 5.5, 2.3, 2.3, CAT.K); put(g, hx - 1, hy + 6, CAT.P); put(g, hx, hy + 6, CAT.P) }
  }
}

/**
 * The head side on, facing left, resting forward (lying down: the user's call), moved by (dx, dy)
 * from a head at (24, 18.5): both ears (the far one behind), the round head, the muzzle with its
 * white chin, the pink nose at its tip, tabby stripes, the one eye we see.
 */
function sideHead(g: Grid, dx: number, dy: number, eyes: 'half' | 'closed'): void {
  triangle(g, 25.5 + dx, 13 + dy, 28.5 + dx, 3.5 + dy, 32 + dx, 13.5 + dy, CAT.O) // far ear
  triangle(g, 27.5 + dx, 12 + dy, 28.5 + dx, 6.5 + dy, 30.5 + dx, 12.5 + dy, CAT.P)
  triangle(g, 17.5 + dx, 13.5 + dy, 19.5 + dx, 4 + dy, 24.5 + dx, 12 + dy, CAT.O) // near ear
  triangle(g, 19.5 + dx, 12 + dy, 20 + dx, 7 + dy, 23 + dx, 11.5 + dy, CAT.P)
  ellipse(g, 24 + dx, 18.5 + dy, 8.5, 7, CAT.O)
  ellipse(g, 16.5 + dx, 21.5 + dy, 3.4, 2.6, CAT.O) // muzzle
  ellipse(g, 17.5 + dx, 23.5 + dy, 2.6, 1.4, CAT.W) // chin
  for (const [x, y] of [[26, 13], [27, 14], [29, 15], [30, 16], [25, 22], [26, 23]]) put(g, x + dx, y + dy, CAT.S)
  put(g, 13 + dx, 20 + dy, CAT.P) // nose
  if (eyes === 'half') rect(g, 19 + dx, 18 + dy, 20 + dx, 18 + dy, CAT.K)
  else for (const [x, y] of [[18, 18], [19, 19], [20, 19], [21, 18]]) put(g, x + dx, y + dy, CAT.K) // closed: a little curve
}

/** Sitting up side on: haunch, back and chest (down over the top of its front leg, so the leg's attached), white bib, front leg and paw, hind foot; its face to the screen. */
function sitting(eyes: Eyes): Grid {
  const g = blank()
  ellipse(g, 39, 42.5, 9.5, 9.5, CAT.O) // haunch
  ellipse(g, 37, 51, 6, 1.8, CAT.O) // hind foot
  ellipse(g, 32, 51, 2.2, 1.6, CAT.W)
  ellipse(g, 30, 37, 9, 14, CAT.O) // back and chest
  ellipse(g, 24.5, 36, 3.5, 8, CAT.W) // bib
  rect(g, 24, 40, 27, 49, CAT.O) // front leg
  rect(g, 22, 50, 27, 51, CAT.W) // paw
  for (const [x, y] of [[36, 28], [37, 29], [37, 32], [38, 33], [37, 36], [38, 37], [42, 38], [43, 39], [44, 42], [45, 43]]) put(g, x, y, CAT.S)
  frontHead(g, 27, 19, eyes)
  return g
}

/** Its tail, curling up behind it: 0 high, 1 mid, 2 low (drawn behind the sitting cat). */
function tail(frame: number): Grid {
  const g = blank()
  tailBand(g, ([
    [[44, 49], [51, 47], [55, 41], [55, 33]],
    [[44, 49], [52, 48], [57, 44], [59, 37]],
    [[44, 49], [52, 50], [58, 49], [61, 45]],
  ] as [number, number][][])[frame])
  return g
}

/** Settling down: lower and longer, head dropping, eyes heavy. */
function crouching(): Grid {
  const g = blank()
  tailBand(g, [[46, 50], [53, 49], [58, 46], [60, 41]])
  ellipse(g, 40, 45, 10, 7.5, CAT.O) // haunch
  ellipse(g, 38, 51, 6, 1.8, CAT.O) // hind foot
  ellipse(g, 33, 51, 2.2, 1.6, CAT.W)
  ellipse(g, 30, 43.5, 11, 9, CAT.O) // body
  ellipse(g, 22.5, 45, 3.5, 5, CAT.W) // bib
  rect(g, 22, 46, 25, 49, CAT.O) // front leg
  rect(g, 20, 50, 25, 51, CAT.W) // paw
  for (const [x, y] of [[33, 36], [34, 36], [39, 38], [40, 38], [44, 40], [45, 41]]) put(g, x, y, CAT.S)
  frontHead(g, 25, 31, 'half')
  return g
}

/** Lying down side on: its body long behind it, haunch up, tail wrapped round the front, a foreleg out to its paws, its head resting forward on them (moved by dx, dy). */
function lying(dx: number, dy: number, eyes: 'half' | 'closed', breathIn = false): Grid {
  const g = blank()
  const lift = breathIn ? 1 : 0
  tailBand(g, [[55, 48], [55, 53], [43, 54], [31, 54]])
  ellipse(g, 37, 46 - lift * 0.4, 18.5, 8 + lift * 0.8, CAT.O) // body
  ellipse(g, 46, 44 - lift * 0.6, 9, 8.5, CAT.O) // haunch
  for (const [x, y] of [[30, 39], [31, 39], [37, 38], [38, 38], [44, 37], [45, 37], [50, 39], [51, 40]]) put(g, x, y - lift, CAT.S)
  band(g, [[43, 54], [31, 54]], 1.8, CAT.O) // the tail again, in front of the body
  band(g, [[35, 54], [31, 54]], 1.8, CAT.S)
  ellipse(g, 22, 49, 4, 4, CAT.W) // chest
  band(g, [[24, 51.5], [11, 52.5]], 1.9, CAT.O) // foreleg, out from the chest…
  ellipse(g, 9, 52.5, 3.6, 1.8, CAT.W) // …to the paws, under its chin
  sideHead(g, dx, dy, eyes)
  return g
}

/** A Z, `n` pixels square (drawn at the TV's own pixels, not the cat's design units). */
function zCanvas(n: number): HTMLCanvasElement {
  const grid: Grid = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) =>
    y === 0 || y === n - 1 || x === n - 1 - y ? Z_COLOUR : null))
  return canvasOf(grid, false)
}

/** Paints a grid into a new canvas, outlined in dark (`outline`) round its filled pixels. */
function canvasOf(grid: Grid, outline = true): HTMLCanvasElement {
  const h = grid.length, w = grid[0].length
  if (outline) {
    const filled = grid.map(row => row.map(c => c !== null))
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!filled[y][x] && (filled[y - 1]?.[x] || filled[y + 1]?.[x] || filled[y][x - 1] || filled[y][x + 1])) grid[y][x] = OUT
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) drawColorGrid(ctx, grid, 1)
  return canvas
}

function sprites() {
  return {
    sit: canvasOf(sitting('open')),
    sitBlink: canvasOf(sitting('closed')),
    sitYawn: canvasOf(sitting('yawn')),
    tails: [0, 1, 2].map(f => canvasOf(tail(f))),
    crouch: canvasOf(crouching()),
    lie: canvasOf(lying(-9, 21, 'half')),
    sleep: canvasOf(lying(-9, 26, 'closed')),
    sleepIn: canvasOf(lying(-9, 26, 'closed', true)),
    zSmall: zCanvas(5),
    zMid: zCanvas(7),
    zBig: zCanvas(9),
  }
}
