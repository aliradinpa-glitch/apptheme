// ═══════════════════════════════════════════════════════════════
// «موتور سطوح» — قدرتمندی هوش مصنوعی را با فیلترهای ۶گانه تنظیم میکند
//   سطح ۱: برنزی، سطح ۲: نقره‌ای، سطح ۳: طلایی، سطح ۴: VIP، سطح ۵: لجندری، سطح ۶: اپیک
// هرچه سطح بالاتر → بخشهای بیشتر، افکتها بیشتر، امنیت بیشتر، قیمت بالاتر
// ═══════════════════════════════════════════════════════════════
export const TIERS = [
  { key: 'bronze',    level: 1, label: 'برنزی',      icon: '🥉', base: 490000,  pages: [1, 3],     effects: 1, sections: 2,  ai: 1, details: 'پایه و ساده — مناسب شروع سریع بدون هزینه بالا' },
  { key: 'silver',    level: 2, label: 'نقرهای',     icon: '🥈', base: 890000,  pages: [3, 5],     effects: 2, sections: 4,  ai: 2, details: 'متعادل — صفحههای بیشتر + افکتهای نئونی' },
  { key: 'gold',      level: 3, label: 'طلایی',      icon: '🥇', base: 1490000, pages: [5, 8],     effects: 3, sections: 6,  ai: 3, details: 'حرفهای — مودالها، فیلترها، صفحههای تخصصی' },
  { key: 'vip',       level: 4, label: 'VIP',        icon: '💎', base: 2490000, pages: [8, 12],    effects: 4, sections: 8,  ai: 4, details: 'کامل — پنل کاربری، سبد خرید، درگاه پرداخت دمو' },
  { key: 'legendary', level: 5, label: 'لجندری',     icon: '👑', base: 4490000, pages: [12, 18],   effects: 5, sections: 11, ai: 5, details: 'فوقحرفهای — داشبورد ادمین، چندزبانه، انیمیشنهای سینمایی' },
  { key: 'epic',      level: 6, label: 'اپیک',       icon: '🔥', base: 7490000, pages: [18, 30],   effects: 6, sections: 14, ai: 6, details: 'بینهایت — مثل نمونههای لجندری دنیا؛ PWA، API، سئوی پیشرفته' },
];

export const tierOf = (key) => TIERS.find(t => t.key === key) || TIERS[0];

/** تشخیص سطح از متن کاربر (اگر ننویسد، پیشنهاد طلایی) */
export function detectTier(text) {
  const t = String(text || '');
  const map = [
    ['epic', /(اپیک|epic|بینهایت|بی نهایت|فوق.*حرفه|کامل.*ترین)/],
    ['legendary', /(لجندری|legen|سلطنتی|فوق حرفه|ابرقدرت)/],
    ['vip', /(وی.?آی.?پی|vip|حرفه ای|کامل)/],
    ['gold', /(طلایی|gold|مدیوم|معمولی تر)/],
    ['silver', /(نقره|فول|silver)/],
    ['bronze', /(برنز|bronze|ساده|ارزون|اقتصادی)/],
  ];
  for (const [k, re] of map) if (re.test(t)) return k;
  return 'gold';
}

/** برآورد قیمت بر اساس سطح + حجم پرامپت */
export function estimatePrice(tierKey, spec, extra = {}) {
  const t = tierOf(tierKey);
  const [pmin, pmax] = t.pages;
  const pagesEst = Math.min(pmax, Math.max(pmin, Math.round((spec?.sections?.length || 4) * 1.4) + 1));
  const complexity = Math.min(1.5, 1 + (spec?.prompt?.length || 0) / 900 + (spec?.dark ? .1 : 0));
  const price = Math.round((t.base * complexity) / 10000) * 10000;
  return { price, pagesEst, tier: t };
}

/** بخشهای اضافه بر اساس سطح (هرچه بالاتر، هوش مصنوعی بیشتر خرج میکند) */
export function tierExtras(tierKey) {
  const map = {
    bronze: ['hero', 'services', 'contact'],
    silver: ['hero', 'services', 'stats', 'testimonials', 'contact'],
    gold: ['hero', 'services', 'stats', 'gallery', 'testimonials', 'faq', 'pricing', 'contact'],
    vip: ['hero', 'services', 'stats', 'gallery', 'testimonials', 'faq', 'pricing', 'blog', 'team', 'newsletter', 'cart-demo', 'contact'],
    legendary: ['hero', 'services', 'stats', 'gallery', 'testimonials', 'faq', 'pricing', 'blog', 'team', 'newsletter', 'cart-demo', 'admin-panel', 'dark-mode', 'i18n', 'contact'],
    epic: ['hero', 'services', 'stats', 'gallery', 'testimonials', 'faq', 'pricing', 'blog', 'team', 'newsletter', 'cart-demo', 'admin-panel', 'dark-mode', 'i18n', 'pwa', 'api-docs', 'seo-advanced', 'contact'],
  };
  return map[tierKey] || map.bronze;
}

/** سطحبندی افکتها: ۱ ساده / ۲ نئونی / ۳ مودال / ۴ انیمیشن / ۵ سینمایی / ۶ لجندری */
export function effectLevel(tierKey) { return tierOf(tierKey).effects; }

/** فایل راهنمای Word مشترک — برای همه خروجیها */
import { makeDocx } from './docx.js';

export function smartGuide({ kind, title, platform, steps, extraBlocks = [], images = [] }) {
  const kindLabel = { template: 'قالب', plugin: 'افزونه', store: 'فروشگاهساز', app: 'اپلیکیشن اندروید', converter: 'تبدیل قالب' }[kind] || 'پروژه';
  const blocks = [
    { h1: `راهنمای کامل — ${title}` },
    { p: `این فایل توسط هوش مصنوعی اپتم ساخته شده و همه مراحل نصب، استفاده و شخصیسازی «${kindLabel}» شما را با تصویر نشان میدهد.` },
    { h2: '۱) قبل از شروع' },
    { list: steps || ['فایل ZIP را از بخش دانلود دریافت کنید', 'فایل را در یک پوشه خالی باز کنید', 'مطمئن شوید پلتفرم موردنظر نصب است'] },
    ...(images[0] ? [{ img: { kind: images[0].kind || 'code-folders', cap: images[0].cap || 'ساختار فایلها', step: 1 } }] : []),
    { h2: '۲) نصب قدمبهقدم' },
    { img: { kind: 'theme-install', cap: 'نصب در پنل', step: 2 } },
    { list: ['از پنل مدیریت وارد بخش «افزونهها» یا «قالبها» شوید', 'گزینه بارگذاری (Upload) را انتخاب کنید', 'فایل ZIP را انتخاب و نصب کنید', 'دکمه فعالسازی را بزنید'] },
    { h2: '۳) تنظیمات اولیه' },
    { img: { kind: 'wp-activate', cap: 'فعالسازی و تنظیمات', step: 3 } },
    { p: 'تمام تنظیمات از بخش «تنظیمات » در دسترس است: برند، رنگها، لوگو، متنها و شبکههای اجتماعی.' },
    { h2: '۴) شخصیسازی حرفهای' },
    { img: { kind: 'code-folders', cap: 'فایلهای قابل ویرایش', step: 4 } },
    { list: ['رنگها: در style.css یا تنظیمات (متغیرهای رنگی)', 'متنها: در هر فایل HTML یا از تنظیمات', 'عکسها: پوشه images را جایگزین کنید'] },
    { h2: '۵) نکات تکمیلی' },
    { note: 'برای پشتیبانی و نسخه بعدی، همین پنل را دنبال کنید. هر بهروزرسانی شامل فایل راهنمای جدید نیز هست.' },
    ...extraBlocks,
  ];
  return makeDocx({ title, blocks });
}

// ═══════════════════════════════════════════════════════════════
// «پلنهای پرو» — اشتراک کاربران (تنظیم از سمت مدیریت)
//  هر پلن: قیمت ماهانه + درصد قدرت هوش مصنوعی (ai) + فعال/غیرفعال
//  پیشفرض: بهترین پلن پرو = ۵۰٪ قدرت ادمین (دقیقاً نصف)
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_PRO_PLANS = [
  { key: 'bronze',    label: 'برنزی',   icon: '🥉', price: 199000,  days: 30, ai: 12, active: true, desc: 'شروع سریع — قالب ساده و اصولی، ریسپانسیو کامل' },
  { key: 'silver',    label: 'نقرهای',  icon: '🥈', price: 399000,  days: 30, ai: 20, active: true, desc: 'متعادل — بخشهای بیشتر + خروجیهای متنوعتر' },
  { key: 'gold',      label: 'طلایی',   icon: '🥇', price: 699000,  days: 30, ai: 28, active: true, desc: 'حرفهای — قالب، افزونه و فروشگاهساز کامل' },
  { key: 'vip',       label: 'VIP',     icon: '💎', price: 999000,  days: 30, ai: 36, active: true, desc: 'کامل — همهٔ سازندهها + ویرایش مجدد خروجیها' },
  { key: 'legendary', label: 'لجندری',  icon: '👑', price: 1490000, days: 30, ai: 44, active: true, desc: 'فوقحرفهای — اپ اندروید پیشرفته + سبد خروجیها' },
  { key: 'epic',      label: 'اپیک',    icon: '🔥', price: 1990000, days: 30, ai: 50, active: true, desc: 'قدرتمندترین پرو — ۵۰٪ قدرت هوش مصنوعی ادمین' },
];

/** پلنهای پرو با ادغام تنظیمات ادمین (db.settings.proPlans) */
export function proPlansOf(db) {
  const saved = (db?.settings?.proPlans) || {};
  return DEFAULT_PRO_PLANS.map(p => ({ ...p, ...(saved[p.key] || {}) }));
}

/** قدرت هوش مصنوعی: ادمین = مافوق حرفهای (۱.۰)، کاربر پرو = طبق پلن (پیشفرض حداکثر ۵۰٪) */
export function strengthFor(role, tierKey = 'epic', plan = null) {
  if (role === 'admin') return Math.min(1, 0.55 + 0.45 * (tierOf(tierKey).level / 6));
  const ai = plan && typeof plan.ai === 'number' ? plan.ai : 50;
  return Math.max(0.04, Math.min(1, ai / 100));
}

/** از آرایه فقط به اندازهٔ قدرت هوش مصنوعی بردار (هرچه ضعیفتر، خروجی سادهتر) */
export function cutByDepth(arr, depth, min = 1) {
  if (!Array.isArray(arr)) return arr;
  return arr.slice(0, Math.max(min, Math.ceil(arr.length * Math.max(depth, 0.08))));
}

/** تخمین زمان ساخت (ثانیه) — قبل از ساخت به کاربر اعلام میشود */
export function estimateBuild(kind, depth = 1, seed = 0) {
  const base = { template: 9, plugin: 7, store: 11, app: 10, convert: 8, link: 8 }[kind] || 9;
  const sec = Math.max(4, Math.round((base + 16 * depth + ((seed % 5) - 2)) / 2));
  const lbl = sec < 25 ? `${sec} ثانیه` : `${Math.round(sec / 6)} دقیقه`;
  return { sec, label: lbl, queued: sec < 10 ? 'در صف سریع' : 'در حال پردازش دقیق' };
}

// ═══════════════════════════════════════════════════════════════
// «استایل ریسپانسیوی حرفهای» — بلوک مشترک همهٔ خروجیهای هوش مصنوعی
//  کلاسهای همهٔ سازندهها (قالب/فروشگاه/سایت از لینک/اپ) را پوشش میدهد
//  تا هر خروجی روی موبایل و تبلت بینقص باشد
// ═══════════════════════════════════════════════════════════════
export function proCssExtra(colors = ['#7c5cff', '#22d3ee', '#f472b6'], depth = 1) {
  const [c1, c2] = colors;
  const depthAnim = depth >= 0.6
    ? `@keyframes tlFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@media (hover:hover) and (prefers-reduced-motion:no-preference){
  .card,.pcard,.pd,.tm,.quote,.step,.tier-public{animation:tlFadeUp .55s ease both}
  .card:nth-child(2),.pcard:nth-child(2),.pd:nth-child(2){animation-delay:.06s}
  .card:nth-child(3),.pcard:nth-child(3),.pd:nth-child(3){animation-delay:.12s}
  .card:nth-child(4),.pcard:nth-child(4),.pd:nth-child(4){animation-delay:.18s}
  .card:nth-child(5),.pcard:nth-child(5),.pd:nth-child(5){animation-delay:.24s}
  .card:nth-child(6),.pcard:nth-child(6),.pd:nth-child(6){animation-delay:.3s}
}
@media (hover:hover){.btn{transition:transform .18s,box-shadow .18s}.btn:hover{transform:translateY(-2px)}}`
    : '';
  return `
/* ═══ ریسپانسیوی حرفهای (تولید مشترک هوش مصنوعی اپتم) ═══ */
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{overflow-x:hidden;text-rendering:optimizeLegibility}
.wrap,.inner,.container{max-width:1120px}
img,svg,video{max-width:100%;height:auto}
h1{font-size:clamp(1.6rem,4.6vw,2.6rem);line-height:1.55}
h2{font-size:clamp(1.25rem,3.2vw,1.7rem)}
h3{font-size:clamp(1rem,2.4vw,1.15rem)}

/* ── هدر و ناوبری: همیشه در دسترس ── */
header .wrap,header .inner,header .wr{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
header nav,nav.links,nav.menu{flex-wrap:wrap}
.brand{min-width:0}
.brand b{white-space:nowrap;text-overflow:ellipsis;max-width:52vw;overflow:hidden}

/* ── شبکهها: ستونهای سیال ── */
.g3,.grid,.gal,.prod-grid,.team,.stats,.svc,.cats{border:0}
.g3,.grid,.gal,.prod-grid,.team,.cats{grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr))}
.stats{grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr))}
.pcard,.pd{min-width:0;width:100%}
.pcard b,.pd h4{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.banner-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:14px}
.tm-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:14px}

/* ── فرمها و دکمهها: لمسی و تمامعرض روی موبایل ── */
input,select,textarea,.inp,.input{font-size:16px;max-width:100%}
form.cnt,.form-grid{width:100%}
button,.btn,a.btn{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.row{width:100%}
.row .btn{flex:1 1 auto}

/* ── گالری و تصاویر ── */
.gal .ph,.hero-art{aspect-ratio:4/3;background-size:cover;background-position:center}
.hero-art{display:none}

/* ── پای صفحه ── */
footer .wrap,footer .inner{display:grid;gap:14px}
footer nav{flex-wrap:wrap}

/* ── اسکرولبار و افکتهای ریز ── */
::selection{background:${c1}33}
:focus-visible{outline:2px solid ${c1};outline-offset:2px;border-radius:6px}
${depthAnim}

/* ── موبایل (تا ۷۶۰px) ── */
@media (max-width:760px){
  section{padding:44px 0}
  .hero{padding:60px 0 48px}
  .hero h1{max-width:100%}
  .hero p{max-width:100%;font-size:.95rem}
  header .wrap,header .inner,header .wr{padding-top:8px;padding-bottom:8px}
  header>div{gap:8px}
  .btn,.btn.lg{width:100%}
  nav.links,nav.menu{overflow-x:auto;width:100%;justify-content:flex-start;flex-wrap:nowrap;scrollbar-width:none;padding-bottom:4px}
  nav.links::-webkit-scrollbar,nav.menu::-webkit-scrollbar{display:none}
  nav.links a,nav.menu a{white-space:nowrap;flex:0 0 auto}
  .banner-wrap{grid-template-columns:1fr}
  .banner{padding:22px 18px}
  .pcard .pimg,.pd .pimg{aspect-ratio:1/1.15}
  .pcard .addbtn,.pd .buy{width:100%;margin-top:8px}
  .footer-cols,.cols{grid-template-columns:1fr 1fr!important}
  .quote{padding:20px 16px}
  .faq details{padding:13px 14px}
  .hours{max-width:100%}
  .hero-cta{flex-direction:column;align-items:stretch;gap:10px}
  .steps-row{grid-template-columns:1fr}
  .why-grid,.tier-grid,.grid-products{grid-template-columns:1fr!important}
}

/* ── تبلت (۷۶۱ تا ۱۰۲۴px) ── */
@media (min-width:761px) and (max-width:1024px){
  .wrap,.inner,.container{padding-inline:22px}
  .hero h1{max-width:26rem}
}

/* ── تلفنهای خیلی کوچک ── */
@media (max-width:420px){
  .g3,.grid,.gal,.team{grid-template-columns:1fr}
  h1{font-size:1.45rem}
  .stats{grid-template-columns:repeat(2,1fr)}
  .svc{grid-template-columns:1fr}
  .cta-band{padding:26px 18px}
}

/* ── دسترسیپذیری: کاهش حرکت ── */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  html{scroll-behavior:auto}
}
`;
}

// ═══════════════════════════════════════════════════════════════
// «خروجیهای متنوع» — با یک پرامپت، نسخههای متفاوت بده (seed متفاوت)
// ═══════════════════════════════════════════════════════════════
const HERO_VARIANTS = {
  restaurant: [
    ['تجربهای که طعمش میماند', 'طعمی که به {b} برمیگردی', 'سفرهٔ خوشمزهٔ {b}'],
    ['سرآشپزهای ما منتظر شما هستند؛ بهترین مواد تازه در فضایی دلنشین.', 'از پیشغذا تا دسر، هر لقمه حکایت تازهای دارد.'],
  ],
  shop: [
    ['خرید آنلاین از {b}', '{b}؛ بازار آنلاین تو', 'هرچی بخواهی، از {b}'],
    ['هزاران کالای اصل با ارسال اکسپرس و قیمت رقابتی.', 'تنوعی که حیرتزدهات میکند؛ با ضمانت و پشتیبانی واقعی.'],
  ],
  corporate: [
    ['{b} — همراه مطمئن کسبوکار شما', 'رشد سازمان شما، مأموریت ماست'],
    ['بیش از یک دهه تجربه در کنار تیمی از متخصصان حوزه.', 'راهکارهای سازمانی که نتیجه را تضمین میکنند.'],
  ],
  portfolio: [
    ['سلام، {b} هستم', 'آثار {b} — یک دنیا خلاقیت'],
    ['طراح و توسعهدهندهای که عاشق ساختن تجربههای ماندگار است.', 'هر پروژه، یک داستان متفاوت.'],
  ],
  landing: [
    ['{b} — آینده کار تو اینجاست', '{b}؛ سادهتر از همیشه'],
    ['ابزاری که کارهای تکراری را خودکار میکند و به تیمت سرعت میدهد.', 'همین امروز رایگان شروع کن؛ بعداً پشیمان نمیشوی.'],
  ],
  agency: [
    ['{b}؛ جایی که برندها بزرگ میشوند', 'خلاقیت + استراتژی = رشد {b}'],
    ['تیم خلاق ما با استراتژی دقیق، رشد برند شما را رقم میزند.', 'کمپینهایی که دیده میشوند و میفروشند.'],
  ],
  clinic: [
    ['{b} — سلامتی شما، اولویت ماست', 'درمان مطمئن، با تیم {b}'],
    ['بهترین پزشکان متخصص با تجهیزات روز دنیا در محیطی آرام.', 'نوبتدهی آنلاین، بدون معطلی.'],
  ],
};
export function varySpec(spec, seed = 0) {
  const s = JSON.parse(JSON.stringify(spec));
  const TY = HERO_VARIANTS[s.type] || HERO_VARIANTS.shop;
  const [hs, ps] = TY;
  const i = Math.abs(seed) % hs.length;
  s.heroTitle = String(hs[i]).replace('{b}', s.brand);
  s.heroSub = ps[Math.abs(seed) % ps.length];
  // چرخش بخشها + پالت اکسنت متفاوت
  const secs = s.sections || [];
  const rot = Math.abs(seed) % Math.max(1, secs.length);
  s.sections = [...secs.slice(rot), ...secs.slice(0, rot)];
  if (seed % 2 === 1) s.palette = [s.palette[1], Math.abs(seed) % 3 === 1 ? s.palette[0] : s.palette[2], s.palette[2]];
  s.variation = seed;
  return s;
}

// ═══════════════════════════════════════════════════════════════
// «موتور ویرایش فارسی» — دستور ویرایش را میفهمد و اعمال میکند
//   «رنگ اصلی را آبی کن» / «نام برند شود کیان» / «بخش گالری اضافه کن»
//   «حالت تیره» / «سبک لوکس» / «شعار: تجربهای متفاوت»
// ═══════════════════════════════════════════════════════════════
const EDIT_COLORS = [
  ['red', ['قرمز', 'لاکی', 'سرخ'], ['#ef4444', '#7f1d1d']],
  ['blue', ['آبی', 'ابی', 'سرمهای'], ['#3b82f6', '#1e3a8a']],
  ['green', ['سبز'], ['#22c55e', '#14532d']],
  ['purple', ['بنفش'], ['#8b5cf6', '#4c1d95']],
  ['pink', ['صورتی'], ['#ec4899', '#831843']],
  ['orange', ['نارنجی'], ['#f97316', '#7c2d12']],
  ['teal', ['فیروزهای', 'فیروزه', 'ترکواز'], ['#14b8a6', '#134e4a']],
  ['goldc', ['طلایی', 'طلا'], ['#f59e0b', '#78350f']],
  ['brown', ['قهوهای', 'قهوه'], ['#b45309', '#442811']],
  ['navy', ['سرمه', 'نیلی'], ['#2563eb', '#172554']],
  ['black', ['مشکی', 'سیاه'], ['#525252', '#111111']],
  ['cyan', ['سایان', 'فیروزهای روشن'], ['#06b6d4', '#164e63']],
];
const EDIT_MODES = [['neon', 'نئون'], ['glass', 'گلاس'], ['minimal', 'مینیمال'], ['brutal', 'بروتال', 'بروتالیست'], ['luxe', 'لوکس'], ['cyber', 'سایبر'], ['aurora', 'اورورا'], ['editorial', 'ادیتوریال']];

export function applyEdit(spec, editText) {
  const t = String(editText || '').trim();
  try { return applyEditInner(spec, t); } catch (e) { return { spec: JSON.parse(JSON.stringify(spec || {})), notes: ['ویرایش ساده اعمال شد'], varied: true }; }
}

function applyEditInner(spec, t) {
  const s = JSON.parse(JSON.stringify(spec));
  const notes = [];
  if (!t) return { spec: s, notes: ['بدون دستور؛ نسخهٔ تازه ساختم'], varied: true };
  // ۱) رنگ
  for (const [k, words, hex] of EDIT_COLORS) {
    if (words.some(w => t.includes(w))) { s.palette = [...hex, s.palette[2] || '#f59e0b']; notes.push(`پالت ${k}`); break; }
  }
  // ۲) حالت تیره/روشن
  if (/(تیره|دارک|شب)/.test(t)) { s.dark = true; notes.push('حالت تیره'); }
  else if (/(روشن|روز)/.test(t)) { s.dark = false; notes.push('حالت روشن'); }
  // ۳) سبک طراحی
  for (const [k, ...ws] of EDIT_MODES) if (ws.some(w => t.includes(w))) { s.mode = k; notes.push(`سبک ${k}`); break; }
  // ۴) نام برند (در گیومه یا بعد از «نام»/«برند»)
  const qm = t.match(/[«"]([^»"]{2,40})[»"]/);
  if (/نام|برند/.test(t) && qm) { s.brand = qm[1]; notes.push(`برند: ${qm[1]}`); }
  else if (qm && !/رنگ|پالت/.test(t) && notes.length === 0) { s.brand = qm[1]; notes.push(`برند: ${qm[1]}`); }
  // ۵) بخشها
  const secMap = { گالری: 'gallery', 'نظرات': 'testimonials', 'نظر': 'testimonials', 'سوال': 'faq', 'سوالات': 'faq', تیم: 'team', تعرفه: 'pricing', بلاگ: 'blog', 'ساعت کاری': 'hours', 'ساعات کاری': 'hours', خبرنامه: 'newsletter', 'درباره': 'about' };
  if (/(اضافه|افزودن|بیاور|بذار|بگذار|بساز|کاملش کن|بیشتر)/.test(t)) {
    for (const [w, sec] of Object.entries(secMap)) {
      if (t.includes(w) && !(s.sections || []).includes(sec)) { s.sections = [...(s.sections || []), sec]; notes.push(`بخش ${w}`); }
    }
  }
  if (/(حذف|بردار|کم کن)/.test(t)) {
    for (const [w, sec] of Object.entries(secMap)) {
      if (t.includes(w)) { s.sections = (s.sections || []).filter(x => x !== sec); notes.push(`حذف بخش ${w}`); }
    }
  }
  // ۶) شعار/تیتر جدید
  const sh = t.match(/(?:شعار|تیتر|عنوان|اسلوگان)[:：\s]+(.{4,90})/);
  if (sh) { s.heroTitle = sh[1].trim(); s.heroSub = s.heroSub || 'نسخهٔ ویرایششده با دستور شما'; notes.push('شعار جدید'); }
  // ۷) بدون کلیدواژه → خلاقیت: یک شعار از خودمان بساز + نسخهٔ متفاوت
  if (notes.length === 0) {
    const creative = t.length > 3 ? ` «${t.slice(0, 60)}»` : '';
    s.heroTitle = `${s.brand}${creative} — نسخهٔ جدید`;
    s.heroSub = 'این نسخه با سلیقهٔ هوش مصنوعی اپتم بازآرایی شده؛ هر وقت خواستی باز هم تغییرش بده.';
    notes.push('چیدمان و متنها بازآرایی شد');
  }
  return { spec: s, notes, varied: true };
}
