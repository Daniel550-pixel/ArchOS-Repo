const CACHE = 'archos-v2-sovereign';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', '/index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);

  // World Model slices & state: stale-while-revalidate for sovereign offline resilience
  if (u.pathname.startsWith('/api/v1/wm')) {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request)
          .then((r) => {
            if (r.ok) {
              caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
            }
            return r;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  } else if (u.origin === location.origin) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
  }
});
