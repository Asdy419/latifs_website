import './PixelCanvas.css'
import type { PixelArt } from '../utils/pixelArt'

const instances = new WeakMap<Element, PixelCanvas>()
// One observer for every PixelCanvas: redraws each one whenever its box changes
// size (first layout, window resize, rotation, zoom), so it always stays sharp.
const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
  for (const entry of entries) instances.get(entry.target)?.render(entry.contentRect.width, entry.contentRect.height)
})

/**
 * A <canvas> showing pixel art (utils/pixelArt.ts), redrawn at the screen's
 * real resolution so it's always crisp. The art is fitted into the canvas's CSS
 * box (centred, never stretched). By default that box fills the parent; size it
 * with CSS (or inline styles) to show the art at a particular size.
 */
export class PixelCanvas {
  readonly element = document.createElement('canvas')
  private art: PixelArt

  /** `label` is what screen readers say for it. */
  constructor(art: PixelArt, label = '') {
    this.art = art
    this.element.className = 'pixel-canvas'
    this.element.setAttribute('role', 'img')
    this.element.setAttribute('aria-label', label)
    instances.set(this.element, this)
    observer?.observe(this.element)
  }

  setArt(art: PixelArt, label = ''): void {
    this.art = art
    this.element.setAttribute('aria-label', label)
    this.render()
  }

  /** Draws the art to fit a `boxWidth` × `boxHeight` CSS-pixel box (normally called for you). */
  render(boxWidth = this.element.clientWidth, boxHeight = this.element.clientHeight): void {
    if (!boxWidth || !boxHeight) return // not laid out yet: the observer calls again once it is
    const { width, height } = this.art
    // screen pixels per art pixel, for the largest size that fits the box
    const scale = Math.min(boxWidth / width, boxHeight / height) * (window.devicePixelRatio || 1)
    const canvas = this.element
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const ctx = canvas.getContext('2d')
    if (ctx) this.art.draw(ctx, scale)
  }
}
