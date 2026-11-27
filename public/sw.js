// Realm of Code service worker: works offline after the first visit (network first, then
// the cache), opens the game when a reminder notification is clicked, and sends a gentle
// daily reminder where the browser supports periodic background sync.
const CACHE = 'realm-of-code-v7';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch {
      const hit = await caches.match(req, { ignoreSearch: true });
      return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    }
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window' });
    if (all.length) return all[0].focus();
    return self.clients.openWindow('./');
  })());
});

self.addEventListener('periodicsync', (e) => {
  if (e.tag !== 'realm-reminder') return;
  e.waitUntil(self.registration.showNotification('Lumi misses you!', { body: 'Five minutes of learning today? Your next lesson is waiting.', icon: 'favicon.svg', tag: 'realm-reminder' }));
});
