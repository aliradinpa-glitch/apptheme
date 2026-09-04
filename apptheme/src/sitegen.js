// ═══════════════════════════════════════════════════════════════
// موتور «سایتساز از لینک» — لینک میگیرد، سایت را تحلیل میکند
// و نسخهای حرفهای از آن را میسازد (شبیه دیجیکالا و هر سایت دیگر)
// ═══════════════════════════════════════════════════════════════
import { generateFromSpec, parsePrompt, MODE_LABELS } from './promptgen.js';
import { makeDocx } from './docx.js';
import { proCssExtra } from './gencore.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
// بدون وابستگی به سرویسهای خارجی: فقط اتصال مستقیم (اگر سایت بلاک بود، پیام شفاف فارسی میدهد)

async function fetchText(url) {
  let lastErr = 'no network';
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
      clearTimeout(to);
      if (!r.ok) { lastErr = 'HTTP ' + r.status; continue; }
      const t = await r.text();
      if (t && t.length > 400) return t;
      lastErr = 'پاسخ خالی';
    } catch (e) { lastErr = e.message; clearTimeout(to); }
  }
  throw new Error('دسترسی به سایت ممکن نشد (' + lastErr + '). این سرویس فقط خودِ سایت مقصد را میخواند (بدون سرویس خارجی)؛ اگر سایت قطع یا بلاک است، به‌جای لینک از «قالب‌ساز» یا «تبدیل قالب» استفاده کن.');
}

// ─── استخراج سیگنالهای استایل از HTML سایــت ───
function extractSignals(html, url) {
  const brand = (() => {
    const t = /<title[^>]*>([^<]{2,140})<\/title>/i.exec(html);
    if (t) { const c = t[1].trim().split(/[-–|·—]| \| /)[0].trim(); if (c.length >= 2) return c.slice(0, 34); }
    try { return new URL(url).hostname.replace(/^www\./, '').split('.')[0].slice(0, 34); } catch { return 'سایت من'; }
  })();
  const colors = new Map();
  const hex = (s) => { const m = String(s).match(/#[0-9a-fA-F]{3,8}\b/g); if (m) for (const raw of m) { const c = raw.length >= 6 ? raw.slice(1, 7) : [...raw.slice(1)].map(x => x + x).join(''); colors.set(c.toLowerCase(), (colors.get(c.toLowerCase()) || 0) + 1); } };
  const cssLinks = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"[^>]*>/gi)].map(m => m[1]);
  const inlineStyles = [...html.matchAll(/style="([^"]{10,400})"/gi)].map(m => m[1]).join(' ');
  hex(html.slice(0, 200000)); hex(inlineStyles);
  let primary = '#7c5cff', secondary = '#22d3ee', accent = '#f59e0b';
  const bgPref = /(?:background(?:-color)?:|bg-)\s*#(f[0-9a-f]{5}|e[0-9a-f]{5})/i.exec(inlineStyles + ' ' + html.slice(0, 60000));
  const light = bgPref ? true : /(background: *(white|#fff)|background-color: *(white|#fff))/i.test(html.slice(0, 60000));
  // انتخاب رنگها: رایجترین رنگهای غیرخنثی
  const neutrals = new Set(['000000', 'ffffff', 'f5f5f5', 'fafafa', 'f8f8f8', 'f9fafb', 'f3f4f6', 'e5e7eb', 'd1d5db', '9ca3af', '6b7280', '4b5563', '374151', '1f2937', '111827', '0f172a', '1e293b', '334155', '475569', '94a3b8', 'cbd5e1', 'e2e8f0', 'f1f5f9', 'ef4444', 'dc2626', '0ea5e9', '2563eb', '16a34a', 'f59e0b', 'eab308']);
  const ranked = [...colors.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(c => !neutrals.has(c));
  if (ranked.length >= 1) primary = '#' + ranked[0];
  if (ranked.length >= 2) secondary = '#' + ranked[1];
  if (ranked.length >= 3) accent = '#' + ranked[2];
  // ابعاد و ساختار
  const hasBanner = /(banner|hero|slider|carousel)/i.test(html) || html.includes('swiper') || html.includes('slick');
  const hasNav = /(header|navbar|nav-bar|top-nav)/i.test(html);
  const hasCards = /(product-card|card-|item-box|product-box)/i.test(html);
  const hasFooter = /<footer/i.test(html);
  const isDark = /(background[^;]*#0[0-9a-f]{5}|dark-|\[data-theme="dark"\])/i.test(html.slice(0, 60000));
  const fonts = [...new Set([...html.matchAll(/font-family:\s*([^;"}]{4,80})/gi)].map(m => m[1].trim().split(',')[0].replace(/['"]/g, '')).filter(f => f && !/system|sans|serif|ui-|inherit/i.test(f)))].slice(0, 3);
  const rad = (html.match(/border-radius:\s*(\d{1,2})px/g) || []).map(m => parseInt(m.match(/\d+/)[0], 10));
  const radius = rad.length ? Math.round(rad.sort((a, b) => a - b)[Math.floor(rad.length / 2)]) : 14;
  // نوع سایت از متن
  const text = (html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  let type = 'shop';
  if (/restaurant|caf[eé]|menu|reserv|order food/i.test(text)) type = 'restaurant';
  else if (/clinic|dental|doctor|patient/i.test(text)) type = 'clinic';
  else if (/portfolio|photograph|designer|showcase/i.test(text)) type = 'portfolio';
  else if (/agency|marketing|creative studio|digital agency/i.test(text)) type = 'agency';
  else if (/school|education|university|course/i.test(text)) type = 'edu';
  else if (/travel|tour|trip|hotel/i.test(text)) type = 'travel';
  else if (/news|blog|article|magazine/i.test(text)) type = 'blog';
  else if (/company|corporate|about us|team/i.test(text)) type = 'corporate';
  else if (/api|saas|app|software/i.test(text)) type = 'landing';
  else type = 'shop';
  const mode = (() => {
    if (/glass|glassmorphism|backdrop-filter/i.test(html)) return 'glass';
    if (/neon|glow:|text-shadow/i.test(html)) return 'neon';
    if (/brutal|uppercase.*font-weight: *[89]00/i.test(html)) return 'brutal';
    if (/gold|#d4af37/i.test(html)) return 'luxe';
    if (/pastel|#fbcfe8|#ddd6fe/i.test(html)) return 'aurora';
    return 'glass';
  })();
  return { brand, palette: [primary, secondary, accent], light: !isDark, mode, radius, hasBanner, hasNav, hasCards, hasFooter, fonts, type, lang: 'fa' };
}

// ─── وبسایت خروجی: فروشگاه دیجیکالا-گونه با قابلیت کامل ───
function digiPage(sig, { inner = '', ctaLabel = 'افزودن به سبد', depth = 1 } = {}) {
  const [c1, c2, ac] = sig.palette;
  const cards = Array(8).fill(0).map((_, i) => {
    const imgs = [
      `linear-gradient(135deg,${c1}${66 - i * 5 > 20 ? 66 - i * 5 : 25}cc,${c2}cc)`,
      `linear-gradient(160deg,${c2}cc,${ac}cc)`,
      `linear-gradient(200deg,${c1}cc,${ac}99)`,
    ][i % 3];
    return `<div class="pcard"><div class="pimg" style="background:${imgs}"><span class="ph">${['📱','🎧','⌚','💻','🎮','📷','🔊','🧺'][i]}</span>${i % 3 === 0 ? '<span class="off">٪' + (5 + i * 4) + ' تخفیف</span>' : ''}</div><div class="pbody"><h4>${['هدفون بیسیم پرو', 'ساعت هوشمند X2', 'اسپیکر بلوتوثی', 'کیف چرمی', 'ماوس گیمینگ', 'دوربین دیجیتال', 'پاوربانک ۲۰هزار', 'کولهپشتی شهری'][i]}</h4><div class="rate">★ ${(4 + (i % 10) / 10).toFixed(1)} <small>(${120 + i * 37} نظر)</small></div><div class="pr"><b>${(1200000 + i * 380000).toLocaleString('fa-IR')}</b><span>تومان</span></div><button class="addbtn">${ctaLabel}</button></div></div>`;
  }).join('');
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${sig.brand} | فروشگاه اینترنتی</title>
<meta name="description" content="${sig.brand} — فروشگاه اینترنتی با تنوع کامل، ارسال سریع و ضمانت اصالت کالا">
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Vazirmatn,Tahoma,sans-serif;background:#f2f3f7;color:#1e2244;direction:rtl;line-height:1.9}
a{text-decoration:none;color:inherit}ul{list-style:none}button{font-family:inherit;cursor:pointer}
.hdr{position:sticky;top:0;z-index:50;background:#fff;box-shadow:0 2px 14px rgba(30,34,68,.08)}
.top-line{background:linear-gradient(90deg,${c1},${c2},${c1});height:4px}
.inner{max-width:1280px;margin:auto;padding:0 18px}
.hrow{display:flex;align-items:center;gap:16px;height:64px}
.logo{font-size:1.15rem;font-weight:900;color:${c1};display:flex;align-items:center;gap:8px}
.logo i{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,${c1},${c2});color:#fff;display:grid;place-items:center;font-style:normal}
.search{flex:1;display:flex;max-width:640px;margin:auto;border:1.6px solid ${c1};border-radius:12px;overflow:hidden}
.search input{flex:1;border:0;padding:11px 14px;font:inherit;outline:none}
.search button{background:linear-gradient(90deg,${c1},${c2});color:#fff;border:0;padding:0 22px;font-weight:700}
.hacts{display:flex;gap:8px;align-items:center}
.hbtn{border:1px solid #e3e5ef;border-radius:11px;padding:7px 12px;font-size:.83rem;background:#fff;white-space:nowrap}
.hbtn.b{padding:11px 26px;border:0;color:#fff;font-weight:800;border-radius:12px;background:linear-gradient(90deg,${c1},${c2})}
.cats{display:flex;gap:4px;padding:10px 0;overflow-x:auto;background:#fff}
.cats a{padding:8px 14px;border-radius:999px;font-size:.86rem;white-space:nowrap;color:#5c6382}
.cats a:hover{background:#f0f0fa;color:${c1}}
.cats a.on{background:${c1}1a;color:${c1};font-weight:700}
.hero{background:linear-gradient(135deg,${c1},${c2});color:#fff;text-align:center;padding:52px 18px 58px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(400px 200px at 90% -10%,rgba(255,255,255,.25),transparent 60%),radial-gradient(300px 200px at 5% 110%,rgba(255,255,255,.18),transparent 60%)}
.hero h1{font-size:1.9rem;margin-bottom:10px;position:relative}
.hero p{opacity:.92;position:relative;margin-bottom:20px}
.hero .sbtn{background:#fff;color:${c1};border:0;border-radius:999px;padding:12px 30px;font-weight:800;font-size:.95rem;position:relative}
.sec{padding:26px 0}
.sech{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.sech h2{font-size:1.15rem;font-weight:800;display:flex;align-items:center;gap:8px}
.sech h2::before{content:'';width:5px;height:22px;border-radius:3px;background:linear-gradient(180deg,${c1},${c2})}
.sech a{color:${c1};font-size:.85rem;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:14px}
.pcard{background:#fff;border-radius:14px;overflow:hidden;transition:.25s;border:1px solid #ecedf4}
.pcard:hover{transform:translateY(-4px);box-shadow:0 16px 36px rgba(30,34,68,.12)}
.pimg{aspect-ratio:1;display:grid;place-items:center;position:relative}
.ph{font-size:3rem;filter:drop-shadow(0 8px 16px rgba(0,0,0,.2))}
.off{position:absolute;top:10px;inset-inline-start:10px;background:${ac};color:#fff;font-size:.72rem;font-weight:800;padding:3px 9px;border-radius:999px}
.pbody{padding:12px 14px 16px}
.pbody h4{font-size:.9rem;font-weight:700;min-height:2.8em}
.rate{color:${ac};font-size:.78rem;margin:4px 0}
.rate small{color:#9aa0b8}
.pr{display:flex;align-items:baseline;gap:5px;margin:6px 0 10px;color:#1e2244}
.pr b{font-size:1.05rem}
.pr span{font-size:.74rem;color:#9aa0b8}
.addbtn{width:100%;border:1.6px solid ${c1};color:${c1};background:#fff;border-radius:10px;padding:8px;font-weight:700;transition:.2s}
.addbtn:hover{background:${c1};color:#fff}
.banner-wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.banner{border-radius:16px;padding:26px;color:#fff;position:relative;overflow:hidden}
.banner h3{font-size:1.1rem;margin-bottom:6px}.banner p{font-size:.84rem;opacity:.9}.banner b{display:inline-block;margin-top:12px;background:#fff;color:#1e2244;padding:7px 18px;border-radius:999px;font-size:.8rem}
.svc{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.svc div{background:#fff;border:1px solid #ecedf4;border-radius:14px;padding:16px;display:flex;gap:12px;align-items:center;font-size:.88rem}
.svc i{width:44px;height:44px;flex-shrink:0;border-radius:12px;display:grid;place-items:center;font-size:1.25rem;font-style:normal;background:${c1}1a;color:${c1}}
footer{background:#23264a;color:#c8cbe6;margin-top:36px}
.ftr{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:26px;padding:42px 0 26px}
footer h4{color:#fff;margin-bottom:12px;font-size:.92rem}
footer li{margin-bottom:9px;font-size:.84rem}
.fnav{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;border-top:1px solid #3a3e66;padding:14px 0;font-size:.78rem}
.enamad{display:flex;gap:10px}.enamad span{border:1px solid #3a3e66;border-radius:10px;padding:8px 16px;font-size:.74rem}
@media(max-width:860px){.search{display:none}.hbtn{display:none}.ftr{grid-template-columns:1fr 1fr}.hero h1{font-size:1.4rem}.grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}}
${proCssExtra(sig.palette, depth)}</style></head><body>
<header class="hdr"><div class="top-line"></div><div class="inner hrow">
  <a class="logo" href="#"><i>${sig.brand.trim().charAt(0)}</i>${sig.brand}</a>
  <div class="search"><input placeholder="جستجو در ${sig.brand}…"><button>🔍 جستجو</button></div>
  <div class="hacts"><a class="hbtn" href="#">👤 ورود | ثبتنام</a><a class="hbtn" href="#">🛒 سبد خرید</a><a class="hbtn b" href="#">🏷️ فروش ویژه</a></div>
</div><div class="inner"><nav class="cats">
  <a class="on" href="#">خانه</a><a href="#">موبایل</a><a href="#">لپتاپ</a><a href="#">صوتی</a><a href="#">پوشاک</a><a href="#">خانه</a><a href="#">ورزشی</a><a href="#">آرایشی</a><a href="#">کتاب</a><a href="#">اسباببازی</a>
</nav></div></header>
<section class="hero"><h1>به ${sig.brand} خوش آمدید 🛍️</h1><p>ارسال سریع | ضمانت اصالت کالا | ۷ روز بازگشت بدون قید و شرط</p><button class="sbtn">مشاهده محصولات</button></section>
${inner}
<footer><div class="inner ftr">
  <div><h4>${sig.brand}</h4><p style="font-size:.84rem">فروشگاه اینترنتی با هدف ارائه کالای اصیل و ارسال سریع؛ رضایت شما، اعتبار ماست.</p><div class="enamad" style="margin-top:14px"><span>🏅 نماد اعتماد</span><span>🔒 پرداخت امن</span></div></div>
  <div><h4>خدمات مشتریان</h4><ul><li>پیگیری سفارش</li><li>رویه بازگشت کالا</li><li>شرایط ارسال</li><li>سوالات متداول</li></ul></div>
  <div><h4>درباره ${sig.brand}</h4><ul><li>داستان ما</li><li>فرصتهای شغلی</li><li>تماس با ما</li><li>حریم خصوصی</li></ul></div>
  <div><h4>📞 پشتیبانی</h4><ul><li>۰۲۱-۹۱۰۰۰۰۰۰</li><li>۷ روز هفته، ۹ تا ۲۱</li><li>support@email.com</li></ul></div>
</div><div class="inner fnav"><span>© ۱۴۰۳ ${sig.brand} — تمامی حقوق محفوظ است</span><span>طراحیشده با قالبساز هوشمند اپتم</span></div></footer>
</body></html>`;
}

// ─── منوی شبیه سایت (برای قالبهای HTML ساده) ───
function siteNav(sig) {
  return `<header class="site-hdr"><div class="wrap"><a class="logo" href="#">${sig.brand}</a><nav><a href="#">خانه</a><a href="#">درباره</a><a href="#">محصولات</a><a href="#">گالری</a><a href="#">تماس</a></nav><button class="cta">شروع</button></div></header>`;
}

function digiCards(sig, ctaLabel) {
  const [c1, c2, ac] = sig.palette;
  return Array(8).fill(0).map((_, i) => {
    const imgs = [
      `linear-gradient(135deg,${c1}${66 - i * 5 > 20 ? 66 - i * 5 : 25}cc,${c2}cc)`,
      `linear-gradient(160deg,${c2}cc,${ac}cc)`,
      `linear-gradient(200deg,${c1}cc,${ac}99)`,
    ][i % 3];
    return `<div class="pcard"><div class="pimg" style="background:${imgs}"><span class="ph">${['📱','🎧','⌚','💻','🎮','📷','🔊','🧺'][i]}</span>${i % 3 === 0 ? '<span class="off">٪' + (5 + i * 4) + ' تخفیف</span>' : ''}</div><div class="pbody"><h4>${['هدفون بی‌سیم پرو', 'ساعت هوشمند X2', 'اسپیکر بلوتوثی', 'کیف چرمی', 'ماوس گیمینگ', 'دوربین دیجیتال', 'پاوربانک ۲۰هزار', 'کوله‌پشتی شهری'][i]}</h4><div class="rate">★ ${(4 + (i % 10) / 10).toFixed(1)} <small>(${120 + i * 37} نظر)</small></div><div class="pr"><b>${(1200000 + i * 380000).toLocaleString('fa-IR')}</b><span>تومان</span></div><button class="addbtn">${ctaLabel}</button></div></div>`;
  }).join('');
}

// ═══ نقطه ورود: تحلیل لینک + ساخت بسته (وبسایت + راهنما) ═══
export async function buildFromUrl(url, opts = {}) {
  const clean = String(url).trim();
  if (!/^https?:\/\//i.test(clean)) throw new Error('لینک باید با http:// یا https:// شروع شود.');
  const html = await fetchText(clean);
  const sig = extractSignals(html, clean);
  sig.title = sig.brand;
  const modeLabel = MODE_LABELS[sig.mode] || sig.mode;

  // محتوای داخلی فروشگاه
  const ctaLabel = sig.type === 'shop' ? 'افزودن به سبد' : 'مشاهده بیشتر';
  const inner = `
<section class="sec"><div class="inner"><div class="banner-wrap">
  <div class="banner" style="background:linear-gradient(120deg,${sig.palette[0]},${sig.palette[1]})"><h3>🔥 حراج بزرگ ${sig.brand}</h3><p>تا ۵۰٪ تخفیف روی دهها محصول پرفروش</p><b>خرید کنید</b></div>
  <div class="banner" style="background:linear-gradient(120deg,${sig.palette[1]},${sig.palette[2]})"><h3>🚚 ارسال اکسپرس</h3><p>سفارشهای بالای ۵۰۰ هزار تومان، رایگان</p><b>مشاهده شرایط</b></div>
  <div class="banner" style="background:linear-gradient(120deg,${sig.palette[2]},${sig.palette[0]})"><h3>🎁 هدیه خرید اول</h3><p>کد تخفیف ۱۵٪ برای عضوهای جدید</p><b>ثبتنام</b></div>
</div></div></section>
<section class="sec"><div class="inner"><div class="sech"><h2>پیشنهاد شگفتانگیز</h2><a href="#">مشاهده همه ←</a></div><div class="grid">${digiCards(sig, ctaLabel).slice(0, 4)}</div></div></section>
<section class="sec"><div class="inner"><div class="sech"><h2>پرفروشترینها</h2><a href="#">مشاهده همه ←</a></div><div class="grid">${digiCards(sig, ctaLabel).slice(4)}</div></div></section>
<section class="sec"><div class="inner"><div class="svc"><div><i>🚚</i><span><b>ارسال سریع</b><br><small>به سراسر کشور، ۲۴ ساعته</small></span></div><div><i>🛡️</i><span><b>ضمانت اصالت</b><br><small>کالای ۱۰۰٪ اورجینال</small></span></div><div><i>↩️</i><span><b>۷ روز بازگشت</b><br><small>بدون پرسش و قید</small></span></div><div><i>💳</i><span><b>پرداخت امن</b><br><small>درگاه رسمی + اقساط</small></span></div></div></div></section>`;

  const main = digiPage(sig, { inner, depth: opts.depth || 1 });

  // راهنمای Word با تصاویر
  const guide = makeDocx({
    title: `راهنمای نصب و شخصیسازی وبسایت ${sig.brand}`,
    blocks: [
      { h1: `راهنمای نصب وبسایت «${sig.brand}»` },
      { p: `این وبسایت با قالبساز هوشمند اپتم و بر اساس تحلیل لینک «${clean}» ساخته شده است. سبک طراحی تشخیصدادهشده: ${modeLabel}.` },
      { h2: '۱) فایلها' },
      { table: { head: ['پوشه/فایل', 'توضیح'], rows: [['index.html', 'صفحه اصلی فروشگاه'], ['css/style.css', 'استایلهای جداگانه (در نسخه فشرده)'], ['js/app.js', 'اسکریپت تعاملات (کارت، منوی موبایل)'], ['docx/راهنمای نصب.docx', 'همین راهنما']] } },
      { h2: '۲) نصب سریع' },
      { list: ['فایل زیپ را روی کامپیوتر خود باز کنید', 'برای تست: فقط index.html را در مرورگر باز کنید', 'برای انتشار: محتوا را در پوشه public/ هاست خود آپلود کنید', 'در هاستهای ایرانی: از فایلمدیریت cPanel، فایلها را در public_html بگذارید'] },
      { img: { kind: 'code-folders', cap: 'ساختار فایلها — همهچیز داخل یک پوشه است' } },
      { h2: '۳) شخصیسازی رنگها' },
      { p: `تمام رنگها در فایل style.css و متغیرهای --مشخص شدهاند. رنگهای فعلی سایت: ${sig.palette.join(' ، ')} — کافی است این سه مقدار را عوض کنید.` },
      { code: ':root { --c1: ' + sig.palette[0] + '; --c2: ' + sig.palette[1] + '; --ac: ' + sig.palette[2] + '; }' },
      { h2: '۴) تغییر لوگو و نام برند' },
      { p: 'نام برند در دو نقطه عوض میشود: بالای index.html در تگ <title> و در سه جای هدر و فوتر (جستجوی «برند» در فایل). لوگو یک حرف اول برند با گرادیان است؛ برای لوگوی تصویری، تگ <i> کنار .logo را با <img> جایگزین کنید.' },
      { img: { kind: 'theme-install', cap: 'نحوه جایگذاری لوگو و هدر' } },
      { h2: '۵) مدیریت محصولات' },
      { p: 'برای افزودن محصول، یک بلوک <div class="pcard"> را کپی کنید و متن، قیمت و عکس (کلاس pimg) را عوض کنید. تعداد محصولات در صفحه اصلی محدودیتی ندارد.' },
      { note: 'برای اتصال به سبد خرید و پرداخت واقعی، از نسخه فروشگاهساز کامل (در همین پنل ادمین) استفاده کنید که شامل پنل مدیریت، درگاه پرداخت و پنل کاربری است.' },
      { br: true },
      { h1: 'سوالات متداول' },
      { list: ['چرا سایت من شبیه دیجیکالا نیست؟ — این قالب «الهامگرفته از ساختار» سایت لینک است؛ برای کپی ۱۰۰٪، از قابلیت «تبدیل قالب» استفاده کنید و فایل ZIP سایت را بدهید', 'چطور به صفحات دیگر لینک بدهم؟ — هدر سایت آماده است؛ فقط href لینکها را تنظیم کنید', 'پشتیبانی چطور؟ — از پنل ادمین، بخش پیامرسانی'] },
    ],
  });
  return { sig, main, guide, modeLabel, sourceUrl: clean };
}

export { extractSignals, fetchText };
