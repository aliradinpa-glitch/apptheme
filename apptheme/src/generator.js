// ─── موتور تولید سایت چندصفحه‌ای از دیتای محصول ───
// خروجی: HTML کامل و مستقل (CSS داخلی) برای پیش‌نمایش آنی و بسته ZIP
// دارای ۶ لایوت متفاوت — بر اساس هش ثابت محصول، تا قالب‌ها هم‌شکل نباشند

function hash(s) {
  return [...String(s || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
}
export function layoutOf(p) {
  if (p && Number.isInteger(p.layout)) return p.layout % 6;
  if (p && p.spec && Number.isInteger(p.spec.layout)) return p.spec.layout % 6;
  return hash((p && (p.slug || p.title)) || 'x') % 6;
}

function css(c1, c2, accent, v = 0) {
  const R = [16, 20, 14, 24, 10, 18][v];
  const base = `:root{--c1:${c1};--c2:${c2};--ac:${accent};--ink:#1c2333;--mut:#6b7690;--bg:#f7f8fc;--card:#fff;--rad:${R}px}
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
.btn{display:inline-block;padding:11px 24px;border-radius:${[12, 999, 10, 16, 8, 999][v]}px;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;font-weight:500;border:0;cursor:pointer}
.btn.o{background:none;border:1.5px solid #dfe3f0;color:var(--ink)}
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

  const V = {
    0: `.hero{position:relative;overflow:hidden;padding:90px 0 80px;background:linear-gradient(160deg,color-mix(in srgb,var(--c1) 7%,transparent),transparent 60%)}
.hero h1{font-size:2.4rem;line-height:1.6;max-width:30rem}
.hero p{color:var(--mut);max-width:32rem;margin:14px 0 26px}
.hero .row{display:flex;gap:12px;flex-wrap:wrap}
.bloob{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--c2) 26%,transparent),transparent 70%);top:-140px;left:-120px;filter:blur(10px)}`,
    1: `.hero{text-align:center;padding:96px 0 84px;position:relative}
.hero h1{font-size:2.6rem;line-height:1.65;margin:auto;max-width:36rem;background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p{color:var(--mut);max-width:34rem;margin:16px auto 28px}
.hero .row{justify-content:center;display:flex;gap:12px;flex-wrap:wrap}
.hero .chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:22px}
.hero .chips i{font-style:normal;background:color-mix(in srgb,var(--c1) 10%,transparent);color:var(--c1);padding:6px 14px;border-radius:999px;font-size:.82rem;font-weight:600}
.g3 .card{border:0;background:color-mix(in srgb,var(--c1) 4%,#fff)}`,
    2: `.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:36px;align-items:center;padding:80px 0}
.hero h1{font-size:2.3rem;line-height:1.65;max-width:26rem}
.hero p{color:var(--mut);margin:14px 0 26px}
.hero-art{aspect-ratio:1.15;border-radius:26px;background:linear-gradient(135deg,var(--c1),var(--c2));position:relative;overflow:hidden;box-shadow:0 30px 70px color-mix(in srgb,var(--c1) 35%,transparent)}
.hero-art::before{content:'';position:absolute;inset:22px;border:1.5px solid rgba(255,255,255,.35);border-radius:16px}
.hero-art::after{content:'✦';position:absolute;bottom:14px;inset-inline-start:20px;color:#fff;font-size:2rem}
.g3 .card{border-top:4px solid var(--c1)}`,
    3: `.hero{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;text-align:center;padding:104px 0 130px;border-radius:0 0 44px 44px;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;width:520px;height:520px;border-radius:50%;background:rgba(255,255,255,.08);top:-260px;left:50%;transform:translateX(-50%)}
.hero h1{font-size:2.5rem;line-height:1.6;max-width:36rem;margin:auto;color:#fff}
.hero p{opacity:.92;max-width:34rem;margin:14px auto 28px}
.hero .row{justify-content:center;display:flex;gap:12px;flex-wrap:wrap}
.hero .btn{background:#fff;color:var(--c1);font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.hero .btn.o{background:transparent;border-color:rgba(255,255,255,.6);color:#fff}
.hero .stats-in{display:flex;gap:44px;justify-content:center;margin-top:44px;flex-wrap:wrap;position:relative;z-index:1}
.hero .stats-in b{display:block;font-size:1.6rem;color:#fff}`,
    4: `.hero{padding:52px 0 8px}
.hero .intro{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center;background:var(--card);border:1px solid #e8ebf5;border-radius:var(--rad);padding:22px 26px}
.hero h1{font-size:1.55rem;line-height:1.7}
.hero p{color:var(--mut);font-size:.92rem;margin-top:6px}
.hero .btn{white-space:nowrap}
.dashbar{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:2px;background:#e8ebf5;border-radius:var(--rad);overflow:hidden;margin:26px 0 8px;border:1px solid #e8ebf5}
.dashbar div{background:#fff;padding:18px 12px;text-align:center}
.dashbar b{display:block;font-size:1.4rem;background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.dashbar span{color:var(--mut);font-size:.8rem}
.g3{grid-template-columns:1fr;gap:12px}
.g3 .card{display:flex;gap:16px;align-items:flex-start;padding:18px}
.g3 .card .ic{margin:0;flex-shrink:0}`,
    5: `header{background:rgba(16,20,38,.92);
header .nav,header .brand,header .nav nav a{color:#e7ebff}
header .brand i{border-radius:50%}
header{border-bottom:2px solid color-mix(in srgb,var(--c1) 60%,transparent)}
.hero{padding:92px 0 76px;position:relative;background-image:radial-gradient(color-mix(in srgb,var(--c1) 14%,transparent) 1.5px,transparent 1.5px);background-size:26px 26px}
.hero h1{font-size:3.1rem;line-height:1.55;font-weight:900;max-width:30rem}
.hero h1 em{font-style:normal;color:transparent;-webkit-text-stroke:2px var(--c1)}
.hero p{color:var(--mut);max-width:32rem;margin:16px 0 26px}
.hero .row{display:flex;gap:12px;flex-wrap:wrap}
.g3 .card{box-shadow:8px 8px 0 color-mix(in srgb,var(--c1) 26%,transparent);border:2px solid var(--ink)}
.g3 .card .ic{background:var(--c1);color:#fff;border-radius:50%}`,
  }[v] || '';
  return base + '\n' + V;
}

function page({ brand, tagline, desc, c1, c2, accent, v, nav, body, styleInline }) {
  const year = '۱۴۰۵';
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${brand} — ${tagline}</title>
<meta name="description" content="${desc}">
${styleInline ? `<style>\n${css(c1, c2, accent, v)}\n</style>` : '<link rel="stylesheet" href="css/style.css">'}
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

function heroBuilders(brand, tagline, desc) {
  return [
    // v0 کلاسیک
    () => `<section class="hero"><div class="bloob"></div><div class="wrap">
  <h1>${tagline}</h1>
  <p>${desc} با ${brand} همراه شوید و تفاوت را احساس کنید.</p>
  <div class="row"><a class="btn" href="contact.html">درخواست مشاوره</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
</div></section>`,
    // v1 متمرکز
    () => `<section class="hero"><div class="wrap">
  <div class="chips"><i>✓ تحویل سریع</i><i>✓ پشتیبانی واقعی</i><i>✓ کیفیت تضمینی</i></div>
  <h1>${tagline}</h1>
  <p>${desc}</p>
  <div class="row"><a class="btn" href="contact.html">درخواست مشاوره</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
</div></section>`,
    // v2 اسپلیت
    () => `<section class="hero"><div class="wrap hero-g" style="display:contents"><div>
  <h1>${tagline}</h1>
  <p>${desc} با ${brand} همراه شوید و تفاوت را احساس کنید.</p>
  <div class="row"><a class="btn" href="contact.html">درخواست مشاوره</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
</div><div class="hero-art" aria-hidden="true"></div></div></section>`,
    // v3 بنر گرادیانی
    () => `<section class="hero"><div class="wrap">
  <h1>${tagline}</h1>
  <p>${desc} با ${brand} همراه شوید و تفاوت را احساس کنید.</p>
  <div class="row"><a class="btn" href="contact.html">درخواست مشاوره</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
  <div class="stats-in"><div><b>+۵۰۰</b><span>مشتری راضی</span></div><div><b>+۸۰۰</b><span>پروژه موفق</span></div><div><b>۱۰</b><span>سال تجربه</span></div><div><b>۲۴/۷</b><span>پشتیبانی</span></div></div>
</div></section>`,
    // v4 مینیمال
    () => `<section class="hero"><div class="wrap">
  <div class="intro">
    <div class="brand" style="font-size:1.3rem"><i style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,var(--c1),var(--c2));display:grid;place-items:center;color:#fff;font-style:normal">${brand.trim().charAt(0)}</i></div>
    <div><h1>${tagline}</h1><p>${desc}</p></div>
    <a class="btn" href="contact.html">شروع کن</a>
  </div>
  <div class="dashbar"><div><b>+۵۰۰</b><span>مشتری راضی</span></div><div><b>+۸۰۰</b><span>پروژه موفق</span></div><div><b>۱۰</b><span>سال تجربه</span></div><div><b>۲۴/۷</b><span>پشتیبانی</span></div></div>
</div></section>`,
    // v5 بولد
    () => `<section class="hero"><div class="wrap">
  <h1>${tagline.split(' ').slice(0, 2).join(' ')} <em>${tagline.split(' ').slice(2).join(' ') || brand}</em></h1>
  <p>${desc} با ${brand} همراه شوید و تفاوت را احساس کنید.</p>
  <div class="row"><a class="btn" href="contact.html">درخواست مشاوره</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
</div></section>`,
  ];
}

export function generateSite(p, { styleInline = true } = {}) {
  const brand = (p.title || '').split('—')[0].trim() || 'وب‌سایت من';
  const tagline = p.description || 'تجربه‌ای مدرن از حضور آنلاین';
  const desc = p.description || tagline;
  const [c1, c2] = p.palette || ['#6d5ef2', '#22d3ee'];
  const accent = p.accent || '#f59e0b';
  const v = layoutOf(p);

  const hero = heroBuilders(brand, tagline, desc)[v]();

  const services = `<section id="services"><div class="wrap">
  <div class="sec-head"><span>خدمات ما</span><h2>چیزی که به شما ارائه می‌دهیم</h2></div>
  <div class="g3">
    ${SERVICES.map(([ic, t, d]) => `<div class="card"><div class="ic">${ic}</div><div><h3>${t}</h3><p>${d}</p></div></div>`).join('\n    ')}
  </div>
</div></section>`;

  const stats = v === 3 || v === 4 ? '' : `<section style="padding-top:0"><div class="wrap"><div class="stats">
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

  // ترتیب بخش‌ها هم per-variant فرق کند
  const orders = [
    [hero, services, stats, quotes, cta, contactMini()],
    [hero, quotes, services, cta, contactMini()],
    [hero, services, quotes, stats, cta, contactMini()],
    [hero, services, quotes, cta, contactMini()],
    [hero, services, cta, quotes, contactMini()],
    [hero, stats, services, quotes, cta, contactMini()],
  ];
  const home = page({ brand, tagline, desc, c1, c2, accent, v, body: orders[v].join('\n'), styleInline });
  const about = page({ brand, tagline, desc, c1, c2, accent, v, body: aboutBody + cta, styleInline });
  const contact = page({ brand, tagline, desc, c1, c2, accent, v, body: contactBody, styleInline });

  return { home, about, contact, style: css(c1, c2, accent, v), variant: v };
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
<style>/* بدون CDN — آفلاین */body{font-family:Vazirmatn,Tahoma,sans-serif;margin:0;background:#f8fafc;color:#1e293b;direction:rtl}.max-w-4xl{max-width:56rem;margin-inline:auto}.px-6{padding-inline:1.5rem}.py-24{padding-block:5rem}.text-center{text-align:center}.text-4xl{font-size:2.2rem;line-height:1.4}.font-extrabold{font-weight:800}.mb-4{margin-bottom:1rem}.mb-8{margin-bottom:2rem}.text-slate-500{color:#64748b}.rounded-xl{border-radius:.75rem}.py-3{padding-block:.75rem}.text-white{color:#fff}.text-brand{color:${(p.palette || ['#6d5ef2'])[0]}}.bg-brand{background:${(p.palette || ['#6d5ef2'])[0]}}@media(max-width:640px){.py-24{padding-block:3.5rem}.text-4xl{font-size:1.7rem}}</style>
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
<style>/* بدون CDN — آفلاین */:root{--bs-primary:${(p.palette || ['#6d5ef2'])[0]}}body{font-family:Vazirmatn,Tahoma,sans-serif;margin:0;color:#212529}.container{max-width:1140px;margin-inline:auto;padding-inline:12px}.py-5{padding-block:3rem}.text-center{text-align:center}.fw-bold{font-weight:700}.mb-3{margin-bottom:1rem}.mb-4{margin-bottom:1.5rem}.text-muted{color:#6c757d}.btn{display:inline-block;padding:.75rem 1.5rem;border-radius:.5rem;border:0;font-size:1.25rem;color:#fff;background:var(--bs-primary);text-decoration:none}.btn-primary{background:var(--bs-primary)}@media(max-width:576px){.btn{display:block;text-align:center}.py-5{padding-block:2rem}}</style>
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
