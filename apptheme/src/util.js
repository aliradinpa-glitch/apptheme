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

// ─── پارس مقاوم مبالغ: «۲۰٬۰۰۰٬۰۰۰»، «20,000,000»، «20.000.000»، «۲۰ میلیون»، «3م» ───
export function parseMoney(v) {
  let s = normalizeDigits(String(v ?? '')).trim();
  if (!s) return NaN;
  s = s.replace(/تومان|تومن|toman|Toman/g, '');
  let mult = 1;
  if (/میلیون|میليون|[Mm]illion/.test(s)) { mult = 1e6; s = s.replace(/میلیون|میليون|[Mm]illion/g, ' '); }
  else if (/هزار|[Kk]یلو|\b[Kk]\b/.test(s)) { mult = 1e3; s = s.replace(/هزار|[Kk]یلو|\b[Kk]\b/g, ' '); }
  else if (/\bم\b/.test(s)) { mult = 1e6; s = s.replace(/\bم\b/g, ' '); }
  s = s.replace(/[,٬،'\s]/g, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // نقطهٔ هزارگان اروپایی
  if (!/^[\d.]+$/.test(s)) return NaN;
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * mult) : NaN;
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

// ─── بندانگشتی محصول: ۴ لایوت متفاوت تا قالب‌ها هم‌شکل نباشند ───
// لایوت بر اساس شناسه محصول ثابت انتخاب می‌شود (پایدار در همه صفحات)
let thumbSeq = 0;
function thumbVariant(seed) {
  const n = (Number(seed) || 0) * 2654435761 >>> 0;
  return n % 6;
}
export function svgThumb(product) {
  if (!product) return '<div style="aspect-ratio:8/5;border-radius:12px;background:linear-gradient(135deg,#1c2240,#252c52)"></div>';
  const [c1, c2] = product.palette || ['#6d5ef2', '#22d3ee'];
  const accent = product.accent || '#ffffff';
  const id = `tg${++thumbSeq}`;
  const v = thumbVariant(product.id);
  const k1 = esc(c1), k2 = esc(c2), ka = esc(accent);
  const defs = `<defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${k1}"/><stop offset="1" stop-color="${k2}"/>
    </linearGradient>
  </defs>`;
  const bg = `<rect width="800" height="500" rx="18" fill="url(#${id})"/>`;

  // ── V0: مرورگر دسکتاپ کلاسیک ──
  if (v === 0) return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">${defs}${bg}
  <rect x="0" y="0" width="800" height="56" fill="rgba(255,255,255,.14)"/>
  <circle cx="740" cy="28" r="8" fill="rgba(255,255,255,.55)"/><circle cx="712" cy="28" r="8" fill="rgba(255,255,255,.35)"/><circle cx="684" cy="28" r="8" fill="rgba(255,255,255,.22)"/>
  <rect x="150" y="14" width="500" height="28" rx="14" fill="rgba(255,255,255,.18)"/>
  <rect x="60" y="96" width="330" height="150" rx="12" fill="rgba(255,255,255,.92)"/>
  <rect x="84" y="122" width="200" height="16" rx="8" fill="${k1}" opacity=".85"/>
  <rect x="84" y="150" width="260" height="10" rx="5" fill="#c7cde6"/><rect x="84" y="168" width="230" height="10" rx="5" fill="#d5daee"/>
  <rect x="84" y="198" width="110" height="26" rx="13" fill="${k2}"/>
  <rect x="410" y="96" width="330" height="150" rx="12" fill="rgba(255,255,255,.25)"/><circle cx="575" cy="163" r="42" fill="rgba(255,255,255,.5)"/>
  <rect x="60" y="270" width="200" height="110" rx="12" fill="rgba(255,255,255,.9)"/>
  <rect x="80" y="292" width="70" height="34" rx="8" fill="${k1}" opacity=".7"/><rect x="80" y="338" width="140" height="9" rx="4" fill="#c7cde6"/><rect x="80" y="352" width="110" height="9" rx="4" fill="#d5daee"/>
  <rect x="280" y="270" width="200" height="110" rx="12" fill="rgba(255,255,255,.75)"/>
  <rect x="300" y="292" width="70" height="34" rx="8" fill="${k2}" opacity=".8"/><rect x="300" y="338" width="140" height="9" rx="4" fill="#c7cde6"/><rect x="300" y="352" width="110" height="9" rx="4" fill="#d5daee"/>
  <rect x="500" y="270" width="240" height="110" rx="12" fill="rgba(255,255,255,.55)"/>
  <rect x="520" y="292" width="70" height="34" rx="8" fill="${ka}" opacity=".9"/><rect x="520" y="338" width="170" height="9" rx="4" fill="rgba(255,255,255,.7)"/><rect x="520" y="352" width="130" height="9" rx="4" fill="rgba(255,255,255,.55)"/>
  <rect x="60" y="406" width="680" height="12" rx="6" fill="rgba(255,255,255,.3)"/><rect x="60" y="430" width="500" height="12" rx="6" fill="rgba(255,255,255,.2)"/>
</svg>`;

  // ── V1: اپ موبایل ──
  if (v === 1) return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">${defs}${bg}
  <circle cx="640" cy="110" r="120" fill="rgba(255,255,255,.1)"/><circle cx="120" cy="420" r="90" fill="rgba(255,255,255,.08)"/>
  <rect x="255" y="36" width="290" height="440" rx="38" fill="#10142c" opacity=".92"/>
  <rect x="267" y="48" width="266" height="416" rx="30" fill="#fff"/>
  <rect x="290" y="84" width="120" height="16" rx="8" fill="${k1}"/>
  <rect x="290" y="112" width="200" height="9" rx="4" fill="#d5daee"/>
  <rect x="290" y="140" width="220" height="120" rx="16" fill="url(#${id})" opacity=".9"/>
  <circle cx="330" cy="182" r="16" fill="rgba(255,255,255,.55)"/>
  <rect x="290" y="276" width="104" height="84" rx="12" fill="#eef0fa"/>
  <rect x="300" y="286" width="40" height="14" rx="7" fill="${k1}"/><rect x="300" y="308" width="76" height="8" rx="4" fill="#c7cde6"/>
  <rect x="402" y="276" width="104" height="84" rx="12" fill="#eef0fa"/>
  <rect x="412" y="286" width="40" height="14" rx="7" fill="${k2}"/><rect x="412" y="308" width="76" height="8" rx="4" fill="#c7cde6"/>
  <rect x="290" y="372" width="216" height="52" rx="26" fill="${k1}"/>
  <rect x="330" y="390" width="136" height="12" rx="6" fill="rgba(255,255,255,.85)"/>
  <rect x="560" y="120" width="180" height="120" rx="14" fill="rgba(255,255,255,.72)"/>
  <rect x="576" y="140" width="90" height="12" rx="6" fill="${k2}"/><rect x="576" y="162" width="148" height="8" rx="4" fill="#c7cde6"/><rect x="576" y="178" width="120" height="8" rx="4" fill="#d5daee"/>
  <rect x="560" y="262" width="180" height="86" rx="14" fill="rgba(255,255,255,.4)"/>
  <rect x="576" y="282" width="60" height="12" rx="6" fill="rgba(255,255,255,.8)"/><rect x="576" y="304" width="140" height="8" rx="4" fill="rgba(255,255,255,.6)"/>
  <rect x="590" y="380" width="120" height="14" rx="7" fill="rgba(255,255,255,.5)"/>
</svg>`;

  // ── V2: داشبورد تیره ──
  if (v === 2) return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">${defs}${bg}
  <rect x="46" y="40" width="708" height="420" rx="20" fill="#0d1230" opacity=".94"/>
  <rect x="46" y="40" width="150" height="420" rx="20" fill="rgba(255,255,255,.07)"/>
  <circle cx="80" cy="76" r="12" fill="url(#${id})"/>
  <rect x="66" y="112" width="110" height="10" rx="5" fill="rgba(255,255,255,.3)"/><rect x="66" y="136" width="96" height="10" rx="5" fill="rgba(255,255,255,.18)"/><rect x="66" y="160" width="104" height="10" rx="5" fill="rgba(255,255,255,.18)"/><rect x="66" y="184" width="88" height="10" rx="5" fill="rgba(255,255,255,.18)"/>
  <rect x="216" y="66" width="240" height="14" rx="7" fill="rgba(255,255,255,.5)"/>
  <rect x="216" y="96" width="130" height="56" rx="12" fill="rgba(255,255,255,.16)"/>
  <rect x="358" y="96" width="130" height="56" rx="12" fill="rgba(255,255,255,.1)"/>
  <rect x="500" y="96" width="130" height="56" rx="12" fill="rgba(255,255,255,.1)"/>
  <rect x="230" y="114" width="52" height="12" rx="6" fill="${k2}"/><rect x="372" y="114" width="42" height="12" rx="6" fill="#7fe3d4"/><rect x="514" y="114" width="46" height="12" rx="6" fill="#fbbf24"/>
  <rect x="216" y="170" width="414" height="180" rx="14" fill="rgba(255,255,255,.09)"/>
  <path d="M236 320 L300 288 L352 302 L410 250 L470 268 L530 220 L600 236 L610 230" fill="none" stroke="${k1}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M236 322 L300 312 L352 320 L410 292 L470 300 L530 268 L600 280" fill="none" stroke="${k2}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9" opacity=".9"/>
  <circle cx="530" cy="220" r="8" fill="${k1}"/><circle cx="410" cy="250" r="8" fill="#fff" opacity=".85"/>
  <rect x="646" y="170" width="88" height="180" rx="14" fill="rgba(255,255,255,.09)"/>
  <rect x="660" y="290" width="18" height="46" rx="5" fill="url(#${id})"/><rect x="686" y="258" width="18" height="78" rx="5" fill="rgba(255,255,255,.25)"/><rect x="712" y="230" width="18" height="106" rx="5" fill="rgba(255,255,255,.45)"/>
  <rect x="216" y="368" width="200" height="66" rx="12" fill="rgba(255,255,255,.09)"/>
  <rect x="232" y="386" width="80" height="12" rx="6" fill="${k1}"/><rect x="232" y="408" width="150" height="8" rx="4" fill="rgba(255,255,255,.25)"/>
  <rect x="430" y="368" width="200" height="66" rx="12" fill="rgba(255,255,255,.09)"/>
  <rect x="446" y="386" width="80" height="12" rx="6" fill="${k2}"/><rect x="446" y="408" width="150" height="8" rx="4" fill="rgba(255,255,255,.25)"/>
</svg>`;

  // ── V3: لندینگ اسپلیت (متن + شکل) ──
  return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">${defs}${bg}
  <circle cx="660" cy="90" r="150" fill="rgba(255,255,255,.12)"/><circle cx="720" cy="330" r="90" fill="rgba(255,255,255,.1)"/>
  <path d="M0 500 L180 330 L330 470 L520 300 L800 520 L800 500 Z" fill="rgba(255,255,255,.1)"/>
  <rect x="60" y="96" width="60" height="60" rx="16" fill="url(#${id})"/><circle cx="110" cy="96" r="8" fill="rgba(255,255,255,.6)"/>
  <rect x="140" y="112" width="90" height="12" rx="6" fill="rgba(255,255,255,.7)"/>
  <rect x="60" y="200" width="340" height="26" rx="10" fill="rgba(255,255,255,.95)"/>
  <rect x="60" y="238" width="300" height="26" rx="10" fill="rgba(255,255,255,.75)"/>
  <rect x="60" y="288" width="250" height="10" rx="5" fill="rgba(255,255,255,.5)"/><rect x="60" y="306" width="210" height="10" rx="5" fill="rgba(255,255,255,.38)"/>
  <rect x="60" y="344" width="150" height="42" rx="21" fill="${ka}"/>
  <rect x="86" y="360" width="98" height="11" rx="5" fill="rgba(20,24,50,.85)"/>
  <rect x="224" y="344" width="110" height="42" rx="21" fill="rgba(255,255,255,.25)"/>
  <rect x="248" y="360" width="62" height="11" rx="5" fill="rgba(255,255,255,.8)"/>
  <rect x="480" y="120" width="250" height="290" rx="22" fill="rgba(255,255,255,.18)"/>
  <rect x="502" y="146" width="206" height="60" rx="14" fill="rgba(255,255,255,.9)"/>
  <rect x="518" y="164" width="120" height="12" rx="6" fill="${k1}"/><rect x="518" y="184" width="90" height="8" rx="4" fill="#c7cde6"/>
  <circle cx="566" cy="252" r="34" fill="rgba(255,255,255,.85)"/><circle cx="566" cy="252" r="14" fill="url(#${id})"/>
  <rect x="502" y="306" width="206" height="14" rx="7" fill="rgba(255,255,255,.55)"/><rect x="502" y="330" width="160" height="14" rx="7" fill="rgba(255,255,255,.35)"/>
  <rect x="502" y="360" width="206" height="30" rx="15" fill="${k2}" opacity=".9"/>
  <rect x="120" y="430" width="90" height="12" rx="6" fill="rgba(255,255,255,.4)"/><rect x="230" y="430" width="70" height="12" rx="6" fill="rgba(255,255,255,.28)"/><rect x="320" y="430" width="80" height="12" rx="6" fill="rgba(255,255,255,.28)"/>
</svg>`;

  // ── V4: داشبورد تحلیلی تیره با نمودار ──
  if (v === 4) return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">${defs}${bg}
  <rect x="0" y="0" width="800" height="500" fill="#0c1027" opacity=".55"/>
  <rect x="40" y="36" width="130" height="34" rx="12" fill="rgba(255,255,255,.1)"/><circle cx="62" cy="53" r="9" fill="${k1}"/>
  <rect x="600" y="36" width="160" height="34" rx="17" fill="rgba(255,255,255,.14)"/><circle cx="624" cy="53" r="8" fill="${ka}"/>
  <rect x="40" y="96" width="720" height="180" rx="18" fill="rgba(255,255,255,.08)"/>
  <polyline points="70,240 140,200 210,222 280,160 350,190 420,120 490,150 560,104 630,132 700,110 730,120" fill="none" stroke="${k1}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="70,250 140,228 210,240 280,210 350,226 420,190 490,210 560,170 630,196 700,168 730,176" fill="none" stroke="${k2}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>
  <circle cx="420" cy="120" r="7" fill="${ka}"/><circle cx="560" cy="104" r="7" fill="#fff"/>
  <rect x="40" y="300" width="230" height="150" rx="16" fill="rgba(255,255,255,.09)"/>
  <rect x="64" y="326" width="90" height="14" rx="7" fill="rgba(255,255,255,.5)"/><rect x="64" y="352" width="150" height="28" rx="12" fill="${k1}" opacity=".9"/>
  <rect x="64" y="400" width="120" height="10" rx="5" fill="rgba(255,255,255,.3)"/>
  <rect x="285" y="300" width="230" height="150" rx="16" fill="rgba(255,255,255,.09)"/>
  <rect x="309" y="326" width="90" height="14" rx="7" fill="rgba(255,255,255,.5)"/><rect x="309" y="352" width="150" height="28" rx="12" fill="${k2}" opacity=".9"/>
  <rect x="309" y="400" width="120" height="10" rx="5" fill="rgba(255,255,255,.3)"/>
  <rect x="530" y="300" width="230" height="150" rx="16" fill="rgba(255,255,255,.09)"/>
  <rect x="554" y="326" width="90" height="14" rx="7" fill="rgba(255,255,255,.5)"/><rect x="554" y="352" width="150" height="28" rx="12" fill="${ka}" opacity=".85"/>
  <rect x="554" y="400" width="120" height="10" rx="5" fill="rgba(255,255,255,.3)"/>
</svg>`;

  // ── V5: کارت‌های شیشه‌ای مینیمال ──
  const v5c = [k1, k2, ka];
  return `<svg class="thumb-svg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(product.title)}">${defs}${bg}
  <circle cx="120" cy="80" r="130" fill="rgba(255,255,255,.14)"/><circle cx="700" cy="430" r="150" fill="rgba(255,255,255,.1)"/>
  <rect x="70" y="70" width="130" height="20" rx="10" fill="rgba(255,255,255,.85)"/><rect x="70" y="100" width="90" height="12" rx="6" fill="rgba(255,255,255,.5)"/>
  ${v5c.map((c, i) => `<rect x="${70 + i * 230}" y="150" width="200" height="290" rx="24" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
  <rect x="${94 + i * 230}" y="178" width="52" height="52" rx="16" fill="${c}" opacity=".95"/>
  <rect x="${94 + i * 230}" y="252" width="120" height="16" rx="8" fill="rgba(255,255,255,.85)"/>
  <rect x="${94 + i * 230}" y="282" width="150" height="9" rx="4" fill="rgba(255,255,255,.45)"/>
  <rect x="${94 + i * 230}" y="298" width="130" height="9" rx="4" fill="rgba(255,255,255,.35)"/>
  <rect x="${94 + i * 230}" y="360" width="152" height="40" rx="20" fill="${c}" opacity=".85"/>
  <rect x="${118 + i * 230}" y="376" width="104" height="10" rx="5" fill="rgba(12,16,39,.75)"/>`).join('')}
</svg>`;
}
