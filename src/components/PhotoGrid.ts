import './PhotoGrid.css'
import { Polaroid } from './Polaroid'
import { photoUrl, type Photo } from '../utils/cloudinary'
import { sfx, playSfx } from '../utils/audio'

/** Photo sizes asked of Cloudinary (px, square): few sizes, so its cache and free plan go further. */
const SIZES = [160, 240, 320, 480, 640, 960]

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

/**
 * The Photo Gallery's wall: every photo as a polaroid in a grid that fills the
 * screen's width and scrolls under the title banner. One is selected: ← → ↑ ↓
 * move the selection (scrolling to keep it in view), as does hovering with the
 * mouse or tapping a photo. The wheel or a finger scrolls the wall.
 *
 *   new PhotoGrid(photos).mount(pageEl)
 */
export class PhotoGrid {
  readonly element = document.createElement('div')
  readonly items: Polaroid[]
  private readonly grid = document.createElement('ul')
  private index = 0
  /** Clicking/tapping the photo that's already selected (opens the big view). */
  onConfirm: (() => void) | null = null
  /** Off while something covers the wall (the big view): input is ignored. */
  enabled = true

  constructor(photos: readonly Photo[]) {
    this.items = photos.map((p, i) => new Polaroid(p, i))
    this.element.className = 'gallery'
    this.grid.className = 'gallery-grid'
    this.grid.setAttribute('role', 'listbox')
    this.grid.setAttribute('aria-label', 'Photos')
    this.grid.append(...this.items.map(item => item.element))
    this.element.append(this.grid)
    if (this.items.length) this.items[0].selected = true
  }

  /** Adds the wall to `parent`, loads the photos at the size they're shown, and starts listening for input. */
  mount(parent: HTMLElement, signal?: AbortSignal): void {
    parent.append(this.element)

    // one size for every photo: the frame's photo area in device pixels, rounded up to a step
    const shown = this.items[0]?.element.querySelector('.polaroid-photo')?.clientWidth ?? 0
    const needed = shown * (window.devicePixelRatio || 1)
    const size = SIZES.find(s => s >= needed) ?? SIZES[SIZES.length - 1]
    for (const item of this.items) item.load(photoUrl(item.photo, size))

    document.addEventListener('keydown', e => this.handleKey(e), { signal })
    // hovering with the mouse selects; a tap selects (or confirms the selected one)
    this.grid.addEventListener('pointerover', e => {
      if (!this.enabled || e.pointerType !== 'mouse') return
      const i = this.indexOf(e.target)
      if (i >= 0) this.select(i, { scroll: false })
    }, { signal })
    this.grid.addEventListener('click', e => {
      if (!this.enabled) return
      const i = this.indexOf(e.target)
      if (i < 0) return
      if (i === this.index) this.onConfirm?.()
      else this.select(i, { scroll: false })
    }, { signal })
  }

  /** The selected photo. */
  get selected(): Polaroid | undefined {
    return this.items[this.index]
  }

  /** Highlights photo `index` (`scroll`: bring it into view; `quiet`: no sound or jump). */
  select(index: number, { scroll = true, quiet = false } = {}): void {
    if (!this.items.length) return
    const next = Math.max(0, Math.min(this.items.length - 1, index))
    if (next === this.index) return
    if (!quiet) {
      playSfx(sfx.bleep)
      this.items[this.index].stopBounce() // the one being left drops straight back
      this.items[next].bounce()
    }
    this.items[this.index].selected = false
    this.items[next].selected = true
    this.index = next
    if (scroll) this.scrollIntoView(this.items[next].element)
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private handleKey(e: KeyboardEvent): void {
    if (!this.enabled) return
    const columns = this.columns()
    let next: number
    switch (e.key) {
      case 'ArrowLeft': next = this.index - 1; break
      case 'ArrowRight': next = this.index + 1; break
      case 'ArrowUp': next = this.index - columns; break
      case 'ArrowDown':
        next = this.index + columns
        // from the row above a shorter last row, drop to its last photo
        if (next >= this.items.length && this.row(this.items.length - 1) > this.row(this.index)) next = this.items.length - 1
        break
      default: return
    }
    e.preventDefault()
    if (next >= 0 && next < this.items.length) this.select(next)
  }

  private indexOf(target: EventTarget | null): number {
    const li = (target as Element | null)?.closest?.('.polaroid')
    return li ? this.items.findIndex(item => item.element === li) : -1
  }

  /** How many photos fit in a row right now (the grid wraps to the screen's width). */
  private columns(): number {
    const top = this.items[0]?.element.offsetTop
    const i = this.items.findIndex(item => item.element.offsetTop !== top)
    return i < 0 ? this.items.length : i
  }

  private row(index: number): number {
    return this.items[index].element.offsetTop
  }

  /**
   * Scrolls the wall just enough to show `el`, keeping the grid's padding
   * around it (above: room for its pin and jump).
   */
  private scrollIntoView(el: HTMLElement): void {
    const wall = this.element
    const style = getComputedStyle(this.grid)
    const top = el.offsetTop - parseFloat(style.paddingTop)
    const bottom = el.offsetTop + el.offsetHeight + parseFloat(style.paddingBottom)
    let to: number | null = null
    if (top < wall.scrollTop) to = top
    else if (bottom > wall.scrollTop + wall.clientHeight) to = bottom - wall.clientHeight
    if (to !== null) wall.scrollTo({ top: Math.max(0, to), behavior: reducedMotion.matches ? 'auto' : 'smooth' })
  }
}
