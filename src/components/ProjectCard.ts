import { PixelText } from './PixelText'

/** One project, as listed in src/projects.ts. */
export interface Project {
  /** Shown in the box's white band in the pixel font (A–Z, 0–9 and . , : ' ! ? - + / ( )). */
  name: string
  /** The project's picture: import the PNG (see src/projects.ts). */
  image: string
}

/**
 * One project box: a striped banner with the project's name, and its picture
 * underneath. Laid out in "art pixels" (ProjectCarousel.css), so it scales with
 * the screen like the rest of the pixel art.
 *
 * Selected, it gets the main menu's highlight: a red copy of the box behind it,
 * pulsing red ↔ pink, with the box lifted up-left of it, and the same bounce.
 */
export class ProjectCard {
  readonly element = document.createElement('li')
  readonly project: Project

  constructor(project: Project) {
    this.project = project
    const el = this.element
    el.className = 'project-card'
    el.setAttribute('role', 'option')
    el.innerHTML = `
      <div class="project-card-highlight"></div>
      <div class="project-card-box">
        <div class="project-card-banner"><div class="project-card-name"></div></div>
        <div class="project-card-picture"><img alt="" draggable="false" decoding="async" loading="lazy" /></div>
      </div>
    `
    el.querySelector('img')!.src = project.image
    el.querySelector('.project-card-name')!.append(new PixelText(project.name).element)
    // the bounce ends itself, so its timing lives in the CSS alone
    el.addEventListener('animationend', e => {
      if (e.animationName === 'card-split-over') el.classList.remove('splitting')
    })
    this.selected = false
  }

  set selected(on: boolean) {
    this.element.classList.toggle('selected', on)
    this.element.setAttribute('aria-selected', String(on))
  }

  /** The quick "split" bounce the menu buttons do when they're selected. */
  bounce(): void {
    this.element.classList.remove('splitting')
    void this.element.offsetWidth // restart the animation
    this.element.classList.add('splitting')
  }
}

// ── Banner art ──────────────────────────────────────────────────────────────
// Drawn once, pixel by pixel (86 × 58 art pixels), so the diagonal stripes have
// proper pixel-art steps. Every card shares it (ProjectCarousel sets it as a CSS
// variable). Swap this for a PNG of your own banner any time.

const BANNER = { width: 86, height: 58, bandTop: 21, bandHeight: 16 }
const BANNER_COLORS = {
  top: '#5ba9bd',
  topStripe: '#efc400',
  light: '#9ad3df',
  band: '#f7f3f7',
  bottomStripe: '#e8365d',
  bottomRight: '#0066ff',
}

let bannerUrl: string | null = null

export function cardBannerArt(): string {
  if (bannerUrl) return bannerUrl
  const canvas = document.createElement('canvas')
  canvas.width = BANNER.width
  canvas.height = BANNER.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return (bannerUrl = '')
  const span = (y: number, x0: number, x1: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(x0, y, Math.min(x1, BANNER.width) - x0, 1)
  }
  const bandBottom = BANNER.bandTop + BANNER.bandHeight
  for (let y = 0; y < BANNER.height; y++) {
    if (y < BANNER.bandTop) {            // top: teal, a yellow "\" stripe, light teal
      span(y, 0, BANNER.width, BANNER_COLORS.top)
      span(y, 34 + y, 44 + y, BANNER_COLORS.topStripe)
      span(y, 44 + y, BANNER.width, BANNER_COLORS.light)
    } else if (y < bandBottom) {         // the white band the name sits on
      span(y, 0, BANNER.width, BANNER_COLORS.band)
    } else {                             // bottom: light teal, a pink stripe, blue
      const k = y - bandBottom
      span(y, 0, BANNER.width, BANNER_COLORS.light)
      span(y, 18 + k, 28 + k, BANNER_COLORS.bottomStripe)
      span(y, 28 + k, BANNER.width, BANNER_COLORS.bottomRight)
    }
  }
  return (bannerUrl = canvas.toDataURL())
}
