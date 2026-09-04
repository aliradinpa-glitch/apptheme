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
<meta name="theme-color" content="#6d5ef2">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
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
${body}
</body>
</html>`;
}

// ─── ناوبار فروشگاه ───
function navbar(user, active = '') {
  const link = (href, label, key) => `<a href="${href}"${active === key ? ' class="active"' : ''}>${label}</a>`;
  const cartBtn = `
  <a class="icon-btn" id="cartBtn" href="/cart" aria-label="سبد خرید" role="button">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    <span class="cart-count" id="cartCount" hidden>۰</span>
  </a>`;
  const themeBtn = `
  <button class="icon-btn" id="themeToggle" aria-label="تغییر تم">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  </button>`;
  const authArea = user
    ? `<a class="btn sm ghost" href="/account">حساب من</a>
       ${user.role === 'admin' ? '<a class="btn sm soft" href="/admin">پنل مدیریت</a>' : ''}`
    : `<a class="btn sm ghost" href="/login" data-auth="login">ورود</a>
       <a class="btn sm" href="/register" data-auth="register">ثبت‌نام</a>`;
  return `
<header class="navbar">
  <div class="container inner">
    <a class="logo" href="/"><span class="mark">پ</span>اپ‌تم</a>
    <nav class="nav-links" id="navLinks">
      ${link('/', 'خانه', 'home')}
      ${link('/templates', 'قالب‌ها', 'templates')}
      ${link('/apps', 'سفارش اپ اندروید 🤖', 'apps')}
      ${link('/#why', 'چرا اپ‌تم؟', 'why')}
      ${link('/#comments', 'نظرات', 'comments')}
    </nav>
    <div class="nav-actions">
      ${themeBtn}
      <button class="icon-btn" id="installBtn" hidden aria-label="نصب اپ موبایل" title="نصب اپ موبایل 📱">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>
      </button>
      ${cartBtn}
      ${authArea}
      <button class="icon-btn hamburger" id="hamburger" aria-label="منو">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
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
      <p class="muted small" style="margin-top:12px; max-width:22rem;">بازار قالب‌های حرفه‌ای وب — خرید با اطمینان، دانلود آنی و پشتیبانی واقعی. تمام قالب‌ها راست‌چین و بهینه برای سئو هستند.</p>
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
  const body = navbar(user, active) + verifyBanner(user, opts.csrf) + `<main>${opts.body}</main>` + footer() + (user ? '' : authModalHtml(opts.csrf));
  return baseHtml({ ...opts, body, csrf: opts.csrf });
}

// ═══ مودال ورود/ثبت‌نام (روی هر صفحه، بدون رفت‌وبرگشت) ═══
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
    <div class="logo" style="margin-bottom:8px"><span class="mark">پ</span>اپ‌تم</div>
    <div class="auth-tabs" id="authTabs">
      <a href="/login" class="on" data-tab="login">ورود</a>
      <a href="/register" data-tab="register">ثبت‌نام</a>
    </div>
    <form method="post" action="/login" id="authFormLogin" class="auth-f">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <input class="input" name="identifier" required dir="ltr" placeholder="ایمیل یا شماره موبایل" autocomplete="username">
      <input class="input" type="password" name="password" required minlength="8" dir="ltr" placeholder="رمز عبور" autocomplete="current-password">
      <button class="btn lg" type="submit">ورود به حساب</button>
      <a class="small" href="/forgot" style="color:var(--primary)">فراموشی رمز عبور؟ 🔑</a>
    </form>
    <form method="post" action="/register" id="authFormReg" class="auth-f" hidden>
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <input class="input" name="name" required minlength="2" placeholder="نام و نام خانوادگی" autocomplete="name">
      <input class="input" name="identifier" required dir="ltr" placeholder="ایمیل (جیمیل) یا موبایل" autocomplete="username">
      <input class="input" type="password" name="password" required minlength="8" dir="ltr" placeholder="رمز عبور (حداقل ۸ کاراکتر)" autocomplete="new-password">
      <button class="btn lg" type="submit">ساخت حساب + هدیه WELCOME10 🎁</button>
    </form>
    <div class="oauth-sep"><span>یا ورود سریع با</span></div>
    <div class="oauth-row">
      ${ob(gh, '/auth/github', '🐙 گیت‌هاب', 'github')}
      ${ob(gg, '/auth/google', '🔴 گوگل (جیمیل)', 'google')}
      ${ob(tg, '/auth/telegram', '✈️ تلگرام', 'telegram')}
      <a class="oauth-btn off" href="/login" data-needs-setup="bale">💬 بله</a>
      <a class="oauth-btn off" href="/login" data-needs-setup="rubika">🟣 روبیکا</a>
    </div>
    <p class="hint" style="margin-top:10px">با ورود/ثبت‌نام، <a href="/terms" style="color:var(--primary)">قوانین</a> را می‌پذیرید.</p>
  </div>
</div>`;
}

// ─── پوسته ادمین ───
export function adminPage({ user, title, active = '', body, desc = '', csrf = '' }) {
  const menu = [
    ['/admin', 'داشبورد', 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'],
    ['/admin/products', 'قالب‌ها', 'M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z'],
    ['/admin/orders', 'سفارش‌ها', 'M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zM8 2v4h8V2'],
    ['/admin/customers', 'مشتریان', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm13 18v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
    ['/admin/comments', 'نظرات', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    ['/admin/coupons', 'کدهای تخفیف', 'M20 12l-8 8-4-4 8-8zM6 18l-2-2M9 21l2-2'],
    ['/admin/app-projects', 'سفارش‌های اپ 🤖', 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 16h4M12 6v6m-3 0h6'],
    ['/admin/generator', 'قالب‌ساز هوشمند ⭐', 'M12 2l2.4 4.9L20 9.5l-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9 5.6-2.6z'],
    ['/admin/messages', 'پیام‌ها', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    ['/admin/withdrawals', 'برداشت‌ها 💸', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
    ['/admin/settings', 'تنظیمات', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7-3a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 2h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 1 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 22h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z'],
  ];
  const pendingComments = findMany('comments', c => c.status === 'pending').length;
  const unreadMsgs = findMany('messages', m => m.fromRole === 'user' && !m.readByAdmin).length;
  const submittedProjects = findMany('projects', p => p.status === 'submitted').length;
  const pendingWds = findMany('withdrawals', w => w.status === 'processing').length;
  const sidebar = `
<aside class="admin-sidebar">
  <a class="logo" href="/"><span class="mark">پ</span>اپ‌تم <span class="badge primary">ادمین</span></a>
  <nav class="admin-nav">
    ${menu.map(([href, label, path]) => {
      const key = href === '/admin' ? 'dashboard' : href.split('/')[2];
      let badge = '';
      if (key === 'comments' && pendingComments) badge = `<span class="badge err">${pendingComments}</span>`;
      if (key === 'messages' && unreadMsgs) badge = `<span class="badge err">${unreadMsgs}</span>`;
      if (key === 'app-projects' && submittedProjects) badge = `<span class="badge warn">${submittedProjects}</span>`;
      if (key === 'withdrawals' && pendingWds) badge = `<span class="badge err">${pendingWds}</span>`;
      return `<a href="${href}" class="${active === key ? 'active' : ''}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>${label}${badge}</a>`;
    }).join('')}
  </nav>
  <div class="admin-side-footer">
    <div class="admin-user">
      <div class="avatar sm">${esc((user?.name || 'ا').trim().charAt(0))}</div>
      <div><b>${esc(user?.name || '')}</b><div class="muted small">مدیر سیستم</div></div>
    </div>
    <a class="btn sm ghost" href="/" target="_blank">مشاهده فروشگاه</a>
  </div>
</aside>`;
  const topbar = `
<header class="admin-topbar">
  <div class="between">
    <h1>${esc(title)}</h1>
    <div class="flex">
      <button class="icon-btn" id="themeToggle" aria-label="تغییر تم"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
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
