import './ButtonMenu.css'
import { PixelCanvas } from './PixelCanvas'
import type { CoverShape } from './HudButton'
import { menuTextArt, menuTextWidth } from '../utils/menuFont'
import { sfx, playSfx } from '../utils/audio'
import { playSelectJump } from '../utils/selectJump'
import { playConfirmFlash } from '../utils/confirmFlash'

export interface MenuItem {
  /** Button text, drawn in the menu font (utils/menuFont.ts). */
  label: string
  onSelect: () => void
}

/*
 * Geometry, in art pixels (one pixel of a 424×240 screen: --art-px), measured
 * from the reference menu clip. ButtonMenu.css uses the same numbers.
 *   - a bar is 25 rows tall, each row BAR_LENGTH long, stepping 1px left per
 *     row (a 45° parallelogram); its slot is the bottom-left corner
 *   - buttons are PITCH apart along the diagonal (left and down)
 *   - the label's letters start 31px right of the slot and 28px above it
 */
const BAR_HEIGHT = 25
const BAR_SLANT = BAR_HEIGHT - 1
const BAR_LENGTH = 175
/** Space a label needs on its bar: the reference's longest label (COMPETITION) fits exactly. */
const LABEL_CLEARANCE = 29

/**
 * The main menu's diagonal stack of slanted buttons. ↑/↓ move the selection
 * (the whole stack slides so the selected button stays in the same spot);
 * Enter/Z or clicking the selected button confirms.
 *
 * Usage (inside a Scene's onMount):
 *   new ButtonMenu([{ label: 'Play', onSelect: () => … }]).mount(listEl, this.signal)
 */
export class ButtonMenu {
  private readonly items: MenuItem[]
  private selectedIndex = 0
  private listEl: HTMLElement | null = null
  private buttonEls: HTMLLIElement[] = []
  private jump: Animation[] = []
  /** 'mouse', 'touch' or 'pen': what pressed the list last */
  private lastPointer = 'mouse'

  /** `selected`: the button highlighted when it opens (out-of-range values mean the first). */
  constructor(items: MenuItem[], { selected = 0 } = {}) {
    this.items = items
    if (Number.isInteger(selected) && selected >= 0 && selected < items.length) this.selectedIndex = selected
  }

  /** Index of the highlighted button. */
  get selected(): number {
    return this.selectedIndex
  }

  /** Renders into `listEl` (a <ul>). Listeners are removed when `signal` aborts. */
  mount(listEl: HTMLElement, signal: AbortSignal): void {
    this.listEl = listEl
    listEl.classList.add('button-menu')
    this.buttonEls = this.items.map((item, i) => buttonElement(item, i))
    listEl.replaceChildren(...this.buttonEls)

    // open with the stack already in place, not sliding there from the first button
    listEl.style.transition = 'none'
    this.updateHighlight()
    void listEl.offsetWidth // apply that position before the slide comes back on
    listEl.style.transition = ''
    document.addEventListener('keydown', e => this.handleKey(e), { signal })
    listEl.addEventListener('pointerdown', e => { this.lastPointer = e.pointerType }, { signal })
    listEl.addEventListener('click', e => this.handleClick(e), { signal })
  }

  /** The buttons' bars and labels, for overlap checks (HudButton.hideWhenCovered). */
  get coverShapes(): CoverShape[] {
    return this.buttonEls.flatMap(el => {
      const bar = el.querySelector<HTMLElement>('.menu-btn-bar')!
      const length = Number(el.style.getPropertyValue('--bar-len'))
      const label = el.querySelector('canvas')!
      return [
        { element: bar, solidAt: (x, y, rect) => inBar(x, y, rect, length) },
        { element: label, solidAt: () => true },
      ]
    })
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private handleKey(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        this.move(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        this.move(1)
        break
      case 'Enter':
      case 'z':
      case 'Z':
        this.confirmSelection()
        break
    }
  }

  /** Clicks land on a bar (its clip-path is its hit area) or a label. */
  private handleClick(e: MouseEvent): void {
    const button = (e.target as Element).closest('.menu-btn')
    const i = this.buttonEls.findIndex(el => el === button)
    if (i < 0) return
    if (i === this.selectedIndex) {
      // a mouse click on it jumps too; a tap confirms with just the flash, like Enter
      if (this.lastPointer === 'mouse') this.playSplit()
      this.confirmSelection()
    } else {
      this.select(i)
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  private move(direction: 1 | -1): void {
    const n = this.items.length
    this.select((this.selectedIndex + direction + n) % n)
  }

  private select(index: number): void {
    this.selectedIndex = index
    this.updateHighlight()
    this.playSplit()
    playSfx(sfx.bleep)
  }

  /** Confirm the highlighted button (Enter/Z, clicking it again, or the CONFIRM badge). */
  confirmSelection(): void {
    playSfx(sfx.accept)
    this.flashLabel()
    this.items[this.selectedIndex].onSelect()
  }

  /** Blink the selected label on and off (utils/confirmFlash.ts), alongside its jump. */
  private flashLabel(): void {
    const label = this.buttonEls[this.selectedIndex]?.querySelector('.menu-btn-label-hop')
    if (label) playConfirmFlash(label)
  }

  /** The selected button's jump (utils/selectJump.ts). Any jump still playing stops at once. */
  private playSplit(): void {
    for (const a of this.jump) a.cancel() // a button left mid-jump drops straight back
    const el = this.buttonEls[this.selectedIndex]
    if (!el) return
    const bar = el.querySelector<HTMLElement>('.menu-btn-bar')!
    this.jump = playSelectJump({
      bar: [bar, el.querySelector('.menu-btn-label-move')!],
      highlight: el.querySelector('.menu-btn-highlight')!,
      hop: el.querySelector('.menu-btn-label-hop')!,
    }, bar.getBoundingClientRect().height / BAR_HEIGHT) // one art pixel, in CSS px
  }

  /** Marks the selected button and slides the stack so it sits in the selected spot. */
  private updateHighlight(): void {
    this.buttonEls.forEach((el, i) => el.classList.toggle('selected', i === this.selectedIndex))
    this.listEl?.style.setProperty('--sel', String(this.selectedIndex))
  }
}

function buttonElement({ label }: MenuItem, index: number): HTMLLIElement {
  const textWidth = menuTextWidth(label)
  const barLength = Math.max(BAR_LENGTH, textWidth + LABEL_CLEARANCE) // long labels get a longer bar
  const shape = barShape(barLength)

  const li = document.createElement('li')
  li.className = 'menu-btn'
  li.style.setProperty('--i', String(index))
  li.style.setProperty('--bar-len', String(barLength))
  li.innerHTML = `
    <div class="menu-btn-highlight"></div>
    <div class="menu-btn-bar"></div>
    <div class="menu-btn-label-move"><div class="menu-btn-label-hop"></div></div>
  `
  li.querySelector<HTMLElement>('.menu-btn-highlight')!.style.clipPath = shape
  li.querySelector<HTMLElement>('.menu-btn-bar')!.style.clipPath = shape

  const art = menuTextArt(label) // includes the 1px outline all round
  const text = new PixelCanvas(art, label)
  text.element.style.width = `calc(${art.width} * var(--art-px))`
  text.element.style.height = `calc(${art.height} * var(--art-px))`
  li.querySelector('.menu-btn-label-hop')!.append(text.element)
  return li
}

/**
 * A bar's outline as a clip-path: a 45° parallelogram with 1px pixel-art steps
 * down both slanted ends, in % of its (length + slant) × height box.
 * (Also used for the project pop-up's title bar.)
 */
export function barShape(length: number): string {
  const w = length + BAR_SLANT, h = BAR_HEIGHT
  const points: [number, number][] = []
  for (let row = 0; row < h; row++) { // right end, top to bottom
    const x = BAR_SLANT - row + length
    points.push([x, row], [x, row + 1])
  }
  for (let row = h - 1; row >= 0; row--) { // left end, bottom to top
    const x = BAR_SLANT - row
    points.push([x, row + 1], [x, row])
  }
  const pct = (v: number, of: number) => `${+(v / of * 100).toFixed(3)}%`
  return `polygon(${points.map(([x, y]) => `${pct(x, w)} ${pct(y, h)}`).join(', ')})`
}

/** Whether screen point (x, y) is on a bar of `length`, whose bounding box is `rect`. */
function inBar(x: number, y: number, rect: DOMRect, length: number): boolean {
  const u = (x - rect.left) / rect.width * (length + BAR_SLANT)
  const row = Math.floor((y - rect.top) / rect.height * BAR_HEIGHT)
  return row >= 0 && row < BAR_HEIGHT && u >= BAR_SLANT - row && u < BAR_SLANT - row + length
}
