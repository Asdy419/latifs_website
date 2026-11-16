import type { PixelArt } from './utils/pixelArt'
import { bustArt, cameraArt, envelopeArt, githubArt, tiktokArt } from './components/socialArt'

/** One of the user's accounts, as a box on the Socials page (SocialSelect). */
export interface Social {
  /** In the box's name strip, in the small pixel font (capitals). */
  label: string
  /** What screen readers say for the box (no handles: the site is "Latif" throughout). */
  name: string
  url: string
  /** The box's picture: pixel art drawn in code (components/socialArt.ts). */
  art: () => PixelArt
  /** Selected when the page opens. */
  first?: boolean
}

/**
 * Left to right. The user's own account has a plain bust (bustArt: the user kept it over their
 * GitHub pfp) and their name, and is selected first (the user's call: "the centre sprite", from
 * when there were three).
 */
export const SOCIALS: readonly Social[] = [
  { label: 'GITHUB', name: 'Latif on GitHub', url: 'https://github.com/Asdy419', art: githubArt },
  { label: 'LATIF', name: 'Latif on Instagram', url: 'https://www.instagram.com/ahmedlatif.4/', art: bustArt, first: true },
  { label: "LATIF'S LENS", name: "Latif's Lens, photography on Instagram", url: 'https://www.instagram.com/latifs.lens/', art: cameraArt },
  { label: 'TIKTOK', name: 'Latif on TikTok', url: 'https://www.tiktok.com/@lordasdy', art: tiktokArt },
  // (the user's email, on the site at their request)
  { label: 'EMAIL', name: 'Email Latif', url: 'mailto:ahmedlatif261@gmail.com', art: envelopeArt },
]
