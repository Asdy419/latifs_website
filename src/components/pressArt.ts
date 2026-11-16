import { drawColorGrid, type PixelArt } from '../utils/pixelArt'

/*
 * "PRESS ANY BUTTON" for the title screen, rebuilt from the one on the Sonic Mania title the user
 * sent (reference/88ecef….gif; they asked for it "1-to-1", in place of their own image): read off
 * the frames that show it, art pixel by art pixel (a per-pixel median across them cancels the
 * island turning behind it). Capitals 6 px tall and 6 wide with 2 px stems, 8 px apart (12 at a
 * word space), banded from the top: orange, gold, cream, cream, gold, deep gold. A 1 px dark brown
 * outline runs round them, filling their holes and the gaps between them, with a darker shadow
 * row under it. One cell per art pixel, the reference's size.
 */

const BANDS = ['#e08a1e', '#f1b85d', '#ece4a8', '#f8ebc0', '#f3ca61', '#bf8e32']
const OUTLINE = '#4a2410', SHADOW = '#1e0d06'
const ADVANCE = 8, SPACE = 12

const GLYPHS: Record<string, string[]> = {
  P: ['XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.', 'XX....', 'XX....'],
  R: ['XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.', 'XX.XX.', 'XX..XX'],
  E: ['XXXXXX', 'XX....', 'XXXXX.', 'XX....', 'XX....', 'XXXXXX'],
  S: ['.XXXXX', 'XX....', '.XXXX.', '....XX', '....XX', 'XXXXX.'],
  A: ['XXXXXX', 'XX..XX', 'XXXXXX', 'XX..XX', 'XX..XX', 'XX..XX'],
  N: ['XX..XX', 'XXX.XX', 'XXXXXX', 'XX.XXX', 'XX..XX', 'XX..XX'],
  Y: ['XX..XX', 'XX..XX', '.XXXX.', '..XX..', '..XX..', '..XX..'],
  B: ['XXXXX.', 'XX..XX', 'XXXXX.', 'XX..XX', 'XX..XX', 'XXXXX.'],
  U: ['XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXX.'],
  T: ['XXXXXX', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..'],
  O: ['.XXXX.', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', '.XXXX.'],
}
const H = BANDS.length

export function pressArt(text = 'PRESS ANY BUTTON'): PixelArt {
  const placed: [string[], number][] = []
  let x = 1
  for (const ch of text) {
    if (ch === ' ') { x += SPACE - ADVANCE; continue }
    const glyph = GLYPHS[ch]
    if (!glyph) continue
    placed.push([glyph, x])
    x += ADVANCE
  }
  const W = x - ADVANCE + 6 + 1, HT = H + 3 // the outline all round, the shadow under it
  const fill = Array.from({ length: HT }, () => Array<boolean>(W).fill(false))
  for (const [glyph, left] of placed) glyph.forEach((row, y) => [...row].forEach((c, gx) => { if (c === 'X') fill[y + 1][left + gx] = true }))
  const filled = (cx: number, cy: number) => fill[cy]?.[cx] ?? false
  const outline = (cx: number, cy: number) => {
    if (filled(cx, cy)) return false
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (filled(cx + dx, cy + dy)) return true
    return false
  }
  const grid = Array.from({ length: HT }, (_, cy) => Array.from({ length: W }, (_, cx): string | null => {
    if (filled(cx, cy)) return BANDS[cy - 1]
    if (outline(cx, cy)) return OUTLINE
    return outline(cx, cy - 1) ? SHADOW : null
  }))
  return { width: W, height: HT, draw: (ctx, scale) => drawColorGrid(ctx, grid, scale) }
}
