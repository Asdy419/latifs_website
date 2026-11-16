import './PhotoGrid.css'
import { Polaroid } from './Polaroid'
import { PINBOARD_FRAME, pinboardFrameUrl } from './pinboardArt'
import { photoUrl, type Photo } from '../utils/cloudinary'
import { sfx, playSfx } from '../utils/audio'

/** Photo sizes asked of Cloudinary (px, square): few sizes, so its cache and free plan go further. */
const SIZES = [160, 240, 320, 480, 640, 960]

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

/** The felt showing round the photos inside the board's frame, in art px: at the sides, above the pins, below the last row. */
const FELT_MARGIN = { side: 8, top: 10, bottom: 12 }

/**
 * The Photo Gallery's wall: every photo as a polaroid pinned to a big pin board (pinboardArt.ts,
 * the user's idea: a framed red felt board that grows with the photos) in a grid that fills the
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
  /** The board behind the photos: placed round the grid's columns and rows whenever they change. */
  private readonly board = document.createElement('li')
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
    this.board.className = 'pinboard'
    this.board.setAttribute('role', 'presentation')
    this.board.setAttribute('aria-hidden', 'true')
    this.board.style.setProperty('--pinboard-frame', `url("${pinboardFrameUrl()}")`)
    this.grid.append(this.board, ...this.items.map(item => item.element))
    this.element.append(this.grid)
    if (this.items.length) this.items[0].selected = true
  }

  /** Adds the wall to `parent`, loads the photos at the size they're shown, and starts listening for input. */
  mount(parent: HTMLElement, signal?: AbortSignal): void {
    parent.append(this.element)
    // the board round the photos, kept there as the columns and rows change (the window's size)
    this.placeBoard()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.placeBoard())
      observer.observe(this.grid)
      signal?.addEventListener('abort', () => observer.disconnect())
    }

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

  /**
   * Sizes the board to the photos: its felt runs FELT_MARGIN past the columns' outer edges, the
   * top row's pins and the last row's bottoms, its frame (PINBOARD_FRAME) outside that; measured
   * in the grid's own pixels (one polaroid is 68 art px wide, which gives the art pixel).
   */
  private placeBoard(): void {
    const first = this.items[0]?.element
    if (!first || !first.offsetWidth) return
    const px = first.offsetWidth / 68
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity
    for (const { element } of this.items) {
      left = Math.min(left, element.offsetLeft)
      right = Math.max(right, element.offsetLeft + element.offsetWidth)
      top = Math.min(top, element.offsetTop)
      bottom = Math.max(bottom, element.offsetTop + element.offsetHeight)
    }
    const pins = 7 * px // the pins stand this far above the frames (Polaroid)
    const s = this.board.style
    s.left = `${Math.round(left - (FELT_MARGIN.side + PINBOARD_FRAME) * px)}px`
    s.top = `${Math.round(top - pins - (FELT_MARGIN.top + PINBOARD_FRAME) * px)}px`
    s.width = `${Math.round(right - left + 2 * (FELT_MARGIN.side + PINBOARD_FRAME) * px)}px`
    s.height = `${Math.round(bottom - top + pins + (FELT_MARGIN.top + FELT_MARGIN.bottom + 2 * PINBOARD_FRAME) * px)}px`
  }

  /** Highlights photo `index` (`scroll`: bring it into view; `quiet`: no sound or wobble). */
  select(index: number, { scroll = true, quiet = false } = {}): void {
    if (!this.items.length) return
    const next = Math.max(0, Math.min(this.items.length - 1, index))
    if (next === this.index) return
    if (!quiet) playSfx(sfx.bleep)
    this.items[this.index].deselect() // tilts back, from wherever it had got to
    this.items[next].select({ quiet }) // straightens, with a wobble unless quiet
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
   * around it (above: room for its pin and the selected frame's lift).
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
