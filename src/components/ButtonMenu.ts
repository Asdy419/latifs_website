import './ButtonMenu.css'
import buttonBase from '../assets/menu/button_base.png'
import { sfx, playSfx } from '../utils/audio'
import { isOpaqueAt } from '../utils/alphaMask'

export interface MenuItem {
  /** Button text, used as the label image's alt text. */
  label: string
  /** Pixel-art label drawn on the button (e.g. assets/menu/projects_txt.png). */
  labelImage: string
  onSelect: () => void
}

/** Horizontal offset between consecutive buttons (vw), giving the diagonal stack. */
const STAGGER_VW = 8

/** Confirm flash: the selected label blinks off/on this many times, each phase this long (ms). */
const FLASH_BLINKS = 14
const FLASH_PHASE_MS = 25 // ~1.5 frames at 60Hz (17 = one frame, the fastest a screen can show)
// Hidden for the first half of each blink, visible for the second (hard cuts, no fade),
// so it vanishes the instant you press and always ends visible.
const FLASH_KEYFRAMES: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 0, offset: 0.5 },
  { opacity: 1, offset: 0.5 },
  { opacity: 1, offset: 1 },
]

/**
 * Vertical list of slanted buttons. Arrow keys move the selection, Enter/Z
 * confirms; clicks only count on the opaque pixels of the button image.
 *
 * Usage (inside a Scene's onMount):
 *   new ButtonMenu([{ label: 'Play', labelImage: playTxt, onSelect: () => … }]).mount(listEl, this.signal)
 */
export class ButtonMenu {
  private readonly items: MenuItem[]
  private selectedIndex = 0
  private listEl: HTMLElement | null = null
  private buttonEls: HTMLLIElement[] = []

  constructor(items: MenuItem[]) {
    this.items = items
  }

  /** Renders into `listEl` (a <ul>). Listeners are removed when `signal` aborts. */
  mount(listEl: HTMLElement, signal: AbortSignal): void {
    this.listEl = listEl
    listEl.classList.add('button-menu')
    listEl.style.setProperty('--btn-mask', `url("${buttonBase}")`)
    listEl.innerHTML = this.items.map(buttonMarkup).join('')
    this.buttonEls = Array.from(listEl.querySelectorAll<HTMLLIElement>('.menu-btn'))
    this.buttonEls.forEach((el, i) => {
      el.style.marginRight = `${i * STAGGER_VW}vw`
      // End each part of the jump when its own animation finishes, so the
      // timings can be tuned in ButtonMenu.css alone.
      el.addEventListener('animationend', e => {
        if (e.animationName === 'split-over') el.classList.remove('splitting')
        if (e.animationName === 'label-hop') el.classList.remove('hopping')
      }, { signal })
    })

    this.updateHighlight()
    document.addEventListener('keydown', e => this.handleKey(e), { signal })
    document.addEventListener('click',   e => this.handleClick(e), { signal })
  }

  /** The button background images (for overlap checks). */
  get buttonImages(): HTMLImageElement[] {
    return this.buttonEls.map(el => el.querySelector<HTMLImageElement>('.menu-btn-bg')!)
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

  private handleClick(e: MouseEvent): void {
    this.buttonEls.forEach((el, i) => {
      const img = el.querySelector<HTMLImageElement>('.menu-btn-bg')!
      if (!isOpaqueHit(img, e.clientX, e.clientY)) return
      if (i === this.selectedIndex) {
        this.playSplit()
        this.confirmSelection()
      } else {
        this.selectedIndex = i
        this.updateHighlight()
        this.playSplit()
        playSfx(sfx.bleep)
      }
    })
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  private move(direction: 1 | -1): void {
    const n = this.items.length
    this.selectedIndex = (this.selectedIndex + direction + n) % n
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

  /**
   * Blink the selected label on and off (the classic "selected!" flash).
   * Uses the Web Animations API on opacity, so it runs alongside the CSS jump
   * animations instead of replacing them.
   */
  private flashLabel(): void {
    const label = this.buttonEls[this.selectedIndex]?.querySelector('.menu-btn-label-hop')
    label?.animate(FLASH_KEYFRAMES, { duration: FLASH_PHASE_MS * 2, iterations: FLASH_BLINKS })
  }

  /** Quick "split" bounce on the selected button. */
  private playSplit(): void {
    const el = this.buttonEls[this.selectedIndex]
    if (!el) return
    el.classList.remove('splitting', 'hopping')
    void el.offsetWidth // restart the animations
    el.classList.add('splitting', 'hopping') // removed on animationend (see mount)
  }

  private updateHighlight(): void {
    this.buttonEls.forEach((el, i) => el.classList.toggle('selected', i === this.selectedIndex))
    this.scrollToSelected()
  }

  /** Slides the whole list so the selected button sits where the first one is. */
  private scrollToSelected(): void {
    if (!this.listEl || this.buttonEls.length === 0) return
    const first    = this.buttonEls[0].getBoundingClientRect()
    const selected = this.buttonEls[this.selectedIndex].getBoundingClientRect()
    this.listEl.style.transform = `translate(${first.left - selected.left}px, ${first.top - selected.top}px)`
  }
}

function buttonMarkup({ label, labelImage }: MenuItem): string {
  return `
    <li class="menu-btn">
      <div class="menu-btn-highlight-wrap">
        <img class="menu-btn-highlight-spacer" src="${buttonBase}" />
        <div class="menu-btn-highlight"></div>
      </div>
      <img class="menu-btn-bg" src="${buttonBase}" crossorigin="anonymous" />
      <span class="menu-btn-label-hop"><img class="menu-btn-label-img" src="${labelImage}" alt="${label}" /></span>
    </li>
  `
}

function isOpaqueHit(img: HTMLImageElement, x: number, y: number): boolean {
  const rect = img.getBoundingClientRect()
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false
  return isOpaqueAt(img, x, y, rect)
}
