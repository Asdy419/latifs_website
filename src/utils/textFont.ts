import { drawColorGrid, type PixelArt } from './pixelArt'

/**
 * The references' small text font: the dialog text in reference/image.png and
 * the main-menu clip's key prompts. Capitals 10 rows tall with 2px strokes,
 * 1px apart, with a dark shadow along their right and bottom edges (a darker
 * shade of whatever the text sits on).
 *
 * Each glyph is 11 rows: 10 of letter plus the shadow row, and one column
 * wider than the letter for the shadow. "X" is ink, "s" shadow. The game's
 * shadows are hand-drawn (they skip rounded corners and the starts of strokes),
 * so A C D E F G H I L M N O P Q R S T U V W Y and "." are copied pixel for
 * pixel from the reference, ink and shadow. The others ("// drawn") follow the
 * same rules: corners rounded by cutting 1px, diagonals stepped 1px per row
 * and 3px wide (like S), most letters 6px wide, and shadow right of, below and
 * diagonally below-right of the ink, except at stroke starts and round corners.
 * B and K were measured from the menu clip's prompts (letters only).
 *
 * Lowercase is drawn as uppercase; characters it doesn't have are drawn as "?".
 * Used by ordinary text (PixelLabel in components/PixelText.ts) and the corner
 * prompts (hudArt.ts, which uses its own 1px diagonal shadow).
 */

/** Rows of letter (the art adds one more for the shadow). */
export const TEXT_FONT_HEIGHT = 10
/** Gap between letters (it holds the shadow column). */
const SPACING = 1
/** Default top-to-top distance between lines (as in the reference dialog). */
export const LINE_HEIGHT = 18

const GLYPHS: Record<string, readonly string[]> = {
  0: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  1: ['  XXs', ' XXXs', 'XXXXs', 'ssXXs', '  XXs', '  XXs', '  XXs', '  XXs', '  XXs', '  XXs', '  sss'], // drawn
  2: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'ss  XXs', '   XXXs', '  XXXs ', ' XXXs  ', 'XXXs   ', 'XXXXXXs', 'XXXXXXs', 'sssssss'], // drawn
  3: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'ss  XXs', '  XXXs ', '  XXXs ', '  ssXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  4: ['XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', 'XXXXXXs', 'ssssXXs', '    XXs', '    XXs', '    XXs', '    sss'], // drawn
  5: ['XXXXXXs', 'XXXXXXs', 'XXsssss', 'XXs    ', 'XXXXXs ', 'XXXXXXs', 'ssssXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  6: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs sss', 'XXXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  7: ['XXXXXXs', 'XXXXXXs', 'ssssXXs', '    XXs', '   XXXs', '  XXXs ', '  XXs  ', '  XXs  ', '  XXs  ', '  XXs  ', '  sss  '], // drawn
  8: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', ' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  9: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXXXXXs', ' XXXXXs', ' sssXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  A: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', 'XXXXXXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'sss sss'],
  B: ['XXXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXXXXs ', 'XXXXXs ', 'XXssXXs', 'XXs XXs', 'XXXXXXs', 'XXXXXs ', 'sssss  '], // drawn
  C: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs sss', 'XXs    ', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '],
  D: ['XXXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', 'XXXXXs ', 'sssss  '],
  E: ['XXXXXXs', 'XXXXXXs', 'XXsssss', 'XXs    ', 'XXXXXs ', 'XXXXXs ', 'XXssss ', 'XXs    ', 'XXXXXXs', 'XXXXXXs', 'sssssss'],
  F: ['XXXXXXs', 'XXXXXXs', 'XXsssss', 'XXs    ', 'XXXXXs ', 'XXXXXs ', 'XXssss ', 'XXs    ', 'XXs    ', 'XXs    ', 'sss    '],
  G: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs sss', 'XXsXXXs', 'XXsXXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '],
  H: ['XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'sss sss'],
  I: ['XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'sss'],
  J: ['    XXs', '    XXs', '    XXs', '    XXs', '    XXs', '    XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '], // drawn
  K: ['XXs  XXs', 'XXs XXXs', 'XXsXXXs ', 'XXXXXs  ', 'XXXXs   ', 'XXXXs   ', 'XXXXXs  ', 'XXsXXXs ', 'XXs XXXs', 'XXs  XXs', 'sss  sss'], // drawn
  L: ['XXs   ', 'XXs   ', 'XXs   ', 'XXs   ', 'XXs   ', 'XXs   ', 'XXs   ', 'XXs   ', 'XXXXXs', 'XXXXXs', 'ssssss'],
  M: ['XXs  XXs', 'XXs  XXs', 'XXX XXXs', 'XXXXXXXs', 'XXXXXXXs', 'XXsXsXXs', 'XXss XXs', 'XXs  XXs', 'XXs  XXs', 'XXs  XXs', 'sss  sss'],
  N: ['XXs  XXs', 'XXs  XXs', 'XXX  XXs', 'XXXX XXs', 'XXXXXXXs', 'XXsXXXXs', 'XXssXXXs', 'XXs sXXs', 'XXs  XXs', 'XXs  XXs', 'sss  sss'],
  O: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '],
  P: ['XXXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXXXXXs', 'XXXXXs ', 'XXsss  ', 'XXs    ', 'XXs    ', 'XXs    ', 'sss    '],
  Q: [' XXXXs  ', 'XXXXXXs ', 'XXssXXs ', 'XXs XXs ', 'XXs XXs ', 'XXs XXs ', 'XXsXXXs ', 'XXssXXs ', 'XXXXXXs ', ' XXXXsXs', ' ssss ss'],
  R: ['XXXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXXXXs ', 'XXXXXs ', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'sss sss'],
  S: [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXXsss ', ' XXXs  ', '  XXXs ', '   XXXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '],
  T: ['XXXXXXs', 'XXXXXXs', 'ssXXsss', '  XXs  ', '  XXs  ', '  XXs  ', '  XXs  ', '  XXs  ', '  XXs  ', '  XXs  ', '  sss  '],
  U: ['XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' ssss  '],
  V: ['XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', '  XXs  ', '  ss   '],
  W: ['XXs  XXs', 'XXs  XXs', 'XXs  XXs', 'XXs  XXs', 'XXsX XXs', 'XXXXXXXs', 'XXXXXXXs', 'XXssXXXs', 'XXs sXXs', 'XXs  XXs', 'sss  sss'],
  X: ['XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', ' XXXXs ', 'XXXXXXs', 'XXssXXs', 'XXs XXs', 'XXs XXs', 'sss sss'], // drawn
  Y: ['XXs XXs', 'XXs XXs', 'XXs XXs', 'XXs XXs', 'XXXXXXs', ' XXXXs ', '  XXs  ', '  XXs  ', '  XXs  ', '  XXs  ', '  sss  '],
  Z: ['XXXXXXs', 'XXXXXXs', 'ssssXXs', '   XXXs', '  XXXs ', ' XXXs  ', 'XXXs   ', 'XXs    ', 'XXXXXXs', 'XXXXXXs', 'sssssss'], // drawn
  ' ': ['        ', '        ', '        ', '        ', '        ', '        ', '        ', '        ', '        ', '        ', '        '], // drawn
  '.': ['   ', '   ', '   ', '   ', '   ', '   ', '   ', '   ', 'XXs', 'XXs', 'sss'],
  ',': ['   ', '   ', '   ', '   ', '   ', '   ', '   ', 'XXs', 'XXs', 'Xs ', 's  '], // drawn
  ':': ['   ', '   ', 'XXs', 'XXs', 'sss', '   ', '   ', '   ', 'XXs', 'XXs', 'sss'], // drawn
  ';': ['   ', '   ', 'XXs', 'XXs', 'sss', '   ', '   ', 'XXs', 'XXs', 'Xs ', 's  '], // drawn
  "'": ['XXs', 'XXs', 'XXs', 'sss', '   ', '   ', '   ', '   ', '   ', '   ', '   '], // drawn
  '\"': ['XXsXXs', 'XXsXXs', 'XXsXXs', 'ssssss', '      ', '      ', '      ', '      ', '      ', '      ', '      '], // drawn
  '!': ['XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'XXs', 'sss', '   ', 'XXs', 'XXs', 'sss'], // drawn
  '?': [' XXXXs ', 'XXXXXXs', 'XXssXXs', 'ss  XXs', '   XXXs', '  XXXs ', '  XXs  ', '  ss   ', '  XXs  ', '  XXs  ', '  sss  '], // drawn
  '-': ['     ', '     ', '     ', '     ', 'XXXXs', 'XXXXs', 'sssss', '     ', '     ', '     ', '     '], // drawn
  '+': ['       ', '       ', '  XXs  ', '  XXs  ', 'XXXXXXs', 'XXXXXXs', 'ssXXsss', '  XXs  ', '  sss  ', '       ', '       '], // drawn
  '=': ['      ', '      ', '      ', 'XXXXXs', 'XXXXXs', 'ssssss', 'XXXXXs', 'XXXXXs', 'ssssss', '      ', '      '], // drawn
  '_': ['       ', '       ', '       ', '       ', '       ', '       ', '       ', '       ', 'XXXXXXs', 'XXXXXXs', 'sssssss'], // drawn
  '/': ['    XXs', '    XXs', '   XXXs', '   XXs ', '  XXXs ', '  XXs  ', ' XXXs  ', ' XXs   ', 'XXXs   ', 'XXs    ', 'ss     '], // drawn
  '(': [' XXs', 'XXs ', 'XXs ', 'XXs ', 'XXs ', 'XXs ', 'XXs ', 'XXs ', 'XXs ', ' XXs', ' sss'], // drawn
  ')': ['XXs ', ' XXs', ' XXs', ' XXs', ' XXs', ' XXs', ' XXs', ' XXs', ' XXs', 'XXs ', 'ss  '], // drawn
  '%': ['XXs   XXs', 'XXs  XXXs', 'sss XXXs ', '   XXXs  ', '  XXXs   ', ' XXXs    ', 'XXXs     ', 'XXs      ', 'ss    XXs', '      XXs', '      sss'], // drawn
  '#': [' XXsXXs ', ' XXsXXs ', 'XXXXXXXs', 'XXXXXXXs', ' XXsXXs ', ' XXsXXs ', 'XXXXXXXs', 'XXXXXXXs', ' XXsXXs ', ' XXsXXs ', ' ssssss '], // drawn
  '↵': ['      XXs', '      XXs', '      XXs', '  Xs  XXs', ' XXs  XXs', 'XXXXXXXXs', 'XXXXXXXXs', ' XXssssss', '  Xs     ', '  ss     ', '         '], // drawn
}

if (import.meta.env?.DEV) {
  for (const [char, rows] of Object.entries(GLYPHS)) {
    if (rows.length !== TEXT_FONT_HEIGHT + 1 || rows.some(r => r.length !== rows[0].length)) {
      console.error(`textFont: glyph ${JSON.stringify(char)} must be ${TEXT_FONT_HEIGHT + 1} rows of equal length`)
    }
  }
}

/** Typographic characters drawn with the glyphs they stand for. */
const SUBSTITUTES: Record<string, string> = {
  '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', '×': 'X', '\t': ' ',
}
const normalise = (text: string): string => text.replace(/[‘’“”–—…×\t]/g, c => SUBSTITUTES[c])

const glyphFor = (char: string): readonly string[] => GLYPHS[char.toUpperCase()] ?? GLYPHS['?']
/** A glyph's letter width (its rows are one wider, for the shadow). */
const letterWidth = (glyph: readonly string[]) => glyph[0].length - 1

/** Width of one line's letters (without the shadow). */
function lineWidth(line: string): number {
  const chars = [...line]
  return chars.reduce((w, c) => w + letterWidth(glyphFor(c)), 0) + Math.max(0, chars.length - 1) * SPACING
}

/**
 * Size of `text`'s art, shadow included (`\n` starts a new line, `lineHeight`
 * pixels below the one before).
 */
export function measureText(text: string, lineHeight = LINE_HEIGHT): { width: number; height: number } {
  const lines = normalise(text).split('\n')
  return {
    width: Math.max(...lines.map(lineWidth)) + 1,
    height: (lines.length - 1) * lineHeight + TEXT_FONT_HEIGHT + 1,
  }
}

/**
 * Breaks `text` into lines (`\n`) whose art is at most `maxWidth` pixels wide,
 * at spaces; a word too long for a line on its own is split between letters.
 */
export function wrapText(text: string, maxWidth: number): string {
  const fits = (line: string) => lineWidth(line) + 1 <= maxWidth
  const out: string[] = []
  for (const paragraph of normalise(text).split('\n')) {
    let line = ''
    for (const word of paragraph.split(/ +/)) {
      const joined = line ? `${line} ${word}` : word
      if (fits(joined)) {
        line = joined
        continue
      }
      if (line) out.push(line)
      line = ''
      for (const char of word) { // only a word wider than a whole line gets here with letters left over
        if (line && !fits(line + char)) {
          out.push(line)
          line = ''
        }
        line += char
      }
    }
    out.push(line)
  }
  return out.join('\n')
}

export interface TextArtOptions {
  /** Letter colour (CSS). */
  ink: string
  /** Shadow colour (CSS). */
  shadow: string
  /** How lines shorter than the longest sit (default: left). */
  align?: 'left' | 'center' | 'right'
  /** Top-to-top distance between lines, in font pixels (default: the reference's 18). */
  lineHeight?: number
  /**
   * Cast the shadow from the ink at these [dx, dy] offsets instead of using
   * the glyphs' own hand-drawn shadows (the corner prompts use [[1, 1]]).
   */
  shadowOffsets?: readonly (readonly [number, number])[]
}

export interface TextArt extends PixelArt {
  /** Whether art pixel (x, y) is drawn (for hit tests). */
  solidAt(x: number, y: number): boolean
}

/** `text` in this font, with its shadow (so 1px wider and taller than the letters). */
export function textArt(text: string, { ink, shadow, align = 'left', lineHeight = LINE_HEIGHT, shadowOffsets }: TextArtOptions): TextArt {
  const lines = normalise(text).split('\n')
  const { width, height } = measureText(text, lineHeight)
  const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null))
  const letters: [number, number][] = []
  const shadows: [number, number][] = []
  lines.forEach((line, li) => {
    const room = width - 1 - lineWidth(line)
    let pen = align === 'left' ? 0 : align === 'right' ? room : Math.floor(room / 2)
    for (const char of line) {
      const glyph = glyphFor(char)
      glyph.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === 'X') letters.push([pen + x, li * lineHeight + y])
          else if (row[x] === 's') shadows.push([pen + x, li * lineHeight + y])
        }
      })
      pen += letterWidth(glyph) + SPACING
    }
  })
  if (shadowOffsets) {
    for (const [x, y] of letters) for (const [dx, dy] of shadowOffsets) grid[y + dy][x + dx] = shadow
  } else {
    for (const [x, y] of shadows) grid[y][x] = shadow
  }
  for (const [x, y] of letters) grid[y][x] = ink // letters on top of any shadow
  return {
    width,
    height,
    draw: (ctx, scale) => drawColorGrid(ctx, grid, scale),
    solidAt: (x, y) => grid[Math.floor(y)]?.[Math.floor(x)] != null,
  }
}
