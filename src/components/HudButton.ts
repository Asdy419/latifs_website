import './HudButton.css'
import { isOpaqueAt } from '../utils/alphaMask'

interface HudButtonOptions {
  /** Element id. */
  id: string
  /** Icon image (key cap + black label bar), cropped to its visible pixels. */
  icon: string
  /** Optional label image drawn over the icon's bar (see .hud-btn-label). */
  label?: string
  /** Where the icon's bar starts, as % of the icon's width (the label starts there). */
  labelLeft?: number
}

const coarsePointer = matchMedia('(pointer: coarse)')

/**
 * A key-prompt badge (e.g. [M] MUTE): icon and label grouped in one element
 * so they always move, scale and hide together. Put badges in a corner HUD:
 *   `<div class="hud hud-left">${badge.markup()}</div>`  (see HudButton.css)
 */
export class HudButton {
  private readonly id: string
  private readonly icon: string
  private readonly label: string | undefined
  private readonly labelLeft: number

  constructor({ id, icon, label, labelLeft = 20 }: HudButtonOptions) {
    this.id = id
    this.icon = icon
    this.label = label
    this.labelLeft = labelLeft
  }

  markup(): string {
    const label = this.label === undefined
      ? ''
      : `<img class="hud-btn-label" src="${this.label}" alt="" style="left: ${this.labelLeft}%" />`
    return `<div class="hud-btn" id="${this.id}"><img class="hud-btn-icon" src="${this.icon}" alt="" />${label}</div>`
  }

  get element(): HTMLElement {
    return document.getElementById(this.id)!
  }

  get image(): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>('.hud-btn-icon')!
  }

  /** Swap the label image (preload it first so the swap is instant). */
  setLabel(src: string): void {
    const label = this.element.querySelector<HTMLImageElement>('.hud-btn-label')
    if (label) label.src = src
  }

  /**
   * Calls `handler` when the badge is clicked/tapped (while it's showing).
   * Mouse clicks must land on the icon's or label's opaque pixels; taps on
   * touch screens anywhere in the badge's enlarged tap area count.
   */
  onClick(handler: () => void, signal?: AbortSignal): void {
    this.element.addEventListener('click', e => {
      if (this.element.style.opacity === '0') return // hidden (see hideWhenCovered)
      if (coarsePointer.matches) return handler()
      const imgs = this.element.querySelectorAll<HTMLImageElement>('img')
      if (Array.from(imgs).some(img => isOpaqueAt(img, e.clientX, e.clientY))) handler()
    }, { signal })
  }

  /**
   * Hides this badge whenever any of `covers` overlaps it (pixel-perfect).
   *
   * Overlap can only change while something moves — `movingParent` scrolling
   * or animating, a resize, or images loading — so rather than checking every
   * frame forever, it checks for a short window after each trigger and then
   * goes to sleep.
   */
  hideWhenCovered(covers: HTMLImageElement[], movingParent: HTMLElement, signal: AbortSignal): void {
    const el = this.element
    const icon = this.image
    const STEP = 4 // sample spacing (px) across the overlapping area

    const isCovered = (er: DOMRect): boolean => covers.some(img => {
      const r = img.getBoundingClientRect()
      if (r.left >= er.right || r.right <= er.left ||
          r.top  >= er.bottom || r.bottom <= er.top) return false
      const x0 = Math.max(r.left, er.left), x1 = Math.min(r.right, er.right)
      const y0 = Math.max(r.top,  er.top),  y1 = Math.min(r.bottom, er.bottom)
      for (let x = x0; x < x1; x += STEP) {
        for (let y = y0; y < y1; y += STEP) {
          if (isOpaqueAt(icon, x, y, er) && isOpaqueAt(img, x, y, r)) return true
        }
      }
      return false
    })

    let rafId = 0
    let activeUntil = 0

    const check = () => {
      rafId = 0
      if (signal.aborted) return
      const er = icon.getBoundingClientRect()
      if (er.width && er.height) {
        const opacity = isCovered(er) ? '0' : '1'
        if (el.style.opacity !== opacity) el.style.opacity = opacity
      }
      if (performance.now() < activeUntil) rafId = requestAnimationFrame(check)
    }

    /** Re-check every frame for the next `ms` milliseconds. */
    const wake = (ms = 600) => {
      activeUntil = Math.max(activeUntil, performance.now() + ms)
      if (!rafId) rafId = requestAnimationFrame(check)
    }

    const opts = { signal }
    document.addEventListener('keydown', () => wake(), opts)
    document.addEventListener('click',   () => wake(), opts)
    window.addEventListener('resize',    () => wake(), opts)
    movingParent.addEventListener('transitionend', () => wake(100), opts)
    movingParent.addEventListener('animationend',  () => wake(100), opts)
    for (const img of [icon, ...covers]) img.addEventListener('load', () => wake(), opts)
    signal.addEventListener('abort', () => cancelAnimationFrame(rafId))

    wake(1000)
  }
}
