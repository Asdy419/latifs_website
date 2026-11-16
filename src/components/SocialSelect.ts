import './SocialSelect.css'
import { PixelCanvas } from './PixelCanvas'
import { drawColorGrid, type PixelArt } from '../utils/pixelArt'
import { textArt } from '../utils/textFont'
import { sfx, playSfx } from '../utils/audio'
import type { Social } from '../socials'

/**
 * The Socials page's row of boxes, after the user's clip of a character select
 * (reference/Desktop 2026.11.16 - 05.41.25.04.mp4), measured frame by frame:
 * 96 × 96 art px boxes, 16 apart, each a black frame round a see-through panel with
 * its picture and a black name strip. Selected, a box's frame pulses red ↔ pink
 * in the clip's 8 steps, two bands grow out of its corners behind the picture (red
 * top-left; steel and blue bottom-right), and the picture lifts with a dark shadow.
 * ← → (or a tap) moves the selection; the selected box, tapped or confirmed, opens
 * its account in a new tab.
 */
export class SocialSelect {
  readonly element = document.createElement('ul')
  private readonly socials: readonly Social[]
  private readonly boxes: HTMLLIElement[]
  private index: number
  /** Tapping the box that's already selected (open it). */
  onConfirm: (() => void) | null = null

  constructor(socials: readonly Social[]) {
    this.socials = socials
    const first = socials.findIndex(s => s.first)
    const start = first >= 0 ? first : Math.floor(socials.length / 2)
    this.index = start
    this.element.className = 'social-select'
    // the clip's 16 px gaps fit three boxes in the 424 px screen; four need them at 8, and more
    // than four need the whole row (boxes, gaps, pictures and names) scaled down to fit 416 px
    const gap = socials.length > 3 ? 8 : 16
    const row = socials.length * 96 + (socials.length - 1) * gap
    if (row > 416) this.element.style.setProperty('--px', `calc(var(--art-px) * ${(416 / row).toFixed(4)})`)
    this.element.style.setProperty('--pitch', String(96 + gap))
    this.element.style.setProperty('--half', String(row / 2))
    this.element.setAttribute('role', 'listbox')
    this.element.setAttribute('aria-label', 'Socials')
    this.boxes = socials.map((social, i) => this.box(social, i))
    this.element.append(...this.boxes)
    this.boxes[start]?.classList.add('selected') // (before the first paint: no bands growing in)
    this.boxes[start]?.setAttribute('aria-selected', 'true')
  }

  /** The selected account. */
  get selected(): Social {
    return this.socials[this.index]
  }

  /** Adds the row to `parent` and listens for ← → and taps (until `signal` aborts). */
  mount(parent: HTMLElement, signal?: AbortSignal): void {
    parent.append(this.element)
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.select(this.index - 1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.select(this.index + 1) }
    }, { signal })
    this.element.addEventListener('click', e => {
      const i = this.boxes.indexOf((e.target as Element).closest('.social-box') as HTMLLIElement)
      if (i < 0) return
      if (i === this.index) this.onConfirm?.()
      else this.select(i)
    }, { signal })
  }

  /** Selects box `index` (stops at either end). */
  select(index: number): void {
    const next = Math.max(0, Math.min(this.boxes.length - 1, index))
    if (next === this.index) return
    playSfx(sfx.bleep)
    this.boxes[this.index].classList.remove('selected')
    this.boxes[this.index].setAttribute('aria-selected', 'false')
    this.boxes[next].classList.add('selected')
    this.boxes[next].setAttribute('aria-selected', 'true')
    this.index = next
  }

  /** Opens the selected account in a new tab. */
  open(): void {
    window.open(this.selected.url, '_blank', 'noopener')
  }

  private box(social: Social, i: number): HTMLLIElement {
    const li = document.createElement('li')
    li.className = 'social-box'
    li.style.setProperty('--i', String(i))
    li.setAttribute('role', 'option')
    li.setAttribute('aria-selected', 'false')
    li.setAttribute('aria-label', social.name)
    // (the inside sits in the frame's border, not beside it: borders are rounded to whole screen
    // pixels, and a separately placed inside left a sliver of the page showing between them)
    li.innerHTML = `
      <div class="social-box-shadow"></div>
      <div class="social-box-frame">
        <div class="social-box-inside">
          <div class="social-box-picture"></div>
          <div class="social-box-name"></div>
        </div>
      </div>
    `
    const inside = li.querySelector('.social-box-inside')!
    // the selected bands, behind the picture: grown out of their corners (SocialSelect.css)
    inside.prepend(canvasOf(BAND_BLUE, 'social-box-band blue'), canvasOf(BAND_RED, 'social-box-band red'))
    li.querySelector('.social-box-picture')!.append(canvasOf(social.art(), 'social-box-art', social.name))
    // the name in the small font, white with its shadow 1px down-right (the clip's colours)
    const name = textArt(social.label, { ink: '#f5f2f6', shadow: '#4a486b', shadowOffsets: [[1, 1]] })
    li.querySelector('.social-box-name')!.append(canvasOf(name, 'social-box-label', social.label))
    return li
  }
}

/** `art` on a canvas with `className`, sized in art px to the art (SocialSelect.css: --w, --h). */
function canvasOf(art: PixelArt, className: string, label = ''): HTMLCanvasElement {
  const canvas = new PixelCanvas(art, label).element
  canvas.classList.add(...className.split(' '))
  canvas.style.setProperty('--w', String(art.width))
  canvas.style.setProperty('--h', String(art.height))
  return canvas
}

/**
 * The selected box's bands, as measured in the clip, in the 90 × 90 art px inside of a box
 * (x + y counted from its top-left): red where x + y < 32, steel blue from 115 to 135, blue
 * beyond. The red is its own 32 × 32 triangle; the steel and blue one 65 × 65 square from the
 * bottom-right corner (from x + y = 115).
 */
const BAND_RED: PixelArt = bandArt(32, (x, y) => (x + y < 32 ? '#fb3954' : null))
const BAND_BLUE: PixelArt = bandArt(65, (x, y) => (x + y < 65 ? null : x + y < 85 ? '#5d9cb7' : '#5375e9'))

function bandArt(size: number, colourAt: (x: number, y: number) => string | null): PixelArt {
  const rows = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => colourAt(x, y)))
  return { width: size, height: size, draw: (ctx, scale) => drawColorGrid(ctx, rows, scale) }
}
