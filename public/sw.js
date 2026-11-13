// Bump this when the caching strategy changes so old caches get cleared.
const CACHE = 'portfolio-v2'

self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['/']))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Vite gives built files content-hashed names (/assets/logo-a1b2c3.png), so a
// given URL never changes — serve those straight from cache, no re-download.
const isImmutable = url => url.pathname.startsWith('/assets/')

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)

  // Only handle same-origin GETs. Range requests (video streaming) go straight
  // to the network: partial (206) responses can't be stored in the cache.
  if (req.method !== 'GET' || url.origin !== self.location.origin || req.headers.has('range')) return

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req)
      if (cached && isImmutable(url)) return cached

      const fresh = fetch(req).then(res => {
        // Clone synchronously — once the page starts reading the body it's too late.
        if (res.status === 200) cache.put(req, res.clone()).catch(() => {})
        return res
      })

      if (cached) {
        // Serve the cached copy now, refresh it in the background for next time.
        e.waitUntil(fresh.catch(() => {}))
        return cached
      }
      return fresh
    })
  )
})
