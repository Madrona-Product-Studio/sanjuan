/**
 * Service worker — offline support for on-the-water use.
 * Cell coverage is spotty across the islands, so the app shell, data,
 * and last-known weather stay available without a connection.
 */

const VERSION = 'sji-v1';
const SHELL_CACHE = VERSION + '-shell';
const RUNTIME_CACHE = VERSION + '-runtime';
const TILE_CACHE = VERSION + '-tiles';

const PRECACHE_URLS = [
  '/',
  '/css/styles.css',
  '/js/app.js',
  '/js/feedback-widget.js',
  '/data/islands.js',
  '/data/marinas.js',
  '/data/activities.js',
  '/data/marine-parks.js',
  '/data/farms.js',
  '/favicon.svg',
  '/manifest.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App navigation: network-first, fall back to cached shell for offline deep links
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(hit => hit || caches.match('/'))
        )
    );
    return;
  }

  // API calls: network-first so data stays fresh; cached fallback keeps
  // last-known weather and already-viewed listings working offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Map tiles: cache-first (they never change for a given URL)
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(TILE_CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Everything else (css/js/data/fonts/CDN): stale-while-revalidate
  event.respondWith(
    caches.match(req).then(hit => {
      const refresh = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || refresh;
    })
  );
});
