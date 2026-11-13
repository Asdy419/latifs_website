import projectsLabel from './assets/menu/projects_txt.png'
import aboutLabel from './assets/menu/about_me_txt.png'
import socialsLabel from './assets/menu/socials_txt.png'
import galleryLabel from './assets/menu/gallery_txt.png'
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
 * `labelImage` is the pixel-art text drawn on its menu button (`label` is the
 * accessible text). `banner` is the title across the top of the page, drawn on
 * the same 2172×724 canvas as the menu's logo (see .page-banner in base.css).
 */
export const SUBPAGES = [
  { id: 'projects', label: 'Projects',      labelImage: projectsLabel, banner: projectsBanner, background: COLORS.teal },
  { id: 'about',    label: 'About me',      labelImage: aboutLabel,    banner: aboutBanner,    background: COLORS.yellow },
  { id: 'socials',  label: 'Socials',       labelImage: socialsLabel,  banner: socialsBanner,  background: COLORS.yellow },
  { id: 'gallery',  label: 'Photo Gallery', labelImage: galleryLabel,  banner: galleryBanner,  background: COLORS.yellow },
] as const

export type SubpageId = (typeof SUBPAGES)[number]['id']

export function subpage(id: SubpageId) {
  return SUBPAGES.find(p => p.id === id)!
}
