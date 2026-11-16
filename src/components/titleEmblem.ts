import { decodeRuns, drawColorGrid, type PixelArt } from '../utils/pixelArt'
import { pfpGrid4x } from './pfpArt'
import { spikyGrid, titleGrid, type Grid } from './titleArt'
import { MEDAL_PALETTE, MEDAL_STATIC, MEDAL_TAILS } from './medalPixels'

/*
 * The title screen's medal, after the Sonic Mania title the user sent (reference/88ecef….gif).
 * Its ring, red plate, black lower tier and the ribbon tails hanging from the plate's ends are
 * the reference's own pixels, lifted off the GIF art pixel by art pixel (the user asked for the
 * banner "1-to-1"; medalPixels.ts, made by scratchpad/islandref/lift.cjs), with the user's
 * tidying: the plate's end panels flat navy with one white band running between them behind the
 * lettering, nothing under the tier, and the tails (which wave in the GIF) frozen in frame 1's
 * pose. The wings keep their own sharp, upturned look (the user's call), and what's on the medal
 * is the user's: their pfp (the Metal Sonic sprite, four times its size) bursting out of the
 * ring's top, head and torso only, LATIF'S on the plate where SONIC was, PORTFOLIO on the tier
 * where MANIA was. One cell per art pixel; TitleScreen.css places it.
 */

export const EMBLEM = { width: 410, height: 200 }
/** The ring's middle; everything is placed from it (the reference's at (212, 109) of 424 × 240: the lifted cells are those less (7, 12)). */
const CX = 205, CY = 97
/** The row of the plate's middle, for TitleScreen.css to line up with the screen. */
export const EMBLEM_PLATE_MID = CY + 34

const FEATHER = '#f4f4fb', FEATHER_RIM = '#b1acd9', FEATHER_SHADE = '#cfcbea', GROOVE = '#6f6aa3', WING_EDGE = '#1a1f4f'
/** The plate's red, and the two rows of shadow the lettering casts on it (as SONIC's does). */
const PLATE_RED = '#e61605', SHADOW = '#930c07', SHADOW_FAR = '#af0f05'

/** A box of cells: x0, y0, x1, y1 (inclusive). */
type Box = [number, number, number, number]
type Cells<T> = (x: number, y: number) => T

export function emblemArt(): PixelArt {
  const { width: W, height: H } = EMBLEM
  const g: Grid = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H
  /** Paints a shape over what's there: its outline first (the cells beside it, not diagonally), then the shape. */
  const layer = ([x0, y0, x1, y1]: Box, inside: Cells<boolean>, colour: Cells<string>, outline: string) => {
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
      if (on(x, y) && !inside(x, y) && (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1))) g[y][x] = outline
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (on(x, y) && inside(x, y)) g[y][x] = colour(x, y)
  }
  const paste = (art: Grid, left: number, top: number) => art.forEach((row, y) => row.forEach((c, x) => { if (c && on(left + x, top + y)) g[top + y][left + x] = c }))
  const mirror = <T>(cells: Cells<T>): Cells<T> => (x, y) => cells(2 * CX - x, y)
  const flip = ([x0, y0, x1, y1]: Box): Box => [2 * CX - x1, y0, 2 * CX - x0, y1]

  // ── the wings, behind everything ──
  const w = wing()
  layer(w.box, w.inside, w.colour, WING_EDGE)
  layer(flip(w.box), mirror(w.inside), mirror(w.colour), WING_EDGE)

  // ── the reference's pixels: the tails first, then the ring, plate and lower tier over their tops ──
  paste(decodeRuns(MEDAL_TAILS.rows, MEDAL_PALETTE), MEDAL_TAILS.left, MEDAL_TAILS.top)
  paste(decodeRuns(MEDAL_STATIC.rows, MEDAL_PALETTE), MEDAL_STATIC.left, MEDAL_STATIC.top)

  // ── the pfp, four times its size, its head over the ring's top; his waist (row 26 of the
  //    sprite, less the 4 px the plate bows up by) at the plate's top, so only his head and torso
  //    show, centred on his chest (the sprite's column 16) ──
  const pfp = pfpGrid4x().slice(0, 26 * 4 - 4)
  paste(pfp, CX - 64, CY + 11 - 26 * 4)

  // ── the words: LATIF'S where SONIC was (its outline's top on row 123 of the reference, 2 rows
  //    up from SONIC's as the plate bows up 4), with SONIC's two rows of shadow under each column;
  //    PORTFOLIO across the lower tier's middle ──
  const name = titleGrid()
  const nameLeft = Math.round(CX - name[0].length / 2), nameTop = CY + 14
  paste(name, nameLeft, nameTop)
  for (let x = 0; x < name[0].length; x++) {
    let bottom = -1
    for (let y = 0; y < name.length; y++) if (name[y][x]) bottom = y
    if (bottom < 0) continue
    for (const [dy, c] of [[1, SHADOW], [2, SHADOW_FAR]] as const) {
      const gx = nameLeft + x, gy = nameTop + bottom + dy
      if (on(gx, gy) && g[gy][gx] === PLATE_RED) g[gy][gx] = c
    }
  }
  const line2 = spikyGrid('PORTFOLIO', 15)
  paste(line2, Math.round(CX - line2[0].length / 2), CY + 53)

  return { width: W, height: H, draw: (ctx, scale) => drawColorGrid(ctx, g, scale) }
}

/**
 * The left wing (the right one is its mirror), kept as the user likes it: five feathers stacked
 * into one wing behind the ring, each shorter than the one above, curving up over its outer part
 * and tapering to a sharp point, so the points hook up in a row stepping in down the wing's outer
 * edge. White, each feather shaded pale lavender along its underside down to a groove parting it
 * from the next, fading out towards the ring; the points lavender underneath. It was designed in
 * cells 1.35 art px across, round a ring centred at (150, 66) of them, and is scaled from there.
 */
function wing(): { box: Box; inside: Cells<boolean>; colour: Cells<string> } {
  const SCALE = 1.35, OX = 150, OY = 66
  const ROOT = 146, TOP = 20, T = 11, LIFT = 10
  const feathers = [0, 1, 2, 3, 4].map(i => {
    const top = TOP + i * T, tip = 14 + i * 10
    const curve = 0.42 * (ROOT - tip)
    const s = (px: number) => Math.max(0, 1 - (px - tip) / curve)
    const upper = (px: number) => top - LIFT * s(px) ** 2
    const lower = (px: number) => top + T - (T + LIFT) * s(px) ** 1.6
    const inside = (px: number, py: number) => px >= tip && px <= ROOT && py >= upper(px) && py <= lower(px)
    return { upper, lower, inside, grooveTo: tip + 0.75 * (ROOT - tip) }
  })
  const design = (x: number, y: number) => [(x + 0.5 - CX) / SCALE + OX, (y + 0.5 - CY) / SCALE + OY] as const
  const which = (x: number, y: number) => { const [px, py] = design(x, y); return feathers.findIndex(f => f.inside(px, py)) }
  const colour: Cells<string> = (x, y) => {
    const i = which(x, y), f = feathers[i], [px, py] = design(x, y)
    const hi = f.upper(px), lo = f.lower(px)
    if (lo - hi < 5) return py > hi + (lo - hi) * 0.45 ? FEATHER_RIM : FEATHER // the thin, curling point
    if (i < feathers.length - 1 && py > lo - 1.2 && px < f.grooveTo) return GROOVE
    if (py > lo - 4.2 && px < f.grooveTo) return FEATHER_SHADE
    return FEATHER
  }
  const box: Box = [Math.floor(CX + (14 - OX) * SCALE) - 2, Math.floor(CY + (TOP - LIFT - OY) * SCALE) - 2, Math.ceil(CX + (ROOT - OX) * SCALE), Math.ceil(CY + (TOP + 5 * T + 2 - OY) * SCALE)]
  return { box, inside: (x, y) => which(x, y) >= 0, colour }
}
