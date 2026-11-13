import './HudButton.css'
import { PixelCanvas } from './PixelCanvas'
import { isOpaqueAt } from '../utils/alphaMask'
import { hudTextArt, HUD_TEXT_HEIGHT, type HudTextArt } from '../utils/hudArt'

interface HudButtonOptions {
  /** Element id. */
  id: string
  /** Icon image (key cap + black label bar), cropped to its visible pixels. */
  icon: string
  /** The action written on the icon's bar, in the prompt font (utils/hudArt.ts). */
  label?: string
  /** Where the icon's bar starts, as % of the icon's width (the label starts there). */
  labelLeft?: number
}

const coarsePointer = matchMedia('(pointer: coarse)')

/** Something that can slide over a badge (see HudButton.hideWhenCovered). */
export interface CoverShape {
  element: Element
  /** Whether the shape is solid at screen point (x, y); `rect` is element's bounding box. */
  solidAt(x: number, y: number, rect: DOMRect): boolean
}

/** An image as a CoverShape: solid where its pixels are opaque. */
export const imageCover = (img: HTMLImageElement): CoverShape =>
  ({ element: img, solidAt: (x, y, rect) => isOpaqueAt(img, x, y, rect) })

/**
 * A key-prompt badge (e.g. [M] MUTE): icon and label grouped in one element
 * so they always move, scale and hide together. Put badges in a corner HUD:
 *   `<div class="hud hud-left">${badge.markup()}</div>`  (see HudButton.css)
 * and call attach() once that HTML is on the page.
 */
export class HudButton {
  private readonly id: string
  private readonly icon: string
  private readonly labelLeft: number
  private readonly text: PixelCanvas | null = null
  private textArt: HudTextArt | null = null

  constructor({ id, icon, label, labelLeft = 20 }: HudButtonOptions) {
    this.id = id
    this.icon = icon
    this.labelLeft = labelLeft
    if (label !== undefined) {
      this.textArt = hudTextArt(label)
      this.text = new PixelCanvas(this.textArt, label)
      this.sizeText()
    }
  }

  markup(): string {
    // the text sits where the old label images' letters did: just past where the bar starts
    const label = this.text
      ? `<span class="hud-btn-text" style="left: calc(${this.labelLeft}% + 0.184 * var(--hud-size))"></span>`
      : ''
    return `<div class="hud-btn" id="${this.id}"><img class="hud-btn-icon" src="${this.icon}" alt="" />${label}</div>`
  }

  /** Puts the label's canvas into the badge (call once markup() is on the page). */
  attach(): void {
    if (this.text) this.element.querySelector('.hud-btn-text')?.append(this.text.element)
  }

  get element(): HTMLElement {
    return document.getElementById(this.id)!
  }

  get image(): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>('.hud-btn-icon')!
  }

  /** Change the action written on the bar (e.g. MUTE ↔ UNMUTE). */
  setLabel(label: string): void {
    if (!this.text) return
    this.textArt = hudTextArt(label)
    this.text.setArt(this.textArt, label)
    this.sizeText()
  }

  private sizeText(): void {
    if (this.text && this.textArt) this.text.element.style.aspectRatio = `${this.textArt.width} / ${HUD_TEXT_HEIGHT}`
  }

  /** Whether screen point (x, y) lands on one of the label's drawn pixels. */
  private onText(x: number, y: number): boolean {
    if (!this.text || !this.textArt) return false
    const r = this.text.element.getBoundingClientRect()
    if (!r.width || x < r.left || x >= r.right || y < r.top || y >= r.bottom) return false
    return this.textArt.solidAt((x - r.left) / r.width * this.textArt.width, (y - r.top) / r.height * this.textArt.height)
  }

  /**
   * Calls `handler` when the badge is clicked/tapped (while it's showing).
   * Mouse clicks must land on the icon's opaque pixels or the label's letters;
   * taps on touch screens anywhere in the badge's enlarged tap area count.
   */
  onClick(handler: () => void, signal?: AbortSignal): void {
    this.element.addEventListener('click', e => {
      if (this.element.style.opacity === '0') return // hidden (see hideWhenCovered)
      if (coarsePointer.matches) return handler()
      if (isOpaqueAt(this.image, e.clientX, e.clientY) || this.onText(e.clientX, e.clientY)) handler()
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
  hideWhenCovered(covers: CoverShape[], movingParent: HTMLElement, signal: AbortSignal): void {
    const el = this.element
    const icon = this.image
    const STEP = 4 // sample spacing (px) across the overlapping area

    const isCovered = (er: DOMRect): boolean => covers.some(cover => {
      const r = cover.element.getBoundingClientRect()
      if (r.left >= er.right || r.right <= er.left ||
          r.top  >= er.bottom || r.bottom <= er.top) return false
      const x0 = Math.max(r.left, er.left), x1 = Math.min(r.right, er.right)
      const y0 = Math.max(r.top,  er.top),  y1 = Math.min(r.bottom, er.bottom)
      for (let x = x0; x < x1; x += STEP) {
        for (let y = y0; y < y1; y += STEP) {
          if (isOpaqueAt(icon, x, y, er) && cover.solidAt(x, y, r)) return true
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
    for (const img of [icon, ...covers.map(c => c.element)]) {
      if (img instanceof HTMLImageElement) img.addEventListener('load', () => wake(), opts)
    }
    signal.addEventListener('abort', () => cancelAnimationFrame(rafId))

    wake(1000)
  }
}
