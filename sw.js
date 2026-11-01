// Offline support: cache the built app so it works without a connection.
// scripts/build.mjs fills in VERSION (a hash of the built files) and FILES.
const PREFIX = 'early-reader-';
const VERSION = `${PREFIX}dev`;
const FILES = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      // Only remove this app's old caches; other apps on the same site keep theirs.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network first, so updates show up when online; cache when offline.
// Only good responses are cached, and an error response never replaces a cached file.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await fetch(e.request);
        if (res.ok) {
          cache.put(e.request, res.clone());
          return res;
        }
        return (await cache.match(e.request, { ignoreSearch: true })) || res;
      } catch {
        return (await cache.match(e.request, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
      }
    })(),
  );
});
