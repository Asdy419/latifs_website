import './ProjectCarousel.css'
import { ProjectCard, cardBannerArt, type Project } from './ProjectCard'
import { sfx, playSfx } from '../utils/audio'

/** A swipe shorter than this (CSS px) is a tap. */
const DRAG_THRESHOLD = 8
/** A swipe of this fraction of a box moves at least one box. */
const FLICK_FRACTION = 0.15
/** Mouse-wheel / trackpad scroll needed to move one box, and the minimum time between moves. */
const WHEEL_STEP = 60
const WHEEL_COOLDOWN_MS = 120

/**
 * The Projects page's row of boxes. ← / → (or a swipe, the mouse wheel, or a
 * tap/click on a box) moves the selection; the row slides so the selected box
 * is in the middle of the screen.
 *
 *   const carousel = new ProjectCarousel(PROJECTS)
 *   carousel.mount(pageEl)
 *   carousel.selected   // the highlighted ProjectCard
 */
export class ProjectCarousel {
  readonly element = document.createElement('div')
  readonly cards: ProjectCard[]
  private readonly track = document.createElement('ul')
  private index = 0

  // swipe state
  private pointerId: number | null = null
  private startX = 0
  private dragging = false
  // wheel state
  private wheelTotal = 0
  private lastWheelEvent = 0
  private lastWheelMove = 0

  constructor(projects: readonly Project[]) {
    this.cards = projects.map(p => new ProjectCard(p))
    this.element.className = 'project-carousel'
    this.element.style.setProperty('--card-banner', `url("${cardBannerArt()}")`)
    this.track.className = 'project-track'
    this.track.setAttribute('role', 'listbox')
    this.track.setAttribute('aria-label', 'Projects')
    this.cards.forEach((card, i) => {
      card.element.style.setProperty('--i', String(i))
      this.track.append(card.element)
    })
    this.element.append(this.track)
    this.select(0, { quiet: true })
  }

  /** The highlighted box. */
  get selected(): ProjectCard {
    return this.cards[this.index]
  }

  /** Adds the row to `parent` and starts listening for input (until `signal` aborts). */
  mount(parent: HTMLElement, signal?: AbortSignal): void {
    parent.append(this.element)
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.move(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.move(1) }
    }, { signal })
    // Taps are handled on pointerup, not click: browsers can swallow the click
    // that follows a quick swipe.
    this.element.addEventListener('pointerdown', e => this.pointerDown(e), { signal })
    this.element.addEventListener('pointermove', e => this.pointerMove(e), { signal })
    this.element.addEventListener('pointerup', e => this.pointerUp(e), { signal })
    this.element.addEventListener('pointercancel', e => this.pointerUp(e, true), { signal })
    document.addEventListener('wheel', e => this.handleWheel(e), { passive: true, signal })
  }

  /** Moves the selection by `by` boxes (stops at either end). */
  move(by: number): void {
    this.select(this.index + by)
  }

  /** Highlights box `index` and slides it to the middle (`quiet`: no sound or bounce). */
  select(index: number, { quiet = false } = {}): void {
    if (this.cards.length === 0) return
    const next = Math.max(0, Math.min(this.cards.length - 1, index))
    if (next !== this.index && !quiet) {
      playSfx(sfx.bleep)
      this.cards[next].bounce()
    }
    this.cards[this.index].selected = false
    this.cards[next].selected = true
    this.index = next
    this.track.style.setProperty('--index', String(next))
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  /** Distance between neighbouring boxes, in CSS px. */
  private stepPx(): number {
    return this.cards.length > 1 ? this.cards[1].element.offsetLeft - this.cards[0].element.offsetLeft : 1
  }

  private pointerDown(e: PointerEvent): void {
    if (e.button !== 0 || this.pointerId !== null) return
    this.pointerId = e.pointerId
    this.startX = e.clientX
    this.dragging = false
  }

  private pointerMove(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return
    let dx = e.clientX - this.startX
    if (!this.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      this.dragging = true
      this.track.classList.add('dragging') // follow the finger with no easing
      this.element.setPointerCapture(e.pointerId)
    }
    // past either end, the row only gives a little (rubber band)
    const step = this.stepPx()
    const maxRight = this.index * step
    const maxLeft = -(this.cards.length - 1 - this.index) * step
    if (dx > maxRight) dx = maxRight + (dx - maxRight) / 3
    else if (dx < maxLeft) dx = maxLeft + (dx - maxLeft) / 3
    this.track.style.setProperty('--drag', `${dx}px`)
  }

  private pointerUp(e: PointerEvent, cancelled = false): void {
    if (e.pointerId !== this.pointerId) return
    this.pointerId = null

    if (!this.dragging) { // a tap: select the box under it
      if (cancelled) return
      const box = (e.target as Element).closest('.project-card')
      const i = this.cards.findIndex(card => card.element === box)
      if (i >= 0) this.select(i)
      return
    }

    // a swipe: move by however many boxes it covered (a flick moves at least one)
    this.dragging = false
    const dx = e.clientX - this.startX
    const step = this.stepPx()
    let by = cancelled ? 0 : Math.round(-dx / step)
    if (!cancelled && by === 0 && Math.abs(dx) > step * FLICK_FRACTION) by = -Math.sign(dx)
    this.track.classList.remove('dragging')
    this.track.style.setProperty('--drag', '0px')
    this.move(by) // eases from where the finger left it
  }

  private handleWheel(e: WheelEvent): void {
    const now = performance.now()
    if (now - this.lastWheelEvent > 300) this.wheelTotal = 0 // a new scroll gesture
    this.lastWheelEvent = now
    this.wheelTotal += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(this.wheelTotal) < WHEEL_STEP || now - this.lastWheelMove < WHEEL_COOLDOWN_MS) return
    this.move(Math.sign(this.wheelTotal))
    this.wheelTotal = 0
    this.lastWheelMove = now
  }
}
