import projectsBanner from './assets/projects/projects_banner.png'
import aboutBanner from './assets/about/about_me_banner.png'
import socialsBanner from './assets/socials/socials_banner.png'
import galleryBanner from './assets/gallery/photo_gallery_banner.png'

/**
 * The Photo Gallery shows every image in this Cloudinary account tagged `tag`,
 * newest first. It reads Cloudinary's public list (no API key: in Cloudinary,
 * Settings → Security → "Restricted media types", "Resource list" must be
 * unticked). Never put the API key or secret here: this repo is public.
 */
export const GALLERY = {
  cloudName: 'jt1dcrqu',
  tag: 'gallery',
} as const

/** Site-wide colours. --yellow and --blue in styles/base.css must match these. */
export const COLORS = {
  yellow: '#efc400',
  blue:   '#0066ff',
  teal:   '#31aac6',
  green:  '#4ad39c',
} as const

/**
 * Ring colours (CircleAnimation) on the green pages: the menu's green ring
 * (#52dba5) all but disappears on COLORS.green, so it's a light mint there.
 */
export const GREEN_PAGE_RINGS = ['#b4f5d8', '#f77129'] as const

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
  { id: 'about',    label: 'About me',      banner: aboutBanner,    background: COLORS.green },
  { id: 'socials',  label: 'Socials',       banner: socialsBanner,  background: COLORS.green },
  { id: 'gallery',  label: 'Photo Gallery', banner: galleryBanner,  background: COLORS.yellow },
] as const

export type SubpageId = (typeof SUBPAGES)[number]['id']

export function subpage(id: SubpageId) {
  return SUBPAGES.find(p => p.id === id)!
}
