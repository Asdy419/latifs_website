import { PixelLabel } from './PixelText'
import { drawColorGrid } from '../utils/pixelArt'
import type { Photo } from '../utils/cloudinary'

/** Each photo hangs at one of these angles (deg), picked from its ID so it never changes. */
const TILTS = [-3, -2.2, -1.4, 1.4, 2.2, 3]
/**
 * A quick little wobble on its pin when it's selected: a slight overshoot to
 * the other side, then straight (deg, from its tilt's side). Toned right down
 * at the user's request: small and short.
 */
const WOBBLE = [-1.5, 0.6, 0]
const WOBBLE_MS = 180
/** How long the one being left takes to tilt back (and a quiet selection to straighten), ms. */
const TURN_MS = 200

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const easeOut = (u: number) => 1 - (1 - u) * (1 - u)
const easeInOut = (u: number) => u * u * (3 - 2 * u)

/**
 * One photo on the gallery wall: a cartoony polaroid (thick black outline,
 * white frame with a deep bottom edge, the caption written there) held up by
 * a pixel-art pin, hanging slightly tilted. Selected, it gets the main menu's
 * highlight (no jump: the user's call) and a quick little wobble as it
 * straightens; the one left behind tilts back. Its edges always step like
 * pixel art (the user's call), even while it turns: it turns a frame at a time
 * here, its frame, shadow and highlight cut to the screen's art pixels at
 * each angle (staircase(); PhotoGrid.css).
 */
export class Polaroid {
  readonly element = document.createElement('li')
  readonly photo: Photo
  private readonly img: HTMLImageElement
  private readonly tilt: number
  /** How far it's turned now (deg): its tilt hanging, 0 selected, between them while it turns. */
  private angle = 0
  private turning = 0

  constructor(photo: Photo, index: number) {
    this.photo = photo
    const el = this.element
    el.className = 'polaroid'
    this.tilt = TILTS[hashOf(photo.id) % TILTS.length]
    el.setAttribute('role', 'option')
    el.setAttribute('aria-label', photo.alt || `Photo ${index + 1}`)
    el.innerHTML = `
      <div class="polaroid-shadow"></div>
      <div class="polaroid-highlight"></div>
      <div class="polaroid-frame">
        <div class="polaroid-photo"><img alt="" loading="lazy" decoding="async" draggable="false" /></div>
        <div class="polaroid-caption"></div>
      </div>
      <span class="polaroid-pin" style="background-image: url(&quot;${pinArt(photo.id)}&quot;)"></span>
    `
    this.img = el.querySelector('img')!
    this.img.addEventListener('load', () => this.img.classList.add('loaded'), { once: true })
    if (photo.caption) el.querySelector('.polaroid-caption')!.append(new PixelLabel(photo.caption).element)
    this.selected = false
  }

  /** Starts loading the photo (lazily: the browser waits until it's near the screen). */
  load(src: string): void {
    this.img.src = src
  }

  /** The small copy's address (the big view shows it while the full photo loads). */
  get src(): string {
    return this.img.currentSrc || this.img.src
  }

  /** Selects or deselects it at once, no turning (the wall's first selection). */
  set selected(on: boolean) {
    cancelAnimationFrame(this.turning)
    this.mark(on)
    this.show(on ? 0 : this.tilt)
  }

  /**
   * Selects it: it straightens with a quick wobble on its pin, or just straightens if `quiet`.
   * (Not the menu buttons' jump: that parted the frame from its highlight on every move, which
   * the user didn't want.)
   */
  select({ quiet = false } = {}): void {
    this.mark(true)
    const side = this.tilt < 0 ? -1 : 1
    if (quiet) this.turn([0], TURN_MS, easeOut)
    else this.turn(WOBBLE.map(a => a * side), WOBBLE_MS, easeInOut)
  }

  /** Deselects it: it tilts back to hang at its angle, from wherever it's got to (even mid-wobble). */
  deselect(): void {
    this.mark(false)
    this.turn([this.tilt], TURN_MS, easeOut)
  }

  private mark(on: boolean): void {
    this.element.classList.toggle('selected', on)
    this.element.setAttribute('aria-selected', String(on))
  }

  /** Turns it from where it is through `path` (deg), each leg an equal share of `ms`, eased. */
  private turn(path: readonly number[], ms: number, ease: (u: number) => number): void {
    cancelAnimationFrame(this.turning)
    const end = path[path.length - 1]
    if (reducedMotion.matches) return this.show(end)
    this.show(this.angle) // cut for its new state straight away (selected: lifted, with its highlight)
    const points = [this.angle, ...path]
    const legs = points.length - 1
    const start = performance.now()
    const tick = () => {
      const u = Math.min(1, Math.max(0, (performance.now() - start) / ms))
      const leg = Math.min(legs - 1, Math.floor(u * legs))
      this.show(u >= 1 ? end : points[leg] + (points[leg + 1] - points[leg]) * ease(u * legs - leg))
      if (u < 1) this.turning = requestAnimationFrame(tick)
    }
    this.turning = requestAnimationFrame(tick)
  }

  /** Turns it to `angle`, its frame and shadow (or, selected, its lifted frame and highlight) cut to the screen's art pixels. */
  private show(angle: number): void {
    this.angle = angle
    const el = this.element
    const { width: w, height: h } = FRAME
    el.style.transform = `rotate(${angle}deg)`
    if (el.classList.contains('selected')) {
      el.style.setProperty('--frame-steps', staircase(angle, -LIFT, -LIFT, w - LIFT, h - LIFT))
      el.style.setProperty('--highlight-steps', staircase(angle, LIFT, LIFT, w + LIFT, h + LIFT))
    } else {
      el.style.setProperty('--frame-steps', staircase(angle, 0, 0, w, h))
      el.style.setProperty('--shadow-steps', staircase(angle, SHADOW, SHADOW, w + SHADOW, h + SHADOW))
    }
  }
}

/** A polaroid's frame in art px, hanging from its pin at the middle of its top edge (PhotoGrid.css). */
const FRAME = { width: 68, height: 78, pivotX: 34, pivotY: 0 }
/** How far its drop shadow sits down and right of it, art px. */
const SHADOW = 4
/** Selected, how far its frame lifts up-left and its highlight sits down-right, art px (PhotoGrid.css). */
const LIFT = 2

/**
 * A clip-path for the box from (x0, y0) to (x1, y1) (art px, in the polaroid's own coordinates)
 * as it hangs at `tilt` degrees off the pin: the screen's art pixels whose middles it covers, so
 * its edges come out as 1px steps (rows sharing a step are merged: ~30 corners). clip-path takes
 * the box's own tilted coordinates, so the corners are untilted into them, from the box's
 * top-left: tilted with it, the steps line up with the screen again.
 */
function staircase(tilt: number, x0: number, y0: number, x1: number, y1: number): string {
  const a = (tilt * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a)
  const { pivotX: px, pivotY: py } = FRAME
  const toScreen = (x: number, y: number): [number, number] =>
    [px + (x - px) * cos - (y - py) * sin, py + (x - px) * sin + (y - py) * cos]
  const toBox = (x: number, y: number): [number, number] =>
    [px + (x - px) * cos + (y - py) * sin, py - (x - px) * sin + (y - py) * cos]
  const corners = [toScreen(x0, y0), toScreen(x1, y0), toScreen(x1, y1), toScreen(x0, y1)]
  const top = Math.floor(Math.min(...corners.map(c => c[1]))), bottom = Math.ceil(Math.max(...corners.map(c => c[1])))
  const left = Math.floor(Math.min(...corners.map(c => c[0]))), right = Math.ceil(Math.max(...corners.map(c => c[0])))
  // each row of the screen's art pixels: the run of them whose middles the tilted box covers
  const rows: { y: number; from: number; to: number }[] = []
  for (let y = top; y < bottom; y++) {
    let from = Infinity, to = -Infinity
    for (let x = left; x < right; x++) {
      const [bx, by] = toBox(x + 0.5, y + 0.5)
      if (bx >= x0 && bx <= x1 && by >= y0 && by <= y1) { from = Math.min(from, x); to = Math.max(to, x + 1) }
    }
    if (from < to) rows.push({ y, from, to })
  }
  // the outline: down the left ends, a corner pair at every step, then back up the right ends
  const points: [number, number][] = [[rows[0].from, rows[0].y]]
  rows.forEach((row, i) => { if (i && row.from !== rows[i - 1].from) points.push([rows[i - 1].from, row.y], [row.from, row.y]) })
  const last = rows[rows.length - 1]
  points.push([last.from, last.y + 1], [last.to, last.y + 1])
  for (let i = rows.length - 1; i > 0; i--) if (rows[i].to !== rows[i - 1].to) points.push([rows[i].to, rows[i].y], [rows[i - 1].to, rows[i].y])
  points.push([rows[0].to, rows[0].y])
  const length = (v: number) => `calc(${+v.toFixed(3)} * var(--art-px))`
  return `polygon(${points.map(([x, y]) => { const [bx, by] = toBox(x, y); return `${length(bx - x0)} ${length(by - y0)}` }).join(', ')})`
}

function hashOf(text: string): number {
  let hash = 0
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return hash
}

// ── The pin ─────────────────────────────────────────────────────────────────
// A round pin head seen from the front, 9 × 9 art px: outline (K), colour (R),
// a shine top-left (H) and shade bottom-right (D). Drawn once per colour at 1px
// per art pixel and scaled up crisply in CSS (image-rendering: pixelated).

const PIN = [
  '..KKKKK..',
  '.KRRRRRK.',
  'KRHHRRRRK',
  'KRHRRRRRK',
  'KRRRRRRDK',
  'KRRRRRRDK',
  'KRRRRRDDK',
  '.KDDDDDK.',
  '..KKKKK..',
]

/** [colour, shine, shade] for each pin; a photo always gets the same one. */
const PIN_COLORS = [
  ['#e8365d', '#ff9db3', '#a3123a'], // red
  ['#0066ff', '#8fc1ff', '#003c9e'], // blue
  ['#2fbf71', '#a5f0c5', '#17824a'], // green
  ['#9b5de5', '#d6b8ff', '#5f2fa0'], // purple
]

const pinUrls = new Map<number, string>()

function pinArt(photoId: string): string {
  const which = (hashOf(photoId) >>> 4) % PIN_COLORS.length // other bits than the tilt's
  const cached = pinUrls.get(which)
  if (cached !== undefined) return cached
  const [main, shine, shade] = PIN_COLORS[which]
  const palette: Record<string, string | null> = { '.': null, K: '#000', R: main, H: shine, D: shade }
  const canvas = document.createElement('canvas')
  canvas.width = PIN[0].length
  canvas.height = PIN.length
  const ctx = canvas.getContext('2d')
  if (ctx) drawColorGrid(ctx, PIN.map(row => [...row].map(c => palette[c] ?? null)), 1)
  const url = ctx ? canvas.toDataURL() : ''
  pinUrls.set(which, url)
  return url
}
