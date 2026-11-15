import { PixelText } from './PixelText'
import { playSelectJump } from '../utils/selectJump'

export interface Language {
  name: string
  /** % of the code (from GitHub). Leave it out when there's no repo to measure: the bar splits evenly and no % is shown. */
  share?: number
  /** GitHub's colour for it */
  color: string
}

/** One project, as listed in src/projects.ts. */
export interface Project {
  /** On the box, in the pixel font (A–Z, 0–9 and . , : ' ! ? - + / ( )). Keep it short. */
  name: string
  /** The pop-up's heading, in the menu font. */
  title: string
  year: number
  /** One fun line (opens the Overview). */
  tagline: string
  /** What kind of project, under the picture ("Systems programming"). */
  kind: string
  /** When, and what sort ("Dec 2025, coursework"), under that. */
  when: string
  /** Tools and libraries, under that (optional). */
  tech?: string[]
  /** OVERVIEW: what it is, in a paragraph. */
  gist: string
  /** OVERVIEW, after the gist (optional). */
  funFact?: string
  /** FEATURES: each "Lead. The rest." */
  features: string[]
  /** NUMBERS: up to 4 big figures. */
  numbers: { value: string; label: string }[]
  /** TIMELINE, oldest first. */
  milestones: { when: string; text: string }[]
  /** The pop-up's picture slot (a screenshot…); it stays a blank panel until set. */
  shot?: string
  /** Fill the picture column with a wide screenshot, including when it needs upscaling. */
  shotFullWidth?: boolean
  /** Centre the image/details and tabbed write-up as two balanced groups. */
  detailsLayout?: 'balanced'
  /** Biggest first. Empty hides the pop-up's language section. */
  languages: Language[]
  /** Pixel-art language logos, small in the box's bottom-right corner (assets/projects/langs/, 16×16). */
  logos: string[]
  /** The project's own logo/picture, in the middle of the box (optional: the space stays free until added). */
  image?: string
  /** The public GitHub repo, if there is one (the pop-up's "View on GitHub"). */
  url?: string
  /** Any other links (a devlog…). */
  links?: { label: string; url: string }[]
}

/**
 * One project box: a striped banner with the project's name, then its picture
 * (the project's own logo, `image`) with its languages as small pixel-art logos
 * in the bottom-right corner. Laid out in art pixels (ProjectCarousel.css), so
 * it scales with the screen like the rest of the pixel art.
 *
 * Selected, it gets the main menu's highlight: a red copy of the box behind it,
 * pulsing red ↔ pink, with the box lifted up-left of it, and the same jump.
 */
export class ProjectCard {
  readonly element = document.createElement('li')
  readonly project: Project
  private jump: Animation[] = []

  constructor(project: Project) {
    this.project = project
    const el = this.element
    el.className = 'project-card'
    el.setAttribute('role', 'option')
    const languages = project.languages.map(l => l.name).join(', ')
    el.setAttribute('aria-label', languages ? `${project.title}: ${languages}` : project.title)
    const logos = project.logos.map(src =>
      `<img class="project-card-logo" src="${src}" alt="" draggable="false" decoding="async" />`).join('')
    el.innerHTML = `
      <div class="project-card-highlight"></div>
      <div class="project-card-box">
        <div class="project-card-banner"><div class="project-card-name"></div></div>
        <div class="project-card-picture">
          <img class="project-card-image" alt="" draggable="false" decoding="async" hidden />
          <div class="project-card-logos">${logos}</div>
        </div>
      </div>
    `
    el.querySelector('.project-card-name')!.append(new PixelText(project.name).element)
    if (project.image) {
      const img = el.querySelector<HTMLImageElement>('.project-card-image')!
      img.src = project.image
      img.hidden = false
    }
    this.selected = false
  }

  set selected(on: boolean) {
    this.element.classList.toggle('selected', on)
    this.element.setAttribute('aria-selected', String(on))
  }

  /** The jump the menu buttons do when they're selected (utils/selectJump.ts). */
  bounce(): void {
    this.stopBounce()
    const box = this.element.querySelector('.project-card-box')!
    this.jump = playSelectJump({
      bar: [box],
      highlight: this.element.querySelector('.project-card-highlight')!,
    }, box.getBoundingClientRect().height / 164) // the box is 164 art px tall
  }

  /** Stops a jump mid-way (the box drops straight back to its spot). */
  stopBounce(): void {
    for (const a of this.jump) a.cancel()
    this.jump = []
  }
}

/** A GitHub-style bar: one coloured segment per language, as wide as its share. */
/** "C 99.4%", or just the name when the share isn't known. */
export const languageLabel = (l: Language): string => l.share === undefined ? l.name : `${l.name} ${l.share}%`

export function languageBar(languages: Language[], className: string): string {
  const segments = languages.map(l =>
    `<span style="flex: ${l.share ?? 1} 0 0; background: ${l.color}" title="${languageLabel(l)}"></span>`).join('')
  return `<div class="${className}" aria-hidden="true">${segments}</div>`
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
