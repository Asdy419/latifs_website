import { PixelCanvas } from './PixelCanvas'
import { measurePixelText, drawPixelText } from '../utils/pixelFont'
import type { PixelArt } from '../utils/pixelArt'

const textArt = (text: string): PixelArt => ({
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
    super(textArt(text), text)
    this.element.classList.add('pixel-text')
  }

  setText(text: string): void {
    this.setArt(textArt(text), text)
  }
}
