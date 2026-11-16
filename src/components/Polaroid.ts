import { PixelLabel } from './PixelText'
import { drawColorGrid } from '../utils/pixelArt'
import { playSelectJump } from '../utils/selectJump'
import type { Photo } from '../utils/cloudinary'

/** Each photo hangs at one of these angles (deg), picked from its ID so it never changes. */
const TILTS = [-3, -2.2, -1.4, 1.4, 2.2, 3]
/**
 * A quick little wobble on its pin when it's selected: a slight overshoot to
 * the other side, then straight (deg, from its tilt's side). Toned right down
 * at the user's request: small and short, alongside the menu's jump.
 */
const WOBBLE = [-1.5, 0.6, 0]
const WOBBLE_MS = 180

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

/**
 * One photo on the gallery wall: a cartoony polaroid (thick black outline,
 * white frame with a deep bottom edge, the caption written there) held up by
 * a pixel-art pin, hanging slightly tilted. Selected, it gets the main menu's
 * highlight, does the menu buttons' jump and a quick little wobble as it
 * straightens; the one left behind tilts back (PhotoGrid.css).
 */
export class Polaroid {
  readonly element = document.createElement('li')
  readonly photo: Photo
  private readonly img: HTMLImageElement
  private readonly tilt: number
  private jump: Animation[] = []

  constructor(photo: Photo, index: number) {
    this.photo = photo
    const el = this.element
    el.className = 'polaroid'
    this.tilt = TILTS[hashOf(photo.id) % TILTS.length]
    el.style.setProperty('--tilt', `${this.tilt}deg`)
    el.setAttribute('role', 'option')
    el.setAttribute('aria-label', photo.alt || `Photo ${index + 1}`)
    el.innerHTML = `
      <div class="polaroid-highlight"></div>
      <div class="polaroid-frame">
        <div class="polaroid-photo"><img alt="" loading="lazy" decoding="async" draggable="false" /></div>
        <div class="polaroid-caption"></div>
        <span class="polaroid-pin" style="background-image: url(&quot;${pinArt(photo.id)}&quot;)"></span>
      </div>
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

  set selected(on: boolean) {
    this.element.classList.toggle('selected', on)
    this.element.setAttribute('aria-selected', String(on))
  }

  /** The jump the menu buttons do when they're selected (utils/selectJump.ts), with a quick wobble on its pin. */
  bounce(): void {
    this.stopBounce()
    const frame = this.element.querySelector('.polaroid-frame')!
    this.jump = playSelectJump({
      bar: [frame],
      highlight: this.element.querySelector('.polaroid-highlight')!,
    }, frame.getBoundingClientRect().height / 78) // the frame is 78 art px tall
    if (reducedMotion.matches) return
    const side = this.tilt < 0 ? -1 : 1
    this.jump.push(this.element.animate(
      [this.tilt, ...WOBBLE.map(a => a * side)].map(a => ({ transform: `rotate(${a}deg)`, easing: 'ease-in-out' })),
      { duration: WOBBLE_MS },
    ))
  }

  /** Stops a jump mid-way (the frame drops straight back). */
  stopBounce(): void {
    for (const a of this.jump) a.cancel()
    this.jump = []
  }
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
