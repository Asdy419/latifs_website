/*
 * The Photo Gallery's pin board (PhotoGrid), after the user's picture: a light oak frame round a
 * deep red felt. Its frame is pixel art, drawn here as a 9-slice for CSS border-image, so the
 * board can be any size (it grows with the photos) and the frame stays crisp at one pixel per art
 * pixel: each rail is a dark outline, a lit edge, the oak with two grain lines along it and a
 * darker inner edge against the felt; the corners are mitred, a dark seam from corner to corner.
 */

/** The frame's width in art px (the border-image's slice and the board's border width). */
export const PINBOARD_FRAME = 8
export const PINBOARD_FELT = '#7a1515'

const OUTLINE = '#3a2a18', LIT = '#e8d0a8', OAK = '#d7b78c', GRAIN = '#c6a271', GRAIN_DARK = '#b48d5c', INNER = '#6a4a2a', SEAM = '#9c7445'

/** The rail's colours by distance in from the outer edge. */
const RAIL = [OUTLINE, LIT, OAK, GRAIN, OAK, OAK, GRAIN_DARK, INNER]

/** The 9-slice (3 × 3 cells of PINBOARD_FRAME px) as a data URL, the middle see-through. */
export function pinboardFrameUrl(): string {
  const F = PINBOARD_FRAME, S = F * 3
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dl = x, dr = S - 1 - x, dt = y, db = S - 1 - y
    const d = Math.min(dl, dr, dt, db)
    if (d >= F) continue // the middle
    const onSeam = (dt < F && (dt === dl || dt === dr)) || (db < F && (db === dl || db === dr))
    ctx.fillStyle = onSeam && d > 0 && d < F - 1 ? SEAM : RAIL[d]
    ctx.fillRect(x, y, 1, 1)
  }
  return canvas.toDataURL()
}
