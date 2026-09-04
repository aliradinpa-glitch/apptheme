// ═══════════════════════════════════════════════════════════════
// «تبدیل قالب» — قالب خام (ZIP) را میگیرد، هوش مصنوعی تحلیل میکند
// و نسخهٔ حرفهایتر (برای پلتفرم درخواستی) میسازد
// ═══════════════════════════════════════════════════════════════
import { unzip, analyzeTemplate, detectPlatform } from './zipx.js';
import { parsePrompt, generateFromSpec } from './promptgen.js';
import { makeDocx } from './docx.js';
import { tierOf } from './gencore.js';

const PLATFORM_LABELS = { html: 'HTML/CSS', wordpress: 'وردپرس', woocommerce: 'ووکامرس', django: 'جنگو', node: 'نود جیاس', unknown: 'نامشخص' };

/** تحلیل قالب: فایل ZIP → مشخصات */
export function analyzeUpload(zipBuf) {
  const files = unzip(zipBuf);
  const analysis = analyzeTemplate(files);
  return { ...analysis, files };
}

/** تبدیل: تحلیل + ساخت نسخهٔ حرفهای (بر اساس سطح انتخابی + پلتفرم خروجی) */
export function convertTemplate(zipBuf, { tierKey = 'gold', target = '', brand = '', prompt = '' } = {}) {
  const analysis = analyzeUpload(zipBuf);
  const tier = tierOf(tierKey);
  const detected = analysis.platform === 'unknown' ? 'html' : analysis.platform;
  const targetP = (target && PLATFORM_LABELS[target] ? target : detected);
  // پرامپت هوش مصنوعی: مشخصات واقعی قالب آپلودشده
  const aiPrompt = [
    prompt || '',
    `سایت با برند "${brand || analysis.brand}"`,
    `پالت رنگ: ${analysis.palette.join(' / ')}`,
    analysis.pageCount ? `${analysis.pageCount} صفحه»` : '',
    `سطح ${tier.icon} ${tier.label} — بخشهای بیشتر و افکتهای حرفهای`,
    `خروجی: ${PLATFORM_LABELS[targetP]}`,
  ].filter(Boolean).join(' — ');
  const spec = parsePrompt(aiPrompt);
  spec.palette = analysis.palette;
  spec.brand = (brand || analysis.brand).slice(0, 34);
  spec.youtube = false;
  // خروجی HTML حرفهای (برای وردپرس/ووکامرس، صفحهٔ شروع قابل بارگذاری را هم میدهیم)
  const gen = generateFromSpec(spec, { styleInline: false });
  const css = gen.style;
  const home = gen.home;
  const guide = makeDocx({
    title: `راهنمای قالب تبدیلشده «${spec.brand}»`,
    blocks: [
      { h1: `قالب «${spec.brand}» — نسخهٔ تبدیلشده با هوش مصنوعی` },
      { p: `قالب شما آپلود شد (${analysis.pageCount} صفحه، ${analysis.sizeKB} کیلوبایت، پلتفرم مبدأ: ${PLATFORM_LABELS[detected]}). هوش مصنوعی اپتم آن را تحلیل کرد و نسخهٔ جدید با سطح «${tier.icon} ${tier.label}» ساخت: طراحی مدرنتر، مودالها، فیلترها و انیمیشنهای جدید.` },
      { h2: 'تحلیل قالب قبلی' },
      { table: { head: ['مورد', 'قبلی'], rows: [['برند', analysis.brand], ['پالت', analysis.palette.join(' ، ')], ['صفحات', String(analysis.pageCount)], ['سایز', analysis.sizeKB + ' کیلوبایت'], ['پلتفرم مبدأ', PLATFORM_LABELS[detected]]] } },
      { h2: 'چه چیزهایی ارتقا پیدا کرد؟' },
      { list: ['کاملتر شدن صفحات (هدر جدید، فوتر کامل، بخشها)', 'افکتها: نئون/گلاس/بروتال مطابق سطح', 'مودال و اعلانهای حرفهای', 'فیلتر و جستجوی محصولات (در نسخههای بالاتر)', 'کد تمیزتر و ریسپانسیو دقیق'] },
      { h2: 'نصب' },
      ...(targetP === 'wordpress' || targetP === 'woocommerce'
        ? [{ img: { kind: 'theme-install', cap: 'وردپرس: نمایش → پوستهها → بارگذاری', step: 1 } }, { list: ['پوسته ZIP را در وردپرس بارگذاری کنید', 'فعالسازی کنید', 'از سفارشیساز رنگها را تنظیم کنید'] }]
        : [{ img: { kind: 'php-upload', cap: 'بارگذاری فایلها روی هاست', step: 1 } }, { list: ['فایلها را در public_html آپلود کنید', 'index.html را باز کنید', 'رنگها را از style.css عوض کنید'] }]),
      { note: `پلتفرم خروجی: ${PLATFORM_LABELS[targetP]} — اگر خواستید به پلتفرم دیگری تبدیل شود، دوباره با انتخاب پلتفرم هدف، تبدیل را اجرا کنید.` },
    ],
  });
  const files = [
    { name: 'index.html', data: home },
    { name: 'css/style.css', data: css },
    { name: 'about.html', data: gen.about },
    { name: 'contact.html', data: gen.contact },
    { name: 'پیشنمایش-قبلی.txt', data: `قابل تحویل قبلی:\n${(analysis.pages || []).join('\n')}` },
    { name: 'تغییرات-ارتقا.txt', data: `TITLE: ${spec.brand}\nSOURCE: ${analysis.brand} (${analysis.pageCount} صفحات)\nTIER: ${tier.label}\nFROM: ${PLATFORM_LABELS[detected]} → TO: ${PLATFORM_LABELS[targetP]}\nPALETTE: ${analysis.palette.join(',')}\n\nچه چیزهایی عوض شد؟\n- طراحی پوسته به ${tier.label} ارتقا یافت (بخشها: بهروزتر)\n- هدر/فوتر حرفهای و ریسپانسیو\n- رنگها: ${analysis.palette.join(',')}` },
    { name: 'راهنمای قالب (Word).docx', data: guide },
  ];
  return { files, spec, analysis, tier, targetP, zipName: `${spec.brand.replace(/\s+/g, '-')}-converted.zip` };
}
