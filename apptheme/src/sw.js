// ═══ Service Worker اپ‌تم — نسخه ۲: کش نسخه‌دار + بازبینی پس‌زمینه ═══
// ⚠️ اصلاح ریشه‌ای «دو بار رفرش»: نسخهٔ کش عوض می‌شود تا کش کهنهٔ مرورگر
//    پاک شود؛ فایل‌های استاتیک: اول کش (سریع) + همیشه بازبینی در پس‌زمینه
//    (دیگر هرگز CSS/JS کهنه سرور نمی‌شود)؛ صفحات: اول شبکه.
const VERSION = 'apptheme-v2';
const CORE = [
  '/', '/templates', '/apps',
  '/assets/css/app.css', '/assets/js/ui.js', '/assets/js/app.js', '/assets/js/catalog.js', '/assets/js/apps.js',
  '/assets/fonts/Vazirmatn-Regular.woff2', '/assets/fonts/Vazirmatn-Medium.woff2', '/assets/fonts/Vazirmatn-Bold.woff2',
  '/assets/icons/icon-192.png', '/favicon.svg',
];

self.addEventListener('install', e => {
  // نصب مدارا: اگر یکی از فایل‌ها خطا بدهد کل نصب از بین نمی‌رود
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.allSettled(CORE.map(url => c.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // صفحات مالی/شخصی/ادمین/API: فقط شبکه (امنیت)
  if (/\/(admin|account|payment|checkout|download|api\/)/.test(url.pathname)) return;

  // استاتیک: اول کش + بازبینی در پس‌زمینه (stale-while-revalidate)
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith((async () => {
      const cached = await caches.match(req);
      const fresh = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => null);
      if (cached) { fresh; return cached; }
      const net = await fresh;
      if (net) return net;
      return new Response('', { status: 504 });
    })());
    return;
  }

  // صفحات: اول شبکه، بعد کش، در آخر صفحهٔ آفلاین
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok && req.mode === 'navigate') {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('/offline')))
  );
});
