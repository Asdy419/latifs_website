import './TvStatic.css'

/**
 * TV static, the same on every TV on the site (the main menu's and the Projects
 * pop-up's): blue-grey speckles with a few light bands, like the reference's.
 * It's drawn once into a canvas strip of STATIC_FRAMES frames stacked top to
 * bottom (the bands drift down from frame to frame), one speckle per art pixel
 * of the screen. Put the strip in a `.tv-static` box (TvStatic.css), which shows
 * one frame: still static, or rolling through the frames at 30fps with
 * `.rolling` (a CSS transform, so it costs no main-thread work).
 */

/** Frames in a strip (TvStatic.css rolls through them: keep the two in step). */
export const STATIC_FRAMES = 4

/**
 * How long a TV shows rolling static, at least, when it tunes to another picture: the Projects
 * pop-up's (ProjectPopup.tuneTV) and the main menu's (TvOverlay.tune).
 */
export const TUNE_MS = 260
/** The same when a TV first comes on: a little longer, like a set warming up. */
export const OPEN_TUNE_MS = 420

/** An opaque colour as one pixel of ImageData, read as 32 bits (in the platform's byte order). */
const pixel = (red: number, green: number, blue: number) => new Uint32Array(new Uint8ClampedArray([red, green, blue, 255]).buffer)[0]
const DARK = pixel(0x5f, 0x70, 0x8d)
const MID = pixel(0x8a, 0x9b, 0xb4)
const BAND = pixel(0x94, 0xa6, 0xbd)
const LIGHT = pixel(0xb9, 0xcd, 0xe0)
/** The light bands: their rows in every 78-row stretch, how tall they are, and how far they drift per frame. */
const BANDS = [8, 23, 41, 57]
const BAND_ROWS = 3
const BAND_PERIOD = 78
const BAND_DRIFT = 5

/** Strips already drawn, by size (the pixels are the same every time). */
const drawn = new Map<string, ImageData>()

/** A canvas strip of static for a `.tv-static` box: `width` x `height` speckles per frame. */
export function staticCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height * STATIC_FRAMES
  canvas.getContext('2d')?.putImageData(staticPixels(width, height), 0, 0)
  return canvas
}

/**
 * Works out a size's static ahead of time, so the TV that shows it later only
 * copies it (drawing the main menu's takes ~20-40ms on a mid-range phone).
 */
export function prepareStatic(width: number, height: number): void {
  staticPixels(width, height)
}

function staticPixels(width: number, height: number): ImageData {
  const key = `${width}x${height}`
  const ready = drawn.get(key)
  if (ready) return ready
  const image = new ImageData(width, height * STATIC_FRAMES)
  const px = new Uint32Array(image.data.buffer)
  let seed = 7
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  let i = 0
  for (let frame = 0; frame < STATIC_FRAMES; frame++) {
    for (let y = 0; y < height; y++) {
      const row = (((y - frame * BAND_DRIFT) % BAND_PERIOD) + BAND_PERIOD) % BAND_PERIOD
      const light = BANDS.some(b => row >= b && row < b + BAND_ROWS) ? BAND : LIGHT
      for (let x = 0; x < width; x++) {
        const r = random()
        px[i++] = r < 0.32 ? DARK : r < 0.45 ? MID : light
      }
    }
  }
  drawn.set(key, image)
  return image
}
