// ─── ماژول فروش: تسویه، تخفیف مناسبت، کد تخفیف، پرداخت دمو، دانلود، وریفای ایمیل ───
import { esc, money, faNum, faDate, faDateTime, isEmail } from './util.js';
import { page } from './render.js';
import { findMany, findOne, insert, updateOne, removeOne, getDb } from './db.js';
import { csrfOk } from './auth.js';
import { APP_NAME } from './config.js';
import { effectiveOccasion } from './occasions.js';
import { generateSite, generateZipFiles } from './generator.js';
import { makeZip } from './zip.js';
import { FRAMEWORKS } from './config.js';
import { randomToken } from './security.js';
import zlib from 'node:zlib';

const fa = n => Number(n).toLocaleString('fa-IR');
const round10k = n => Math.round(n / 10000) * 10000;

// ─── قیمت مؤثر با تخفیف خودکار مناسبت ───
export function effectivePrice(p, occ) {
  if (p.salePrice) return { price: p.salePrice, occasionApplied: false };
  if (occ) return { price: round10k(p.price * (1 - occ.percent / 100)), occasionApplied: true };
  return { price: p.price, occasionApplied: false };
}

// ─── اعتبارسنجی کد تخفیف ───
export function validateCoupon(code) {
  if (!code) return { ok: false, reason: 'کد را وارد کنید.' };
  const c = findOne('coupons', x => x.code === String(code).trim().toUpperCase());
  if (!c || !c.active) return { ok: false, reason: 'کد تخفیف معتبر نیست.' };
  if (new Date(c.expiresAt) < new Date()) return { ok: false, reason: 'این کد منقضی شده است.' };
  if (c.uses >= c.maxUses) return { ok: false, reason: 'ظرفیت استفاده از این کد پر شده است.' };
  return { ok: true, coupon: c };
}

// ─── محاسبه سبد (با مناسبت + کد) ───
export function cartTotals(items, couponCode) {
  const occ = effectiveOccasion(getDb().settings);
  const rows = items.map(p => ({ p, ...effectivePrice(p, occ) }));
  const subtotal = rows.reduce((s, r) => s + r.price, 0);
  const occAny = rows.some(r => r.occasionApplied);
  const cv = couponCode ? validateCoupon(couponCode) : { ok: false };
  let discount = 0, coupon = null;
  if (cv.ok) {
    coupon = cv.coupon;
    discount = coupon.type === 'percent' ? round10k(subtotal * coupon.value / 100) : Math.min(coupon.value, subtotal);
  }
  return { occ, occAny, rows, subtotal, discount, coupon, total: Math.max(0, subtotal - discount) };
}

// ─── صفحه تسویه ───
export function renderCheckout(req, res, ctx) {
  const { user, csrf, baseUrl, query } = ctx;
  const ids = (query.items || '').split(',').map(x => parseInt(x, 10)).filter(Boolean);
  const products = ids.length
    ? ids.map(id => findOne('products', p => p.id === id && p.published)).filter(Boolean)
    : [];
  if (!products.length) {
    const body = `<div class="container section"><div class="card empty-state"><div class="ic">🛒</div><p>سبد خرید شما خالی است.</p><a class="btn" style="margin-top:16px" href="/templates">مشاهده قالب‌ها</a></div></div>`;
    return page({ user, csrf, title: `تسویه حساب | ${APP_NAME}`, desc: 'تسویه خرید', body, noindex: true });
  }

  const couponCode = (query.coupon || '').trim();
  const t = cartTotals(products, couponCode);
  const couponErr = couponCode && !t.coupon ? (validateCoupon(couponCode).reason || 'کد نامعتبر است.') : '';
  const gatewayErr = query.err === 'gateway' ? 'اتصال به درگاه پرداخت ناموفق بود؛ لطفاً دوباره تلاش کنید.' : '';
  const itemsStr = products.map(p => p.id).join(',');

  const guestBox = !user ? `
  <div class="card card-pad guest-promo">
    <div class="flex" style="align-items:flex-start">
      <div class="gp-icon">🎁</div>
      <div class="grow">
        <b>اولین خریدت هست؟ ثبت‌نام کن و تخفیف ویژه بگیر!</b>
        <p class="muted small" style="margin-top:4px">با ثبت‌نام رایگان، کد تخفیف <kbd class="code">WELCOME10</kbd> برای شما فعال می‌شود (۱۰٪ کاهش همین خرید) + دسترسی به تخفیف‌های ویژه اعضا.</p>
        <div class="flex" style="margin-top:10px">
          <a class="btn sm" href="/register">ثبت‌نام سریع</a>
          <a class="btn sm ghost" href="/login">ورود</a>
        </div>
      </div>
    </div>
  </div>` : '';

  const body = `
<div class="container section" style="max-width:860px">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <a href="/cart">سبد خرید</a> <span>/</span> <span>تسویه</span></nav>
  <div class="section-head"><h2>تسویه خرید</h2></div>
  ${guestBox}
  ${t.occ && t.occAny ? `<div class="alert ok occasion-banner">${t.occ.icon} تخفیف خودکار «${esc(t.occ.label)}» روی این خرید اعمال شد (${fa(t.occ.percent)}٪) — جشنواره فعال است!</div>` : ''}
  ${couponErr ? `<div class="alert err">${esc(couponErr)}</div>` : ''}
  ${gatewayErr ? `<div class="alert err">${esc(gatewayErr)}</div>` : ''}
  ${t.coupon ? `<div class="alert ok">✓ کد تخفیف <b>${esc(t.coupon.code)}</b> اعمال شد.</div>` : ''}

  <div class="card card-pad">
    ${t.rows.map(r => `
    <div class="between checkout-row">
      <div><b>${esc(r.p.title)}</b>
        <div class="muted small">${r.occasionApplied ? `<span class="badge ok">${t.occ.icon} تخفیف مناسبت ${fa(t.occ.percent)}٪</span>` : (r.p.salePrice ? '<span class="badge warn">تخفیف‌دار</span>' : '')}</div>
      </div>
      <b>${money(r.price)}</b>
    </div>`).join('')}
    <div class="between checkout-row" style="border-top:1.5px solid var(--border)">
      <span class="muted">جمع</span><b>${money(t.subtotal)}</b>
    </div>
    ${t.discount ? `<div class="between checkout-row"><span class="muted">تخفیف کد (${esc(t.coupon.code)})</span><b style="color:var(--ok)">−${money(t.discount)}</b></div>` : ''}

    <form method="get" action="/checkout" class="coupon-form">
      <input type="hidden" name="items" value="${esc(itemsStr)}">
      <input class="input grow" name="coupon" value="${esc(couponCode)}" placeholder="کد تخفیف دارید؟ وارد کنید…" dir="ltr" style="text-align:right">
      <button class="btn soft" type="submit">اعمال کد</button>
    </form>

    <div class="between" style="margin-top:18px">
      <div><span class="muted small">قابل پرداخت</span><div class="price" style="font-size:1.35rem">${money(t.total)}</div></div>
      <form method="post" action="/checkout/pay">
        <input type="hidden" name="_csrf" value="${esc(csrf)}">
        <input type="hidden" name="items" value="${esc(itemsStr)}">
        <input type="hidden" name="couponCode" value="${t.coupon ? esc(t.coupon.code) : ''}">
        <button class="btn lg" type="submit">پرداخت و دریافت آنی</button>
      </form>
    </div>
    <p class="hint" style="margin-top:12px">🔒 پرداخت امن | دانلود بلافاصله پس از پرداخت | پشتیبانی ${APP_NAME}</p>
  </div>
</div>`;

  return page({ user, csrf, title: `تسویه خرید | ${APP_NAME}`, desc: 'تسویه خرید قالب', body, noindex: true });
}

// ─── ثبت سفارش و انتقال به درگاه ───
export function handleCheckoutPay(req, res, ctx) {
  const { user, body, session, csrf } = ctx;
  if (!csrfOk(req, session || csrf, body)) return { redirect: '/cart?err=csrf' };
  const ids = String(body.items || '').split(',').map(x => parseInt(x, 10)).filter(Boolean);
  const products = ids.map(id => findOne('products', p => p.id === id && p.published)).filter(Boolean);
  if (!products.length) return { redirect: '/cart' };

  const t = cartTotals(products, body.couponCode);
  const code = 'AT-' + (1000 + getDb().orders.reduce((m, o) => Math.max(m, Number(String(o.code).split('-')[1]) || 1000), 1000) + 1);
  const order = insert('orders', {
    code, userId: user?.id || null,
    items: products.map(p => ({ productId: p.id, price: t.rows.find(r => r.p.id === p.id).price })),
    subtotal: t.subtotal, discount: t.discount, total: t.total,
    couponCode: t.coupon?.code || null, status: 'pending', gateway: null, refId: null, paidAt: null,
  });
  if (t.coupon) updateOne('coupons', c => c.id === t.coupon.id, { uses: t.coupon.uses + 1 });
  return { redirect: `/payment/${code}` };
}

// ─── صفحه درگاه (دمو) ───
export function renderPayment(req, res, ctx) {
  const { user, csrf, order } = ctx;
  if (order.status !== 'pending') return { redirect: `/payment/${order.code}/success` };
  const body = `
<div class="container section" style="max-width:520px">
  <div class="card card-pad center">
    <div class="gateway-logo">💳</div>
    <h2 style="margin:10px 0 4px">درگاه پرداخت امن</h2>
    <p class="muted small">زرین‌پال — حالت آزمایشی (دمو)</p>
    <div class="pay-box">
      <div class="between"><span class="muted">سفارش</span><b>${esc(order.code)}</b></div>
      <div class="between"><span class="muted">مبلغ</span><b class="price" style="font-size:1.2rem">${money(order.total)}</b></div>
    </div>
    <div style="display:grid;gap:10px;margin-top:18px">
      <form method="post" action="/payment/${esc(order.code)}/confirm">
        <input type="hidden" name="_csrf" value="${esc(csrf)}">
        <button class="btn lg" style="width:100%" type="submit">پرداخت (تست موفق)</button>
      </form>
      <form method="post" action="/payment/${esc(order.code)}/cancel">
        <input type="hidden" name="_csrf" value="${esc(csrf)}">
        <button class="btn ghost" style="width:100%" type="submit">انصراف</button>
      </form>
    </div>
    <p class="hint" style="margin-top:14px">پس از اتصال مرچنت‌کد واقعی، این صفحه به‌صورت خودکار به درگاه زرین‌پال وصل می‌شود.</p>
  </div>
</div>`;
  return page({ user, csrf, title: `پرداخت سفارش ${order.code} | ${APP_NAME}`, desc: 'درگاه پرداخت', body, noindex: true });
}

export function createLicenses(order) {
  for (const it of order.items) {
    insert('licenses', { token: randomToken(16), orderId: order.id, productId: it.productId, userId: order.userId, downloads: 0, createdAt: new Date().toISOString() });
  }
}

export function handlePaymentConfirm(req, res, ctx) {
  const { order, session, csrf, body } = ctx;
  if (!csrfOk(req, session || csrf, body || {})) return { redirect: `/payment/${order.code}` };
  if (order.status !== 'pending') return { redirect: `/payment/${order.code}/success` };
  updateOne('orders', o => o.id === order.id, { status: 'paid', gateway: 'zarinpal-demo', refId: String(880000000 + order.id * 733), paidAt: new Date().toISOString() });
  const fresh = findOne('orders', o => o.id === order.id);
  createLicenses(fresh);
  return { redirect: `/payment/${order.code}/success` };
}

export function handlePaymentCancel(req, res, ctx) {
  const { order, session, csrf, body } = ctx;
  if (!csrfOk(req, session || csrf, body || {})) return { redirect: `/payment/${order.code}` };
  if (order.status === 'pending') updateOne('orders', o => o.id === order.id, { status: 'failed' });
  return { redirect: '/templates' };
}

export function renderPaymentSuccess(req, res, ctx) {
  const { user, order } = ctx;
  const licenses = findMany('licenses', l => l.orderId === order.id);
  const body = `
<div class="container section" style="max-width:620px">
  <div class="card card-pad center success-card">
    <div style="font-size:3.4rem">🎉</div>
    <h2 style="margin:8px 0 6px">پرداخت با موفقیت انجام شد!</h2>
    <p class="muted">سفارش <b>${esc(order.code)}</b> — کد پیگیری: <kbd class="code">${esc(order.refId || '—')}</kbd></p>
    <div class="dl-box">
      ${order.items.map(it => {
        const p = findOne('products', x => x.id === it.productId);
        const l = licenses.find(x => x.productId === it.productId);
        return p && l ? `<a class="btn dl-btn" href="/download/${esc(l.token)}">⬇️ دانلود «${esc(p.title)}»</a>` : '';
      }).join('')}
    </div>
    ${user
      ? '<p class="muted small">لینک‌های دانلود همیشه از <a href="/account" style="color:var(--primary)">حساب کاربری</a> هم در دسترس‌اند. 📦</p>'
      : '<p class="muted small">💡 اگر <a href="/register" style="color:var(--primary)">ثبت‌نام</a> کنید، این دانلودها در حساب کاربری‌تان آرشیو می‌شوند.</p>'}
    <a class="btn ghost" href="/templates" style="margin-top:10px">ادامه خرید</a>
  </div>
</div>`;
  return page({ user, csrf: ctx.csrf, title: `پرداخت موفق | ${APP_NAME}`, desc: 'پرداخت موفق', body, noindex: true });
}

// ─── دانلود ZIP توکن‌دار ───
export function handleDownload(req, res, token) {
  const license = findOne('licenses', l => l.token === String(token || ''));
  if (!license) return null; // 404
  const product = findOne('products', p => p.id === license.productId);
  if (!product) return null;
  updateOne('licenses', l => l.id === license.id, { downloads: license.downloads + 1, lastAt: new Date().toISOString() });
  const zip = makeZip(generateZipFiles(product, { FRAMEWORKS }));
  const heads = {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="apptheme-${product.slug}.zip"`,
  };
  if (/gzip/i.test(req.headers['accept-encoding'] || '')) {
    heads['Content-Encoding'] = 'gzip';
    res.writeHead(200, heads);
    res.end(zlib.gzipSync(zip));
  } else {
    heads['Content-Length'] = zip.length;
    res.writeHead(200, heads);
    res.end(zip);
  }
  return true;
}

// دانلود از حساب کاربری (بررسی مالکیت)
export function handleAccountDownload(req, res, ctx, productId) {
  const { user } = ctx;
  if (!user) return { redirect: '/login' };
  const license = findOne('licenses', l => l.userId === user.id && l.productId === productId) ||
                  (findOne('orders', o => o.userId === user.id && o.status === 'paid' && o.items.some(i => i.productId === productId))
                    ? findMany('licenses', l => l.productId === productId)[0] : null);
  if (!license) return { redirect: '/account?err=license' };
  return handleDownload(req, res, license.token);
}

// ─── پیش‌نمایش زنده قالب ───
export function servePreview(req, res, product) {
  const { home } = generateSite(product, { styleInline: true });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(home);
  return true;
}

// ─── وریفای ایمیل ───
export function ensureVerification(user) {
  if (user.verified) return null;
  let v = findOne('verifications', x => x.userId === user.id);
  if (!v || new Date(v.expiresAt) < new Date()) {
    if (v) removeOne('verifications', x => x.id === v.id);
    v = insert('verifications', { userId: user.id, token: randomToken(16), expiresAt: new Date(Date.now() + 48 * 3600_000).toISOString() });
  }
  return v;
}

export function sendMail(to, subject, body) {
  // در پروداکشن: ماژول SMTP از تنظیمات؛ فعلاً لاگ سرور + بازگشت لینک برای دمو
  console.log(`\n ═════════ 📧 ایمیل خروجی ═════════\n به: ${to}\n موضوع: ${subject}\n ─────────────────────────────\n ${body.split('\n').slice(0, 6).join('\n')}\n ═══════════════════════════════════\n`);
  return true;
}

export function verificationMessage(user, link) {
  return `سلام ${user.name} عزیز 👋

ایمیل شما (${user.email}) را تأیید کنید تا حساب‌تان کامل فعال شود.

لینک تأیید (۴۸ ساعت اعتبار):
${link}

اگر شما این حساب را نساخته‌اید این پیام را نادیده بگیرید.
— تیم اپ‌تم`;
}

export function handleVerifyEmail(req, res, token) {
  const v = findOne('verifications', x => x.token === String(token || ''));
  if (!v || new Date(v.expiresAt) < new Date()) {
    return { redirect: '/account?verified=0' };
  }
  updateOne('users', u => u.id === v.userId, { verified: true });
  removeOne('verifications', x => x.id === v.id);
  return { redirect: '/account?verified=1' };
}

export function handleResendVerification(req, res, ctx) {
  const { user, session, body } = ctx;
  if (!user || user.verified) return { redirect: '/account' };
  if (!csrfOk(req, session, body)) return { redirect: '/account' };
  const v = ensureVerification(user);
  const link = `${ctx.baseUrl}/verify-email?token=${v.token}`;
  sendMail(user.email, 'تأیید ایمیل — اپ‌تم', verificationMessage(user, link));
  return { redirect: '/account?resent=1' };
}

// ─── صفحه قوانین ───
export function renderTerms(req, res, ctx) {
  const { user, csrf } = ctx;
  const items = [
    ['۱. پذیرش شرایط', 'استفاده از سایت اپ‌تم به معنای پذیرش کامل این قوانین است. این قوانین ممکن است به‌روزرسانی شود؛ نسخه معتبر همان است که در این صفحه منتشر می‌شود.'],
    ['۲. حساب کاربری', 'مسئولیت حفظ رمز عبور با کاربر است. ارائه اطلاعات دقیق در ثبت‌نام الزامی است. حساب‌های تأییدنشده پس از ۷ روز به‌صورت خودکار حذف می‌شوند.'],
    ['۳. پرداخت و دانلود', 'پس از پرداخت موفق، لینک دانلود اختصاصی فعال می‌شود. مبلغ پرداخت‌شده بابت محصولات دانلودی، پس از ارائه فایل سالم، قابل بازگشت نیست مگر در صورت ایراد فنی اثبات‌شده.'],
    ['۴. مجوز استفاده', 'هر قالب فقط برای یک پروژه (شخصی یا تجاری) مجوز دارد. بازفروش، اجاره یا انتشار مجدد فایل‌ها ممنوع است و پیگرد قانونی دارد.'],
    ['۵. سفارش اپلیکیشن اختصاصی', 'مشخصات پروژه از طریق ویزارد هوشمند جمع‌آوری و پس از تایید مدیر، قیمت نهایی منصفانه (متناسب با حجم پروژه) حداکثر ظرف ۲۴ ساعت اعلام می‌شود. پرداخت در ۳ مرحله ۳۰٪ + ۳۰٪ + ۴۰٪ انجام می‌شود و پول شما نزد اپ‌تم امانت می‌ماند. در صورت انصراف در نقطه ۷۰٪، ۶۰٪ پرداختی به کیف پول بازمی‌گردد. مشتریانی که تا پایان پروژه بمانند، ۱۰٪ کل مبلغ به‌عنوان پاداش وفاداری دریافت می‌کنند و در صورت نارضایتی پس از تحویل، ۹۰٪ مبلغ پرداختی به کیف پول آن‌ها بازگردانده می‌شود.'],
    ['۶. مالکیت معنوی', 'تمام قالب‌ها متعلق به اپ‌تم یا طراحان همکار است.محتوای وارد‌شده توسط کاربران متعلق به خود آنان است.'],
    ['۷. پیام‌رسانی', 'امکان ارسال پیام به پشتیبانی از پنل کاربری فراهم است. ارسال محتوای نامناسب، تبلیغاتی یا مزاحم منجر به مسدودسازی حساب می‌شود.'],
    ['۸. کیف پول و برداشت', 'بازگشت وجه‌ها به کیف پول پروفایل کاربر واریز می‌شود. کاربر می‌تواند هر زمان از صفحه کیف پول درخواست برداشت ثبت کند؛ مبلغ خودکار به شبای ثبت‌شده او واریز می‌شود (حداقل برداشت ۱۰۰٬۰۰۰ تومان، حداکثر تا ۷۲ ساعت کاری). برداشت فقط به شبای به نام خود کاربر امکان‌پذیر است و تمام تراکنش‌ها در تاریخچه ثبت می‌شود.'],
    ['۹. محدودیت مسئولیت', 'اپ‌تم هیچ مسئولیتی در قبال خسارات غیرمستقیم ناشی از استفاده از محصولات نمی‌پذیرد. کیفیت محصولات قبل از انتشار آزمایش می‌شود.'],
    ['۱۰. تغییرات قوانین', 'حق تغییر قوانین برای اپ‌تم محفوظ است. تغییرات مهم از طریق پیام سیستمی به کاربران اعلام می‌شود.'],
  ];
  const body = `
<div class="container section" style="max-width:820px">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>قوانین و مقررات</span></nav>
  <div class="section-head"><h2>📜 قوانین و مقررات اپ‌تم</h2><span class="sub">آخرین بروزرسانی: ${faDate(Date.now())}</span></div>
  ${items.map(([t, d]) => `<div class="card card-pad term-card"><h3>${t}</h3><p class="muted" style="margin-top:8px">${d}</p></div>`).join('')}
  <div class="alert info">سوالی درباره قوانین دارید؟ از <a href="/account/messages" style="color:var(--primary)">پیام به پشتیبانی</a> بپرسید.</div>
</div>`;
  return page({ user, csrf, title: `قوانین و مقررات | ${APP_NAME}`, desc: 'قوانین و مقررات استفاده از فروشگاه قالب اپ‌تم', body });
}
