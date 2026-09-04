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
