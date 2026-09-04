// ═══ Aura Intelligence Engine — لایه هوشمندی نسل بعد ═══
// بدون وابستگی اجباری به سرویس خارجی: تحلیل معنایی/UX/SEO/Performance و تولید brief اجرایی.
// در صورت اتصال مدل خارجی در آینده، این لایه به‌عنوان pre/post processor قابل استفاده است.
const norm = s => String(s || '').replace(/[\u200c\u200f]/g, ' ').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim();

const RULES = [
  ['فروشگاه', /(فروشگاه|فروش آنلاین|محصول|سبد خرید|ووکامرس|دیجی)/i, 12],
  ['تبدیل', /(تبدیل|ارتقا|بازطراحی|redesign|migration)/i, 8],
  ['رزرو', /(رزرو|نوبت|تقویم|appointment|booking)/i, 8],
  ['محتوا', /(وبلاگ|مجله|مقاله|خبر|محتوا)/i, 7],
  ['SaaS', /(saas|سرویس|اشتراک|داشبورد|پنل)/i, 8],
  ['مارکت‌پلیس', /(مارکت|فروشنده|فروشندگان|marketplace)/i, 9],
];

const STYLE_RULES = [
  ['neon', /(نئون|نئونی|neon)/i], ['glass', /(گلاس|شیشه|glassmorphism)/i],
  ['minimal', /(مینیمال|minimal|ساده|خلوت)/i], ['brutal', /(بروتال|brutal)/i],
  ['luxe', /(لوکس|لاکچری|luxury|طلایی)/i], ['cyber', /(سایبر|cyber|فناورانه)/i],
  ['aurora', /(اورورا|پاستل|نرم|شاد)/i], ['editorial', /(ادیتوریال|مجله‌ای|editorial)/i],
];

const SECURITY = /(ورود|ثبت ?نام|کاربر|حساب|پرداخت|درگاه|پنل|رمز|احراز)/i;
const SEO = /(سئو|seo|گوگل|جستجو|schema|متا)/i;
const ACCESS = /(دسترسی|accessibility|کنتراست|کیبورد|صفحه‌خوان)/i;
const PERFORMANCE = /(سریع|سرعت|بهینه|performance|lighthouse|core web vitals)/i;

export function analyzeIntelligence(raw, kind = 'template', tier = 'gold') {
  const text = norm(raw);
  const intents = RULES.filter(([, re]) => re.test(text)).map(([n]) => n);
  const style = STYLE_RULES.find(([, re]) => re.test(text))?.[0] || (
    kind === 'store' ? 'minimal' : kind === 'app' ? 'glass' : 'aurora'
  );
  const requirements = [];
  if (!/(موبایل|ریسپانسیو|responsive)/i.test(text)) requirements.push('ریسپانسیو موبایل‌محور');
  if (!SECURITY.test(text) && ['store','plugin','app'].includes(kind)) requirements.push('احراز هویت و کنترل دسترسی');
  if (!SEO.test(text) && ['template','store','link'].includes(kind)) requirements.push('SEO + OpenGraph + Schema');
  if (!ACCESS.test(text)) requirements.push('دسترسی‌پذیری WCAG و ناوبری کیبورد');
  if (!PERFORMANCE.test(text)) requirements.push('بهینه‌سازی Core Web Vitals');
  if (!/(انیمیشن|موشن|motion|animation)/i.test(text)) requirements.push('micro-interactionهای کنترل‌شده');
  if (!/(فیلتر|جستجو|sort|مرتب)/i.test(text) && kind === 'store') requirements.push('جستجوی سریع + فیلتر چندلایه');
  if (!/(خطا|اعتبارسنج|validation)/i.test(text)) requirements.push('اعتبارسنجی فرم و خطاهای قابل فهم');

  const explicit = Math.min(100, Math.round(
    35 + Math.min(35, text.length / 8) + intents.length * 4 +
    (/(برند|رنگ|تم|فونت)/i.test(text) ? 7 : 0) +
    (/(صفحه|بخش|منو|گالری|قیمت|نظر)/i.test(text) ? 7 : 0)
  ));
  const score = Math.min(100, explicit + (tier === 'epic' ? 6 : tier === 'legendary' ? 4 : tier === 'vip' ? 2 : 0));

  const architecture = {
    mobileFirst: true,
    semanticHtml: true,
    designTokens: true,
    rtlReady: true,
    darkMode: true,
    reducedMotion: true,
    keyboardNavigation: true,
    lazyMedia: true,
    seoReady: SEO.test(text) || ['template','store','link'].includes(kind),
  };

  const improvedPrompt = [
    text || 'یک پروژه حرفه‌ای طراحی کن',
    `سبک طراحی: ${style}.`,
    'خروجی باید production-ready، RTL، mobile-first و دارای Design System یکپارچه باشد.',
    'UX را بر اساس سلسله‌مراتب بصری، حالات loading/empty/error/success و micro-interactionهای ظریف طراحی کن.',
    requirements.length ? 'نیازهای تکمیلی: ' + requirements.join('، ') + '.' : '',
  ].filter(Boolean).join(' ');

  return {
    score, confidence: Math.min(99, 72 + Math.min(24, intents.length * 5) + (text.length > 80 ? 3 : 0)),
    style, intents, requirements, architecture, improvedPrompt: improvedPrompt.slice(0, 1600),
    recommendations: [
      'ساختار کامپوننتی و Design Token محور',
      'حالات loading / empty / error / success برای تمام تعاملات',
      'تمرکز روی Core Web Vitals و کاهش JavaScript غیرضروری',
      'دسترسی‌پذیری: focus-visible، aria، keyboard و کنتراست مناسب',
    ],
  };
}

export function enrichSpec(spec, intelligence) {
  const next = { ...spec };
  if (!next.mode && intelligence?.style) next.mode = intelligence.style;
  if (intelligence?.style && (!spec.prompt || !new RegExp(intelligence.style, 'i').test(spec.prompt))) next.prompt = `${spec.prompt || ''} ${intelligence.improvedPrompt}`.trim().slice(0, 1800);
  return next;
}
