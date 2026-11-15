import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import { imagetools, type TransformFactory } from 'vite-imagetools'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PROJECT_SHOT_CROPS } from './src/assets/projects/shots/crops.ts'

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
 *    under 1/255 at 1080p); only 1px edge highlights soften, and only at full zoom
 * The source PNGs are never modified.
 */
const NEAR_LOSSLESS = /\/menu_logo\.png$/
const LOSSY = /\/\w+_banner\.png$/

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
    stripMp3Tags(),
    imagetools({
      include: '**/*.png',
      removeMetadata: true,
      defaultDirectives: imageDirectives,
      extendTransforms: builtins => [cropProjectShot, ...builtins, nearLossless, lossyArt],
    }),
  ],
  build: {
    rollupOptions: { input: pages },
  },
})
