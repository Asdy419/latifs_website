/**
 * A small pixel font in the style of the "NEW" text on the save-select cards
 * (N, E and W are copied from that reference pixel for pixel; the rest of the
 * alphabet is drawn to match).
 *
 * Every glyph is 12 pixels tall and drawn with four colours:
 *   #  ink           (black)
 *   s  shade         the dark column on the right of each upright stroke and bar end
 *   b  edge          the blue-grey pixels either side of 45° diagonals (pixel-art anti-aliasing)
 *   ' ' transparent
 *
 * Style rules, for adding glyphs: uprights are "##s", bars are two rows tall and
 * end in "s", diagonals step 1px per row as "b##b", rounded corners are cut
 * with a 1px "b". Lowercase is drawn as uppercase.
 *
 * Render with `PixelText` (components/PixelText.ts), or `drawPixelText()` for a canvas.
 */

export const CAP_HEIGHT = 12
/** Gap between letters, in font pixels (as in the reference). */
export const LETTER_SPACING = 2
/** Gap between lines, in font pixels. */
export const LINE_SPACING = 4

export const PIXEL_FONT_COLORS = {
  '#': '#000000',
  s: '#393042',
  b: '#5a7194',
} as const

interface Glyph {
  rows: readonly string[]
  width: number
  /** Columns the glyph reaches into the gap before it (E and F's middle bar). */
  overhang: number
}

// ── Glyphs ──────────────────────────────────────────────────────────────────
// Each is 12 strings of equal length. A leading '<' column marks an overhang
// column: it is drawn in the letter gap, so the upright still lines up.

const GLYPH_ROWS: Record<string, string[]> = {
  A: [
    '      b##b      ',
    '     b####b     ',
    '    b##bb##b    ',
    '   b##b  b##b   ',
    '  b##b    b##b  ',
    ' b##b      b##b ',
    'b##b        b##b',
    '###############s',
    '###############s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
  ],
  B: [
    '##############b ',
    '###############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##############b ',
    '###############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '###############b',
    '##############b ',
  ],
  C: [
    ' b#############s',
    'b##############s',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    'b##############s',
    ' b#############s',
  ],
  D: [
    '##############b ',
    '###############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '###############b',
    '##############b ',
  ],
  E: [ // from the reference
    '< ###############s',
    '< ###############s',
    '< ##s             ',
    '< ##s             ',
    '< ##s             ',
    '<########s        ',
    '<########s        ',
    '< ##s             ',
    '< ##s             ',
    '< ##s             ',
    '< ###############s',
    '< ###############s',
  ],
  F: [
    '< ###############s',
    '< ###############s',
    '< ##s             ',
    '< ##s             ',
    '< ##s             ',
    '<########s        ',
    '<########s        ',
    '< ##s             ',
    '< ##s             ',
    '< ##s             ',
    '< ##s             ',
    '< ##s             ',
  ],
  G: [
    ' b#############s',
    'b##############s',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s      ######s',
    '##s      ######s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    'b##############b',
    ' b############b ',
  ],
  H: [
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '###############s',
    '###############s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
  ],
  I: Array(12).fill('##s'),
  J: [
    '             ##s',
    '             ##s',
    '             ##s',
    '             ##s',
    '             ##s',
    '             ##s',
    '             ##s',
    '             ##s',
    '##s          ##s',
    '##s          ##s',
    'b##############b',
    ' b############b ',
  ],
  K: [
    '##s         b##s',
    '##s        b##b ',
    '##s       b##b  ',
    '##s      b##b   ',
    '##s     b##b    ',
    '#########b      ',
    '#########b      ',
    '##s     b##b    ',
    '##s      b##b   ',
    '##s       b##b  ',
    '##s        b##b ',
    '##s         b##s',
  ],
  L: [
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '###############s',
    '###############s',
  ],
  M: [ // the reference W, upside down
    '##b          b#s',
    '###b        b##s',
    '####b      b###s',
    '#####b    b####s',
    '##sb##b  b##b##s',
    '##s b##bb##b ##s',
    '##s  b####b  ##s',
    '##s   b##b   ##s',
    '##s    bb    ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
  ],
  N: [ // from the reference
    '####b         ##s',
    '#####b        ##s',
    '##sb##b       ##s',
    '##s b##b      ##s',
    '##s  b##b     ##s',
    '##s   b##b    ##s',
    '##s    b##b   ##s',
    '##s     b##b  ##s',
    '##s      b##b ##s',
    '##s       b##b##s',
    '##s        b####s',
    '##s         b###s',
  ],
  O: [
    ' b############b ',
    'b##############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    'b##############b',
    ' b############b ',
  ],
  P: [
    '##############b ',
    '###############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '###############b',
    '##############b ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
    '##s             ',
  ],
  Q: [
    ' b############b ',
    'b##############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s     b##b ##s',
    '##s      b##b##s',
    '##s       b####s',
    '##s        b###s',
    'b##############s',
    ' b#############s',
  ],
  R: [
    '##############b ',
    '###############b',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '###############b',
    '##############b ',
    '##s     b##b    ',
    '##s      b##b   ',
    '##s       b##b  ',
    '##s        b##b ',
    '##s         b##s',
  ],
  S: [
    ' b#############s',
    'b##############s',
    '##s             ',
    '##s             ',
    '##s             ',
    '##############b ',
    ' b#############b',
    '             ##s',
    '             ##s',
    '             ##s',
    '###############b',
    '##############b ',
  ],
  T: [
    '###############s',
    '###############s',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
  ],
  U: [
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    'b##############b',
    ' b############b ',
  ],
  V: [
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    'b##b        b##b',
    ' b##b      b##b ',
    '  b##b    b##b  ',
    '   b##b  b##b   ',
    '    b##bb##b    ',
    '     b####b     ',
    '      b##b      ',
  ],
  W: [ // from the reference
    '##s          ##s',
    '##s          ##s',
    '##s          ##s',
    '##s    bb    ##s',
    '##s   b##b   ##s',
    '##s  b####b  ##s',
    '##s b##bb##b ##s',
    '##sb##b  b##b##s',
    '#####b    b####s',
    '####b      b###s',
    '###b        b##s',
    '##b          b#s',
  ],
  X: [
    'b##b        b##b',
    ' b##b      b##b ',
    '  b##b    b##b  ',
    '   b##b  b##b   ',
    '    b##bb##b    ',
    '     b####b     ',
    '     b####b     ',
    '    b##bb##b    ',
    '   b##b  b##b   ',
    '  b##b    b##b  ',
    ' b##b      b##b ',
    'b##b        b##b',
  ],
  Y: [
    'b##b        b##b',
    ' b##b      b##b ',
    '  b##b    b##b  ',
    '   b##b  b##b   ',
    '    b##bb##b    ',
    '     b####b     ',
    '      b##b      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
    '       ##s      ',
  ],
  Z: [
    '###############s',
    '###############s',
    '          b##b  ',
    '         b##b   ',
    '        b##b    ',
    '       b##b     ',
    '      b##b      ',
    '     b##b       ',
    '    b##b        ',
    '   b##b         ',
    '###############s',
    '###############s',
  ],

  // Digits are narrower than letters, so 0 and O are easy to tell apart.
  0: [
    ' b#########b ',
    'b###########b',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    'b###########b',
    ' b#########b ',
  ],
  1: [
    ' b####s',
    'b##b##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
    '    ##s',
  ],
  2: [
    '###########b ',
    '############b',
    '          ##s',
    '          ##s',
    '          ##s',
    ' b##########b',
    'b##########b ',
    '##s          ',
    '##s          ',
    '##s          ',
    '############s',
    '############s',
  ],
  3: [
    '###########b ',
    '############b',
    '          ##s',
    '          ##s',
    '          ##s',
    '   #########s',
    '   #########s',
    '          ##s',
    '          ##s',
    '          ##s',
    '############b',
    '###########b ',
  ],
  4: [
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    '############s',
    '############s',
    '          ##s',
    '          ##s',
    '          ##s',
    '          ##s',
    '          ##s',
  ],
  5: [
    '############s',
    '############s',
    '##s          ',
    '##s          ',
    '##s          ',
    '###########b ',
    '############b',
    '          ##s',
    '          ##s',
    '          ##s',
    '############b',
    '###########b ',
  ],
  6: [
    ' b##########s',
    'b###########s',
    '##s          ',
    '##s          ',
    '##s          ',
    '###########b ',
    '############b',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    'b###########b',
    ' b#########b ',
  ],
  7: [
    '############s',
    '############s',
    '         b##b',
    '        b##b ',
    '       b##b  ',
    '      b##b   ',
    '     b##b    ',
    '     ##s     ',
    '     ##s     ',
    '     ##s     ',
    '     ##s     ',
    '     ##s     ',
  ],
  8: [
    ' b#########b ',
    'b###########b',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    ' b#########b ',
    'b###########b',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    'b###########b',
    ' b#########b ',
  ],
  9: [
    ' b#########b ',
    'b###########b',
    '##s       ##s',
    '##s       ##s',
    '##s       ##s',
    'b###########s',
    ' b##########s',
    '          ##s',
    '          ##s',
    '          ##s',
    '############b',
    '###########b ',
  ],

  ' ': Array(12).fill('     '),
  '.': [...Array(10).fill('   '), '##s', '##s'],
  ',': [...Array(9).fill('   '), '##s', '##s', '#b '],
  ':': ['   ', '   ', '   ', '##s', '##s', '   ', '   ', '   ', '   ', '   ', '##s', '##s'],
  "'": ['##s', '##s', '##s', ...Array(9).fill('   ')],
  '!': [...Array(8).fill('##s'), '   ', '   ', '##s', '##s'],
  '?': [
    '###########b ',
    '############b',
    '          ##s',
    '          ##s',
    '          ##s',
    '     #######b',
    '     ##s     ',
    '     ##s     ',
    '             ',
    '             ',
    '     ##s     ',
    '     ##s     ',
  ],
  '-': ['        ', '        ', '        ', '        ', '        ', '#######s', '#######s', '        ', '        ', '        ', '        ', '        '],
  '+': [
    '            ',
    '            ',
    '     ##s    ',
    '     ##s    ',
    '     ##s    ',
    '###########s',
    '###########s',
    '     ##s    ',
    '     ##s    ',
    '     ##s    ',
    '            ',
    '            ',
  ],
  '/': [
    '          b##b',
    '         b##b ',
    '        b##b  ',
    '       b##b   ',
    '      b##b    ',
    '     b##b     ',
    '    b##b      ',
    '   b##b       ',
    '  b##b        ',
    ' b##b         ',
    'b##b          ',
    '##b           ',
  ],
  '(': [' b##s', 'b##s ', '##s  ', '##s  ', '##s  ', '##s  ', '##s  ', '##s  ', '##s  ', '##s  ', 'b##s ', ' b##s'],
  ')': ['##b  ', ' ##b ', '  ##s', '  ##s', '  ##s', '  ##s', '  ##s', '  ##s', '  ##s', '  ##s', ' ##b ', '##b  '],
}

const GLYPHS = new Map<string, Glyph>()
for (const [char, rows] of Object.entries(GLYPH_ROWS)) {
  // A leading '<' marks a glyph whose next column is drawn in the gap before it.
  const overhang = rows[0].startsWith('<') ? 1 : 0
  const pixels = overhang ? rows.map(r => r.slice(1)) : rows
  GLYPHS.set(char, { rows: pixels, width: pixels[0].length - overhang, overhang })
}

const glyphFor = (char: string): Glyph =>
  GLYPHS.get(char.toUpperCase()) ?? GLYPHS.get('?')!

// ── Measuring and drawing ──────────────────────────────────────────────────

/** Size of `text` in font pixels (`\n` starts a new line). */
export function measurePixelText(text: string): { width: number; height: number } {
  const lines = text.split('\n')
  const width = Math.max(...lines.map(lineWidth))
  return { width, height: lines.length * CAP_HEIGHT + (lines.length - 1) * LINE_SPACING }
}

/** Width of one line; a first letter's overhang counts, so it isn't cut off. */
function lineWidth(line: string): number {
  const chars = [...line]
  if (chars.length === 0) return 0
  return glyphFor(chars[0]).overhang
    + chars.reduce((w, c) => w + glyphFor(c).width, 0)
    + (chars.length - 1) * LETTER_SPACING
}

/**
 * Draws `text` with its top-left at (x, y), `scale` canvas pixels per font
 * pixel. Each font pixel's edges are rounded to whole canvas pixels, so the
 * text stays sharp at any scale (no blur, no gaps). Lines are centred.
 */
export function drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number): void {
  const lines = text.split('\n')
  const blockWidth = measurePixelText(text).width
  lines.forEach((line, li) => {
    let penX = Math.floor((blockWidth - lineWidth(line)) / 2) + (line ? glyphFor([...line][0]).overhang : 0)
    const top = li * (CAP_HEIGHT + LINE_SPACING)
    for (const char of line) {
      const glyph = glyphFor(char)
      const left = penX - glyph.overhang
      glyph.rows.forEach((row, ry) => {
        const y0 = Math.round(y + (top + ry) * scale)
        const y1 = Math.round(y + (top + ry + 1) * scale)
        // one fillRect per run of same-coloured pixels
        for (let cx = 0; cx < row.length; ) {
          const c = row[cx] as keyof typeof PIXEL_FONT_COLORS | ' '
          let end = cx + 1
          while (end < row.length && row[end] === c) end++
          if (c !== ' ') {
            ctx.fillStyle = PIXEL_FONT_COLORS[c]
            const x0 = Math.round(x + (left + cx) * scale)
            ctx.fillRect(x0, y0, Math.round(x + (left + end) * scale) - x0, y1 - y0)
          }
          cx = end
        }
      })
      penX += glyph.width + LETTER_SPACING
    }
  })
}

/** Characters the font can draw (anything else is drawn as "?"). */
export const PIXEL_FONT_CHARS = [...GLYPHS.keys()].join('')
