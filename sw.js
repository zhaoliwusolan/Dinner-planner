/* 「今晚吃什么」离线缓存 Service Worker
   注意：Service Worker 只在 http(s) 下生效；直接用 file:// 打开 index.html 时本文件不会被注册。 */
const CACHE = 'dinner-planner-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      ASSETS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null))
    ))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        try {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
        } catch (err) {}
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
