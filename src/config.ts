import projectsBanner from './assets/projects/projects_banner.png'
import aboutBanner from './assets/about/about_me_banner.png'
import socialsBanner from './assets/socials/socials_banner.png'
import galleryBanner from './assets/gallery/photo_gallery_banner.png'

/** Site-wide colours. --yellow and --blue in styles/base.css must match these. */
export const COLORS = {
  yellow: '#efc400',
  blue:   '#0066ff',
  teal:   '#31aac6',
} as const

/**
 * Sub-pages reachable from the main menu, in menu order.
 * Each one needs `<id>.html` in the project root and `src/pages/<id>.ts`.
 * `label` is the text on its menu button, drawn in the menu's pixel font
 * (utils/menuFont.ts: A–Z, 0–9, some punctuation). `banner` is the title across
 * the top of the page, drawn on the same 2172×724 canvas as the menu's logo
 * (see .page-banner in base.css).
 */
export const SUBPAGES = [
  { id: 'projects', label: 'Projects',      banner: projectsBanner, background: COLORS.teal },
  { id: 'about',    label: 'About me',      banner: aboutBanner,    background: COLORS.yellow },
  { id: 'socials',  label: 'Socials',       banner: socialsBanner,  background: COLORS.yellow },
  { id: 'gallery',  label: 'Photo Gallery', banner: galleryBanner,  background: COLORS.yellow },
] as const

export type SubpageId = (typeof SUBPAGES)[number]['id']

export function subpage(id: SubpageId) {
  return SUBPAGES.find(p => p.id === id)!
}
