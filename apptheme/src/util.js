// ─── ابزارهای عمومی: escape، اعداد/تاریخ فارسی، اسلاگ، بندانگشتی SVG ───

export function esc(s = '') {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('fa-IR') + ' تومان';
}

export function faNum(n) {
  return Number(n).toLocaleString('fa-IR');
}

export function faDate(d) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d));
  } catch { return ''; }
}

export function faDateTime(d) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  } catch { return ''; }
}

export function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), day = Math.floor(h / 24);
  if (m < 1) return 'لحظاتی پیش';
  if (m < 60) return `${faNum(m)} دقیقه پیش`;
  if (h < 24) return `${faNum(h)} ساعت پیش`;
  if (day < 30) return `${faNum(day)} روز پیش`;
  return faDate(d);
}

export function slugify(str = '') {
  const base = String(str).trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return base || `t-${Date.now().toString(36)}`;
}

export function isEmail(v = '') {
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,10}$/.test(String(v).trim());
}

// تبدیل ارقام فارسی/عربی به انگلیسی + اعتبارسنجی موبایل ایران
export function normalizeDigits(v = '') {
  const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
  return String(v).replace(/[۰-۹٠-٩]/g, ch => {
    const i = fa.indexOf(ch);
    return String(i > -1 ? i : ar.indexOf(ch));
  });
}

export function normalizeMobile(v = '') {
  const m = normalizeDigits(v).replace(/[\s\-()]/g, '');
  if (/^(\+98|0098|98)?(9\d{9})$/.test(m)) {
    const rest = m.startsWith('+98') || m.startsWith('0098') ? m.slice(m.length - 10) : (m.startsWith('98') ? m.slice(2) : m);
    return '0' + rest;
  }
  if (/^0(9\d{9})$/.test(m)) return m;
  return null;
}

// ─── ستاره‌های امتیاز ───
export function starsSvg(rating = 0, size = 15) {
  const r = Math.round((Number(rating) || 0) * 2) / 2;
  let out = `<span class="stars" aria-label="امتیاز ${faNum(r)} از ۵" dir="ltr">`;
  for (let i = 1; i <= 5; i++) {
    const fill = r >= i ? 'var(--star)' : (r >= i - 0.5 ? 'url(#halfstar)' : 'var(--star-bg)');
    out += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z"/></svg>`;
  }
  return out + '</span>';
}

// ─── بندانگشتی محصول: ماکاپ مرورگر با پالت رنگی هر قالب ───
let thumbSeq = 0;
export function svgThumb(product) {
  if (!product) return '<div style="aspect-ratio:8/5;border-radius:12px;background:linear-gradient(135deg,#1c2240,#252c52)"></div>';
  const [c1, c2] = product.palette || ['#6d5ef2', '#22d3ee'];
  const accent = product.accent || '#ffffff';
  const id = `tg${++thumbSeq}`;
  return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${esc(c1)}"/><stop offset="1" stop-color="${esc(c2)}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" rx="18" fill="url(#${id})"/>
  <rect x="0" y="0" width="800" height="56" fill="rgba(255,255,255,.14)"/>
  <circle cx="740" cy="28" r="8" fill="rgba(255,255,255,.55)"/>
  <circle cx="712" cy="28" r="8" fill="rgba(255,255,255,.35)"/>
  <circle cx="684" cy="28" r="8" fill="rgba(255,255,255,.22)"/>
  <rect x="150" y="14" width="500" height="28" rx="14" fill="rgba(255,255,255,.18)"/>
  <rect x="170" y="23" width="180" height="10" rx="5" fill="rgba(255,255,255,.3)"/>
  <rect x="60" y="96" width="330" height="150" rx="12" fill="rgba(255,255,255,.92)"/>
  <rect x="84" y="122" width="200" height="16" rx="8" fill="${esc(c1)}" opacity=".85"/>
  <rect x="84" y="150" width="260" height="10" rx="5" fill="#c7cde6"/>
  <rect x="84" y="168" width="230" height="10" rx="5" fill="#d5daee"/>
  <rect x="84" y="198" width="110" height="26" rx="13" fill="${esc(c2)}"/>
  <rect x="410" y="96" width="330" height="150" rx="12" fill="rgba(255,255,255,.25)"/>
  <circle cx="575" cy="163" r="42" fill="rgba(255,255,255,.5)"/>
  <rect x="60" y="270" width="200" height="110" rx="12" fill="rgba(255,255,255,.9)"/>
  <rect x="80" y="292" width="70" height="34" rx="8" fill="${esc(c1)}" opacity=".7"/>
  <rect x="80" y="338" width="140" height="9" rx="4" fill="#c7cde6"/>
  <rect x="80" y="352" width="110" height="9" rx="4" fill="#d5daee"/>
  <rect x="280" y="270" width="200" height="110" rx="12" fill="rgba(255,255,255,.75)"/>
  <rect x="300" y="292" width="70" height="34" rx="8" fill="${esc(c2)}" opacity=".8"/>
  <rect x="300" y="338" width="140" height="9" rx="4" fill="#c7cde6"/>
  <rect x="300" y="352" width="110" height="9" rx="4" fill="#d5daee"/>
  <rect x="500" y="270" width="240" height="110" rx="12" fill="rgba(255,255,255,.55)"/>
  <rect x="520" y="292" width="70" height="34" rx="8" fill="${esc(accent)}" opacity=".9"/>
  <rect x="520" y="338" width="170" height="9" rx="4" fill="rgba(255,255,255,.7)"/>
  <rect x="520" y="352" width="130" height="9" rx="4" fill="rgba(255,255,255,.55)"/>
  <rect x="60" y="406" width="680" height="12" rx="6" fill="rgba(255,255,255,.3)"/>
  <rect x="60" y="430" width="500" height="12" rx="6" fill="rgba(255,255,255,.2)"/>
</svg>`;
}
