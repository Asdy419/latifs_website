import { PixelCanvas } from './PixelCanvas'
import { measurePixelText, drawPixelText } from '../utils/pixelFont'
import { TEXT_FONT_HEIGHT, LINE_HEIGHT, measureText, wrapText, textArt } from '../utils/textFont'
import type { PixelArt } from '../utils/pixelArt'

const boxFontArt = (text: string): PixelArt => ({
  ...measurePixelText(text),
  draw: (ctx, scale) => drawPixelText(ctx, text, 0, 0, scale),
})

/**
 * Text in the project boxes' pixel font (utils/pixelFont.ts), as a <canvas>
 * that fills its parent: the text is scaled to fit the parent's box (centred,
 * never stretched) and redrawn at the screen's real resolution.
 *
 * Size the parent with CSS, then:
 *   const title = new PixelText('My project')
 *   parentEl.append(title.element)
 */
export class PixelText extends PixelCanvas {
  constructor(text: string) {
    super(boxFontArt(text), text)
    this.element.classList.add('pixel-text')
  }

  setText(text: string): void {
    this.setArt(boxFontArt(text), text)
  }
}

/** Shadow colour when CSS doesn't set --pixel-shadow: the reference dialog's under light text. */
const defaultShadow = (ink: string) => {
  const [r = 0, g = 0, b = 0] = (ink.match(/[\d.]+/g) ?? []).map(Number)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#4a496b' : '#c6c0d2'
}

/**
 * Ordinary text, in the references' small text font (utils/textFont.ts),
 * styled like CSS text:
 *  - `font-size` is the capitals' height (1em = 10 font pixels)
 *  - `color` is the ink; `--pixel-shadow` the shadow 1px down and right
 *    (by default a dark blue-grey under light text, a pale one under dark)
 *  - `text-align` lines up wrapped lines; `--pixel-line-height` (a multiple of
 *    the capitals' height, like line-height) spaces them, by default 1.8 (the
 *    reference dialog's)
 * Redrawn at the screen's real resolution whenever its size changes.
 *
 *  - new PixelLabel('Close'): one line, as wide as the text (inline-block)
 *  - new PixelLabel(paragraph, { wrap: true }): a block that wraps at spaces
 *    to fit its container; never wider than the text needs, so it also works
 *    inside shrink-to-fit boxes
 */
export class PixelLabel extends PixelCanvas {
  private text: string
  private readonly wrap: boolean
  private lines = ''
  /** What the canvas shows now (text, size, colours…), so drawing the same again is skipped. */
  private drawn = ''

  constructor(text: string, { wrap = false } = {}) {
    super(boxFontArt(''), text) // placeholder: render() draws the text itself
    this.text = text
    this.wrap = wrap
    this.element.classList.add('pixel-label', wrap ? 'pixel-label-block' : 'pixel-label-inline')
    this.size()
  }

  setText(text: string): void {
    this.text = text
    this.element.setAttribute('aria-label', text)
    this.size()
    this.render()
  }

  /** CSS size in em, so it follows font-size by itself (the observer then redraws). */
  private size(): void {
    const { width, height } = measureText(this.text)
    const style = this.element.style
    style.width = `${width / TEXT_FONT_HEIGHT}em`
    if (!this.wrap) style.height = `${height / TEXT_FONT_HEIGHT}em`
    else this.lines = '' // re-wrap on the next render
  }

  override render(boxWidth = this.element.clientWidth, boxHeight = this.element.clientHeight): void {
    if (!boxWidth) return // not laid out yet: the observer calls again once it is
    const css = getComputedStyle(this.element)
    const fontSize = parseFloat(css.fontSize)
    const fontPx = fontSize / TEXT_FONT_HEIGHT // CSS px per font pixel
    const pitch = parseFloat(css.getPropertyValue('--pixel-line-height'))
    const lineHeight = pitch > 0 ? Math.round(pitch * TEXT_FONT_HEIGHT) : LINE_HEIGHT
    let text = this.text
    if (this.wrap) {
      // + 0.1: layout rounds the box to 1/64 px, which made lines that fit
      // exactly wrap their last word (at most ~0.02 font px short)
      text = wrapText(this.text, Math.floor(boxWidth / fontPx + 0.1))
      const heightEm = measureText(text, lineHeight).height / TEXT_FONT_HEIGHT
      if (text !== this.lines) {
        this.lines = text
        this.element.style.height = `${heightEm}em`
      }
      boxHeight = heightEm * fontSize // its new height, before layout catches up
    }
    if (!boxHeight) return
    const align = css.textAlign === 'center' ? 'center' : css.textAlign === 'right' || css.textAlign === 'end' ? 'right' : 'left'
    const ink = css.color
    const shadow = css.getPropertyValue('--pixel-shadow').trim() || defaultShadow(ink)
    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, Math.round(boxWidth * dpr))
    const height = Math.max(1, Math.round(boxHeight * dpr))
    // device px per font pixel: from the font size, not canvas.height / art.height,
    // whose rounding grew across a long line and cut off its last letter
    const scale = fontPx * dpr
    // Already showing exactly this? (A wrapped label is always measured twice:
    // once laid out, then again after it sets its own height.)
    const key = `${text}\n${width}x${height}@${scale} ${ink} ${shadow} ${align} ${lineHeight}`
    if (key === this.drawn) return
    this.drawn = key
    const art = textArt(text, { ink, shadow, align, lineHeight })
    const canvas = this.element
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const room = canvas.width - art.width * scale
    ctx.save()
    ctx.translate(Math.round(align === 'left' ? 0 : align === 'right' ? room : room / 2), 0)
    art.draw(ctx, scale)
    ctx.restore()
  }
}
