// ═══════════════════════════════════════════════════════════
//  اپ‌تم (apptheme.ir) — فروشگاه قالب + سفارش اپ | سرور اصلی
//  Node.js خالص، بدون هیچ وابستگی خارجی
// ═══════════════════════════════════════════════════════════
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { PORT, HOST, BODY_LIMIT, UPLOAD_LIMIT, SITE_URL } from './src/config.js';
import { loadDb, getDb, findOne, persist, dbSyncInit } from './src/db.js';
import { getSessionUser, anonCsrf, csrfOk } from './src/auth.js';
import { securityHeaders, rateLimit } from './src/security.js';
import * as pub from './src/routes/public.js';
import * as api from './src/routes/api.js';
import * as admin from './src/routes/admin.js';
import * as aiadmin from './src/aiadmin.js';
import { userStudioPage, apiUserBuild, apiUserRework, apiUserSubscribe, proState } from './src/proai.js';
import { makeZip } from './src/zip.js';
import { buildFromUrl } from './src/sitegen.js';
import { convertTemplate } from './src/converter.js';
import { randomToken } from './src/security.js';

import * as shop from './src/shop.js';
import * as apporder from './src/apporder.js';
import * as account from './src/routes/account.js';
import * as wallet from './src/wallet.js';
import { gatewayConfig, zarinpalRequest, zarinpalVerify } from './src/gateway.js';
import { readCart, writeCart, cartAdd, cartJson } from './src/cart.js';
import { githubStart, githubCallback, googleStart, googleCallback, telegramVerify, telegramLogin, oauthConfig } from './src/oauth.js';
import { createLicenses } from './src/shop.js';
import { OFFLINE_HTML } from './src/offline.js';
import * as renderMod from './src/render.js';

await dbSyncInit(); // اگر هاست دیسک موقت دارد، ابتدا از گیت‌هاب بازیابی کن
loadDb();

// ─── حذف خودکار حساب‌های تأییدنشده (هر ساعت) ───
setInterval(() => {
  const n = api.purgeUnverified();
  if (n) console.log(`[purge] ${n} حساب تأییدنشده حذف شد.`);
}, 3600_000).unref();

// ─── ابزار پاسخ ───
function send(req, res, code, html) {
  const buf = Buffer.isBuffer(html) ? html : Buffer.from(html);
  const heads = { 'Content-Type': 'text/html; charset=utf-8' };
  if (buf.length > 900 && /gzip/i.test(req.headers['accept-encoding'] || '')) {
    heads['Content-Encoding'] = 'gzip';
    res.writeHead(code, heads);
    return res.end(zlib.gzipSync(buf));
  }
  heads['Content-Length'] = buf.length;
  res.writeHead(code, heads);
  res.end(buf);
}
function redirect(res, to) {
  res.writeHead(302, { Location: to });
  res.end();
}
function notFoundPage() {
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>۴۰۴ — صفحه پیدا نشد</title><link rel="stylesheet" href="/assets/css/app.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml"></head><body>
<div class="bg-fx" aria-hidden="true"></div>
<div class="auth-wrap"><div class="card auth-card center"><div style="font-size:3.4rem;filter:drop-shadow(0 0 22px rgba(124,92,255,.5))">🧭</div><h1 style="justify-content:center">صفحه پیدا نشد!</h1><p class="sub">آدرسی که دنبالش هستید وجود ندارد یا جابه‌جا شده.</p><div style="display:grid;gap:10px"><a class="btn" href="/">بازگشت به خانه</a><a class="btn ghost" href="/templates">مشاهده قالب‌ها</a></div></div></div></body></html>`;
}
const errPage = () => `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>خطای سرور</title><link rel="stylesheet" href="/assets/css/app.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml"></head><body>
<div class="bg-fx" aria-hidden="true"></div>
<div class="auth-wrap"><div class="card auth-card center"><div style="font-size:3.4rem;filter:drop-shadow(0 0 22px rgba(251,113,133,.5))">⚠️</div><h1 style="justify-content:center">خطای غیرمنتظره</h1><p class="sub">مشکلی پیش آمد؛ دوباره تلاش کنید.</p><a class="btn" href="/">بازگشت</a></div></div></body></html>`;

// ─── بدنه درخواست ───
function readBody(req, { raw = false } = {}) {
  return new Promise((resolve, reject) => {
    const limit = raw ? UPLOAD_LIMIT : BODY_LIMIT;
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('body-too-large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (raw) { resolve(buf) ; return; } // آپلود باینری (ZIP)
      const type = (req.headers['content-type'] || '').split(';')[0].trim();
      const rawStr = buf.toString('utf8');
      try {
        if (type === 'application/json') resolve(JSON.parse(rawStr || '{}'));
        else if (type === 'application/x-www-form-urlencoded') resolve(Object.fromEntries(new URLSearchParams(rawStr)));
        else resolve({});
      } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}


// ─── ذخیرهٔ خروجیهای استودیو روی دیسک (data/ai-builds) — برای ZIPهای بزرگ ───
const __dir = path.dirname(fileURLToPath(import.meta.url));
const AI_BUILDS_DIR = path.join(__dir, 'data', 'ai-builds');
function saveAiBuild(token, buf) {
  try { fs.mkdirSync(AI_BUILDS_DIR, { recursive: true }); fs.writeFileSync(path.join(AI_BUILDS_DIR, token + '.zip'), buf); } catch (e) { console.error('saveAiBuild:', e.message); }
}
function readAiBuild(token) { try { return fs.readFileSync(path.join(AI_BUILDS_DIR, token + '.zip')); } catch { return null; } }

// ─── استاتیک ───
const MIME = {
  '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip',
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, 'src', 'assets');
function serveAsset(req, res, pathname) {
  const rel = pathname.replace(/^\/assets\//, '');
  const file = path.normalize(path.join(ASSETS_DIR, rel));
  if (!file.startsWith(ASSETS_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  const ctype = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const gz = /gzip/i.test(req.headers['accept-encoding'] || '') && /css|javascript|json|svg|font/.test(ctype) && !/woff2/.test(ctype);
  const heads = { 'Content-Type': ctype, 'Cache-Control': 'public, max-age=300' };
  if (gz) heads['Content-Encoding'] = 'gzip';
  res.writeHead(200, heads);
  if (gz) fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
  else fs.createReadStream(file).pipe(res);
  return true;
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d5ef2"/><stop offset="1" stop-color="#9a55f7"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="44" font-size="34" text-anchor="middle" fill="#fff" font-family="Vazirmatn,Tahoma" font-weight="bold">پ</text></svg>`;

// ═══ سرور ═══
const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const requestId = Math.random().toString(36).slice(2, 8);
  res.setHeader('X-Request-ID', requestId);
  let pathname = '/', query = {};
  try {
    const u = new URL(req.url, 'http://internal');
    pathname = decodeURIComponent(u.pathname);
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1); // برابرسازی اسلش انتهایی
    query = Object.fromEntries(u.searchParams);
  } catch {
    return send(req, res, 400, notFoundPage());
  }

  const isHttps = (req.headers['x-forwarded-proto'] || '') === 'https';
  securityHeaders(res, isHttps);
  const { user, session } = getSessionUser(req);
  const csrf = session?.csrf || anonCsrf(req, res, isHttps);
  const baseUrl = SITE_URL || `${isHttps ? 'https' : 'http'}://${req.headers.host || 'localhost'}`;
  const cart = readCart(req);
  const ctx = { user, session, csrf, baseUrl, query, isHttps, cart };
  if (user && user.role === 'admin') user.__csrf = csrf; // برای فرم‌های ادمین

  const finish = (code, html) => {
    if (!res.headersSent) res.setHeader('X-Request-ID', requestId);
    send(req, res, code, html);
    console.log(`${requestId} ${req.method} ${pathname} → ${code} (${Date.now() - started}ms)`);
  };
  const handle = result => {
    if (!result) return finish(404, notFoundPage());
    if (result.redirect) return redirect(res, result.redirect);
    if (result.json !== undefined) {
      res.writeHead(result.code || 200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(result.json));
    }
    if (result.render !== undefined) return finish(200, result.render);
    return finish(200, String(result));
  };

  try {
    // ─── استاتیک و متا ───
    if (pathname.startsWith('/assets/')) {
      if (serveAsset(req, res, pathname)) return;
      return finish(404, notFoundPage());
    }
    if (pathname === '/favicon.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
      return res.end(FAVICON);
    }
    if (pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /cart\nDisallow: /checkout\nDisallow: /payment\nSitemap: ${baseUrl}/sitemap.xml\n`);
    }
    if (pathname === '/sitemap.xml') {
      const products = getDb().products.filter(p => p.published);
      const urls = ['', '/templates', '/apps', '/ai', '/terms', ...products.map(p => `/templates/${encodeURIComponent(p.slug)}`)];
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x => `<url><loc>${baseUrl}${x}</loc><changefreq>weekly</changefreq></url>`).join('\n')}\n</urlset>`);
    }
    if (pathname === '/api/health') return api.health(req, res);

    // ─── PWA: منیفست، سرویس‌ورکر، آفلاین ───
    if (pathname === '/manifest.json') {
      res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
      return res.end(JSON.stringify({
        name: 'اپ‌تم — فروشگاه قالب و سفارش اپ', short_name: 'اپ‌تم',
        description: 'خرید قالب حرفه‌ای و سفارش ساخت اپلیکیشن با پرداخت امن',
        start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
        dir: 'rtl', lang: 'fa', background_color: '#0c0f1e', theme_color: '#6d5ef2',
        icons: [
          { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/assets/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'قالب‌ها', url: '/templates' },
          { name: 'سفارش اپ', url: '/apps' },
          { name: 'کیف پول', url: '/account/wallet' },
        ],
      }));
    }
    if (pathname === '/sw.js') {
      const sw = fs.readFileSync(path.join(ASSETS_DIR, '..', 'sw.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Service-Worker-Allowed': '/' });
      return res.end(sw);
    }
    if (pathname === '/offline') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(OFFLINE_HTML);
    }

    // ═══ POST ═══
    if (req.method === 'POST') {
      const isZipPost = (req.headers['content-type'] || '').includes('zip');
      const body = isZipPost ? {} : await readBody(req);
      ctx.body = body;
      ctx.rawBody = isZipPost ? await readBody(req, { raw: true }) : null;
      let m;

      if (pathname === '/setup') {
        if (findOne('users', u => u.role === 'admin')) return redirect(res, '/login');
        const r = api.handleSetup(req, res, ctx);
        if (r.error) return finish(200, pub.authForm({ mode: 'setup', error: r.error, csrf, baseUrl, user: null }));
        return handle(r);
      }
      if (pathname === '/auth/telegram') {
        const tg = telegramVerify(body);
        if (!tg) return redirect(res, '/login?err=oauth');
        return redirect(res, telegramLogin(res, tg, isHttps));
      }
      if (pathname === '/forgot') return handle(api.handleForgot(req, res, ctx));
      if (pathname === '/reset-password') return handle(api.handleResetPassword(req, res, ctx));
      if (pathname === '/login') {
        if ((req.headers.accept || '').includes('application/json')) {
          const r = api.handleLogin(req, res, ctx);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(r.error ? { ok: false, error: r.error } : { ok: true, redirect: r.redirect }));
          return;
        }
        const r = api.handleLogin(req, res, ctx);
        if (r.error) return finish(200, pub.authForm({ mode: 'login', error: r.error, csrf, baseUrl, user: null }));
        return handle(r);
      }
      if (pathname === '/register') {
        const r = api.handleRegister(req, res, ctx);
        if (r.error) return finish(200, pub.authForm({ mode: 'register', error: r.error, csrf, baseUrl, user: null }));
        return handle(r);
      }
      if (pathname === '/logout') return handle(api.handleLogout(req, res, ctx));
      if (pathname === '/resend-verification') return handle(shop.handleResendVerification(req, res, ctx));

      // فروشگاه
      if (pathname === '/checkout/pay') return handle(shop.handleCheckoutPay(req, res, ctx));
      if ((m = pathname.match(/^\/payment\/([A-Z0-9-]+)\/confirm$/))) {
        const order = findOne('orders', o => o.code === m[1]);
        if (!order) return finish(404, notFoundPage());
        return handle(shop.handlePaymentConfirm(req, res, { ...ctx, order }));
      }
      if ((m = pathname.match(/^\/payment\/([A-Z0-9-]+)\/cancel$/))) {
        const order = findOne('orders', o => o.code === m[1]);
        if (!order) return finish(404, notFoundPage());
        return handle(shop.handlePaymentCancel(req, res, { ...ctx, order }));
      }

      // نظرات و لایک
      if ((m = pathname.match(/^\/templates\/([^/]+)\/comment$/))) {
        const product = findOne('products', p => p.slug === m[1] && p.published);
        if (!product) return finish(404, notFoundPage());
        return redirect(res, api.handleComment(req, res, { ...ctx, product }).redirect);
      }
      if ((m = pathname.match(/^\/api\/products\/(\d+)\/like$/))) return api.handleLike(req, res, { ...ctx, productId: parseInt(m[1], 10) });

      // سفارش اپ
      if (pathname === '/api/apps/estimate') {
        if (!rateLimit(`est:${req.socket.remoteAddress}`, 30, 60_000)) return handle({ json: { ok: false, error: 'لطفاً کمی آرام‌تر!' } });
        const r = apporder.handleEstimateApi(req, res, ctx);
        return handle({ json: r.json });
      }
      if (pathname === '/apps/order') return handle(apporder.handleAppOrder(req, res, ctx));
      if (pathname === '/account/wallet/withdraw') return handle(wallet.handleWithdraw(req, res, ctx));
      if (/^\/admin\//.test(pathname) && (!user || user.role !== 'admin')) return redirect(res, '/login');
      if ((m = pathname.match(/^\/admin\/app-projects\/(\d+)\/quote$/))) return handle(apporder.handleAdminQuote(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/app-projects\/(\d+)\/reject$/))) return handle(apporder.handleAdminReject(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/withdrawals\/(\d+)\/mark$/))) return handle(wallet.handleWithdrawalMark(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/apps\/([A-Z0-9-]+)\/action$/))) {
        const project = findOne('projects', p => p.code === m[1]);
        if (!project) return finish(404, notFoundPage());
        return handle(apporder.handleAppAction(req, res, { ...ctx, project }));
      }

      // پیام‌ها
      if (pathname === '/account/messages') return handle(account.handleMessageSend(req, res, ctx));
      if (pathname === '/admin/messages/reply') {
        if (!user || user.role !== 'admin') return redirect(res, '/login');
        return handle(admin.handleAdminReply(req, res, ctx));
      }

      // ─── استودیوی پرو کاربران ───
      if (pathname === '/ai/build' || pathname === '/ai/rework' || pathname === '/ai/subscribe') {
        if (!user) return redirect(res, '/login');
        if (!csrfOk(req, session, body)) return finish(403, 'درخواست نامعتبر (CSRF)');
        if (pathname === '/ai/build') return handle(apiUserBuild(req, res, ctx));
        if (pathname === '/ai/rework') return handle(apiUserRework(req, res, ctx));
        return handle(apiUserSubscribe(req, res, ctx));
      }

      // ─── ادمین ───
      if (pathname.startsWith('/admin/') && (!user || user.role !== 'admin')) return redirect(res, '/login');
      if (pathname.startsWith('/admin/') && !csrfOk(req, session, body)) return finish(403, 'درخواست نامعتبر (CSRF)');
      if (pathname === '/admin/restore') return handle(admin.handleRestore(req, res, ctx));
      if (pathname === '/admin/purge-demo') return handle(admin.handlePurgeDemo(req, res, ctx));
      if (pathname === '/admin/generator/generate') return handle(admin.handleGenerate(req, res, ctx));
      if (pathname === '/admin/generator/publish') return handle(admin.handleGenPublish(req, res, ctx));
      // ═══ استودیوی هوش مصنوعی (POST) ═══
      if (pathname === '/admin/ai/analyze') return handle(aiadmin.apiAiAnalyze(req, res, ctx));
      if (pathname === '/admin/ai/build') return handle(aiadmin.apiAiBuild(req, res, ctx));
      if (pathname === '/admin/ai/publish') return handle(aiadmin.aiPublish(req, res, ctx));
      if (pathname === '/admin/ai/proplans') return handle(aiadmin.apiProPlansSave(req, res, ctx));
      if (pathname === '/admin/ai/rework') return handle(aiadmin.apiAiRework(req, res, ctx));
      if (pathname === '/admin/ai/linkbuild') {
        const url = String(ctx.body.url || '');
        if (!/^https?:\/\//i.test(url)) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ ok: false, error: 'لینک معتبر بده' })); }
        buildFromUrl(url).then(({ sig, main, guide, modeLabel }) => {
          const token = randomToken(20);
          const zipBuf = makeZip([
            { name: 'index.html', data: main },
            { name: 'css/style.css', data: '' },
            { name: 'راهنمای نصب (Word).docx', data: guide },
          ]);
          saveAiBuild(token, zipBuf);
          import('./src/db.js').then(({ insert }) => {
            insert('aiProducts', { token, kind: 'link', title: `وب‌سایت ${sig.brand} (الهام از لینک)`, price: 0, discount: 0, published: false, data: { spec: { brand: sig.brand, palette: sig.palette, mode: sig.mode, sourceUrl: url }, prompt: url }, createdAt: new Date().toISOString() });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, token, name: sig.brand, sizeKB: Math.round(zipBuf.length / 1024), modeLabel, palette: sig.palette, sourceUrl: url }));
          });
        }).catch(e => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'خطا در تحلیل سایت: ' + e.message }));
        });
        return;
      }
      if (pathname === '/admin/ai/convert' && (req.headers['content-type'] || '').includes('zip')) {
        Promise.resolve(ctx.rawBody || Buffer.alloc(0)).then(buf => {
          try {
            const token = randomToken(20);
            const tier = String(ctx.query.tier || 'gold');
            const target = String(ctx.query.target || '');
            const brand = String(ctx.query.brand || '');
            const prompt = String(ctx.query.prompt || '');
            const { files, spec, analysis, tier: tInfo } = convertTemplate(buf, { tierKey: tier, target, brand, prompt });
            const zipBuf = makeZip(files);
            saveAiBuild(token, zipBuf);
            import('./src/db.js').then(({ insert }) => {
              insert('aiProducts', { token, kind: 'convert', title: `قالب تبدیل‌شده ${spec.brand}`, price: tInfo.base, discount: 0, published: false, data: { spec: { brand: spec.brand, palette: analysis.palette, from: analysis.platform, to: tInfo.key }, prompt }, createdAt: new Date().toISOString() });
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, token, name: spec.brand, sizeKB: Math.round(zipBuf.length / 1024), analysis: { pages: analysis.pageCount, platform: analysis.platform, palette: analysis.palette, brand: analysis.brand }, tier: tInfo.label }));
            });
          } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        }).catch(() => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'فایل ZIP ارسال شود' })); });
        return;
      }
      if ((m = pathname.match(/^\/admin\/products\/new$/))) return handle(admin.handleProductSave(req, res, ctx));
      if ((m = pathname.match(/^\/admin\/products\/(\d+)\/edit$/))) return handle(admin.handleProductSave(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/products\/(\d+)\/delete$/))) return handle(admin.handleProductDelete(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/orders\/(\d+)\/status$/))) return handle(admin.handleOrderStatus(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/customers\/(\d+)\/toggle$/))) return handle(admin.handleCustomerToggle(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/customers\/(\d+)\/reset-pass$/))) return handle(admin.handleCustomerResetPass(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/comments\/(\d+)\/(approve|reject|delete)$/))) return handle(admin.handleCommentAction(req, res, ctx, parseInt(m[1], 10), m[2]));
      if (pathname === '/admin/coupons/new') return handle(admin.handleCouponCreate(req, res, ctx));
      if ((m = pathname.match(/^\/admin\/coupons\/(\d+)\/(toggle|delete)$/))) {
        return handle(m[2] === 'toggle' ? admin.handleCouponToggle(req, res, ctx, parseInt(m[1], 10)) : admin.handleCouponDelete(req, res, ctx, parseInt(m[1], 10)));
      }
      if ((m = pathname.match(/^\/admin\/app-projects\/(\d+)\/status$/))) return handle(admin.handleProjectStatus(req, res, ctx, parseInt(m[1], 10)));
      if ((m = pathname.match(/^\/admin\/app-projects\/(\d+)\/preview$/))) return handle(admin.handleProjectPreview(req, res, ctx, parseInt(m[1], 10)));
      if (pathname === '/admin/settings/save') return handle(admin.handleSettingsSave(req, res, ctx));

      // ═══ سبد سروری (حتی بدون جاوااسکریپت) — با محافظ CSRF ═══
      if (pathname.startsWith('/cart/') && !csrfOk(req, csrf, body)) return finish(403, 'درخواست نامعتبر (CSRF)');
      const cartJsonRes = items => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(cartJson(items))); };
      if (pathname === '/cart/add') {
        const items = cartAdd(cart, body.productId ?? body.id, body.qty);
        writeCart(res, items);
        if ((req.headers.accept || '').includes('application/json') || body.json) return cartJsonRes(items);
        return redirect(res, '/cart');
      }
      if (pathname === '/cart/remove') {
        const id = parseInt(body.productId ?? body.id, 10);
        const items = cart.filter(x => x.id !== id);
        writeCart(res, items);
        if ((req.headers.accept || '').includes('application/json') || body.json) return cartJsonRes(items);
        return redirect(res, '/cart');
      }
      if (pathname === '/cart/qty') {
        const id = parseInt(body.productId ?? body.id, 10);
        const qty = Math.max(1, Math.min(10, parseInt(body.qty, 10) || 1));
        const items = cart.map(x => x.id === id ? { ...x, qty } : x);
        writeCart(res, items);
        if ((req.headers.accept || '').includes('application/json') || body.json) return cartJsonRes(items);
        return redirect(res, '/cart');
      }
      if (pathname === '/cart/sync') { // مهاجرت یک‌باره از localStorage قدیمی
        let items = [...cart];
        for (const it of (Array.isArray(body.items) ? body.items : [])) items = cartAdd(items, it.id, it.qty ? it.qty - 1 : 0);
        writeCart(res, items);
        return cartJsonRes(items);
      }
      if (pathname === '/cart/clear') {
        writeCart(res, []);
        if ((req.headers.accept || '').includes('application/json') || body.json) return cartJsonRes([]);
        return redirect(res, '/cart');
      }

      return finish(404, notFoundPage());
    }

    // ═══ GET ═══
    if (req.method === 'GET' || req.method === 'HEAD') {
      let m;

      // عمومی
      if (pathname === '/') return finish(200, pub.home(req, res, ctx));
      if (pathname === '/setup') {
        if (findOne('users', u => u.role === 'admin')) return redirect(res, '/login');
        return finish(200, pub.authForm({ mode: 'setup', csrf, baseUrl, needsSetup: true, user: null }));
      }
      // ═══ ورود اجتماعی ═══
      const cookieState = ((req.headers.cookie || '').match(/tl_oauth_state=([a-f0-9]+)/) || [])[1];
      if (pathname === '/auth/github') return redirect(res, githubStart(req, res));
      if (pathname === '/auth/github/callback') return githubCallback(req, res, query, cookieState).then(to => redirect(res, to));
      if (pathname === '/auth/google') return redirect(res, googleStart(req, res));
      if (pathname === '/auth/google/callback') return googleCallback(req, res, query, cookieState).then(to => redirect(res, to));
      if (pathname === '/forgot') return finish(200, pub.forgotForm({ csrf, query }));
      if ((m = pathname.match(/^\/reset-password$/)) && query.token) return finish(200, pub.resetForm({ csrf, token: query.token, query }));

      if (pathname === '/login') {
        if (user) return redirect(res, user.role === 'admin' ? '/admin' : '/account');
        return finish(200, pub.authForm({ mode: 'login', csrf, baseUrl, user: null }));
      }
      if (pathname === '/register') {
        if (user) return redirect(res, '/account');
        return finish(200, pub.authForm({ mode: 'register', csrf, baseUrl, user: null }));
      }
      if (pathname === '/templates') return finish(200, pub.catalogPage(req, res, ctx));
      if ((m = pathname.match(/^\/templates\/([^/]+)\/preview$/))) {
        const product = findOne('products', p => p.slug === m[1] && p.published);
        if (!product) return finish(404, notFoundPage());
        return shop.servePreview(req, res, product);
      }
      if ((m = pathname.match(/^\/templates\/([^/]+)$/)) && m[1] !== 'preview') {
        const product = findOne('products', p => p.slug === m[1] && p.published);
        if (!product) return finish(404, notFoundPage());
        ctx.product = product;
        const ok = query.ok === 'comment' ? 'نظر شما ثبت شد و پس از تأیید مدیر منتشر می‌شود. سپاس! 🌟' : '';
        const errs = { rate: 'تلاش بیش از حد؛ کمی صبر کنید.', csrf: 'نشست منقضی شد؛ دوباره تلاش کنید.', short: 'متن نظر خیلی کوتاه است.' };
        const error = query.err ? (errs[query.err] || 'خطا در ثبت نظر') : '';
        return finish(200, pub.productPage(req, res, { ...ctx, ok, error }));
      }
      if (pathname === '/cart') return finish(200, pub.cartPage(req, res, ctx));
      if (pathname === '/cart/summary') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(cartJson(cart))); return; }
      if (pathname === '/checkout') return finish(200, shop.renderCheckout(req, res, ctx));
      if (pathname === '/payment/callback') {
        // بازگشت از زرین‌پال: Authority + Status (مبلغ از سرور خوانده می‌شود، نه از کال‌بک)
        const authority = String(query.Authority || query.authority || '');
        const status = String(query.Status || query.status || '');
        const order = findOne('orders', o => o.authority === authority && o.status === 'pending');
        if (!order) return redirect(res, '/account');
        if (status === 'OK') {
          let verified = null;
          try { verified = await zarinpalVerify(order.total, authority); } catch (e) { console.error('[zarinpal] verify exception:', e.message); }
          if (verified && verified.ok) {
            updateOne('orders', o => o.id === order.id, { status: 'paid', gateway: 'zarinpal', refId: String(verified.refId), paidAt: new Date().toISOString(), authority });
            createLicenses(findOne('orders', o => o.id === order.id));
            return redirect(res, `/payment/${order.code}/success`);
          }
        }
        updateOne('orders', o => o.id === order.id, { status: 'failed' });
        return redirect(res, `/checkout?items=${order.items.map(i => i.productId).join(',')}&err=gateway`);
      }
      if ((m = pathname.match(/^\/payment\/([A-Z0-9-]+)$/))) {
        const order = findOne('orders', o => o.code === m[1]);
        if (!order) return finish(404, notFoundPage());
        if (order.status !== 'pending') return redirect(res, `/payment/${order.code}/success`);
        const cfg = gatewayConfig();
        if (cfg.provider === 'zarinpal' && cfg.merchantId) {
          try {
            const r = await zarinpalRequest(order, baseUrl);
            if (r.ok) return redirect(res, r.redirect);
          } catch (e) { console.error('[zarinpal] request exception:', e.message); }
          return redirect(res, `/checkout?items=${order.items.map(i => i.productId).join(',')}&err=gateway`);
        }
        const r = shop.renderPayment(req, res, { ...ctx, order });
        return r.redirect ? redirect(res, r.redirect) : finish(200, r);
      }
      if ((m = pathname.match(/^\/payment\/([A-Z0-9-]+)\/success$/))) {
        const order = findOne('orders', o => o.code === m[1]);
        if (!order || order.status !== 'paid') return finish(404, notFoundPage());
        return finish(200, shop.renderPaymentSuccess(req, res, { ...ctx, order }));
      }
      if ((m = pathname.match(/^\/download\/([a-f0-9]{32})$/))) {
        if (!rateLimit(`dl:${req.socket.remoteAddress}`, 30, 60_000)) return finish(429, errPage());
        const r = shop.handleDownload(req, res, m[1]);
        if (r === true) return;
        return finish(404, notFoundPage());
      }
      if (pathname === '/admin/backup') {
        if (!user || user.role !== 'admin') return redirect(res, '/login');
        const db = getDb();
        db.meta.lastBackupAt = new Date().toISOString();
        persist();
        const data = JSON.stringify(db, null, 1);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="apptheme-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        });
        return res.end(data);
      }
      if ((m = pathname.match(/^\/account\/downloads\/(\d+)$/))) {
        const r = shop.handleAccountDownload(req, res, ctx, parseInt(m[1], 10));
        if (r && r.redirect) return redirect(res, r.redirect);
        return; // دانلود استریم شده
      }
      if (pathname === '/verify-email') return handle(shop.handleVerifyEmail(req, res, query.token));
      if (pathname === '/terms') return finish(200, shop.renderTerms(req, res, ctx));

      // سفارش اپ
      if (pathname === '/apps') return finish(200, apporder.renderAppsHome(req, res, ctx));
      if (pathname === '/ai') return finish(200, user ? userStudioPage(req, res, ctx) : pub.aiHub(req, res, ctx));
      if (pathname === '/ai/download') {
        if (!user) return redirect(res, '/login');
        const token = String(ctx.query.token || '');
        const rec = findOne('aiProducts', x => x.token === token);
        if (!rec || (rec.userId !== user.id && user.role !== 'admin')) return finish(404, notFoundPage());
        const onDisk = readAiBuild(token);
        if (onDisk) {
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="ai-build-' + token.slice(0, 8) + '.zip"' });
          return res.end(onDisk);
        }
        const r = aiadmin.apiAiDownload(req, res, { query: ctx.query });
        if (r && r.download) {
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="' + r.download.name + '"' });
          return res.end(r.download.buf);
        }
        return finish(404, 'پروژه پیدا نشد');
      }
      if ((m = pathname.match(/^\/preview\/gen\/([a-f0-9]{32})$/))) {
        const gen = findOne('generatedTemplates', g => g.token === m[1]);
        if (!gen) return finish(404, notFoundPage());
        return admin.serveGenPreview(req, res, gen);
      }
      if ((m = pathname.match(/^\/preview\/ai\/([A-Za-z0-9]+)$/))) {
        const rec = findOne('aiProducts', x => x.token === m[1]);
        if (!rec) return finish(404, notFoundPage());
        const pubProduct = rec.productId && findOne('products', p => p.id === rec.productId && p.published);
        const allowed = !!(user && (user.role === 'admin' || rec.userId === user.id)) || !!pubProduct;
        if (!allowed) return finish(403, 'دسترسی ندارید — این خروجی خصوصی شماست؛ وارد حساب خودت شو');
        // ۱) فایل preview.html از ZIP روی دیسک
        if (rec.kind !== 'template') {
          const zb = readAiBuild(rec.token);
          if (zb) {
            try {
              const { unzip } = await import('./src/zipx.js');
              const files = unzip(zb);
              const pv = files.find(f => f.name === 'preview.html' || f.name === 'index.html');
              if (pv) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(String(pv.data)); }
            } catch (e) {}
          }
        }
        if (rec.data && rec.data.full && rec.data.full.home) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(rec.data.full.home);
        }
        return finish(404, notFoundPage());
      }
      if (pathname === '/admin/ai/download') {
        const token = String(ctx.query.token || '');
        const onDisk = readAiBuild(token);
        if (onDisk) {
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="ai-build-' + token.slice(0, 8) + '.zip"' });
          return res.end(onDisk);
        }
        const r = aiadmin.apiAiDownload(req, res, { query: ctx.query });
        if (r && r.download) {
          res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="' + r.download.name + '"' });
          return res.end(r.download.buf);
        }
        return finish(404, 'پروژه پیدا نشد');
      }
      if (pathname === '/apps/wizard') {
        const r = apporder.renderAppWizard(req, res, ctx);
        if (r && r.redirect) return redirect(res, r.redirect);
        return finish(200, r);
      }
      if (pathname === '/account/wallet') {
        if (!user) return redirect(res, '/login');
        return finish(200, wallet.walletPage(req, res, ctx));
      }
      if ((m = pathname.match(/^\/apps\/track\/([A-Z0-9-]+)$/))) {
        const project = findOne('projects', p => p.code === m[1]);
        if (!project) return finish(404, notFoundPage());
        return finish(200, apporder.renderAppTrack(req, res, { ...ctx, project }));
      }

      // حساب کاربری
      if (pathname === '/account') {
        if (!user) return redirect(res, '/login');
        return finish(200, pub.accountPage(req, res, ctx));
      }
      if (pathname === '/account/messages') {
        if (!user) return redirect(res, '/login');
        return finish(200, account.messagesPage(req, res, ctx));
      }

      // ─── استودیوی هوش مصنوعی (صفحه) ───
      if (pathname === '/admin/ai-pro') {
        if (!user || user.role !== 'admin') return redirect(res, '/login');
        return finish(200, aiadmin.aiProPage(req, res, ctx));
      }
      if (pathname === '/admin/ai-studio') {
        if (!user || user.role !== 'admin') return redirect(res, '/login');
        return finish(200, aiadmin.aiStudioPage(req, res, { user }));
      }

      // ─── پنل ادمین ───
      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        if (!user || user.role !== 'admin') return redirect(res, '/login');
        if (pathname === '/admin') return finish(200, admin.dashboard(req, res, ctx));
        if (pathname === '/admin/products') return finish(200, admin.productsList(req, res, ctx));
        if (pathname === '/admin/products/new') return finish(200, admin.productForm(req, res, { user }));
        if ((m = pathname.match(/^\/admin\/products\/(\d+)\/edit$/))) {
          const product = findOne('products', p => p.id === parseInt(m[1], 10));
          if (!product) return finish(404, notFoundPage());
          return finish(200, admin.productForm(req, res, { user, product }));
        }
        if (pathname === '/admin/orders') return finish(200, admin.ordersList(req, res, ctx));
        if (pathname === '/admin/customers') return finish(200, admin.customersList(req, res, ctx));
        if (pathname === '/admin/comments') return finish(200, admin.commentsList(req, res, ctx));
        if (pathname === '/admin/coupons') return finish(200, admin.couponsList(req, res, { ...ctx, ok: query.ok ? 'کد تخفیف ساخته شد ✓' : '' }));
        if (pathname === '/admin/app-projects') return finish(200, admin.appProjectsList(req, res, ctx));
        if ((m = pathname.match(/^\/admin\/app-projects\/(\d+)$/))) {
          const project = findOne('projects', p => p.id === parseInt(m[1], 10));
          if (!project) return finish(404, notFoundPage());
          return finish(200, admin.appProjectDetail(req, res, { ...ctx, project, query }));
        }
        if (pathname === '/admin/messages') return finish(200, admin.messagesAdmin(req, res, ctx));
        if (pathname === '/admin/withdrawals') return finish(200, wallet.withdrawalsAdmin(req, res, ctx));
        if ((m = pathname.match(/^\/admin\/generator\/download\/([a-f0-9]{32})$/))) {
          const gen = findOne('generatedTemplates', g => g.token === m[1]);
          if (!gen) return finish(404, notFoundPage());
          return admin.handleGenDownload(req, res, gen);
        }
        if ((m = pathname.match(/^\/admin\/app-projects\/(\d+)\/spec\.json$/))) {
          const project = findOne('projects', p => p.id === parseInt(m[1], 10));
          if (!project) return finish(404, notFoundPage());
          const data = admin.specDownload(req, res, project);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${project.code}-spec.json"` });
          return res.end(data);
        }
        if (pathname === '/admin/settings') return finish(200, admin.settingsPage(req, res, { ...ctx, ok: query.ok ? '1' : '' }));
        if (pathname === '/admin/generator') return finish(200, admin.generatorPage(req, res, ctx));
        return finish(404, notFoundPage());
      }
    }

    return finish(404, notFoundPage());
  } catch (e) {
    console.error(`[error] ${req.method} ${pathname}:`, e);
    if (!res.headersSent) send(req, res, 500, errPage());
    else res.end();
  }
});


server.listen(PORT, HOST, () => {
  console.log(`\n🚀 اپ‌تم روی http://${HOST}:${PORT} اجرا شد`);
  console.log(`   فروشگاه: http://localhost:${PORT}/  |  ادمین: http://localhost:${PORT}/admin  |  دامنه: apptheme.ir`);
});
