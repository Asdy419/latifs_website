import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import { imagetools, type TransformFactory } from 'vite-imagetools'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PROJECT_SHOT_CROPS } from './src/assets/projects/shots/crops.ts'
import { normalizeMusic } from './build/normalizeMusic.ts'

// Multi-page site: every .html file in the project root is a page.
const pages = Object.fromEntries(
  readdirSync(import.meta.dirname)
    .filter(file => file.endsWith('.html'))
    .map(file => [file.slice(0, -'.html'.length), resolve(import.meta.dirname, file)]),
)

/**
 * Tags every page shares, injected so each HTML file stays tiny:
 *  - common <head> meta/link tags
 *  - the page-transition panels already covering the screen, so the first paint
 *    continues the previous page's wipe instead of flashing the bare page
 *    (pageReveal() then slides them away). On the home page they're only shown
 *    when arriving from BACK (/#menu) — a tiny inline script checks the hash
 *    before the first paint; otherwise the title screen appears as normal.
 */
function sharedHead(): Plugin {
  const tag = (name: 'meta' | 'link', attrs: Record<string, string>): HtmlTagDescriptor =>
    ({ tag: name, attrs, injectTo: 'head' })

  const coverPanels = (extraClass = ''): HtmlTagDescriptor => ({
    tag: 'div',
    attrs: { id: 'panel-transition', class: `covering ${extraClass}`.trim() },
    children: [0, 1, 2].map(i => ({ tag: 'div', attrs: { class: `trans-panel trans-panel-${i}` } })),
    injectTo: 'body-prepend',
  })

  const homeFromPage: HtmlTagDescriptor = {
    tag: 'script',
    children: `if (location.hash === '#menu') document.documentElement.classList.add('from-page')`,
    injectTo: 'head-prepend',
  }

  // The panels' CSS goes inline in <head> (not in the bundle) so they're styled
  // in the very first paint, before any stylesheet or script loads.
  const wipeCssFile = resolve(import.meta.dirname, 'src/core/pageTransition.css')
  const wipeCss = (): HtmlTagDescriptor => ({
    tag: 'style',
    children: readFileSync(wipeCssFile, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '') // comments
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .trim(),
    injectTo: 'head',
  })

  return {
    name: 'shared-head',
    configureServer(server) {
      // not imported anywhere, so the dev server doesn't watch it by itself
      server.watcher.add(wipeCssFile)
      server.watcher.on('change', file => {
        if (resolve(file) === wipeCssFile) server.ws.send({ type: 'full-reload' })
      })
    },
    transformIndexHtml: (_html, ctx) => {
      const isHome = ctx.path === '/' || ctx.path.endsWith('/index.html')
      return [
        wipeCss(),
        ...(isHome ? [homeFromPage, coverPanels('home-cover')] : [coverPanels()]),
        tag('meta', {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
        }),
        tag('meta', { name: 'mobile-web-app-capable', content: 'yes' }),
        tag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }),
        tag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }),
        // tab / home-screen icons, made from src/assets/shared/site_icon.png
        tag('link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' }),
        tag('link', { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icons/favicon-48.png' }),
        tag('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }),
        tag('link', { rel: 'manifest', href: '/manifest.json' }),
      ]
    },
  }
}

/**
 * Every imported PNG is served as WebP (in dev and in the build), so new
 * exports dropped into src/assets are optimised automatically:
 *  - lossless (pixel-identical) for the pixel-art UI
 *  - near-lossless for the menu's logo: at most 2/255 change per channel, ~30% smaller
 *  - high-quality lossy for the sub-page title banners (any *_banner.png): their
 *    soft, noisy edges barely compress losslessly (~360 KB each), while quality 92
 *    is ~75 KB and looks the same at the size they're shown (a mean change of
 *    under 1/255 at 1080p); only 1px edge highlights soften, and only at full zoom.
 *    The same goes for photo-like project pictures (LOSSY_SHOTS: X-rays, a 3D
 *    render, a photographed sketch, a dense dot graph, a map of thin lines), 50-85%
 *    smaller; diagrams, slides and flat-colour figures stay lossless, for crisp text.
 * The source PNGs are never modified.
 */
const NEAR_LOSSLESS = /\/menu_logo\.png$/
const LOSSY_SHOTS = [
  'tsp_pso_swarm.png', 'bitcoin_voronoi.png', 'mars_speed_sketch.png', 'horses_samples.png',
  'clash_title.png', 'clash_menu.png', 'clash_stage.png',
  'xray_restored.png', 'xray_geometry.png', 'xray_inpaint.png',
]
const LOSSY = new RegExp(`/\\w+_banner\\.png$|/shots/(${LOSSY_SHOTS.map(n => n.replace('.', '\\.')).join('|')})$`)

// imagetools has no near-lossless option, so add one: `?nearLossless=<quality>`
const nearLossless: TransformFactory = config => {
  if (!config.nearLossless) return undefined
  return (_state, image) =>
    image.webp({ nearLossless: true, quality: Number(config.nearLossless), effort: 6 })
}

// …and lossy with the alpha kept exact (crisp cut-out edges): `?lossyArt=<quality>`
const lossyArt: TransformFactory = config => {
  if (!config.lossyArt) return undefined
  return (_state, image) =>
    image.webp({ quality: Number(config.lossyArt), alphaQuality: 100, smartSubsample: true, effort: 6 })
}

/**
 * The project boxes' pictures (assets/projects/container_imgs/), so they all
 * look the same size and sit the same way (ProjectCard draws every one with
 * about the same area, centred):
 *  - cropped to their visible pixels: exports come with very different
 *    transparent margins (none to a third of the canvas). Only pixels at most
 *    CARD_ART_ALPHA (3%) opaque are cut: background-removal dust, invisible.
 *  - scaled down to at most CARD_ART_MAX px: a picture is drawn at most ~70 art
 *    px (~630 px on a 4K screen), and the originals reach 3000 × 3000 (a 36 MB
 *    bitmap on a phone, for each one).
 * Scaled pictures are saved lossy at high quality with exact alpha (they've
 * been resampled anyway; lossless they were up to ~780 KB each); the others
 * stay lossless, pixel for pixel. The source PNGs are never modified.
 */
const CARD_ART = /\/assets\/projects\/container_imgs\/[^/]+\.png$/
const CARD_ART_MAX = 640
const CARD_ART_ALPHA = 8
/** Pipelines whose picture cardArt scaled down (so cardArtEncode saves them lossy). */
const scaledCardArt = new WeakSet<object>()

const cardArt: TransformFactory = config => {
  if (!config.cardArt) return undefined
  return async (state, image) => {
    const { data, info } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width: w, height: h, channels } = info
    let left = w, top = h, right = -1, bottom = -1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * channels + channels - 1] <= CARD_ART_ALPHA) continue
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
    if (right < 0) return image // nothing visible: leave it alone
    const width = right - left + 1
    const height = bottom - top + 1
    let out = width === w && height === h ? image : image.extract({ left, top, width, height })
    let size = { width, height }
    const scale = CARD_ART_MAX / Math.max(width, height)
    if (scale < 1) {
      size = { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
      out = out.resize({ ...size, kernel: 'lanczos3' }) // sharp premultiplies alpha, so no dark fringes
      scaledCardArt.add(state)
    }
    state.info.width = size.width
    state.info.height = size.height
    state.info.autoOriented = size
    return out
  }
}

const cardArtEncode: TransformFactory = config => {
  if (!config.cardArt) return undefined
  return (state, image) => scaledCardArt.has(state)
    ? image.webp({ quality: 90, alphaQuality: 100, smartSubsample: true, effort: 6 })
    : image.webp({ lossless: true, effort: 6 })
}

/** Apply the curated screenshot crops before encoding, in both dev and production. */
const cropProjectShot: TransformFactory = config => {
  if (!config.projectShotCrop) return undefined
  const [left, top, width, height] = config.projectShotCrop.split('_').map(Number)
  const crop = { left, top, width, height }
  return (state, image) => {
    state.info.width = crop.width
    state.info.height = crop.height
    state.info.autoOriented = { width: crop.width, height: crop.height }
    return image.extract(crop)
  }
}

function imageDirectives(url: URL): URLSearchParams {
  if (url.searchParams.size > 0) return new URLSearchParams() // explicit directives win
  const shotName = url.pathname.split('/').at(-1) ?? ''
  if (url.pathname.includes('/assets/projects/shots/') && PROJECT_SHOT_CROPS[shotName]) {
    const { left, top, width, height } = PROJECT_SHOT_CROPS[shotName]
    // Include the coordinates in the cache key so crop edits regenerate the asset.
    return new URLSearchParams({
      format: 'webp', lossless: 'true', effort: '6',
      projectShotCrop: [left, top, width, height].join('_'),
    })
  }
  // The version is part of imagetools' cache key: bump it whenever cardArt or
  // cardArtEncode change, or stale copies keep being served (v1 entries were
  // cached by a dev server that restarted mid-edit, before cardArt existed).
  if (CARD_ART.test(url.pathname)) return new URLSearchParams({ format: 'webp', cardArt: 'v2' })
  if (NEAR_LOSSLESS.test(url.pathname)) return new URLSearchParams({ format: 'webp', nearLossless: '60' })
  if (LOSSY.test(url.pathname)) return new URLSearchParams({ format: 'webp', lossyArt: '92' })
  return new URLSearchParams({ format: 'webp', lossless: 'true', effort: '6' })
}

/**
 * Drops the ID3v2 tag (title, artist, cover art…) from the front of every MP3
 * in the build. The site never reads it, and YouTube downloads often carry a
 * ~200 KB cover image. Only the tag is removed, so the audio frames are untouched.
 * Source files aren't modified.
 */
function stripMp3Tags(): Plugin {
  return {
    name: 'strip-mp3-tags',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.mp3') || typeof file.source === 'string') continue
        const src = file.source
        if (src[0] !== 0x49 || src[1] !== 0x44 || src[2] !== 0x33) continue // no "ID3" tag
        // tag size: 4 "syncsafe" bytes (7 bits each), plus 10-byte header and optional footer
        const size = ((src[6] & 0x7f) << 21) | ((src[7] & 0x7f) << 14) | ((src[8] & 0x7f) << 7) | (src[9] & 0x7f)
        const footer = src[5] & 0x10 ? 10 : 0
        file.source = src.subarray(10 + size + footer)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    sharedHead(),
    normalizeMusic(),
    stripMp3Tags(),
    imagetools({
      include: '**/*.png',
      removeMetadata: true,
      defaultDirectives: imageDirectives,
      extendTransforms: builtins => [cropProjectShot, cardArt, ...builtins, nearLossless, lossyArt, cardArtEncode],
    }),
  ],
  build: {
    rollupOptions: { input: pages },
  },
})
