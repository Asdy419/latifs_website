import { PixelText } from './PixelText'
import { playSelectJump } from '../utils/selectJump'

/**
 * Where a box's picture goes, in art px of its 86 × 93 picture panel: centred
 * on (CENTER_X, CENTER_Y), inside MAX_W × MAX_H (6px from the top and sides;
 * the language logos sit in the bottom-right corner, below it). Every picture
 * gets the same area (AREA), whatever its shape, so wide, tall and square ones
 * look the same size; the build crops each to its visible pixels first
 * (cardArt in vite.config.ts), so their margins don't count.
 */
const ART = { CENTER_X: 43, CENTER_Y: 38, MAX_W: 74, MAX_H: 64, AREA: 54 * 54 }

/**
 * A picture's size in art px: AREA in its own proportions (`scale` times as big each way:
 * Project.cardImageScale), shrunk to fit MAX_W × MAX_H.
 */
function artSize(naturalWidth: number, naturalHeight: number, scale = 1): { width: number; height: number } {
  const ratio = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1
  let width = Math.sqrt(ART.AREA * ratio) * scale
  let height = width / ratio
  const fit = Math.min(1, ART.MAX_W / width, ART.MAX_H / height)
  width *= fit
  height *= fit
  return { width, height }
}

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
  /**
   * Where the picture's subject is, top to bottom, as a fraction of its height (0.5 if not
   * given) as served, after the build trims its empty edges (cardArt, vite.config.ts): the
   * pop-up's header centres that on the title and the line under it (Mars Allocator's rover
   * is centred on its box, not its mast: the user's call).
   */
  imageCentre?: number
  /**
   * How much bigger the pop-up's header draws the picture than its 24 pp slot (1 if not
   * given): it grows round its middle, over the slot's edges, so the title stays put. For
   * pictures far from square, which fill less of the slot (Horses From Noise's and Mystic
   * Messaging's: the user's call).
   */
  imageScale?: number
  /**
   * How much bigger the box draws the picture, each way, than the area every picture gets
   * (ART; 1 if not given; still inside the panel's limits): for a sparse drawing that looks
   * small at that area (Kinemechanics': the user's call).
   */
  cardImageScale?: number
  /** What kind of project, under the picture ("Systems programming"). */
  kind: string
  /** When, and what sort ("Dec 2025, coursework"). Not shown at the moment: the pop-up's header
   *  dropped it, as the Timeline tab has the dates (the user's call). */
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
  /**
   * The pop-up's pictures (screenshots…), shown on a pixel-art TV: one per
   * tab (Overview, Features, Numbers, Timeline), wrapping round if there are
   * fewer; switching tabs tunes the TV to the next. No pictures: static.
   */
  shots?: string[]
  /** Biggest first. Empty hides the pop-up's language section. */
  languages: Language[]
  /** Pixel-art language logos, small in the box's bottom-right corner (assets/projects/langs/, 16×16). */
  logos: string[]
  /**
   * The project's own logo/picture, in the middle of the box and next to the
   * pop-up's title (optional: the space stays free until added). Any size or
   * margin: the build crops it to its visible pixels and the box sizes it.
   */
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
      // shown once it has loaded and been given its size (see ART)
      const place = () => {
        const { width, height } = artSize(img.naturalWidth, img.naturalHeight, project.cardImageScale)
        const px = (n: number) => `calc(${+n.toFixed(2)} * var(--px))`
        img.style.width = px(width)
        img.style.height = px(height)
        img.style.left = px(ART.CENTER_X - width / 2)
        img.style.top = px(ART.CENTER_Y - height / 2)
        img.hidden = false
      }
      img.addEventListener('load', place, { once: true })
      img.src = project.image
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

/** "C 99.4%", or just the name when the share isn't known. */
export const languageLabel = (l: Language): string => l.share === undefined ? l.name : `${l.name} ${l.share}%`

/** A GitHub-style bar: one coloured segment per language, as wide as its share. */
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
