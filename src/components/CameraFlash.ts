import type { TvShow } from './TvOverlay'
import { drawColorGrid } from '../utils/pixelArt'

/*
 * The camera flash: the main menu TV's picture while Photo Gallery is highlighted (the user's pick,
 * from the video they approved, reference/camera-flash.mp4). A pixel-art Fujifilm X100VI (after the
 * user's photo), drawn flat (they found a shaded take too busy), charges up at its AF-assist lamp
 * (the small round lamp the user circled): the lamp brightens from amber to white in flat steps and
 * golden sparks stream into it while the camera shakes harder and faster. At the climax a burst
 * from the lamp whites out the screen, which fades back to the camera at rest. One charge is one
 * seamless loop. It's set against a starry night sky and nothing else, as if looking straight
 * up (the user's calls: a lake with the moon's path on it and a treeline came first, then a
 * banded sky; "the entire background should just be stars in the sky like I'm looking directly
 * up", "add more stars"). With reduced motion it's just the camera at rest: no shaking, no flash.
 *
 * Drawn in code, one pixel per art pixel like the TV's static; the camera itself is drawn once.
 */

const OUT = '#15171b'
const SILVER = '#c9cfd6', SILVER_LIGHT = '#e6e9ed', SILVER_DARK = '#8b929b'
const LEATHER = '#2a2b30'
const LENS_BLACK = '#1c1d22', LETTERING = '#d9dde2', GLASS = '#121520', GLINT = '#ffffff'
const RED = '#c0392b'
const LAMP = '#d9bf5c'
const VIEWFINDER = '#232833', VIEWFINDER_SHINE = '#4c5567'
/** The charge, flat: white, pale, yellow. */
const GLOW = ['#ffffff', '#fff6cf', '#ffe58a']
/** A spark: its head, then its tail. */
const SPARK = ['#ffffff', '#ffe58a', '#f0b23a']

/** One loop, in ms: at rest, charging, the burst, white, fading back. */
const REST = 500, CHARGE = 2000, BURST = 60, WHITE = 140, FADE = 600
const CYCLE = REST + CHARGE + BURST + WHITE + FADE
const FLASH_AT = REST + CHARGE

/*
 * Where the camera goes on the TV's 330 × 180 screen (one pixel per art pixel). Only part of it
 * shows: rows 11–168, from column 37 to the slanted right edge, column 337 − row (see GithubHop.ts).
 * The camera (rows 8–92 of its sprite) sits in the middle of those rows, its bottom right corner
 * well clear of the slant even shaken 4 px.
 */
const SPRITE_X = 53, SPRITE_Y = 39

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export class CameraFlash implements TvShow {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly camera = cameraCanvas()
  private frame = 0
  private started = 0

  /** `screen`: the TV's screen in art px (the canvas's size). */
  constructor(screen: { width: number; height: number }) {
    this.canvas.width = screen.width
    this.canvas.height = screen.height
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
  }

  /** Plays from the top of a loop (the camera at rest), looping; with reduced motion, just that frame. */
  start(): void {
    this.stop()
    this.started = performance.now()
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
    const charge = t >= REST && t < FLASH_AT ? (t - REST) / CHARGE : 0
    const [dx, dy] = shake(t, charge)
    const { width, height } = this.canvas
    drawNight(ctx, Math.max(0, ms))
    ctx.drawImage(this.camera, SPRITE_X + dx, SPRITE_Y + dy)
    const lx = SPRITE_X + dx + LAMP_AT.cx, ly = SPRITE_Y + dy + LAMP_AT.cy // the lamp's middle

    // the charge, in flat steps: the lamp goes yellow, pale, white; a glow round it grows in two
    // flat rings; near the climax the lamp flickers
    if (charge > 0) {
      const lamp = charge > 0.7 ? (charge > 0.85 && Math.floor(t / 33) % 2 === 0 ? GLOW[1] : GLOW[0]) : charge > 0.4 ? GLOW[1] : GLOW[2]
      const outer = charge < 0.25 ? 0 : 3.5 + 6 * charge * charge
      if (outer > 0) fillDisc(ctx, lx, ly, outer, GLOW[2])
      if (outer - 2.2 > 0) fillDisc(ctx, lx, ly, outer - 2.2, GLOW[1]) // over the lamp's rim too: one glow
      fillDisc(ctx, lx, ly, LAMP_AT.glass, lamp)
    }
    // the sparks, streaming in faster as they near the lamp
    if (charge > 0) {
      for (const s of SPARKS) {
        const age = t - s.at
        if (age < 0 || age >= SPARK_LIFE) continue
        const u = age / SPARK_LIFE
        const r = s.from - (s.from - 3) * u * u
        for (let k = 2; k >= 0; k--) { // its tail, then its head
          const rr = r + k * (1 + u * 2)
          ctx.fillStyle = SPARK[k]
          ctx.fillRect(Math.round(lx + s.cos * rr), Math.round(ly + s.sin * rr), 1, 1)
        }
      }
    }
    // the flash: a burst out of the lamp fills the screen, holds white, then fades back
    if (t >= FLASH_AT && t < FLASH_AT + BURST) {
      const u = (t - FLASH_AT) / BURST
      fillDisc(ctx, lx, ly, 6 + 300 * u * u, '#ffffff')
    } else if (t >= FLASH_AT + BURST) {
      const u = (t - FLASH_AT - BURST - WHITE) / FADE
      const white = u <= 0 ? 1 : Math.pow(1 - Math.min(1, u), 1.6)
      ctx.fillStyle = `rgba(255, 255, 255, ${white})`
      ctx.fillRect(0, 0, width, height)
    }
  }
}

/*
 * The night sky behind it, over the TV's whole screen (its visible part: rows 11–168, columns 37
 * to 337 − row): one deep blue, as if looking straight up (no horizon, no bands: the user's
 * call), thick with stars everywhere. Most twinkle between white and a dim blue on their own
 * periods, every ninth flaring into a little cross while bright; a third are faint, far ones.
 */
const SKY = '#0b1433'
// scattered evenly but not on a grid (the R2 sequence; hashed positions bunched up top left)
const STARS = Array.from({ length: 230 }, (_, i) => ({
  x: Math.floor(((0.5 + i * 0.7548776662) % 1) * 330),
  y: Math.floor(((0.5 + i * 0.5698402910) % 1) * 180),
  period: 900 + Math.floor(hash(i * 3 + 3) * 1600),
  big: i % 9 === 0,
  faint: i % 3 === 1,
}))

function drawNight(ctx: CanvasRenderingContext2D, now: number): void {
  ctx.fillStyle = SKY
  ctx.fillRect(0, 0, 330, 180)
  for (const s of STARS) {
    const bright = ((now + s.x * 37) % s.period) / s.period < 0.55
    ctx.fillStyle = s.faint ? (bright ? '#6b7db3' : '#46558a') : bright ? '#ffffff' : '#7f93c9'
    ctx.fillRect(s.x, s.y, 1, 1)
    if (s.big && bright) { // a bigger one twinkles into a little cross
      ctx.fillStyle = '#c9d6ff'
      ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1); ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1)
    }
  }
}

/** A deterministic 0–1 number for `n` (the shakes and sparks are the same every loop). */
function hash(n: number): number {
  let h = (n * 2654435761) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 2246822519) >>> 0
  h ^= h >>> 13
  return h / 4294967296
}

/** How far the camera's shaken (whole pixels): harder and faster as the charge (0–1) builds. */
function shake(t: number, charge: number): [number, number] {
  if (charge < 0.12) return [0, 0]
  const amp = charge < 0.42 ? 1 : charge < 0.72 ? 2 : charge < 0.93 ? 3 : 4
  const every = charge < 0.42 ? 100 : charge < 0.72 ? 66 : charge < 0.93 ? 50 : 33 // ms between jolts
  const step = Math.floor(t / every)
  let dx = Math.round((hash(step * 2 + 1) * 2 - 1) * amp)
  const dy = Math.round((hash(step * 2 + 2) * 2 - 1) * amp * 0.75)
  if (!dx && !dy) dx = hash(step) < 0.5 ? -1 : 1
  return [dx, dy]
}

/** The sparks streaming into the lamp while it charges: when each starts, its direction, how far out. */
const SPARKS = Array.from({ length: 64 }, (_, i) => {
  const angle = hash(i * 7 + 3) * Math.PI * 2
  return {
    at: REST + CHARGE * (0.22 + 0.74 * Math.sqrt(i / 64)), // sparser at first, thicker towards the climax
    cos: Math.cos(angle),
    sin: Math.sin(angle),
    from: 46 + hash(i * 7 + 5) * 30,
  }
})
const SPARK_LIFE = 340

/** Fills the pixels whose middles are within `r` of (cx, cy), a row at a time. */
function fillDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, colour: string): void {
  ctx.fillStyle = colour
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    const dy = y + 0.5 - cy
    if (dy * dy > r * r) continue
    const w = Math.sqrt(r * r - dy * dy)
    const x0 = Math.ceil(cx - 0.5 - w), x1 = Math.floor(cx - 0.5 + w)
    if (x1 >= x0) ctx.fillRect(x0, y, x1 - x0 + 1, 1)
  }
}

// ── The camera, drawn once ───────────────────────────────────────────────────

/** The AF-assist lamp: a 7-pixel circle (centred on a pixel), its glass inside a dark rim. */
const LAMP_AT = { cx: 51.5, cy: 30.5, glass: 2.6, rim: 3.5 }

/**
 * The camera, front-on and a little from above, flat: three silvers, black leather, a dark outline.
 * Its body's front runs from row 22 to 91 (x 6–133), its dials stand on its top, the lens sits low
 * on its front.
 */
function cameraCanvas(): HTMLCanvasElement {
  const W = 140, H = 100
  const grid: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  const set = (x: number, y: number, c: string) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = c }
  const each = (x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y)
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => each(x0, y0, x1, y1, (x, y) => set(x, y, c))
  const polar = (x: number, y: number, cx: number, cy: number): [number, number] => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy
    return [Math.hypot(dx, dy), (Math.atan2(dy, dx) * 180) / Math.PI]
  }
  const disc = (cx: number, cy: number, r: number, c: string) =>
    each(Math.floor(cx - r - 1), Math.floor(cy - r - 1), Math.ceil(cx + r + 1), Math.ceil(cy + r + 1), (x, y) => {
      if (polar(x, y, cx, cy)[0] <= r) set(x, y, c)
    })

  // body: a silver top plate down to row 44, black leather, a thin silver base; corners well rounded.
  // Its top, seen from a little above, is exactly as wide as the front's top edge, so the outline
  // runs on down into the rounded corners (wider, it looked like a separate lid).
  const BODY = { x0: 6, x1: 133, top: 22, plateBottom: 44, hideBottom: 86, bottom: 91, corner: 6 }
  const inBody = (x: number, y: number) => {
    if (x < BODY.x0 || x > BODY.x1 || y < BODY.top || y > BODY.bottom) return false
    const cx = Math.min(Math.max(x, BODY.x0 + BODY.corner), BODY.x1 - BODY.corner)
    const cy = Math.min(Math.max(y, BODY.top + BODY.corner), BODY.bottom - BODY.corner)
    return Math.hypot(x - cx, y - cy) <= BODY.corner + 0.3
  }
  let left = BODY.x0, right = BODY.x1
  while (!inBody(left, BODY.top)) left++
  while (!inBody(right, BODY.top)) right--
  for (let y = 18; y <= 21; y++) for (let x = left + (y === 18 ? 1 : 0); x <= right - (y === 18 ? 1 : 0); x++) set(x, y, SILVER_LIGHT)
  each(BODY.x0, BODY.top, BODY.x1, BODY.bottom, (x, y) => {
    if (inBody(x, y)) set(x, y, y <= BODY.plateBottom || y > BODY.hideBottom ? SILVER : LEATHER)
  })

  // dials on top: flat sides ridged with dark lines, light tops with a few marks
  const dial = (x0: number, x1: number, top: number, base: number, marks: [number, string][]) => {
    each(x0, top + 2, x1, base, (x, y) => set(x, y, (x - x0) % 3 === 1 ? SILVER_DARK : SILVER))
    for (let x = x0; x <= x1; x++) { set(x, top, SILVER_LIGHT); set(x, top + 1, SILVER_LIGHT) }
    for (const [x, c] of marks) set(x, top, c)
  }
  dial(12, 29, 10, 17, [[16, SILVER_DARK], [20, RED], [24, SILVER_DARK]]) // exposure compensation
  each(33, 13, 38, 17, (x, y) => set(x, y, y === 14 || y === 16 ? SILVER_DARK : SILVER)) // shutter button: threaded collar…
  rect(34, 11, 37, 12, SILVER_LIGHT) // …and button
  dial(42, 68, 9, 17, [[48, SILVER_DARK], [55, RED], [62, SILVER_DARK]]) // shutter speed
  rect(76, 15, 98, 17, SILVER_DARK) // hot shoe
  for (let x = 76; x <= 98; x++) set(x, 15, SILVER)

  // on the top plate's front: the front command dial, a round button, the AF-assist lamp (where the
  // charge builds), the flash window, a tiny sensor, and the big optical viewfinder window
  rect(11, 31, 28, 36, OUT)
  each(12, 32, 27, 35, (x, y) => set(x, y, x % 2 === 0 ? SILVER : SILVER_DARK))
  disc(38, 35.5, 4.6, SILVER_DARK)
  disc(38, 35.5, 3.6, SILVER)
  disc(LAMP_AT.cx, LAMP_AT.cy, LAMP_AT.rim, SILVER_DARK)
  disc(LAMP_AT.cx, LAMP_AT.cy, LAMP_AT.glass, LAMP)
  rect(59, 27, 77, 33, SILVER_DARK) // flash window: a frame round a light diffuser, two ribs across it
  rect(60, 28, 76, 32, SILVER_LIGHT)
  for (let x = 60; x <= 76; x++) { set(x, 29, SILVER); set(x, 31, SILVER) }
  set(86, 34, SILVER_DARK)
  rect(95, 26, 126, 42, SILVER_DARK) // viewfinder: its frame, its glass with one shine across it
  rect(97, 28, 124, 40, VIEWFINDER)
  for (let i = 0; i < 9; i++) { set(104 + i, 39 - i, VIEWFINDER_SHINE); set(105 + i, 39 - i, VIEWFINDER_SHINE) }

  // strap lugs, each end
  for (const x0 of [2, 134]) { rect(x0, 27, x0 + 3, 31, SILVER); set(x0 + 1, 29, OUT); set(x0 + 2, 29, OUT) }

  // the lens: a short barrel out of the body, seen a little from above (its front sits lower, so
  // the barrel's top shows); on its front the silver aperture ring with its marks, then the black
  // front with its lettering round the glass
  const MOUNT = { cx: 66, cy: 62 }, FRONT = { cx: 66, cy: 64 }
  const R = { outer: 22, silver: 18.6, black: 18, glass: 7.5 }
  const inTube = (x: number, y: number) => {
    const py = Math.min(Math.max(y + 0.5, MOUNT.cy), FRONT.cy)
    return Math.hypot(x + 0.5 - MOUNT.cx, y + 0.5 - py) <= R.outer
  }
  each(MOUNT.cx - 24, MOUNT.cy - 24, MOUNT.cx + 24, FRONT.cy + 24, (x, y) => {
    if (inTube(x, y)) set(x, y, SILVER_LIGHT)
    else if (inTube(x - 1, y) || inTube(x + 1, y) || inTube(x, y - 1) || inTube(x, y + 1)) set(x, y, OUT)
  })
  each(FRONT.cx - 23, FRONT.cy - 23, FRONT.cx + 23, FRONT.cy + 23, (x, y) => {
    const [r, d] = polar(x, y, FRONT.cx, FRONT.cy)
    if (r > R.outer) return
    let c: string
    if (r > R.silver) { // the aperture ring: its f-number marks round the top
      c = SILVER
      if (r > 19.4 && r < 20.9 && d > -150 && d < -30) {
        const step = Math.round((d + 150) / 20)
        if (Math.abs(d + 150 - step * 20) < 3) c = step === 3 ? RED : SILVER_DARK
      }
    } else if (r > R.black) c = OUT
    else if (r > R.glass) { // the black front, lettered round the top and the bottom
      c = LENS_BLACK
      if (r > 13.8 && r < 15.2 && ((d > -150 && d < -30) || (d > 35 && d < 145)) && Math.round(d / 6) % 4 !== 0) c = LETTERING
    } else c = GLASS
    set(x, y, c)
  })
  rect(FRONT.cx - 4, FRONT.cy - 4, FRONT.cx - 3, FRONT.cy - 3, GLINT)

  // the outline: every see-through pixel touching the camera
  const filled = grid.map(row => row.map(c => c !== null))
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!filled[y][x] && (filled[y - 1]?.[x] || filled[y + 1]?.[x] || filled[y][x - 1] || filled[y][x + 1])) grid[y][x] = OUT
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (ctx) drawColorGrid(ctx, grid, 1)
  return canvas
}
