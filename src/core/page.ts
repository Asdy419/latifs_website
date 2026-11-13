import '../styles/base.css'
import { installScreenGuard } from './screenGuard'
import { pageReveal } from './pageTransition'

/**
 * Shared setup that every page runs first (import this before anything else
 * so the global CSS comes first in the cascade). Sub-pages use startSubpage()
 * in subpage.ts, which calls this.
 */

interface PageOptions {
  background: string
  /** Play the slanted-panel reveal on load (true when arriving by a page wipe). */
  reveal: boolean
}

export function startPage({ background, reveal }: PageOptions): HTMLDivElement {
  setBackground(background)
  trackViewportHeight()
  installScreenGuard()
  registerServiceWorker()

  // The browser back button restores pages from the bfcache exactly as they
  // were left — i.e. with the navigation cover panels frozen over the screen.
  // Clear them and play the reveal so it transitions in cleanly.
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return
    document.getElementById('panel-transition')?.remove()
    pageReveal()
  })

  if (reveal) pageReveal()
  return document.querySelector<HTMLDivElement>('#app')!
}

export function setBackground(color: string): void {
  document.documentElement.style.background = color
  document.body.style.background = color
}

/**
 * Chrome on iOS doesn't honour dvh/viewport-fit the same way Safari does.
 * Pinning --vh to window.innerHeight gives us the real usable pixel height.
 */
function trackViewportHeight(): void {
  let lastH = -1
  const update = () => {
    const h = window.innerHeight
    if (h === lastH) return // mobile fires lots of resizes; rewriting --vh restyles the page
    lastH = h
    document.documentElement.style.setProperty('--vh', `${h * 0.01}px`)
  }
  update()
  window.addEventListener('resize', update)
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js')
  } else {
    // During `npm run dev` a service worker would serve stale cached files
    // after you edit code, so make sure none is left over from a build.
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
  }
}
