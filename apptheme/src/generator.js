// ─── موتور تولید سایت چندصفحه‌ای از دیتای محصول ───
// خروجی: HTML کامل و مستقل (CSS داخلی) برای پیش‌نمایش آنی و بسته ZIP

function css(c1, c2, accent) {
  return `:root{--c1:${c1};--c2:${c2};--ac:${accent};--ink:#1c2333;--mut:#6b7690;--bg:#f7f8fc;--card:#fff;--rad:16px}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Vazirmatn,Tahoma,sans-serif;background:var(--bg);color:var(--ink);line-height:1.9;direction:rtl}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:auto;padding:0 20px}
header{position:sticky;top:0;z-index:9;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid #e8ebf5}
.nav{display:flex;align-items:center;gap:26px;height:66px}
.brand{display:flex;gap:9px;align-items:center;font-weight:700;font-size:1.1rem}
.brand i{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--c1),var(--c2));display:grid;place-items:center;color:#fff;font-style:normal}
.nav nav{display:flex;gap:4px}
.nav nav a{padding:7px 13px;border-radius:9px;color:var(--mut);font-size:.92rem}
.nav nav a:hover{background:#f1f3fb;color:var(--ink)}
.btn{display:inline-block;padding:11px 24px;border-radius:12px;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;font-weight:500;border:0;cursor:pointer}
.btn.o{background:none;border:1.5px solid #dfe3f0;color:var(--ink)}
.hero{position:relative;overflow:hidden;padding:90px 0 80px;background:linear-gradient(160deg,color-mix(in srgb,var(--c1) 7%,transparent),transparent 60%)}
.hero h1{font-size:2.4rem;line-height:1.6;max-width:30rem}
.hero p{color:var(--mut);max-width:32rem;margin:14px 0 26px}
.hero .row{display:flex;gap:12px;flex-wrap:wrap}
.bloob{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--c2) 26%,transparent),transparent 70%);top:-140px;left:-120px;filter:blur(10px)}
section{padding:64px 0}
.sec-head{text-align:center;margin-bottom:38px}
.sec-head span{color:var(--c1);font-size:.85rem;font-weight:700;letter-spacing:.5px}
.sec-head h2{font-size:1.65rem;margin-top:6px}
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:20px}
.card{background:var(--card);border:1px solid #e8ebf5;border-radius:var(--rad);padding:26px 22px;transition:.25s}
.card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(25,32,60,.09)}
.card .ic{width:52px;height:52px;border-radius:14px;background:color-mix(in srgb,var(--c1) 12%,transparent);display:grid;place-items:center;font-size:1.4rem;margin-bottom:14px}
.card h3{font-size:1.02rem;margin-bottom:8px}
.card p{color:var(--mut);font-size:.88rem}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px;text-align:center}
.stats b{font-size:1.9rem;background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.stats span{color:var(--mut);font-size:.86rem}
.quote{background:var(--card);border:1px solid #e8ebf5;border-radius:var(--rad);padding:26px}
.quote p{color:var(--mut);font-size:.92rem}
.quote .who{display:flex;gap:10px;align-items:center;margin-top:16px}
.quote .who i{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700}
form.cnt{display:grid;gap:14px;max-width:560px;margin:auto}
.inp{padding:12px 15px;border:1.5px solid #e2e6f2;border-radius:12px;background:#fbfcff;font-family:inherit;font-size:.95rem}
.inp:focus{outline:none;border-color:var(--c1)}
footer{background:#141a2e;color:#aeb6d3;padding:44px 0 26px;margin-top:40px}
footer .cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:26px;padding-bottom:26px}
footer h4{color:#fff;margin-bottom:12px;font-size:.98rem}
footer li{margin-bottom:8px;font-size:.88rem}
.copy{border-top:1px solid #232b47;text-align:center;padding-top:18px;font-size:.8rem}
@media(max-width:760px){.nav nav{display:none}.hero h1{font-size:1.6rem}footer .cols{grid-template-columns:1fr}}`;
}

function page({ brand, tagline, desc, c1, c2, accent, nav, body, styleInline }) {
  const year = '۱۴۰۵';
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${brand} — ${tagline}</title>
<meta name="description" content="${desc}">
${styleInline ? `<style>\n${css(c1, c2, accent)}\n</style>` : '<link rel="stylesheet" href="css/style.css">'}
</head>
<body>
<header><div class="wrap nav">
  <a class="brand" href="index.html"><i>${brand.trim().charAt(0)}</i>${brand}</a>
  <nav>
    <a href="index.html">خانه</a><a href="about.html">درباره ما</a><a href="index.html#services">خدمات</a><a href="contact.html">تماس</a>
  </nav>
  <a class="btn" href="contact.html" style="margin-inline-start:auto">شروع همکاری</a>
</div></header>
${body}
<footer><div class="wrap">
  <div class="cols">
    <div>
      <a class="brand" href="index.html" style="color:#fff"><i>${brand.trim().charAt(0)}</i>${brand}</a>
      <p style="font-size:.86rem;margin-top:12px;max-width:22rem">${desc}</p>
    </div>
    <div><h4>دسترسی سریع</h4><ul><li><a href="index.html">خانه</a></li><li><a href="about.html">درباره ما</a></li><li><a href="contact.html">تماس با ما</a></li></ul></div>
    <div><h4>راه‌های ارتباطی</h4><ul><li>info@apptheme.ir</li><li>۰۲۱-۹۱۰۰۰۰۰۰</li><li>تهران، ایران</li></ul></div>
  </div>
  <div class="copy">© ${year} ${brand} — تمامی حقوق محفوظ است. | قالب ساخته‌شده توسط اپ‌تم</div>
</div></footer>
</body>
</html>`;
}

const SERVICES = [
  ['🎨', 'طراحی اختصاصی', 'طراحی رابط کاربری متناسب با هویت برند شما، مدرن و مینیمال.'],
  ['⚡', 'سرعت بالا', 'بهینه‌سازی کامل برای بارگذاری سریع و تجربه روان کاربران.'],
  ['📱', 'واکنش‌گرا', 'نمایش بی‌نقص در موبایل، تبلت و دسکتاپ بدون شکستگی.'],
  ['🔍', 'سئو‌پسند', 'ساختار استاندارد و آماده‌ی نمایه‌شدن در موتورهای جستجو از روز اول.'],
  ['🛡️', 'امنیت', 'کدنویسی امن و رعایت اصول حفاظت داده کاربران.'],
  ['💬', 'پشتیبانی', 'پاسخگویی سریع تیم پشتیبانی در تمام روزهای هفته.'],
];

export function generateSite(p, { styleInline = true } = {}) {
  const brand = (p.title || '').split('—')[0].trim() || 'وب‌سایت من';
  const tagline = p.description || 'تجربه‌ای مدرن از حضور آنلاین';
  const desc = p.description || tagline;
  const [c1, c2] = p.palette || ['#6d5ef2', '#22d3ee'];
  const accent = p.accent || '#f59e0b';

  const hero = `<section class="hero"><div class="bloob"></div><div class="wrap">
  <h1>${tagline}</h1>
  <p>${desc} با ${brand} همراه شوید و تفاوت را احساس کنید.</p>
  <div class="row"><a class="btn" href="contact.html">درخواست مشاوره</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
</div></section>`;

  const services = `<section id="services"><div class="wrap">
  <div class="sec-head"><span>خدمات ما</span><h2>چیزی که به شما ارائه می‌دهیم</h2></div>
  <div class="g3">
    ${SERVICES.map(([ic, t, d]) => `<div class="card"><div class="ic">${ic}</div><h3>${t}</h3><p>${d}</p></div>`).join('\n    ')}
  </div>
</div></section>`;

  const stats = `<section style="padding-top:0"><div class="wrap"><div class="stats">
  <div><b>+۵۰۰</b><br><span>مشتری راضی</span></div>
  <div><b>+۸۰۰</b><br><span>پروژه موفق</span></div>
  <div><b>۱۰</b><br><span>سال تجربه</span></div>
  <div><b>۲۴/۷</b><br><span>پشتیبانی</span></div>
</div></div></section>`;

  const quotes = `<section><div class="wrap">
  <div class="sec-head"><span>نظرات</span><h2>مشتریان چه می‌گویند</h2></div>
  <div class="g3">
    <div class="quote"><p>«همکاری با ${brand} بهترین انتخاب ما بود؛ حرفه‌ای، سریع و پاسخگو.»</p><div class="who"><i>م</i><b>مریم احمدی</b></div></div>
    <div class="quote"><p>«کیفیت خدمات فراتر از انتظار بود. قطعاً پروژه‌های بعدی را هم سپردیم.»</p><div class="who"><i>ر</i><b>رضا کریمی</b></div></div>
    <div class="quote"><p>«از اولین تماس تا تحویل، همه‌چیز شفاف و دقیق پیش رفت.»</p><div class="who"><i>ز</i><b>زهرا موسوی</b></div></div>
  </div>
</div></section>`;

  const cta = `<section><div class="wrap"><div class="card" style="text-align:center;background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 10%,#fff),color-mix(in srgb,var(--c2) 10%,#fff));padding:46px 22px">
  <h2 style="margin-bottom:10px">آماده شروع هستید؟</h2>
  <p style="color:var(--mut);margin-bottom:20px">همین حالا درخواست خود را ثبت کنید، کمتر از ۲۴ ساعت پاسخ می‌گیرید.</p>
  <a class="btn" href="contact.html">ارتباط با ما</a>
</div></div></section>`;

  const contactBody = `<section><div class="wrap">
  <div class="sec-head"><span>تماس</span><h2>پیام خود را ارسال کنید</h2></div>
  <form class="cnt" onsubmit="event.preventDefault();this.innerHTML='<p style=\\'color:var(--c1);font-weight:700\\'>✓ پیام شما ثبت شد. به‌زودی با شما تماس می‌گیریم.</p>'">
    <input class="inp" required placeholder="نام و نام خانوادگی">
    <input class="inp" type="email" required placeholder="ایمیل" dir="ltr" style="text-align:right">
    <input class="inp" placeholder="موضوع (اختیاری)">
    <textarea class="inp" rows="5" required placeholder="متن پیام…"></textarea>
    <button class="btn" type="submit">ارسال پیام</button>
  </form>
</div></section>`;

  const aboutBody = `<section><div class="wrap">
  <div class="sec-head"><span>درباره ما</span><h2>داستان ${brand}</h2></div>
  <p style="max-width:44rem;margin:0 auto 22px;color:var(--mut)">${brand} با هدف ارائه خدمات حرفه‌ای و تجربه‌ای متفاوت فعالیت خود را آغاز کرده و با تکیه بر تیمی متخصص و خلاق، همواره در تلاش است بهترین نتیجه را برای مشتریان رقم بزند. اعتماد شما، سرمایه ماست.</p>
</div></section>${stats}${quotes}`;

  const home = page({ brand, tagline, desc, c1, c2, accent, body: hero + services + stats + quotes + cta + contactMini(), styleInline });
  const about = page({ brand, tagline, desc, c1, c2, accent, body: aboutBody + cta, styleInline });
  const contact = page({ brand, tagline, desc, c1, c2, accent, body: contactBody, styleInline });

  return { home, about, contact, style: css(c1, c2, accent) };
}

function contactMini() {
  return `<section id="contact" style="padding-top:0"><div class="wrap"><div class="card" style="display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap">
  <div><h3>سوالی دارید؟</h3><p style="color:var(--mut);font-size:.88rem">کارشناسان ما آماده پاسخگویی هستند.</p></div>
  <a class="btn" href="contact.html">تماس با ما</a>
</div></div></section>`;
}

// بسته ZIP قابل دانلود
export function generateZipFiles(p, { FRAMEWORKS }) {
  const g = generateSite(p, { styleInline: false });
  const home = g.home, about = g.about, contact = g.contact;
  const fw = (p.frameworks || ['html']).map(f => FRAMEWORKS[f]?.label || f).join('، ');
  const readme = `# ${(p.title || '').split('—')[0].trim()}

${p.description || ''}

## محتوا
- index.html — صفحه اصلی
- about.html — درباره ما
- contact.html — تماس با ما
- css/style.css — استایل‌ها (متغیرهای رنگ در ابتدای فایل)

## فریمورک‌ها: ${fw}
این قالب با HTML/CSS استاندارد و بدون وابستگی ارائه شده و در پوشه starter،
نسخه‌های آماده‌ی Tailwind و Bootstrap (با CDN) نیز قرار دارد.

## شخصی‌سازی رنگ
فایل css/style.css را باز کنید و سه متغیر --c1 و --c2 و --ac را تغییر دهید.

---
ساخته‌شده توسط اپ‌تم — apptheme.ir`;

  const starterTw = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>شروع با Tailwind</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{brand:{DEFAULT:'${(p.palette || ['#6d5ef2'])[0]}',light:'${(p.palette || ['#6d5ef2','#22d3ee'])[1]}'}}}}}</script>
</head>
<body class="bg-slate-50 text-slate-800">
  <div class="max-w-4xl mx-auto px-6 py-24 text-center">
    <h1 class="text-4xl font-extrabold mb-4">قالب ${(p.title || '').split('—')[0].trim()} <span class="text-brand">نسخه Tailwind</span></h1>
    <p class="text-slate-500 mb-8">این فایل شروع، Tailwind را از CDN بارگذاری کرده و رنگ برند شما را ثبت کرده است.</p>
    <a href="https://tailwindcss.com/docs" class="rounded-xl bg-brand px-6 py-3 text-white">مستندات Tailwind</a>
  </div>
</body>
</html>`;

  const starterBs = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>شروع با Bootstrap 5</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
<style>:root{--bs-primary:${(p.palette || ['#6d5ef2'])[0]}};.btn-primary{--bs-bg:var(--bs-primary)}</style>
</head>
<body>
  <div class="container py-5 text-center">
    <h1 class="fw-bold mb-3">قالب ${(p.title || '').split('—')[0].trim()} — نسخه Bootstrap</h1>
    <p class="text-muted mb-4">Bootstrap 5 راست‌چین از CDN بارگذاری شده است.</p>
    <a href="https://getbootstrap.com/docs/5.3/getting-started/introduction/" class="btn btn-primary btn-lg">مستندات Bootstrap</a>
  </div>
</body>
</html>`;

  return [
    { name: 'README.md', data: readme },
    { name: 'css/style.css', data: g.style },
    { name: 'index.html', data: home },
    { name: 'about.html', data: about },
    { name: 'contact.html', data: contact },
    { name: 'starter/tailwind.html', data: starterTw },
    { name: 'starter/bootstrap.html', data: starterBs },
    { name: 'LICENSE.txt', data: `قالب «${p.title}»\nخریدار: خریداری‌شده از اپ‌تم (apptheme.ir)\nمجوز: استفاده در یک پروژه شخصی/تجاری، بازفروش ممنوع.` },
  ];
}
