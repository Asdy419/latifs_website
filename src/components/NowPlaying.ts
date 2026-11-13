import './NowPlaying.css'

/**
 * "Now Playing" pop-up: a black slanted box that slides in at the top right,
 * stays for a few seconds, then slides back out and removes itself.
 */
export function showNowPlaying(title: string): void {
  document.querySelector('.now-playing')?.remove()

  const box = document.createElement('div')
  box.className = 'now-playing'
  box.setAttribute('role', 'status') // screen readers announce it
  box.innerHTML = `
    <span class="now-playing-label">&#9835; Now Playing</span>
    <span class="now-playing-title"></span>
  `
  box.querySelector('.now-playing-title')!.textContent = title // file names are text, never HTML
  box.addEventListener('animationend', () => box.remove(), { once: true })
  document.body.append(box)
}
