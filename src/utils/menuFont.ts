import { drawColorGrid, type PixelArt } from './pixelArt'

/**
 * The main menu's button font: white capitals, 20 art pixels tall, with a 1px
 * black outline and a grey shade down the right side and along the bottom of
 * every stroke. Rebuilt from the reference menu clip (reference/): A C D E I K
 * M N O P R S T X were measured from it pixel by pixel; the other glyphs are
 * drawn to the same rules (4px strokes, 4-row bars, 45° steps, rounded corners
 * cut as 3-1-1-0).
 *
 * Each glyph is only its shape ('X' = filled); the outline and shading are
 * worked out from it, so adding a character is just drawing 20 rows.
 */

export const MENU_FONT_HEIGHT = 20
/** Gap between letters' fills, in art pixels (their 1px outlines meet in it). */
const LETTER_SPACING = 2

const COLORS = {
  outline: '#000000',
  fill: '#f0f0f0',
  right: '#b8bbc4',  // a stroke's right-hand column
  bottom: '#d5d6dc', // a stroke's bottom row
  corner: '#a4a5aa', // where the two meet
}

const GLYPHS: Record<string, string[]> = {
  A: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
  ],
  B: [
    'XXXXXXXXX   ', 'XXXXXXXXXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXX   XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX   XXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXXX  ',
    'XXXXXXXXXX  ', 'XXXXXXXXXXX ', 'XXXX   XXXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX   XXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXX   ',
  ],
  C: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  D: [
    'XXXXXXXXX   ', 'XXXXXXXXXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXX   XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX   XXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXX   ',
  ],
  E: [
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXXXXXXXX  ', 'XXXXXXXXXX  ',
    'XXXXXXXXXX  ', 'XXXXXXXXXX  ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX',
  ],
  F: [
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXXXXXXXX  ', 'XXXXXXXXXX  ',
    'XXXXXXXXXX  ', 'XXXXXXXXXX  ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
  ],
  G: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX        ', 'XXXX        ', 'XXXX  XXXXXX', 'XXXX  XXXXXX',
    'XXXX  XXXXXX', 'XXXX  XXXXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  H: [
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX',
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
  ],
  I: Array(20).fill('XXXX'),
  J: [
    '        XXXX', '        XXXX', '        XXXX', '        XXXX', '        XXXX',
    '        XXXX', '        XXXX', '        XXXX', '        XXXX', '        XXXX',
    '        XXXX', '        XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  K: [
    'XXXX      XXXX', 'XXXX     XXXXX', 'XXXX    XXXXXX', 'XXXX   XXXXXX ', 'XXXX  XXXXXX  ',
    'XXXX XXXXXX   ', 'XXXXXXXXXX    ', 'XXXXXXXXX     ', 'XXXXXXX       ', 'XXXXXXX       ',
    'XXXXXXX       ', 'XXXXXXXX      ', 'XXXXXXXXX     ', 'XXXXXXXXXX    ', 'XXXX XXXXXX   ',
    'XXXX  XXXXXX  ', 'XXXX   XXXXXX ', 'XXXX    XXXXXX', 'XXXX     XXXXX', 'XXXX      XXXX',
  ],
  L: [
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX',
  ],
  M: [
    'XX              XX', 'XXX            XXX', 'XXXX          XXXX', 'XXXXX        XXXXX', 'XXXXXX      XXXXXX',
    'XXXXXXX    XXXXXXX', 'XXXXXXXX  XXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXX XXXXXXXX XXXX',
    'XXXX  XXXXXX  XXXX', 'XXXX   XXXX   XXXX', 'XXXX    XX    XXXX', 'XXXX          XXXX', 'XXXX          XXXX',
    'XXXX          XXXX', 'XXXX          XXXX', 'XXXX          XXXX', 'XXXX          XXXX', 'XXXX          XXXX',
  ],
  N: [
    'XX          XXXX', 'XXX         XXXX', 'XXXX        XXXX', 'XXXXX       XXXX', 'XXXXXX      XXXX',
    'XXXXXXX     XXXX', 'XXXXXXXX    XXXX', 'XXXXXXXXX   XXXX', 'XXXXXXXXXX  XXXX', 'XXXXXXXXXXX XXXX',
    'XXXX XXXXXXXXXXX', 'XXXX  XXXXXXXXXX', 'XXXX   XXXXXXXXX', 'XXXX    XXXXXXXX', 'XXXX     XXXXXXX',
    'XXXX      XXXXXX', 'XXXX       XXXXX', 'XXXX        XXXX', 'XXXX         XXX', 'XXXX          XX',
  ],
  O: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  P: [
    'XXXXXXXXX   ', 'XXXXXXXXXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXX   XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX   XXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXX ',
    'XXXXXXXXXXX ', 'XXXXXXXXX   ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXX        ',
  ],
  Q: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX XX XXXX', 'XXXX  XXXXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXXX', ' XXXXXXXXXXX', '   XXXXXXXXX',
  ],
  R: [
    'XXXXXXXXX   ', 'XXXXXXXXXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXX   XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX   XXXX ', 'XXXXXXXXXXX ', 'XXXXXXXXXX  ',
    'XXXXXXXXXX  ', 'XXXXXXXXXXX ', 'XXXX   XXXX ', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
  ],
  S: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXXX   XXXX', 'XXXXXX      ', ' XXXXXX     ', ' XXXXXXX    ', '  XXXXXXX   ',
    '   XXXXXXX  ', '    XXXXXXX ', '     XXXXXX ', '      XXXXXX', 'XXXX   XXXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  T: [
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '    XXXX    ',
    '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ',
    '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ',
    '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ',
  ],
  U: [
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  V: [
    'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX',
    'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX',
    'XXXXX    XXXXX', 'XXXXX    XXXXX', ' XXXX    XXXX ', ' XXXXX  XXXXX ', '  XXXX  XXXX  ',
    '  XXXXXXXXXX  ', '   XXXXXXXX   ', '   XXXXXXXX   ', '    XXXXXX    ', '     XXXX     ',
  ],
  W: [
    'XXXX          XXXX', 'XXXX          XXXX', 'XXXX          XXXX', 'XXXX          XXXX', 'XXXX          XXXX',
    'XXXX          XXXX', 'XXXX          XXXX', 'XXXX    XX    XXXX', 'XXXX   XXXX   XXXX', 'XXXX  XXXXXX  XXXX',
    'XXXX XXXXXXXX XXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XXXXXXXX  XXXXXXXX', 'XXXXXXX    XXXXXXX',
    'XXXXXX      XXXXXX', 'XXXXX        XXXXX', 'XXXX          XXXX', 'XXX            XXX', 'XX              XX',
  ],
  X: [
    'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX',
    'XXXXX    XXXXX', 'XXXXX    XXXXX', ' XXXXX  XXXXX ', ' XXXXXXXXXXXX ', '  XXXXXXXXXX  ',
    ' XXXXXXXXXXXX ', ' XXXXXXXXXXXX ', 'XXXXXX  XXXXXX', 'XXXXX    XXXXX', 'XXXXX    XXXXX',
    'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX',
  ],
  Y: [
    'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX', 'XXXX      XXXX',
    'XXXXX    XXXXX', 'XXXXX    XXXXX', ' XXXXX  XXXXX ', ' XXXXXXXXXXXX ', '  XXXXXXXXXX  ',
    '   XXXXXXXX   ', '     XXXX     ', '     XXXX     ', '     XXXX     ', '     XXXX     ',
    '     XXXX     ', '     XXXX     ', '     XXXX     ', '     XXXX     ', '     XXXX     ',
  ],
  Z: [
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '     XXXXXXX',
    '     XXXXXX ', '    XXXXXXX ', '    XXXXXX  ', '   XXXXXXX  ', '   XXXXXX   ',
    '  XXXXXXX   ', '  XXXXXX    ', ' XXXXXXX    ', ' XXXXXX     ', 'XXXXXXX     ',
    'XXXXXX      ', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX',
  ],

  0: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  1: [
    '   XXXX', '  XXXXX', ' XXXXXX', 'XXXXXXX', '   XXXX',
    '   XXXX', '   XXXX', '   XXXX', '   XXXX', '   XXXX',
    '   XXXX', '   XXXX', '   XXXX', '   XXXX', '   XXXX',
    '   XXXX', '   XXXX', '   XXXX', '   XXXX', '   XXXX',
  ],
  2: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', '        XXXX', '       XXXXX', '     XXXXXXX', '    XXXXXXX ',
    '   XXXXXXX  ', '  XXXXXXX   ', ' XXXXXXX    ', 'XXXXXXX     ', 'XXXXXX      ',
    'XXXX        ', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX',
  ],
  3: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', '        XXXX', '       XXXXX', '   XXXXXXXX ', '   XXXXXXX  ',
    '   XXXXXXX  ', '   XXXXXXXX ', '       XXXXX', '        XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  4: [
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX',
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '        XXXX', '        XXXX', '        XXXX',
    '        XXXX', '        XXXX', '        XXXX', '        XXXX', '        XXXX',
  ],
  5: [
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXX        ',
    'XXXX        ', 'XXXX        ', 'XXXX        ', 'XXXXXXXXX   ', 'XXXXXXXXXXX ',
    'XXXXXXXXXXX ', 'XXXXXXXXXXXX', '       XXXXX', '        XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  6: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX        ', 'XXXX        ', 'XXXXXXXXX   ', 'XXXXXXXXXXX ',
    'XXXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  7: [
    'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', '        XXXX',
    '       XXXXX', '      XXXXX ', '     XXXXX  ', '    XXXXX   ', '    XXXX    ',
    '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ',
    '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ',
  ],
  8: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ',
    'XXXXXXXXXXXX', 'XXXXX  XXXXX', 'XXXX    XXXX', 'XXXX    XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],
  9: [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', 'XXXX    XXXX', 'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXXX',
    ' XXXXXXXXXXX', '   XXXXXXXXX', '        XXXX', '        XXXX', 'XXXX    XXXX',
    'XXXXX  XXXXX', 'XXXXXXXXXXXX', ' XXXXXXXXXX ', ' XXXXXXXXXX ', '   XXXXXX   ',
  ],

  ' ': Array(20).fill('  '), // with the letter gaps either side: 6px between words, as in the reference
  '.': [...Array(16).fill('    '), 'XXXX', 'XXXX', 'XXXX', 'XXXX'],
  ':': ['    ', '    ', '    ', '    ', 'XXXX', 'XXXX', 'XXXX', 'XXXX', ...Array(8).fill('    '), 'XXXX', 'XXXX', 'XXXX', 'XXXX'],
  "'": [...Array(6).fill('XXXX'), ...Array(14).fill('    ')],
  '!': [...Array(13).fill('XXXX'), '    ', '    ', '    ', 'XXXX', 'XXXX', 'XXXX', 'XXXX'],
  '-': [...Array(8).fill('        '), ...Array(4).fill('XXXXXXXX'), ...Array(8).fill('        ')],
  '+': [
    ...Array(4).fill('            '), ...Array(4).fill('    XXXX    '), ...Array(4).fill('XXXXXXXXXXXX'),
    ...Array(4).fill('    XXXX    '), ...Array(4).fill('            '),
  ],
  '?': [
    '   XXXXXX   ', ' XXXXXXXXXX ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXXXX  XXXXX',
    'XXXX    XXXX', '       XXXXX', '     XXXXXX ', '    XXXXXX  ', '    XXXXX   ',
    '    XXXX    ', '    XXXX    ', '    XXXX    ', '            ', '            ',
    '            ', '    XXXX    ', '    XXXX    ', '    XXXX    ', '    XXXX    ',
  ],
}

// Catch malformed glyphs while developing (every row the same width, 20 rows).
if (import.meta.env.DEV) {
  for (const [char, rows] of Object.entries(GLYPHS)) {
    if (rows.length !== MENU_FONT_HEIGHT || rows.some(r => r.length !== rows[0].length)) {
      console.error(`menuFont: glyph "${char}" must be ${MENU_FONT_HEIGHT} rows of equal width`)
    }
  }
}

const glyphFor = (char: string): string[] => GLYPHS[char.toUpperCase()] ?? GLYPHS['?']

/** Width of `text`'s letters in art pixels (not counting the 1px outline round it). */
export function menuTextWidth(text: string): number {
  const chars = [...text]
  return chars.reduce((w, c) => w + glyphFor(c)[0].length, 0) + Math.max(0, chars.length - 1) * LETTER_SPACING
}

/**
 * `text` as pixel art: its outline adds 1px all round, so the art is
 * menuTextWidth(text) + 2 wide and 22 tall, with the letters starting at (1, 1).
 */
export function menuTextArt(text: string): PixelArt {
  const width = menuTextWidth(text) + 2
  const height = MENU_FONT_HEIGHT + 2
  // where the letters are filled
  const fill: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false))
  let pen = 1
  for (const char of text) {
    const glyph = glyphFor(char)
    glyph.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'X') fill[y + 1][pen + x] = true })
    pen += glyph[0].length + LETTER_SPACING
  }
  const filled = (x: number, y: number) => fill[y]?.[x] === true
  // colour each pixel: shade a stroke's right column and bottom row, outline round everything
  const colors = fill.map((row, y) => row.map((isFill, x) => {
    if (isFill) {
      const right = !filled(x + 1, y), below = !filled(x, y + 1)
      return right && below ? COLORS.corner : right ? COLORS.right : below ? COLORS.bottom : COLORS.fill
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (filled(x + dx, y + dy)) return COLORS.outline
    return null
  }))
  return { width, height, draw: (ctx, scale) => drawColorGrid(ctx, colors, scale) }
}
