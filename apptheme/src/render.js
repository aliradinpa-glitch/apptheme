// ─── رندر سمت سرور (SSR) + سئو ───
import { esc } from './util.js';
import { APP_NAME } from './config.js';
import { findMany, getDb } from './db.js';

const BASE_CSS = '<link rel="stylesheet" href="/assets/css/app.css">';

// جلوگیری از شکستن تگ script توسط داده‌های JSON-LD
const jsonLdSafe = value => JSON.stringify(value).replace(/</g, '\u003c').replace(/>/g, '\u003e').replace(/&/g, '\u0026');

function baseHtml({ title, desc, url = '', body, extraHead = '', adminMode = false, noindex = false, jsonld = [], csrf = '' }) {
  const robots = noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">';
  const jsonldTags = jsonld.length
    ? jsonld.map(j => `<script type="application/ld+json">${jsonLdSafe(j)}</script>`).join('')
    : '';
  const csrfMeta = csrf ? `<meta name="csrf" content="${esc(csrf)}">` : '';
  const pwaMeta = adminMode ? '' : `<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0b0f24">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="اپ‌تم">
<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">`;
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${robots}
${csrfMeta}
${pwaMeta}
${url ? `<link rel="canonical" href="${esc(url)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(APP_NAME)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:locale" content="fa_IR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/Vazirmatn-Regular.woff2" as="font" type="font/woff2" crossorigin>
${adminMode ? '<link rel="stylesheet" href="/assets/css/admin.css">' : BASE_CSS}
${extraHead}
${jsonldTags}
</head>
<body${adminMode ? ' class="admin-body"' : ''}>
<div class="bg-fx" aria-hidden="true"></div>
${body}
</body>
</html>`;
}

// ═══ آیکون‌ها ═══
const I = {
  sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>',
  moon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  cart: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  install: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>',
  burger: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  bell: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  plus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  store: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l1.5-5h15L21 9M3 9h18M4 9v11h16V9M9 20v-6h6v6"/></svg>',
  exit: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  user: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
  menu: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
};

// ─── ناوبار فروشگاه ───
function navbar(user, active = '', csrf = '') {
  const link = (href, label, key, cls = '') => `<a href="${href}" class="${cls}${active === key ? ' active' : ''}">${label}</a>`;
  const authArea = user
    ? `<div class="user-chip" id="userChip" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">
        <span class="avatar">${esc((user.name || 'ا').trim().charAt(0))}</span>
        <span class="uname">${esc(user.name || 'کاربر')}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        <div class="user-menu" id="userMenu" role="menu">
          <a href="/account" role="menuitem">${I.user} حساب من</a>
          <a href="/account" role="menuitem">📦 سفارش‌ها و دانلودها</a>
          <a href="/account/wallet" role="menuitem">💳 کیف پول</a>
          <a href="/account/messages" role="menuitem">💬 پیام با پشتیبانی</a>
          ${user.role === 'admin' ? `<a href="/admin" role="menuitem">🛡️ پنل مدیریت</a>` : ''}
          <form method="post" action="/logout"><input type="hidden" name="_csrf" value="${esc(csrf || '')}"><button type="submit" role="menuitem" style="color:var(--err)">${I.exit} خروج از حساب</button></form>
        </div>
      </div>`
    : `<a class="btn sm soft" href="/forgot" data-auth="forgot" title="بازیابی رمز عبور">🔑</a>
       <a class="btn sm ghost" href="/login" data-auth="login">ورود</a>
       <a class="btn sm" href="/register" data-auth="register">ثبت‌نام ✨</a>`;
  return `
<header class="navbar">
  <div class="container inner">
    <a class="logo" href="/"><span class="mark">پ</span><span>اپ‌تم<span class="tag">بازار قالب‌های حرفه‌ای</span></span></a>
    <nav class="nav-links" id="navLinks">
      ${link('/', '🏠 خانه', 'home')}
      ${link('/templates', '🧩 قالب‌ها', 'templates')}
      ${link('/apps', '🤖 سفارش اپ اندروید', 'apps')}
      ${link('/ai', '⚡ استودیو AI', 'ai')}
      ${link('/#why', '⚡ چرا اپ‌تم؟', 'why')}
      ${link('/#comments', '💬 نظرات', 'comments')}
      ${!user ? `
      <a class="m-auth" href="/login" data-auth="login">🔑 ورود</a>
      <a class="m-auth" href="/register" data-auth="register">✨ ثبت‌نام</a>
      <a class="m-auth" href="/forgot" data-auth="forgot">فراموشی رمز</a>` : `
      <a class="m-auth" href="/account">👤 حساب کاربری</a>`}
    </nav>
    <div class="nav-actions">
      <button class="icon-btn" id="themeToggle" aria-label="تغییر تم" title="روشن/تاریک">${I.sun}</button>
      <button class="icon-btn" id="installBtn" hidden aria-label="نصب اپ موبایل" title="نصب اپ موبایل 📱">${I.install}</button>
      <a class="icon-btn" id="cartBtn" href="/cart" aria-label="سبد خرید" role="button">${I.cart}<span class="cart-count" id="cartCount" hidden>۰</span></a>
      ${authArea}
      <button class="icon-btn hamburger" id="hamburger" aria-label="منو">${I.burger}</button>
    </div>
  </div>
</header>`;
}

// ─── فوتر ───
function footer() {
  const cats = findMany('categories').slice(0, 5);
  return `
<footer>
  <div class="container inner">
    <div>
      <a class="logo" href="/"><span class="mark">پ</span>اپ‌تم</a>
      <p class="muted small" style="margin-top:14px; max-width:22rem;">بازار قالب‌های حرفه‌ای وب — خرید با اطمینان، دانلود آنی و پشتیبانی واقعی. تمام قالب‌ها راست‌چین و بهینه برای سئو هستند.</p>
      <div class="socials" style="margin-top:16px;">
        <a href="#" aria-label="تلگرام"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 15.5l-.38 5.3c.55 0 .79-.24 1.08-.52l2.6-2.48 5.38 3.94c.99.55 1.69.26 1.96-.9L23.5 4.6c.32-1.45-.52-2.02-1.48-1.66L1.7 10.9c-1.42.55-1.4 1.34-.24 1.7l5.2 1.62L18.7 6.8c.57-.38 1.09-.17.66.2L9.04 15.5z"/></svg></a>
        <a href="#" aria-label="اینستاگرام"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" stroke="none"/></svg></a>
        <a href="#" aria-label="ایکس"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.15h3.68l-8.04 9.2L24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.3 19.5h2.04L6.5 3.24H4.3z"/></svg></a>
        <a href="#" aria-label="گیت‌هاب"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.36.77 1.05.77 2.13v3.16c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg></a>
      </div>
    </div>
    <div>
      <h4>دسته‌بندی‌ها</h4>
      <ul>${cats.map(c => `<li><a href="/templates?cat=${esc(c.slug)}">${esc(c.name)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h4>دسترسی سریع</h4>
      <ul>
        <li><a href="/templates">همه قالب‌ها</a></li>
        <li><a href="/apps">سفارش اپ اندروید 🤖</a></li>
        <li><a href="/register">ثبت‌نام</a></li>
        <li><a href="/login">ورود</a></li>
        <li><a href="/account">پیگیری سفارش</a></li>
        <li><a href="/terms">قوانین سایت</a></li>
      </ul>
    </div>
    <div>
      <h4>پشتیبانی</h4>
      <ul class="muted small">
        <li>پاسخگویی: شنبه تا پنجشنبه</li>
        <li>ایمیل: support@apptheme.ir</li>
        <li>دانلود آنی پس از پرداخت</li>
        <li>به‌روزرسانی رایگان قالب‌ها</li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom container">© ${new Date().toLocaleDateString('fa-IR', { year: 'numeric' })} تمامی حقوق برای اپ‌تم محفوظ است. | ساخته‌شده با ❤ در ایران</div>
</footer>
<script src="/assets/js/ui.js" defer></script>
<script src="/assets/js/app.js" defer></script>`;
}

// ─── بنر تأیید ایمیل (اخطار همیشگی تا زمان تأیید) ───
function verifyBanner(user, csrf) {
  if (!user || user.verified || user.role === 'admin') return '';
  return `<div class="verify-banner">
    <div class="container between">
      <span>⚠️ <b>ایمیل شما تأیید نشده است.</b> طبق <a href="/terms">قوانین سایت</a>، حساب‌های تأییدنشده ۷ روز پس از ثبت‌نام حذف می‌شوند. تأیید کنید: <span class="muted small" dir="ltr">${esc(user.email)}</span></span>
      <form method="post" action="/resend-verification">
        <input type="hidden" name="_csrf" value="${esc(csrf || '')}">
        <button class="btn sm" type="submit">ارسال دوباره لینک تأیید</button>
      </form>
    </div>
  </div>`;
}

// ─── صفحه فروشگاه ───
export function page(opts) {
  const { user, active = '' } = opts;
  const body = navbar(user, active, opts.csrf) + verifyBanner(user, opts.csrf) + `<main>${opts.body}</main>` + footer() + (user ? '' : authModalHtml(opts.csrf));
  return baseHtml({ ...opts, body, csrf: opts.csrf });
}

// ═══ مودال احراز هویت «اورا» — ورود/ثبت‌نام/بازیابی رمز در یک مودال بدون رفت‌وبرگشت ═══
function authModalHtml(csrf) {
  const o = (getDb().settings.oauth) || {};
  const gh = o.githubId && o.githubSecret, gg = o.googleId && o.googleSecret, tg = o.telegramBot && o.telegramToken;
  const ob = (on, href, label, setupKey) => on
    ? `<a class="oauth-btn" href="${href}">${label}</a>`
    : `<a class="oauth-btn off" href="/login" data-needs-setup="${setupKey}">${label}</a>`;
  return `
<div id="authModal" class="tl-wrap" hidden>
  <div class="tl-ov" data-close-auth></div>
  <div class="tl-box auth-box">
    <button class="auth-x" type="button" data-close-auth aria-label="بستن">×</button>

    <div class="auth-grid">
      <!-- پنل برند -->
      <div class="auth-brand">
        <div class="ab-orb o1"></div><div class="ab-orb o2"></div><div class="ab-orb o3"></div>
        <div class="ab-inner">
          <div class="logo"><span class="mark">پ</span>اپ‌تم</div>
          <h3>حرفه‌ای‌ترین بازار قالب‌های وب</h3>
          <ul class="ab-feats">
            <li><span>⚡</span> دانلود آنی پس از پرداخت</li>
            <li><span>🛡️</span> پرداخت امن با درگاه رسمی</li>
            <li><span>🔄</span> به‌روزرسانی رایگان همیشگی</li>
            <li><span>💬</span> پشتیبانی واقعی و پاسخگو</li>
          </ul>
          <div class="ab-badges">
            <span class="badge ok">SSL امن</span><span class="badge primary">درگاه زرین‌پال</span><span class="badge info">ضمانت اصالت</span>
          </div>
        </div>
      </div>

      <!-- پنل فرم -->
      <div class="auth-side">
        <!-- نوار وضعیت: آیا قبلاً حساب دارید؟ -->
        <div class="auth-switch" id="authSwitch">
          <span id="authSwitchTxt" class="hide">حساب ندارید؟ <a href="#r" data-open-view="register">ثبت‌نام کنید</a></span>
          <span id="authSwitchTxtR" class="hide">قبلاً عضو شده‌اید؟ <a href="#l" data-open-view="login">وارد شوید</a></span>
        </div>

        <!-- وضعیت ۱: ورود -->
        <div class="auth-view on" data-view="login">
          <div class="av-head">
            <h3>خوش برگشتید 👋</h3>
            <p class="muted small">برای ادامه وارد حساب خود شوید.</p>
          </div>
          <form method="post" action="/login" id="authFormLogin" class="auth-f">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <div class="af-field">
              <label>ایمیل یا شماره موبایل</label>
              <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg><input class="input" name="identifier" required dir="ltr" placeholder="you@example.com" autocomplete="username"></div>
            </div>
            <div class="af-field">
              <label>رمز عبور</label>
              <div class="af-ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                <input class="input" id="loginPass" type="password" name="password" required minlength="8" dir="ltr" placeholder="••••••••" autocomplete="current-password">
                <button class="af-eye" type="button" data-eye="loginPass" aria-label="نمایش رمز">👁</button>
              </div>
              <button class="af-forgot" type="button" data-open-view="forgot">🔑 فراموشی رمز عبور؟</button>
            </div>
            <button class="btn lg" type="submit">ورود به حساب 🚀</button>
          </form>
          <div class="oauth-sep"><span>یا ورود سریع با</span></div>
          <div class="oauth-row">
            ${ob(gh, '/auth/github', '🐙 گیت‌هاب', 'github')}
            ${ob(gg, '/auth/google', '🔴 گوگل', 'google')}
            ${ob(tg, '/auth/telegram', '✈️ تلگرام', 'telegram')}
          </div>
        </div>

        <!-- وضعیت ۲: ثبت‌نام -->
        <div class="auth-view" data-view="register">
          <div class="av-head">
            <h3>ساخت حساب ✨</h3>
            <p class="muted small">کمتر از یک دقیقه؛ هدیه <b class="grad-text">WELCOME10</b> انتظار شماست.</p>
          </div>
          <form method="post" action="/register" id="authFormReg" class="auth-f">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <div class="af-field">
              <label>نام و نام خانوادگی</label>
              <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg><input class="input" name="name" required minlength="2" maxlength="60" placeholder="مثلاً: سارا محمدی" autocomplete="name"></div>
            </div>
            <div class="af-field">
              <label>ایمیل یا شماره موبایل</label>
              <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg><input class="input" name="identifier" required dir="ltr" placeholder="you@example.com" autocomplete="username"></div>
            </div>
            <div class="af-field">
              <label>رمز عبور</label>
              <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input class="input" id="regPass" type="password" name="password" required minlength="8" dir="ltr" placeholder="حداقل ۸ کاراکتر" autocomplete="new-password">
              <button class="af-eye" type="button" data-eye="regPass" aria-label="نمایش رمز">👁</button></div>
              <div class="af-strength" id="passStrength"><i></i><i></i><i></i><i></i></div>
            </div>
            <button class="btn lg" type="submit">ساخت حساب + هدیه WELCOME10 🎁</button>
          </form>
          <p class="hint center" style="margin-top:12px">با ثبت‌نام، <a href="/terms" style="color:var(--primary)">قوانین سایت</a> را می‌پذیرید.</p>
        </div>

        <!-- وضعیت ۳: بازیابی رمز -->
        <div class="auth-view" data-view="forgot">
          <div class="av-head">
            <h3>بازیابی رمز عبور 🔑</h3>
            <p class="muted small">ایمیلت را بده؛ لینک بازنشانی برایت ارسال می‌شود.</p>
          </div>
          <form method="post" action="/forgot" id="authFormForgot" class="auth-f">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <div class="af-field">
              <label>ایمیل حساب</label>
              <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg><input class="input" name="identifier" required dir="ltr" placeholder="you@example.com"></div>
            </div>
            <button class="btn lg" type="submit">ارسال لینک بازنشانی ✉️</button>
          </form>
          <div id="forgotDone" class="forgot-done hide">
            <div class="fd-ic">📬</div>
            <b>لینک ارسال شد!</b>
            <p class="muted small">اگر حسابی با این ایمیل وجود داشته باشد، لینک بازنشانی (۱ ساعت اعتبار) برایتان ارسال شد. صندوق ورودی و اسپم را چک کنید.</p>
          </div>
          <button class="af-back" type="button" data-open-view="login">→ بازگشت به ورود</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

// ═══ پوسته ادمین ═══
export function adminPage({ user, title, active = '', body, desc = '', csrf = '' }) {
  // ─── منو با گروه‌بندی ───
  const groups = [
    ['مدیریت', [
      ['/admin', 'داشبورد', 'dashboard', 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'],
    ]],
    ['فروشگاه', [
      ['/admin/products', 'قالب‌ها', 'products', 'M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z'],
      ['/admin/orders', 'سفارش‌ها', 'orders', 'M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zM8 2v4h8V2'],
      ['/admin/customers', 'مشتریان', 'customers', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm13 18v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
      ['/admin/comments', 'نظرات', 'comments', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
      ['/admin/coupons', 'کدهای تخفیف', 'coupons', 'M20 12l-8 8-4-4 8-8zM6 18l-2-2M9 21l2-2'],
    ]],
    ['سرویس‌ها', [
      ['/admin/ai-studio', 'استودیوی هوش مصنوعی ⚡', 'ai-studio', 'M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7zm-3 19h6m-4-3v3'],
    ['/admin/ai-pro', 'پلن‌های پرو 👥', 'ai-pro', 'M17 20h5v-2a4 4 0 0 0-3-3.87V9.1a5 5 0 1 0-2 0v5.03A4 4 0 0 0 14 18v2h3zm-8-9a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 4.5c-2.2 0-4.5 1.1-4.5 2.5V20h9v-2c0-1.4-2.3-2.5-4.5-2.5z'],
      ['/admin/generator', 'قالب‌ساز هوشمند', 'generator', 'M12 2l2.4 4.9L20 9.5l-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9 5.6-2.6z'],
      ['/admin/app-projects', 'سفارش‌های اپ', 'app-projects', 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 16h4M12 6v6m-3 0h6'],
    ]],
    ['ارتباطات و مالی', [
      ['/admin/messages', 'پیام‌ها', 'messages', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
      ['/admin/withdrawals', 'برداشت‌ها', 'withdrawals', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
    ]],
    ['سیستم', [
      ['/admin/settings', 'تنظیمات', 'settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7-3a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 2h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 1 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 22h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z'],
    ]],
  ];

  const pendingComments = findMany('comments', c => c.status === 'pending').length;
  const unreadMsgs = findMany('messages', m => m.fromRole === 'user' && !m.readByAdmin).length;
  const submittedProjects = findMany('projects', p => p.status === 'submitted').length;
  const pendingWds = findMany('withdrawals', w => w.status === 'processing').length;
  const unverifiedUsers = findMany('users', u => u.role === 'customer' && !u.verified).length;
  const notifTotal = pendingComments + unreadMsgs + submittedProjects + pendingWds + unverifiedUsers;

  const badgeFor = key => {
    if (key === 'comments' && pendingComments) return `<span class="badge err">${pendingComments}</span>`;
    if (key === 'messages' && unreadMsgs) return `<span class="badge err">${unreadMsgs}</span>`;
    if (key === 'app-projects' && submittedProjects) return `<span class="badge warn">${submittedProjects}</span>`;
    if (key === 'withdrawals' && pendingWds) return `<span class="badge err">${pendingWds}</span>`;
    return '';
  };

  const sidebar = `
<aside class="admin-sidebar" id="adminSidebar">
  <a class="logo" href="/"><span class="mark">پ</span>اپ‌تم <span class="badge primary" style="font-size:.62rem">ادمین</span></a>
  <nav class="admin-nav">
    ${groups.map(([gTitle, items]) => `
      <div class="nav-group-title">${gTitle}</div>
      ${items.map(([href, label, key, path]) => `
        <a href="${href}" class="${active === key ? 'active' : ''}" title="${esc(label)}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>
          ${esc(label)}${badgeFor(key)}
        </a>`).join('')}
    `).join('')}
  </nav>
  <div class="admin-side-footer">
    <div class="admin-user">
      <div class="avatar">${esc((user?.name || 'ا').trim().charAt(0))}</div>
      <div class="grow"><b class="small">${esc(user?.name || '')}</b><div class="muted small">مدیر سیستم</div></div>
    </div>
    <a class="btn sm ghost" href="/" target="_blank">${I.store} مشاهده فروشگاه</a>
  </div>
</aside>
<div class="admin-side-ov" id="sideOv" hidden></div>`;

  // ─── مرکز اعلان‌ها (دراپ‌داون) ───
  const notifItems = [
    unreadMsgs ? `<a class="notif-item" href="/admin/messages"><span class="notif-ic" style="background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary)">💬</span><span class="grow"><b>${unreadMsgs} پیام خوانده‌نشده</b><small>از مشتریان در انتظار پاسخ شماست</small></span></a>` : '',
    pendingComments ? `<a class="notif-item" href="/admin/comments"><span class="notif-ic" style="background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)">💬</span><span class="grow"><b>${pendingComments} نظر در انتظار تأیید</b><small>بررسی و انتشار نظرات جدید</small></span></a>` : '',
    submittedProjects ? `<a class="notif-item" href="/admin/app-projects"><span class="notif-ic" style="background:color-mix(in srgb,var(--info) 16%,transparent);color:var(--info)">📱</span><span class="grow"><b>${submittedProjects} پروژه اپ در انتظار قیمت‌گذاری</b><small>پرامپت مشتریان را بررسی کنید</small></span></a>` : '',
    pendingWds ? `<a class="notif-item" href="/admin/withdrawals"><span class="notif-ic" style="background:color-mix(in srgb,var(--err) 16%,transparent);color:var(--err)">💸</span><span class="grow"><b>${pendingWds} برداشت در حال پردازش</b><small>واریزها را تأیید کنید</small></span></a>` : '',
    unverifiedUsers ? `<a class="notif-item" href="/admin/customers"><span class="notif-ic" style="background:color-mix(in srgb,var(--primary-3) 16%,transparent);color:var(--primary-3)">⚠️</span><span class="grow"><b>${unverifiedUsers} حساب تأییدنشده</b><small>۷ روز پس از ثبت‌نام حذف می‌شوند</small></span></a>` : '',
  ].filter(Boolean).join('');

  const topbar = `
<header class="admin-topbar">
  <div class="between">
    <div>
      <button class="icon-btn" id="sideToggle" aria-label="منو" style="margin-inline-end:10px;vertical-align:middle">${I.menu}</button>
      <h1 style="display:inline-block;vertical-align:middle">${esc(title)}</h1>
      <div class="admin-breadcrumb" style="margin-top:2px">پنل مدیریت <span>‹</span> <b>${esc(title)}</b></div>
    </div>
    <div class="flex">
      <a class="btn sm soft" href="/admin/products/new">${I.plus} قالب جدید</a>
      <div class="notif-wrap">
        <button class="icon-btn notif-bell" id="notifBell" aria-label="اعلان‌ها" aria-haspopup="true" aria-expanded="false">${I.bell}
          ${notifTotal ? `<span class="notif-dot">${notifTotal}</span>` : ''}
        </button>
        <div class="notif-panel" id="notifPanel" role="menu">
          <div class="notif-title">🔔 مرکز اعلان‌ها <span class="badge primary">${notifTotal}</span></div>
          ${notifItems || '<div class="notif-empty">✅ همه‌چیز مرتب است؛ اعلان جدیدی ندارید.</div>'}
        </div>
      </div>
      <button class="icon-btn" id="themeToggle" aria-label="تغییر تم">${I.sun}</button>
      <div class="notif-wrap">
        <button class="icon-btn" id="adminUserBtn" aria-label="حساب مدیر" aria-haspopup="true" aria-expanded="false"><span class="avatar sm" style="width:26px;height:26px;font-size:.75rem">${esc((user?.name || 'ا').trim().charAt(0))}</span></button>
        <div class="user-menu" id="adminUserMenu" role="menu">
          <a href="/account" role="menuitem">👤 حساب کاربری</a>
          <a href="/" target="_blank" role="menuitem">🏪 مشاهده فروشگاه</a>
          <form method="post" action="/logout"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button type="submit" role="menuitem" style="color:var(--err)">${I.exit} خروج از پنل</button></form>
        </div>
      </div>
    </div>
  </div>
</header>`;

  const html = `
<div class="admin-shell">
  ${sidebar}
  <div class="admin-main">${topbar}<div class="admin-content">${body}</div></div>
</div>
<script src="/assets/js/ui.js" defer></script>
<script src="/assets/js/admin.js" defer></script>`;
  return baseHtml({ title: `${title} — پنل مدیریت اپ‌تم`, desc: desc || title, body: html, adminMode: true, noindex: true, csrf });
}
