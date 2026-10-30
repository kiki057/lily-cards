// Lily Card Voyage — offline-first.
// The whole game is these files. They are saved on first open and the game always
// starts from the saved copy (instant, works in airplane mode or on weak Wi-Fi).
// When there is internet, a fresh copy is fetched quietly in the background and
// used the next time the app opens.
const V = 'lily-cards-v6';
const FILES = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;                 // question sheet etc.: network only, the game copes without it
  const isPage = req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  const key = isPage ? './index.html' : req;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const hit = await cache.match(key, { ignoreSearch: true });
    const refresh = fetch(req, { cache: 'no-store' }).then(r => {
      if (r && r.ok) cache.put(key, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(refresh); return hit; }            // saved copy right away, update in background
    const r = await refresh;                                   // nothing saved yet: need the network once
    return r || new Response('Lily Card Voyage needs internet the very first time it opens.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
