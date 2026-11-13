/**
 * Pixel art drawn in code (text in the pixel fonts, …): its size in art pixels,
 * and how to paint it at `scale` canvas pixels per art pixel. Shown on screen by
 * PixelCanvas (components/PixelCanvas.ts), which keeps it sharp at any size.
 */
export interface PixelArt {
  readonly width: number
  readonly height: number
  draw(ctx: CanvasRenderingContext2D, scale: number): void
}

/**
 * Paints a grid of colours (one cell per art pixel; null = transparent) with
 * its top-left at (x, y). Every cell edge is rounded to a whole canvas pixel,
 * so blocks stay sharp at any scale with no gaps between them.
 */
export function drawColorGrid(
  ctx: CanvasRenderingContext2D, rows: readonly (readonly (string | null)[])[], scale: number, x = 0, y = 0,
): void {
  rows.forEach((row, ry) => {
    const y0 = Math.round(y + ry * scale)
    const y1 = Math.round(y + (ry + 1) * scale)
    for (let cx = 0; cx < row.length; ) {
      const color = row[cx]
      let end = cx + 1
      while (end < row.length && row[end] === color) end++ // one rect per run of a colour
      if (color) {
        const x0 = Math.round(x + cx * scale)
        ctx.fillStyle = color
        ctx.fillRect(x0, y0, Math.round(x + end * scale) - x0, y1 - y0)
      }
      cx = end
    }
  })
}
