import { drawColorGrid, type PixelArt } from '../utils/pixelArt'

/**
 * The Socials page's box pictures (SocialSelect), drawn in code as pixel art, one cell per
 * art pixel: flat colours, no shading or gleam (the user's taste in the small logos).
 */

type Cells = (string | null)[][]

const cells = (width: number, height: number): Cells =>
  Array.from({ length: height }, () => Array<string | null>(width).fill(null))

/** Colours every cell where `inside` holds, the shape moved by `dx`, `dy`. */
function paint(grid: Cells, inside: (x: number, y: number) => boolean, colour: string, dx = 0, dy = 0): void {
  grid.forEach((row, y) => row.forEach((_, x) => { if (inside(x - dx, y - dy)) row[x] = colour }))
}

const toArt = (grid: Cells): PixelArt => ({
  width: grid[0].length,
  height: grid.length,
  draw: (ctx, scale) => drawColorGrid(ctx, grid, scale),
})

/** A rectangle from (x0, y0) to (x1, y1), its corners rounded to radius `r`. */
const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) => (x: number, y: number) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return Math.hypot(x - cx, y - cy) <= r + 0.3
}

/** TikTok's note: a ring with a stem up its right side and a flag curling off its top, black,
 *  with the logo's cyan and red echoes up-left and down-right. */
export function tiktokArt(): PixelArt {
  const note = (x: number, y: number) => {
    const ring = Math.hypot(x - 15.5, y - 37.5)
    if (ring <= 12.5 && ring >= 5.5) return true // the head
    if (x >= 23 && x <= 30 && y >= 3 && y <= 38) return true // the stem
    const arc = Math.hypot(x - 30.5, y - 17.5) // the flag: a quarter of a ring
    return x >= 30 && y <= 17 && arc <= 14.5 && arc >= 7.5
  }
  const grid = cells(48, 54)
  paint(grid, note, '#25f4ee', -2, -2)
  paint(grid, note, '#fe2c55', 2, 2)
  paint(grid, note, '#111111')
  return toArt(grid)
}

/** A camera, for the photography account: a dark body and top plate, the viewfinder's bump, a
 *  red shutter button, a white flash and a big blue lens. */
export function cameraArt(): PixelArt {
  const grid = cells(56, 42)
  const lens = (r: number) => (x: number, y: number) => Math.hypot(x - 27.5, y - 25.5) <= r
  paint(grid, roundRect(17, 2, 34, 12, 2), '#2b2d33') // viewfinder bump
  paint(grid, roundRect(41, 5, 48, 10, 1), '#c62828') // shutter button
  paint(grid, roundRect(2, 8, 53, 39, 4), '#2b2d33') // body
  paint(grid, roundRect(4, 10, 51, 15, 1), '#4a4d55') // top plate
  paint(grid, lens(12.5), '#111216') // lens ring
  paint(grid, lens(9), '#3b6fb6') // glass
  paint(grid, lens(4.5), '#1d3c6e') // its dark middle
  paint(grid, roundRect(7, 18, 11, 21, 0), '#f2f2f2') // flash
  return toArt(grid)
}

/** GitHub's mark: a dark disc with the cat's silhouette in white (head and ears, its body down
 *  to the disc's edge, its tail curled off the body's left side). */
export function githubArt(): PixelArt {
  const grid = cells(50, 50)
  const triangle = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (x: number, y: number) => {
    const s = (p: number, q: number, r: number, t: number) => (x - r) * (q - t) - (p - r) * (y - t)
    const d1 = s(ax, ay, bx, by), d2 = s(bx, by, cx, cy), d3 = s(cx, cy, ax, ay)
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
  }
  const disc = (x: number, y: number) => Math.hypot(x - 24.5, y - 24.5) <= 23.5
  const head = (x: number, y: number) => ((x - 24.5) / 11.5) ** 2 + ((y - 22) / 9.5) ** 2 <= 1
  const ears = (x: number, y: number) =>
    triangle(13, 17, 15, 7, 21, 14)(x, y) || triangle(36, 17, 34, 7, 28, 14)(x, y)
  const body = (x: number, y: number) => x >= 19 && x <= 30 && y >= 28 && disc(x, y)
  const tail = (x: number, y: number) => {
    const r = Math.hypot(x - 13.5, y - 32.5)
    return x <= 19 && y >= 32 && r >= 3.5 && r <= 6.5
  }
  paint(grid, disc, '#24292f')
  paint(grid, (x, y) => disc(x, y) && (head(x, y) || ears(x, y) || body(x, y) || tail(x, y)), '#f6f8fa')
  return toArt(grid)
}

/** A plain bust, for the user's own account (they kept it over their GitHub pfp). */
export function bustArt(): PixelArt {
  const grid = cells(46, 52)
  paint(grid, (x, y) => y >= 34 && Math.hypot((x - 22.5) / 1.25, y - 52) <= 18, '#36475a') // shoulders
  paint(grid, (x, y) => Math.hypot(x - 22.5, y - 20) <= 12.2, '#36475a') // head
  return toArt(grid)
}

/** Instagram's glyph for the menu TV's logo drift (SocialDrift): a flat magenta tile with the
 *  rounded-square outline, the lens ring and the dot in white. */
export function instagramArt(): PixelArt {
  const grid = cells(48, 48)
  const ring = (cx: number, cy: number, outer: number, inner: number) => (x: number, y: number) => {
    const d = Math.hypot(x - cx, y - cy)
    return d <= outer && d >= inner
  }
  paint(grid, roundRect(2, 2, 45, 45, 11), '#dd2a7b') // the tile
  paint(grid, (x, y) => roundRect(10, 10, 37, 37, 8)(x, y) && !roundRect(13, 13, 34, 34, 5.5)(x, y), '#ffffff') // the frame
  paint(grid, ring(23.5, 23.5, 8.6, 5.4), '#ffffff') // the lens
  paint(grid, (x, y) => Math.hypot(x - 31.5, y - 15.5) <= 1.9, '#ffffff') // the dot
  return toArt(grid)
}

/** An envelope, for the user's email: cream, its flap closed over a little red seal. */
export function envelopeArt(): PixelArt {
  const grid = cells(52, 40)
  const flap = (x: number, y: number) => y <= 21 - Math.abs(x - 25.5) * 0.84
  paint(grid, roundRect(0, 0, 51, 39, 2), '#f6f1e4') // the body
  paint(grid, (x, y) => x === 51 || y === 39, '#cfc6b4') // its far edges, a touch darker
  paint(grid, flap, '#e8e2d2') // the flap
  paint(grid, (x, y) => flap(x, y) && !flap(x, y + 1), '#cfc6b4') // its edge
  paint(grid, (x, y) => Math.hypot(x - 25.5, y - 20.5) <= 3.2, '#d9534f') // the seal
  return toArt(grid)
}
