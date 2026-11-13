import './PixelText.css'
import { measurePixelText, drawPixelText } from '../utils/pixelFont'

const instances = new WeakMap<Element, PixelText>()
// One observer for every PixelText: redraws each one whenever its box changes size
// (first layout, window resize, rotation, zoom), so the pixels always stay sharp.
const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
  for (const entry of entries) instances.get(entry.target)?.render(entry.contentRect.width, entry.contentRect.height)
})

/**
 * Text in the pixel font (utils/pixelFont.ts), as a <canvas> that fills its
 * parent: the text is scaled to fit the parent's box (centred, never stretched)
 * and redrawn at the screen's real resolution, so it's as crisp as pixel art.
 *
 * Size the parent with CSS, then:
 *   const title = new PixelText('My project')
 *   parentEl.append(title.element)
 */
export class PixelText {
  readonly element = document.createElement('canvas')
  private text = ''

  constructor(text: string) {
    this.element.className = 'pixel-text'
    this.element.setAttribute('role', 'img')
    instances.set(this.element, this)
    this.setText(text)
    observer?.observe(this.element)
  }

  setText(text: string): void {
    this.text = text
    this.element.setAttribute('aria-label', text)
    this.render()
  }

  /** Draws the text to fit a `boxWidth` × `boxHeight` CSS-pixel box (normally called for you). */
  render(boxWidth = this.element.clientWidth, boxHeight = this.element.clientHeight): void {
    if (!boxWidth || !boxHeight) return // not laid out yet: the observer calls again once it is
    const { width, height } = measurePixelText(this.text)
    // screen pixels per font pixel, for the largest size that fits the box
    const scale = Math.min(boxWidth / width, boxHeight / height) * (window.devicePixelRatio || 1)
    const canvas = this.element
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const ctx = canvas.getContext('2d')
    if (ctx) drawPixelText(ctx, this.text, 0, 0, scale)
  }
}
