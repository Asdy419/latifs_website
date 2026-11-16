import type { TvShow } from './TvOverlay'

/*
 * Lights out: the main menu TV's picture while Exit is highlighted (the user's calls: a sleepy cat
 * came first, then Zs floating up through the dark, then "remove the zs, just keep the background
 * turning dark and that's it"). A cosy pixel-art bedroom, lit: a lavender wall with a pink LED
 * strip along its top and a string of fairy lights twinkling, a bed with its pillow at the left
 * end, a bedside table with a lamp, two posters and a clock on the wall, a window on the night sky
 * and the moon between pink curtains, a wooden floor and a round pink rug. Nothing stirs for a
 * moment; then the lights go down slowly (the room fades to near black, the window still
 * moonlit), and that's it: the dark room until the TV tunes back to Exit, only the stars in the
 * window twinkling (the user's call). Flat pixel art with dark outlines, like the other shows.
 * With reduced motion: the dark room from the start, still.
 *
 * Drawn in code, one pixel per art pixel like the TV's static; the room is drawn once, and once
 * it's dark the picture is redrawn only a few times a second, for the stars. The room is laid out
 * for what shows of the screen (rows 11–168,
 * columns 37 to 337 − row: wide at the top, narrow at the floor), so the bed and rug sit low on
 * the left and the window high up.
 */

const OUT = '#15171b'
/** The room's lights going down: how dark it gets (nearly black: the user wanted it darker), and the window pane, which stays moonlit but dims a little. */
const NIGHT = 'rgb(5 4 12 / 0.94)', NIGHT_PANE = 'rgb(5 4 12 / 0.35)'
/** The LED strip's pink, lit and after dark. */
const LED = ['#ff7ac0', '#5a2a48']
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
      ctx.fillStyle = LED[1]
      ctx.globalAlpha = dark
      ctx.fillRect(0, 11, width, 2)
      ctx.globalAlpha = 1
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
  /** A box with a dark outline just outside it. */
  const boxed = (x0: number, y0: number, x1: number, y1: number, c: string) => { rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, OUT); rect(x0, y0, x1, y1, c) }

  // the wall and the floor (boards, their joints staggered), the skirting between
  rect(0, 0, W, 115, '#7a68b4')
  rect(0, 116, W, H, '#9a6a45')
  for (let y = 116; y < H; y += 12) {
    rect(0, y, W, y, '#83573a')
    for (let x = (y / 12) % 2 ? 20 : 50; x < W; x += 60) rect(x, y + 1, x, y + 11, '#83573a')
  }
  rect(0, 113, W, 115, '#4e4178')
  // the LED strip along the top of the wall, and the fairy lights' string (its bulbs are drawn live)
  rect(0, 11, W, 12, LED[0])
  for (let x = 37; x < W; x++) rect(x, stringY(x), x, stringY(x), '#d9d2f0')

  // the window: a frame round the night sky, a crescent moon and stars, a bar across; curtains and a rod
  rect(196, 26, 308, 27, '#6b4327')
  boxed(PANE.x0 - 4, PANE.y0 - 4, PANE.x1 + 4, PANE.y1 + 4, '#efe9f4')
  rect(PANE.x0, PANE.y0, PANE.x1, PANE.y1, '#1a2350')
  disc(268, 50, 8, 8, '#fff2c0')
  disc(272, 47, 7, 7, '#1a2350')
  rect(251, PANE.y0, 252, PANE.y1, '#efe9f4')
  rect(PANE.x0, 56, PANE.x1, 57, '#efe9f4')
  for (const x0 of [200, 292]) {
    boxed(x0, 28, x0 + 12, 96, '#e98db8')
    for (let x = x0 + 3; x < x0 + 12; x += 4) rect(x, 29, x, 95, '#cf6f9c')
  }

  // two posters and a clock on the wall
  boxed(110, 40, 142, 76, '#26233f')
  disc(126, 54, 7, 7, '#ffd54a')
  rect(111, 64, 141, 69, '#e0608a')
  boxed(152, 46, 180, 72, '#f0ead8')
  rect(156, 50, 166, 60, '#4a7ab8')
  rect(168, 56, 176, 68, '#c94b4b')
  disc(190, 56, 8, 8, OUT)
  disc(190, 56, 7, 7, '#f6f3f8')
  rect(190, 50, 190, 56, OUT)
  rect(190, 56, 194, 56, OUT)

  // the bed, side on, its head at the left: headboard, mattress under a blue blanket, the pillow, the frame and legs
  boxed(44, 86, 52, 138, '#6b4327')
  boxed(52, 112, 176, 136, '#4068b8')
  rect(52, 112, 176, 115, '#6a8cd6')
  rect(53, 116, 100, 118, '#e9edf5')
  boxed(56, 102, 86, 113, '#f4f2f8')
  rect(52, 137, 176, 142, '#5a3a22')
  rect(54, 143, 58, 150, '#5a3a22')
  rect(170, 143, 174, 150, '#5a3a22')

  // the bedside table with a lamp
  boxed(184, 118, 208, 142, '#7a4b2c')
  rect(184, 118, 208, 121, '#8e5a36')
  rect(195, 123, 197, 142, '#5a3a22')
  rect(193, 109, 199, 117, '#4a3a4a')
  boxed(186, 97, 206, 108, '#f3d26b')

  // the round rug in front of the bed
  disc(140, 160, 44, 9, OUT)
  disc(140, 160, 43, 8, '#e089b8')
  disc(140, 160, 36, 6, '#cc6fa0')
  disc(140, 160, 28, 4, '#e089b8')
  return canvas
}
