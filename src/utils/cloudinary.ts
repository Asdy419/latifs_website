import { GALLERY } from '../config'

/** One photo from Cloudinary (see GALLERY in config.ts). */
export interface Photo {
  /** Cloudinary's public ID (may include folders: "trips/beach"). */
  id: string
  version: number
  format: string
  /** The original's size in px (for the full-size view's shape). */
  width: number
  height: number
  /** Written on the polaroid: the photo's Title in Cloudinary, if it has one. */
  caption: string
  /** For screen readers: its Description in Cloudinary, else the caption. */
  alt: string
  /** When it was uploaded (ISO date), for the order. */
  created: string
}

interface ListedResource {
  public_id: string
  version: number
  format: string
  width?: number
  height?: number
  created_at?: string
  context?: { custom?: { caption?: string; alt?: string } }
}

const base = () => `https://res.cloudinary.com/${encodeURIComponent(GALLERY.cloudName)}/image`

/**
 * Every photo tagged GALLERY.tag, newest first: Cloudinary's public list
 * (/image/list/<tag>.json, served from its CDN, so it can be a minute behind).
 * An empty list when nothing has the tag; throws if the list can't be read.
 */
export async function fetchPhotos(): Promise<Photo[]> {
  if (!GALLERY.cloudName) throw new Error('GALLERY.cloudName is empty (src/config.ts)')
  const res = await fetch(`${base()}/list/${encodeURIComponent(GALLERY.tag)}.json`)
  if (res.status === 404) return [] // Cloudinary's answer when no image has the tag
  if (!res.ok) {
    const hint = res.status === 401 || res.status === 403 ? ' (untick "Resource list" in Cloudinary: Settings → Security)' : ''
    throw new Error(`Cloudinary photo list: HTTP ${res.status}${hint}`)
  }
  const data = await res.json() as { resources?: ListedResource[] }
  return (data.resources ?? [])
    .map(r => {
      const caption = r.context?.custom?.caption?.trim() ?? ''
      return {
        id: r.public_id,
        version: r.version,
        format: r.format,
        width: r.width ?? 0,
        height: r.height ?? 0,
        caption,
        alt: r.context?.custom?.alt?.trim() || caption,
        created: r.created_at ?? '',
      }
    })
    .sort((a, b) => b.created.localeCompare(a.created))
}

/**
 * The photo as a `size` × `size` square, cropped around its subject (g_auto),
 * in the best format the browser takes (f_auto: AVIF/WebP) at automatic
 * quality. Resized copies carry no camera data (no GPS location).
 */
export function photoUrl(photo: Photo, size: number): string {
  return `${base()}/upload/c_fill,g_auto,w_${size},h_${size},f_auto,q_auto/${versionedPath(photo)}`
}

/**
 * The whole photo (not cropped), `width` px wide, or its own width if that's
 * smaller (c_limit never enlarges), in the best format the browser takes.
 */
export function photoFullUrl(photo: Photo, width: number): string {
  return `${base()}/upload/c_limit,w_${width},f_auto,q_auto/${versionedPath(photo)}`
}

const versionedPath = (photo: Photo) =>
  `v${photo.version}/${photo.id.split('/').map(encodeURIComponent).join('/')}.${photo.format}`
