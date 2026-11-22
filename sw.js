/* 树树工作台 Service Worker · 离线缓存 */
const CACHE = 'shushu-workspace-v18';
const BUST = '?v=18';
const ASSETS = [
  './',
  './index.html' + BUST,
  './manifest.json' + BUST,
  './css/style.css' + BUST,
  './js/icons.js' + BUST,
  './js/store.js' + BUST,
  './js/sync.js' + BUST,
  './js/data.js' + BUST,
  './js/summary.js' + BUST,
  './js/health-content.js' + BUST,
  './js/english-content.js' + BUST,
  './js/dict.js' + BUST,
  './js/wordcard.js' + BUST,
  './js/audio-map.js' + BUST,
  './icons/avatar-tree.png',
  './js/app.js' + BUST,
  './js/modules/home.js' + BUST,
  './js/modules/todo.js' + BUST,
  './js/modules/schedule.js' + BUST,
  './js/modules/health.js' + BUST,
  './js/modules/english.js' + BUST,
  './js/modules/diary.js' + BUST,
  './icons/tree.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 跨域请求（如 Supabase API）不缓存、不拦截，直接走网络
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // HTML 用 network-first，保证更新及时；其余静态资源 cache-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html' + BUST)))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
        return res;
      }).catch(() => cached);
    })
  );
});
