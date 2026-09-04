// ═══ Service Worker اپ‌تم — اپ موبایل نصب‌شدنی + آفلاین ═══
const VERSION = 'appteam-v3';
const CORE = [
  '/', '/offline', '/templates', '/apps',
  '/assets/css/app.css', '/assets/js/ui.js', '/assets/js/app.js', '/assets/js/cart.js', '/assets/js/apps.js',
  '/assets/fonts/Vazirmatn-Regular.woff2', '/assets/fonts/Vazirmatn-Medium.woff2', '/assets/fonts/Vazirmatn-Bold.woff2',
  '/assets/icons/icon-192.png', '/favicon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // صفحات مالی/شخصی/ادمین: فقط شبکه (امنیت)
  if (/\/(admin|account|payment|checkout|download|api\/)/.test(url.pathname)) return;

  // استاتیک: اول کش
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // صفحات: اول شبکه، جایگزین کش، در آخر آفلاین
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && req.mode === 'navigate') {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('/offline')))
  );
});
