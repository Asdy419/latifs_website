import './NowPlaying.css'
import { PixelLabel } from './PixelText'

/**
 * "Now Playing" pop-up: a black slanted box that slides in at the top right,
 * stays for a few seconds, then slides back out and removes itself.
 * Its text is in the references' small text font (PixelLabel).
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
}

/** Removes the pop-up at once, if it's showing. */
export function hideNowPlaying(): void {
  document.querySelector('.now-playing')?.remove()
}
