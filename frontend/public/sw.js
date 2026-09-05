const CACHE_NAME = 'expensemate-cache-v2';
const urlsToCache = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Always fetch the app shell and code from the network first, so a new
  // deploy is picked up immediately instead of serving a stale cached
  // index.html that points at JS/CSS files which no longer exist.
  if (request.mode === 'navigate' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Static, rarely-changing assets: cache-first, falling back to network.
  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  );
});
