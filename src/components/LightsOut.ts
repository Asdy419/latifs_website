import type { TvShow } from './TvOverlay'

/*
 * Lights out: the main menu TV's picture while Exit is highlighted (the user's calls: a sleepy cat
 * came first, then Zs floating up through the dark, then "remove the zs, just keep the background
 * turning dark and that's it"). A cosy pixel-art bedroom, lit: a lavender wall with a string of
 * fairy lights twinkling along its top (a pink LED strip above them went: the user's call), a bed with its pillow at the left
 * end, a bedside table with a lamp, two posters and a clock on the wall, a window on the night sky
 * and the moon between pink curtains, a wooden floor and a round pink rug. Nothing stirs for a
 * moment; then the lights go down slowly (the room fades to near black, the window still
 * moonlit), and that's it: the dark room until the TV tunes back to Exit, only the stars in the
 * window twinkling (the user's call). Flat pixel art, its edges tones of their own colours rather
 * than black outlines (the user found the outlined take too heavy).
 * With reduced motion: the dark room from the start, still.
 *
 * Drawn in code, one pixel per art pixel like the TV's static; the room is drawn once, and once
 * it's dark the picture is redrawn only a few times a second, for the stars. The room is laid out
 * for what shows of the screen (rows 11–168,
 * columns 37 to 337 − row: wide at the top, narrow at the floor), so the bed and rug sit low on
 * the left and the window high up.
 */

/** The room's lights going down: how dark it gets (nearly black: the user wanted it darker), and the window pane, which stays moonlit but dims a little. */
const NIGHT = 'rgb(5 4 12 / 0.94)', NIGHT_PANE = 'rgb(5 4 12 / 0.35)'
/** The fairy lights' colours, round and round the string. */
const BULBS = ['#ffd84a', '#ff8a7a', '#7ef0ff', '#c7ff7a']
/** The window pane (kept moonlit after dark), and the stars in it, each twinkling on its own period (ms). */
const PANE = { x0: 216, y0: 34, x1: 288, y1: 80 }
const STARS = [[224, 42, 1300], [236, 50, 1700], [230, 66, 2100], [246, 40, 1500], [258, 72, 1900], [282, 46, 1100], [276, 62, 2300], [262, 58, 1600], [240, 74, 1400], [286, 70, 1800]]
/** How often the picture is redrawn once it's dark, when only the stars twinkle. */
const TWINKLE_MS = 100

/** In ms: the lit room, then the lights going down slowly. */
const AWAKE = 1300, FADE = 2600
const DARK = AWAKE + FADE

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export class LightsOut implements TvShow {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly room = roomCanvas()
  private frame = 0
  private started = 0

  /** `screen`: the TV's screen in art px (the canvas's size). */
  constructor(screen: { width: number; height: number }) {
    this.canvas.width = screen.width
    this.canvas.height = screen.height
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
  }

  /** Plays from the top (the lit room); with reduced motion, the dark room, still. */
  start(): void {
    this.stop()
    if (reducedMotion.matches) return this.drawAt(DARK)
    this.started = performance.now()
    this.drawAt(0)
    let drawn = this.started
    const tick = () => {
      const now = performance.now(), t = now - this.started
      // every frame while the lights go down; once it's dark only the stars twinkle, a few times a second
      if (t < DARK || now - drawn >= TWINKLE_MS) { this.drawAt(t); drawn = now }
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
    const { width, height } = this.canvas
    ctx.drawImage(this.room, 0, 0)
    // the fairy lights, twinkling while the room's lit
    const dark = Math.min(1, Math.max(0, (t - AWAKE) / FADE))
    if (dark < 1) {
      for (let i = 0; i < 16; i++) {
        const x = 46 + i * 18, y = stringY(x)
        ctx.fillStyle = (Math.floor(t / 400) + i) % 3 === 0 ? '#fff6d8' : BULBS[i % BULBS.length]
        ctx.fillRect(x - 1, y + 1, 3, 3)
      }
    }
    // the lights going down: the room darkens, all but the window
    if (dark > 0) {
      ctx.save()
      ctx.globalAlpha = dark
      ctx.fillStyle = NIGHT
      ctx.fillRect(0, 0, width, PANE.y0)
      ctx.fillRect(0, PANE.y1 + 1, width, height - PANE.y1 - 1)
      ctx.fillRect(0, PANE.y0, PANE.x0, PANE.y1 - PANE.y0 + 1)
      ctx.fillRect(PANE.x1 + 1, PANE.y0, width - PANE.x1 - 1, PANE.y1 - PANE.y0 + 1)
      ctx.fillStyle = NIGHT_PANE
      ctx.fillRect(PANE.x0, PANE.y0, PANE.x1 - PANE.x0 + 1, PANE.y1 - PANE.y0 + 1)
      ctx.restore()
    }
    // the stars in the window, twinkling (the user's call): each bright for most of its period, then dim
    for (const [x, y, period] of STARS) {
      ctx.fillStyle = ((t + x * 37) % period) / period < 0.6 ? '#ffffff' : '#7f8cc0'
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

/** The fairy lights' string: a shallow sag across the top of the wall. */
function stringY(x: number): number {
  return Math.round(20 + 5 * Math.sin(((x - 37) / 300) * Math.PI))
}

/** The bedroom, lit, drawn once: flat colours with dark outlines round the furniture. */
function roomCanvas(): HTMLCanvasElement {
  const W = 330, H = 180
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1) }
  const disc = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    ctx.fillStyle = c
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const dy = (y + 0.5 - cy) / ry
      if (dy * dy > 1) continue
      const w = rx * Math.sqrt(1 - dy * dy)
      const x0 = Math.ceil(cx - 0.5 - w), x1 = Math.floor(cx - 0.5 + w)
      if (x1 >= x0) ctx.fillRect(x0, y, x1 - x0 + 1, 1)
    }
  }
  /** A box with a one-pixel edge of a darker (or lighter) tone of itself, not a black line. */
  const edged = (x0: number, y0: number, x1: number, y1: number, c: string, edge: string) => { rect(x0, y0, x1, y1, edge); rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, c) }

  // the wall and the floor (boards, their joints staggered), the skirting between
  rect(0, 0, W, 115, '#7a68b4')
  rect(0, 116, W, H, '#9a6a45')
  for (let y = 116; y < H; y += 12) {
    rect(0, y, W, y, '#83573a')
    for (let x = (y / 12) % 2 ? 20 : 50; x < W; x += 60) rect(x, y + 1, x, y + 11, '#83573a')
  }
  rect(0, 113, W, 115, '#5f518c')
  // the fairy lights' string along the top of the wall (its bulbs are drawn live)
  for (let x = 37; x < W; x++) rect(x, stringY(x), x, stringY(x), '#d9d2f0')

  // the window: a pale frame round the night sky, a crescent moon (the stars are drawn live), a
  // bar across; curtains hanging from a rod, their folds darker pink
  rect(196, 26, 308, 27, '#6b4327')
  edged(PANE.x0 - 4, PANE.y0 - 4, PANE.x1 + 4, PANE.y1 + 4, '#efe9f4', '#cfc6d8')
  rect(PANE.x0, PANE.y0, PANE.x1, PANE.y1, '#1a2350')
  disc(268, 50, 8, 8, '#fff2c0')
  disc(272, 47, 7, 7, '#1a2350')
  rect(251, PANE.y0, 252, PANE.y1, '#efe9f4')
  rect(PANE.x0, 56, PANE.x1, 57, '#efe9f4')
  for (const x0 of [200, 292]) {
    rect(x0, 28, x0 + 12, 96, '#e98db8')
    for (let x = x0 + 3; x < x0 + 12; x += 4) rect(x, 29, x, 95, '#cf6f9c')
    rect(x0, 96, x0 + 12, 97, '#cf6f9c')
  }

  // two posters (a thin frame of their own colours) and a clock on the wall
  edged(110, 40, 142, 76, '#26233f', '#3a3552')
  disc(126, 54, 7, 7, '#ffd54a')
  rect(112, 64, 140, 69, '#e0608a')
  edged(152, 46, 180, 72, '#f0ead8', '#d8cfbd')
  rect(156, 50, 166, 60, '#4a7ab8')
  rect(168, 56, 176, 68, '#c94b4b')
  disc(190, 56, 8, 8, '#4a4660')
  disc(190, 56, 7, 7, '#f6f3f8')
  rect(190, 50, 190, 56, '#4a4660')
  rect(190, 56, 194, 56, '#4a4660')

  // the bed, side on, its head at the left: a wooden headboard with a rounded top and a lighter
  // inner panel; the mattress one light blue all over, its top lower than the blanket's (the user's
  // calls), the pillow propped against the headboard, short of the blanket; the blanket laid
  // over the far part of the bed only, from past the pillow to a little beyond the foot (the user
  // drew where), lit along its top, darker at its edges, a few folds, the top corner of its end
  // rounded and its bottom cut off square; a plump pale pillow; the frame and legs wood
  rect(45, 86, 53, 132, '#6b4327')
  rect(46, 84, 52, 85, '#6b4327')
  rect(47, 83, 51, 83, '#6b4327')
  rect(47, 88, 51, 128, '#7d5232')
  rect(46, 84, 52, 84, '#8a5c38')
  rect(54, 114, 178, 133, '#8fb0e6')
  rect(54, 133, 178, 133, '#6a8cd0')
  rect(88, 108, 181, 124, '#4a74c8')
  rect(88, 108, 181, 110, '#6f94dd')
  rect(88, 123, 181, 124, '#3a5ca6')
  rect(88, 108, 88, 124, '#3f64b4')
  for (const [x0, x1] of [[104, 112], [128, 136]]) rect(x0, 113, x1 + 10, 113, '#3f64b4') // folds
  rect(179, 113, 179, 121, '#3f64b4')
  for (const [x, y] of [[181, 108], [180, 108], [181, 109]]) rect(x, y, x, y, '#7a68b4')
  // the pillow: a plump lozenge, both sides sloping out towards its base and its corners well
  // rounded (not a square: the user's calls), propped against the headboard, sunk a little into
  // the mattress; its sides shaded
  const PILLOW = { top: 106, bottom: 117, cx: 70.5, halfTop: 10, halfBottom: 16, r: 4 }
  for (let y = PILLOW.top; y <= PILLOW.bottom; y++) {
    const t = (y - PILLOW.top) / (PILLOW.bottom - PILLOW.top)
    const half = PILLOW.halfTop + (PILLOW.halfBottom - PILLOW.halfTop) * t
    const d = Math.min(y - PILLOW.top, PILLOW.bottom - y) + 0.5 // rows in from the nearer edge
    const inset = d < PILLOW.r ? PILLOW.r - Math.sqrt(PILLOW.r * PILLOW.r - (PILLOW.r - d) ** 2) : 0
    const x0 = Math.round(PILLOW.cx - half + inset), x1 = Math.round(PILLOW.cx + half - inset) - 1
    if (x1 < x0) continue
    rect(x0, y, x1, y, '#d7e4f7')
    if (inset === 0) { rect(x0, y, x0, y, '#bcd0ee'); rect(x1, y, x1, y, '#bcd0ee') }
  }
  rect(70, 109, 70, 114, '#bcd0ee') // its crease
  rect(52, 134, 180, 139, '#5a3a22')
  rect(52, 134, 180, 134, '#7a5232')
  rect(54, 140, 59, 150, '#5a3a22')
  rect(173, 140, 178, 150, '#5a3a22')
  rect(58, 140, 59, 150, '#46301c')
  rect(177, 140, 178, 150, '#46301c')

  // the bedside table (a lighter top, a darker underside) with a lamp
  rect(184, 118, 208, 142, '#7a4b2c')
  rect(184, 118, 208, 121, '#9a6240')
  rect(184, 122, 208, 122, '#5e3a22')
  rect(195, 123, 197, 142, '#5a3a22')
  rect(193, 109, 199, 117, '#4a3a4a')
  rect(186, 97, 206, 108, '#f3d26b')
  rect(186, 107, 206, 108, '#d8b452')
  rect(187, 96, 205, 96, '#f3d26b')

  // the round rug in front of the bed
  disc(140, 160, 43, 8, '#e089b8')
  disc(140, 160, 36, 6, '#cc6fa0')
  disc(140, 160, 28, 4, '#e089b8')
  return canvas
}
