import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import { imagetools, type TransformFactory } from 'vite-imagetools'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

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

  return {
    name: 'shared-head',
    transformIndexHtml: (_html, ctx) => {
      const isHome = ctx.path === '/' || ctx.path.endsWith('/index.html')
      return [
        ...(isHome ? [homeFromPage, coverPanels('home-cover')] : [coverPanels()]),
        tag('meta', {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
        }),
        tag('meta', { name: 'mobile-web-app-capable', content: 'yes' }),
        tag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }),
        tag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }),
        tag('link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }),
        tag('link', { rel: 'manifest', href: '/manifest.json' }),
      ]
    },
  }
}

/**
 * Every imported PNG is served as WebP (in dev and in the build), so new
 * exports dropped into src/assets are optimised automatically:
 *  - lossless (pixel-identical) for the pixel-art UI
 *  - near-lossless for the big banners — at most 2/255 change per channel, ~30% smaller
 * The source PNGs are never modified.
 */
const NEAR_LOSSLESS = /\/(menu_logo|projects)\.png$/

// imagetools has no near-lossless option, so add one: `?nearLossless=<quality>`
const nearLossless: TransformFactory = config => {
  if (!config.nearLossless) return undefined
  return (_state, image) =>
    image.webp({ nearLossless: true, quality: Number(config.nearLossless), effort: 6 })
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
      defaultDirectives: url => {
        if (url.searchParams.size > 0) return new URLSearchParams() // explicit directives win
        return NEAR_LOSSLESS.test(url.pathname)
          ? new URLSearchParams({ format: 'webp', nearLossless: '60' })
          : new URLSearchParams({ format: 'webp', lossless: 'true', effort: '6' })
      },
      extendTransforms: builtins => [...builtins, nearLossless],
    }),
  ],
  build: {
    rollupOptions: { input: pages },
  },
})
