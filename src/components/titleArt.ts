/*
 * Lettering for the title screen's medal, after the Sonic Mania title the user sent
 * (reference/88ecef….gif), measured from it art pixel by art pixel:
 *
 * - `titleGrid`: LATIF'S in the style of its "SONIC": chunky yellow letters 26 px tall, lit along
 *   their top and left and deeper along their bottom and right, in a 4 px bevelled blue outline
 *   (a dark line against the yellow, blue, then a lighter blue rim along the top but navy below,
 *   and a dark edge) that runs on between the letters and fills their holes. Square corners (the
 *   user's call). It's as wide as SONIC is (125 px) though it has seven glyphs, so the letters are
 *   a little narrower and closer than SONIC's.
 * - `spikyGrid`: a second line in the style of its "MANIA": angular red letters whose strokes end
 *   in points, edged gold with a dark orange rim, shaded dark red along their bottom and right.
 *
 * The letter shapes are our own; one cell per art pixel.
 */

/** Rows of colours, one per art pixel (null: see-through). */
export type Grid = (string | null)[][]

// ── LATIF'S ──────────────────────────────────────────────────────────────────

const YELLOW = '#f9cc09', YELLOW_LIGHT = '#f7d960', YELLOW_DEEP = '#d8b632'
const EDGE = '#33305a', BLUE = '#043ad3', BLUE_RIM = '#2957cb', NAVY = '#050a88', OUTER = '#0e0963', OUTER_LIT = '#53588f'
/** The letters' height, and the outline's thickness: a dark line, blue, a rim, a dark edge. */
const H = 26, OUTLINE = 4
/**
 * Spacing, by the letters' shapes rather than their boxes (so a T's arms don't leave a gulf
 * under them): the gap between two neighbours' edges averages SPACING px over the rows they
 * share, and is never under TIGHTEST (where an arm overhangs).
 */
const SPACING = 3, TIGHTEST = 2

/** A letter: its width in design units (of a 24-unit height), and whether the point (u, v) is inside. */
interface Letter { w: number; inside: (u: number, v: number) => boolean }

const LETTERS: Record<string, Letter> = {
  L: { w: 13, inside: (u, v) => u < 7 || v >= 17 },
  // 7 across the top and the full width at the foot, a little triangle of a hole, a gap between the legs
  A: {
    w: 19,
    inside: (u, v) => {
      const d = Math.abs(u - 9.5)
      return d <= 3.5 + v * 0.3 && !(v >= 8 && v < 13 && d <= (v - 8) * 0.5) && !(v >= 18 && d < 2.5)
    },
  },
  T: { w: 15, inside: (u, v) => v < 7 || (u >= 4 && u < 11) },
  I: { w: 7, inside: () => true },
  F: { w: 13, inside: (u, v) => u < 7 || v < 7 || (v >= 9 && v < 16 && u < 11) },
  // a block with a tail hanging to the left
  "'": { w: 5, inside: (u, v) => v < 6 || (v < 9.5 && u < 5 - (v - 6) * 1.3) },
  // three bars, the middle one sloping down to the right, joined top-left and bottom-right
  S: {
    w: 15,
    inside: (u, v) => {
      const slant = (2 * u) / 15
      return v < 6 || (u < 6 && v < 10) || (v >= 9 + slant && v < 15 + slant) || (u >= 9 && v >= 14) || v >= 18
    },
  },
}

/** A letter at `h` px tall: its width in px, and whether cell (x, y) is filled. */
function sized(l: Letter, h: number): { w: number; filled: (x: number, y: number) => boolean } {
  const s = h / 24
  const w = Math.round(l.w * s)
  return { w, filled: (x, y) => x >= 0 && y >= 0 && x < w && y < h && l.inside((x + 0.5) / s, (y + 0.5) / s) }
}

/** A letter's leftmost and rightmost filled cell in each row ([w, -1] in an empty row). */
function extents(w: number, h: number, filled: (x: number, y: number) => boolean): [number, number][] {
  return Array.from({ length: h }, (_, y) => {
    let lo = w, hi = -1
    for (let x = 0; x < w; x++) if (filled(x, y)) { lo = Math.min(lo, x); hi = Math.max(hi, x) }
    return [lo, hi] as [number, number]
  })
}

/** LATIF'S: 26 px letters in their outline, about 125 × 34. */
export function titleGrid(text = "LATIF'S"): Grid {
  const letters = [...text].map(ch => LETTERS[ch]).filter(Boolean).map(l => sized(l, H))
  // each letter's left edge: far enough from the last for the spacing above
  const lefts = [0]
  for (let i = 1; i < letters.length; i++) {
    const a = extents(letters[i - 1].w, H, letters[i - 1].filled), b = extents(letters[i].w, H, letters[i].filled)
    // how far the last letter's right edge reaches past this one's left edge, in each row both have cells in
    const reach = a.map(([, hi], y) => (hi < 0 || b[y][0] >= letters[i].w ? null : hi - b[y][0])).filter((r): r is number => r !== null)
    const tightest = Math.max(...reach) + 1 + TIGHTEST
    const average = Math.round(reach.reduce((sum, r) => sum + r, 0) / reach.length + 1 + SPACING)
    lefts.push(lefts[i - 1] + Math.max(tightest, average))
  }
  const W = lefts[lefts.length - 1] + letters[letters.length - 1].w + 2 * OUTLINE
  const HT = H + 2 * OUTLINE
  const shape = Array.from({ length: HT }, () => Array<boolean>(W).fill(false))
  letters.forEach((l, i) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < l.w; x++) if (l.filled(x, y)) shape[y + OUTLINE][OUTLINE + lefts[i] + x] = true
  })
  const fill = (x: number, y: number) => shape[y]?.[x] ?? false
  // how far a cell is from the nearest letter cell, squarely (so the outline keeps square corners)
  const reach = (x: number, y: number) => {
    for (let r = 1; r <= OUTLINE; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (fill(x + dx, y + dy)) return r
    }
    return Infinity
  }
  // an outline cell above a letter (lit) rather than beside or below it
  const above = (x: number, y: number, r: number) => fill(x, y + r) || fill(x - 1, y + r) || fill(x + 1, y + r)
  const grid: Grid = Array.from({ length: HT }, (_, y) => Array.from({ length: W }, (_, x): string | null => {
    if (fill(x, y)) {
      if (!fill(x, y - 1) || !fill(x, y - 2) || !fill(x - 1, y)) return YELLOW_LIGHT
      if (!fill(x, y + 1) || !fill(x + 1, y)) return YELLOW_DEEP
      return YELLOW
    }
    const r = reach(x, y)
    if (r === 1) return EDGE
    if (r === 2) return BLUE
    if (r === 3) return above(x, y, 3) ? BLUE_RIM : NAVY
    if (r === 4) return above(x, y, 4) ? OUTER_LIT : OUTER
    return null
  }))
  // narrow cracks between letters, and pockets the outline closes off (under a T's arm), are filled
  // blue, so the outline runs on round the word as the reference's does: only see-through cells
  // reachable from the edge stay see-through
  for (const row of grid) {
    for (let x = 0; x < W; ) {
      if (row[x] !== null) { x++; continue }
      let end = x
      while (end < W && row[end] === null) end++
      if (x > 0 && end < W && end - x <= 5) for (let k = x; k < end; k++) row[k] = BLUE
      x = end
    }
  }
  const open = Array.from({ length: HT }, () => Array<boolean>(W).fill(false))
  const stack: [number, number][] = []
  for (let x = 0; x < W; x++) stack.push([x, 0], [x, HT - 1])
  for (let y = 0; y < HT; y++) stack.push([0, y], [W - 1, y])
  while (stack.length) {
    const [x, y] = stack.pop()!
    if (x < 0 || y < 0 || x >= W || y >= HT || open[y][x] || grid[y][x] !== null) continue
    open[y][x] = true
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  for (let y = 0; y < HT; y++) for (let x = 0; x < W; x++) if (grid[y][x] === null && !open[y][x]) grid[y][x] = BLUE
  return grid
}

// ── The spiky second line ────────────────────────────────────────────────────

const RED = '#e51605', RED_SHADE = '#b01107', GOLD_EDGE = '#f4c861', RIM = '#7a2a08'
/** Glyphs as polygons in a box 20 tall (and `w` wide): `add` shapes, less `cut` holes. */
interface Spiky { w: number; add: [number, number][][]; cut?: [number, number][][] }
const S = 4 // a stroke's thickness

/** A left-hand stem from (x0, 0), its foot flaring out to a point at the bottom left. */
const stem = (x0: number): [number, number][] => [[x0, 0], [x0 + S, 0], [x0 + S, 20], [x0 - 1.5, 20], [x0, 15]]
/** A bar across y0..y0+S from x0 to x1, its right end cut to a point. */
const bar = (x0: number, x1: number, y0: number): [number, number][] => [[x0, y0], [x1 - 1.5, y0], [x1 + 0.5, y0 + S / 2], [x1 - 1.5, y0 + S], [x0, y0 + S]]
/** A P's bowl: the top bar, the round side, the middle bar, with the hole between. */
const BOWL: [number, number][] = [[0, 0], [9, 0], [12, 2.5], [12, 8.5], [9, 11], [0, 11]]
const BOWL_HOLE: [number, number][] = [[S, 3.5], [8.5, 3.5], [8.5, 7.5], [S, 7.5]]

const SPIKY: Record<string, Spiky> = {
  P: { add: [stem(0), BOWL], cut: [BOWL_HOLE], w: 12 },
  O: { add: [[[2.5, 0], [9.5, 0], [12, 2.5], [12, 17.5], [9.5, 20], [2.5, 20], [0, 17.5], [0, 2.5]]], cut: [[[S, 4], [12 - S, 4], [12 - S, 16], [S, 16]]], w: 12 },
  R: { add: [stem(0), BOWL, [[5, 11], [9, 11], [13, 20], [9, 20]]], cut: [BOWL_HOLE], w: 13 },
  T: { add: [[[-1, 0], [13, 0], [11.5, S], [0.5, S]], [[4, S], [8, S], [8, 16], [9, 20], [3, 20], [4, 16]]], w: 12 },
  F: { add: [stem(0), bar(0, 12, 0), bar(0, 10, 8)], w: 11 },
  L: { add: [[[0, 0], [S, 0], [S, 20], [0, 20]], bar(0, 12, 20 - S)], w: 12 },
  I: { add: [[[0, 0], [9, 0], [6.5, S], [6.5, 20 - S], [9, 20], [0, 20], [2.5, 20 - S], [2.5, S]]], w: 9 },
}

function inPolygon(poly: [number, number][], x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** `text` in the spiky style, `h` px tall (letters 20 design units), 1 px apart, in a 2 px edge. */
export function spikyGrid(text: string, h = 18): Grid {
  const s = h / 20
  const glyphs = [...text].map(ch => SPIKY[ch]).filter(Boolean)
  const widths = glyphs.map(g => Math.round(g.w * s))
  const GAP = 1, EDGE_W = 2
  const W = widths.reduce((sum, w) => sum + w, 0) + GAP * (glyphs.length - 1) + 2 * EDGE_W
  const HT = h + 2 * EDGE_W
  const shape = Array.from({ length: HT }, () => Array<boolean>(W).fill(false))
  let left = EDGE_W
  glyphs.forEach((g, i) => {
    for (let y = 0; y < h; y++) for (let x = -2; x < widths[i] + 2; x++) {
      const u = (x + 0.5) / s, v = (y + 0.5) / s
      if (g.add.some(p => inPolygon(p, u, v)) && !g.cut?.some(p => inPolygon(p, u, v))) shape[y + EDGE_W][left + x] = true
    }
    left += widths[i] + GAP
  })
  const fill = (x: number, y: number) => shape[y]?.[x] ?? false
  const near = (x: number, y: number, r: number) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (fill(x + dx, y + dy)) return true
    return false
  }
  return Array.from({ length: HT }, (_, y) => Array.from({ length: W }, (_, x): string | null => {
    if (fill(x, y)) return !fill(x, y + 1) || !fill(x + 1, y) ? RED_SHADE : RED
    if (near(x, y, 1)) return GOLD_EDGE
    if (near(x, y, 2)) return RIM
    return null
  }))
}
