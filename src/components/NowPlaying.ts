import './NowPlaying.css'
import { PixelLabel } from './PixelText'
import { drawColorGrid } from '../utils/pixelArt'

/**
 * "Now Playing" pop-up: a pixel-art banner that slides in at the top right,
 * stays for a few seconds, then slides back out and removes itself.
 * Its text is in the references' small text font (PixelLabel); its background
 * is drawn in art pixels (bannerArt) once its size is known.
 */
export function showNowPlaying(title: string): void {
  hideNowPlaying()

  const box = document.createElement('div')
  box.className = 'now-playing'
  box.setAttribute('role', 'status') // screen readers announce it

  const label = new PixelLabel('♫ Now Playing').element
  label.classList.add('now-playing-label')
  const name = new PixelLabel(title).element // drawn on a canvas, so file names are never HTML
  name.classList.add('now-playing-title')
  box.append(label, name)

  box.addEventListener('animationend', () => box.remove(), { once: true })
  document.body.append(box)
  paintBanner(box)
}

/** Removes the pop-up at once, if it's showing. */
export function hideNowPlaying(): void {
  document.querySelector('.now-playing')?.remove()
}

const BANNER_FILL = '#16151f'

/**
 * Sizes the banner to whole art pixels (so every block of the art is square) and paints
 * its background: a dark fill, its left end stepped like a staircase (1 across for every
 * 2 down). Nothing else: the user had its rim, outline and stripe taken off.
 */
function paintBanner(box: HTMLElement): void {
  // one art pixel, in CSS px (NowPlaying.css: --np-px)
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--np-px);height:0'
  box.append(probe)
  const px = probe.getBoundingClientRect().width
  probe.remove()
  if (!(px > 0)) return

  const rows = Math.ceil(box.getBoundingClientRect().height / px - 0.01)
  box.style.height = `${rows * px}px`
  const step = (r: number) => Math.floor((rows - 1 - r) / 2) // where row r starts: the staircase end
  box.style.paddingLeft = `${(step(0) + 5) * px}px` // the text clears the stepped end
  const cols = Math.ceil(box.getBoundingClientRect().width / px - 0.01)
  box.style.width = `${cols * px}px`

  const grid = Array.from({ length: rows }, (_, r) => {
    const row = Array<string | null>(cols).fill(null)
    for (let x = step(r); x < cols; x++) row[x] = BANNER_FILL
    return row
  })
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  drawColorGrid(ctx, grid, 1)
  box.style.backgroundImage = `url("${canvas.toDataURL()}")`
}
