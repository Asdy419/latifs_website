import { drawColorGrid, type PixelArt } from './pixelArt'

/**
 * The corner key prompts' text (BACK, MUTE, UNMUTE, CONFIRM), in the small
 * font of the reference menu clip's button prompts: capitals 10 rows tall with
 * 2px strokes, 1px apart, white with a dark shadow 1px down and right.
 * A B C F I K M N O R were measured from the clip; E T U drawn to match.
 */

const COLORS = { text: '#efe9f3', shadow: '#271e27' }
const SPACING = 1

const GLYPHS: Record<string, string[]> = {
  A: [' XXXX ', 'XXXXXX', 'XX  XX', 'XX  XX', 'XX  XX', 'XXXXXX', 'XXXXXX', 'XX  XX', 'XX  XX', 'XX  XX'],
  B: ['XXXXX ', 'XXXXXX', 'XX  XX', 'XX  XX', 'XXXXX ', 'XXXXX ', 'XX  XX', 'XX  XX', 'XXXXXX', 'XXXXX '],
  C: [' XXXX ', 'XXXXXX', 'XX  XX', 'XX  XX', 'XX    ', 'XX    ', 'XX  XX', 'XX  XX', 'XXXXXX', ' XXXX '],
  E: ['XXXXXX', 'XXXXXX', 'XX    ', 'XX    ', 'XXXXX ', 'XXXXX ', 'XX    ', 'XX    ', 'XXXXXX', 'XXXXXX'],
  F: ['XXXXXX', 'XXXXXX', 'XX    ', 'XX    ', 'XXXXX ', 'XXXXX ', 'XX    ', 'XX    ', 'XX    ', 'XX    '],
  I: Array(10).fill('XX'),
  K: ['XX   XX', 'XX  XXX', 'XX XXX ', 'XXXXX  ', 'XXXX   ', 'XXXX   ', 'XXXXX  ', 'XX XXX ', 'XX  XXX', 'XX   XX'],
  M: ['XX   XX', 'XX   XX', 'XXX XXX', 'XXXXXXX', 'XXXXXXX', 'XX X XX', 'XX   XX', 'XX   XX', 'XX   XX', 'XX   XX'],
  N: ['XX   XX', 'XX   XX', 'XXX  XX', 'XXXX XX', 'XXXXXXX', 'XX XXXX', 'XX  XXX', 'XX   XX', 'XX   XX', 'XX   XX'],
  O: [' XXXX ', 'XXXXXX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XXXXXX', ' XXXX '],
  R: ['XXXXX ', 'XXXXXX', 'XX  XX', 'XX  XX', 'XXXXX ', 'XXXXX ', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX'],
  T: ['XXXXXX', 'XXXXXX', '  XX  ', '  XX  ', '  XX  ', '  XX  ', '  XX  ', '  XX  ', '  XX  ', '  XX  '],
  U: ['XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XX  XX', 'XXXXXX', ' XXXX '],
  ' ': Array(10).fill('  '),
}

/** Height of the art: 10 rows of letters plus the shadow row. */
export const HUD_TEXT_HEIGHT = 11

export interface HudTextArt extends PixelArt {
  /** Whether art pixel (x, y) is drawn (for hit tests). */
  solidAt(x: number, y: number): boolean
}

/** `text` in the prompt font, with its shadow (so 1px wider and taller than the letters). */
export function hudTextArt(text: string): HudTextArt {
  const glyphs = [...text.toUpperCase()].map(c => GLYPHS[c]).filter(Boolean)
  const lettersWidth = glyphs.reduce((w, g) => w + g[0].length, 0) + Math.max(0, glyphs.length - 1) * SPACING
  const width = lettersWidth + 1, height = HUD_TEXT_HEIGHT
  const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null))
  const letters: [number, number][] = []
  let pen = 0
  for (const g of glyphs) {
    g.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') letters.push([pen + x, y]) }))
    pen += g[0].length + SPACING
  }
  for (const [x, y] of letters) grid[y + 1][x + 1] = COLORS.shadow // shadow first, letters on top
  for (const [x, y] of letters) grid[y][x] = COLORS.text
  return {
    width,
    height,
    draw: (ctx, scale) => drawColorGrid(ctx, grid, scale),
    solidAt: (x, y) => grid[Math.floor(y)]?.[Math.floor(x)] != null,
  }
}
