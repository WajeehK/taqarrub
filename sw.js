/* Taqarrub service worker (tq-v1).
   App shell: cache-first, refreshed per build. APIs stay on the network. */
const SHELL = 'taqarrub-shell-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './style.css?v=1', './app.js?v=1',
  './data/duas.json', './data/names.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png',
  './icons/favicon.svg', './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k.startsWith('taqarrub-shell-') && k !== SHELL).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
