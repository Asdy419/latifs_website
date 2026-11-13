/**
 * Pixel-perfect hit testing against an <img>'s alpha channel.
 *
 * Each image's pixels are read ONCE and cached as a plain byte array, so every
 * lookup afterwards is just an array read. (Calling getImageData per sample is
 * very slow — on mobile it can mean a GPU read-back for every single pixel.)
 */

const ALPHA_THRESHOLD = 10

interface AlphaMask {
  data: Uint8ClampedArray
  width: number
  height: number
}

// Keyed by image URL, so <img>s sharing a picture share one mask and swapping an
// <img>'s src picks up the right one.
// null = image loaded but its pixels can't be read (cross-origin) → treat as opaque
const cache = new Map<string, AlphaMask | null>()

function getMask(img: HTMLImageElement): AlphaMask | null {
  const key = img.currentSrc || img.src
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  if (!img.complete || !img.naturalWidth) return null // not loaded yet — try again next time

  let mask: AlphaMask | null = null
  try {
    const canvas = document.createElement('canvas')
    canvas.width  = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    mask = { data, width: canvas.width, height: canvas.height }
  } catch {
    mask = null
  }
  cache.set(key, mask)
  return mask
}

/**
 * True if `img` is opaque at the given screen point.
 * If the pixels can't be read (not loaded / cross-origin) the whole box counts as opaque.
 * Pass `rect` when you already have it to avoid an extra layout read.
 */
export function isOpaqueAt(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
  rect: DOMRect = img.getBoundingClientRect(),
): boolean {
  const mask = getMask(img)
  if (!mask) return true
  const px = Math.floor(((clientX - rect.left) / rect.width)  * mask.width)
  const py = Math.floor(((clientY - rect.top)  / rect.height) * mask.height)
  if (!(px >= 0 && py >= 0 && px < mask.width && py < mask.height)) return false
  return mask.data[(py * mask.width + px) * 4 + 3] > ALPHA_THRESHOLD
}
