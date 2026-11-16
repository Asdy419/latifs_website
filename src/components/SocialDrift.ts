import type { TvShow } from './TvOverlay'
import { SOCIALS } from '../socials'
import { instagramArt } from './socialArt'

/*
 * Logo drift: the main menu TV's picture while Socials is highlighted (the user's idea, in place
 * of the phone feed). The Socials page's box pictures (socialArt.ts: GitHub's mark, the bust,
 * the camera, TikTok's note, the envelope) and Instagram's glyph (the user asked for it too),
 * drawn a little smaller than on the page for room, drift about the screen like a DVD screensaver, each turning slowly, bouncing off the screen's edges (the
 * slanted right edge too) and off each other.
 * Behind them something plain and abstract (the user's call): a pale screen with three big,
 * slightly darker discs drifting slowly across it. Flat pixel art, one pixel per art pixel like
 * the TV's static; the logos are their own sprites, turned with hard edges. The same start every
 * time, no randomness. With reduced motion: the first frame, still.
 */

/** What shows of the TV's 330 × 180 screen: rows 11–168, from column 37 to the slant, column 337 − row. */
const VIEW = { left: 37, top: 11, bottom: 168, slant: 337 }
const FPS = 30
/** The logos are drawn a little smaller than their sprites, for room (the user's call). */
const LOGO_SCALE = 0.82
/** The drifting discs' tones on the pale screen (flat, no shading). */
const SCREEN = '#d6dde8', TONES = ['#c3cddc', '#b0bdd0', '#c3cddc']

interface Logo {
  sprite: HTMLCanvasElement
  /** Half the sprite's drawn size: it bounces as a disc this big. */
  r: number
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
}
interface Disc { r: number; x: number; y: number; vx: number; vy: number; tone: string }

/** Where each logo starts (middle, px/s, rad/s): spread out, heading different ways, turning slowly either way. */
const STARTS = [
  { x: 95, y: 58, vx: 23, vy: 13, spin: 0.42 },
  { x: 200, y: 48, vx: -16, vy: 20, spin: -0.36 },
  { x: 100, y: 135, vx: 19, vy: -17, spin: 0.3 },
  { x: 165, y: 130, vx: -24, vy: -9, spin: -0.48 },
  { x: 150, y: 70, vx: 12, vy: 22, spin: 0.38 },
  { x: 195, y: 96, vx: -14, vy: -18, spin: 0.34 },
]
const DISC_STARTS = [
  { x: 70, y: 40, r: 58, vx: 5, vy: 3.5 },
  { x: 230, y: 130, r: 70, vx: -4, vy: -3 },
  { x: 290, y: 30, r: 44, vx: -6, vy: 4 },
]

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export class SocialDrift implements TvShow {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly sprites: HTMLCanvasElement[]
  private logos: Logo[] = []
  private discs: Disc[] = []
  private frame = 0
  private last = 0
  private drawn = 0

  /** `screen`: the TV's screen in art px (the canvas's size). */
  constructor(screen: { width: number; height: number }) {
    this.canvas.width = screen.width
    this.canvas.height = screen.height
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d')
    this.sprites = [...SOCIALS.map(social => social.art()), instagramArt()].map(art => {
      const sprite = document.createElement('canvas')
      sprite.width = art.width
      sprite.height = art.height
      const ctx = sprite.getContext('2d')
      if (ctx) art.draw(ctx, 1)
      return sprite
    })
  }

  /** Plays from the start, for good; with reduced motion, the first frame, still. */
  start(): void {
    this.stop()
    this.logos = this.sprites.map((sprite, i) => ({ sprite, r: (Math.max(sprite.width, sprite.height) * LOGO_SCALE) / 2, angle: 0, ...STARTS[i % STARTS.length] }))
    this.discs = DISC_STARTS.map((d, i) => ({ ...d, tone: TONES[i % TONES.length] }))
    this.draw()
    if (reducedMotion.matches) return
    this.last = performance.now()
    this.drawn = this.last
    const tick = () => {
      const now = performance.now()
      this.step(Math.min(0.05, (now - this.last) / 1000)) // a long gap (a hidden tab) isn't one huge step
      this.last = now
      if (now - this.drawn >= 1000 / FPS - 2) { this.draw(); this.drawn = now }
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
  }

  stop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  /** Moves everything on by `dt` seconds: drift, bounce off the edges, bounce off each other. */
  private step(dt: number): void {
    for (const d of this.discs) {
      d.x += d.vx * dt
      d.y += d.vy * dt
      // the discs wander past the screen's sides a little before turning back
      if (d.x < -20 && d.vx < 0) d.vx = -d.vx
      if (d.x > this.canvas.width + 20 && d.vx > 0) d.vx = -d.vx
      if (d.y < -20 && d.vy < 0) d.vy = -d.vy
      if (d.y > this.canvas.height + 20 && d.vy > 0) d.vy = -d.vy
    }
    for (const l of this.logos) {
      l.x += l.vx * dt
      l.y += l.vy * dt
      l.angle += l.spin * dt
      if (l.x - l.r < VIEW.left) { l.x = VIEW.left + l.r; l.vx = Math.abs(l.vx) }
      if (l.y - l.r < VIEW.top) { l.y = VIEW.top + l.r; l.vy = Math.abs(l.vy) }
      if (l.y + l.r > VIEW.bottom) { l.y = VIEW.bottom - l.r; l.vy = -Math.abs(l.vy) }
      // the slanted right edge, the line x + y = slant, whose normal points down-right
      const over = l.x + l.y + l.r * Math.SQRT2 - VIEW.slant
      if (over > 0) {
        l.x -= over / 2
        l.y -= over / 2
        const into = l.vx + l.vy
        if (into > 0) { l.vx -= into; l.vy -= into }
      }
    }
    // each pair: pushed apart if overlapping, and if closing, their speeds along the line between
    // them swap (an elastic bounce of equal weights)
    for (let i = 0; i < this.logos.length; i++) for (let j = i + 1; j < this.logos.length; j++) {
      const a = this.logos[i], b = this.logos[j]
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.hypot(dx, dy) || 0.001
      const overlap = a.r + b.r - dist
      if (overlap <= 0) continue
      const nx = dx / dist, ny = dy / dist
      a.x -= (nx * overlap) / 2; a.y -= (ny * overlap) / 2
      b.x += (nx * overlap) / 2; b.y += (ny * overlap) / 2
      const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny
      if (closing <= 0) continue
      a.vx -= closing * nx; a.vy -= closing * ny
      b.vx += closing * nx; b.vy += closing * ny
    }
  }

  private draw(): void {
    const ctx = this.ctx
    if (!ctx) return
    const { width, height } = this.canvas
    ctx.fillStyle = SCREEN
    ctx.fillRect(0, 0, width, height)
    for (const d of this.discs) fillDisc(ctx, d.x, d.y, d.r, d.tone, width, height)
    ctx.imageSmoothingEnabled = false
    for (const l of this.logos) {
      ctx.save()
      ctx.translate(Math.round(l.x), Math.round(l.y))
      ctx.rotate(l.angle)
      const w = Math.round(l.sprite.width * LOGO_SCALE), h = Math.round(l.sprite.height * LOGO_SCALE)
      ctx.drawImage(l.sprite, -Math.round(w / 2), -Math.round(h / 2), w, h)
      ctx.restore()
    }
  }
}

/** A flat disc, a run of whole pixels per row (so its edge steps like pixel art). */
function fillDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, colour: string, width: number, height: number): void {
  ctx.fillStyle = colour
  const top = Math.max(0, Math.floor(cy - r)), bottom = Math.min(height - 1, Math.ceil(cy + r))
  for (let y = top; y <= bottom; y++) {
    const dy = y + 0.5 - cy
    const half = Math.sqrt(Math.max(0, r * r - dy * dy))
    const x0 = Math.max(0, Math.round(cx - half)), x1 = Math.min(width, Math.round(cx + half))
    if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1)
  }
}
