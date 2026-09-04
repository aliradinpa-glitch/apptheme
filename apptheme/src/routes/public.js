// ─── صفحات عمومی فروشگاه ───
import { cartSummary } from '../cart.js';
import { esc, money, faNum, faDate, timeAgo, starsSvg, svgThumb, isEmail } from '../util.js';
import { page } from '../render.js';
import { findMany, findOne, productRating, productLikes, getDb } from '../db.js';
import { FRAMEWORKS, APP_NAME } from '../config.js';
import { proPlansOf } from '../gencore.js';
import { anonCsrf } from '../auth.js';

const fa = n => Number(n).toLocaleString('fa-IR');

// ─── خانه ───
export function home(req, res, { user, baseUrl, csrf }) {
  const db = getDb();
  const products = findMany('products', p => p.published).sort((a, b) => b.downloads - a.downloads);
  const featured = products.slice(0, 6);
  const totalDownloads = products.reduce((s, p) => s + p.downloads, 0);
  const categoryCount = db.categories.length;
  const approved = findMany('comments', c => c.status === 'approved').slice(0, 3);

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: APP_NAME, url: baseUrl, inLanguage: 'fa-IR' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'قالب‌های پرفروش', itemListElement: featured.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${baseUrl}/templates/${p.slug}`, name: p.title })) },
  ];

  const body = `
<section class="hero">
  <div class="container inner">
    <div>
      <span class="badge primary" style="margin-bottom:18px; display:inline-flex;">بیش از ${fa(totalDownloads)} دانلود موفق قالب</span>
      <h1>قالب وب سایت حرفه‌ای بساز، <span class="grad-text">فارغ از کدنویسی</span></h1>
      <p class="lead">مجموعه‌ای از بهترین قالب‌های راست‌چین و بهینه برای سئو — فروشگاهی، شرکتی، شخصی و استارتاپی. خرید امن، دانلود آنی و آپدیت رایگان.</p>
      <div class="hero-cta">
        <a class="btn lg" href="/templates">مشاهده قالب‌ها</a>
        <a class="btn lg ghost" href="#why">چرا اپ‌تم؟</a>
      </div>
      <div class="hero-stats">
        <div><div class="num">${fa(products.length)}</div><div class="lbl">قالب حرفه‌ای</div></div>
        <div><div class="num">${fa(totalDownloads)}</div><div class="lbl">دانلود موفق</div></div>
        <div><div class="num">${fa(categoryCount)}</div><div class="lbl">دسته‌بندی تخصصی</div></div>
      </div>
    </div>
    <div class="hero-art">
      <div class="card">${svgThumb(featured[0] || db.products[0])}</div>
      <div class="flex" style="gap:14px">
        <div class="card grow" style="overflow:hidden">${svgThumb(featured[2] || db.products[1])}</div>
        <div class="card grow" style="overflow:hidden">${svgThumb(featured[4] || db.products[2])}</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="cats">
  <div class="container">
    <div class="section-head"><h2>دسته‌بندی‌ها</h2><a class="muted small" href="/templates">همه قالب‌ها ←</a></div>
    <div class="cat-grid">
      ${db.categories.map(c => `<a class="cat-card" href="/templates?cat=${esc(c.slug)}"><span class="ic">${c.icon}</span><b>${esc(c.name)}</b><span class="muted small">${fa(findMany('products', p => p.published && p.categoryIds.includes(c.id)).length)} قالب</span></a>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="padding-top:10px">
  <div class="container">
    <div class="section-head"><h2>قالب‌های پرفروش</h2><a class="muted small" href="/templates?sort=popular">مشاهده همه ←</a></div>
    <div class="grid-products">${featured.map(p => productCard(p, user)).join('')}</div>
  </div>
</section>

<section class="section" id="ai-builder" style="padding-top:10px">
  <div class="container">
    <div class="ai-sell-band">
      <div class="ai-sell-glow"></div>
      <div class="ai-sell-in">
        <div class="ai-sell-txt">
          <span class="badge primary" style="display:inline-flex;margin-bottom:10px">استودیو هوش مصنوعی — ۶ سطح از برنز تا اپیک</span>
          <h2>فروشگاه اینترنتی خودت را با هوش مصنوعی بساز</h2>
          <p>لینک سایت موردعلاقه‌ات را بده (حتی دیجی‌کالا!) — هوش مصنوعی آن را تحلیل می‌کند و قالب، افزونه وردپرس/ووکامرس، فروشگاه‌ساز جنگو/نود/HTML و حتی اپ اندروید برایت می‌سازد؛ همراه <b>فایل راهنمای Word با تصاویر مراحل نصب</b>.</p>
          <div class="ai-sell-feats">
            <span>کپی سبک از لینک</span><span>افزونه‌ساز وردپرس</span><span>فروشگاه‌ساز ۵ پلتفرم</span><span>اپ اندروید PWA</span><span>راهنمای ورد با عکس</span>
          </div>
          <div class="hero-cta" style="margin-top:22px">
            <a class="btn lg" href="/ai">شروع با هوش مصنوعی</a>
            <a class="btn lg ghost" href="/apps">سفارش اپ اندروید</a>
          </div>
        </div>
        <div class="ai-sell-art" aria-hidden="true">
          <div class="ai-tile t1"><b>برنز</b></div>
          <div class="ai-tile t2"><b>نقره</b></div>
          <div class="ai-tile t3"><b>طلا</b></div>
          <div class="ai-tile t4"><b>VIP</b></div>
          <div class="ai-tile t5"><b>لجندری</b></div>
          <div class="ai-tile t6"><b>اپیک</b></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="why">
  <div class="container">
    <div class="section-head"><h2>چرا اپ‌تم؟</h2></div>
    <div class="why-grid">
      <div class="card why-card"><div class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><h3>سرعت و سئو</h3><p>ساختار سبک، HTML معنایی، داده‌های ساختاریافته و خروجی SSR برای سئوی بهتر.</p></div>
      <div class="card why-card"><div class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg></div><h3>دانلود آنی</h3><p>بلافاصله پس از پرداخت، لینک دانلود اختصاصی در پنل کاربری فعال می‌شود.</p></div>
      <div class="card why-card"><div class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/></svg></div><h3>آپدیت رایگان</h3><p>خرید یک‌بارمِمیز؛ همه به‌روزرسانی‌های بعدی قالب برای شما رایگان است.</p></div>
      <div class="card why-card"><div class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><h3>پشتیبانی واقعی</h3><p>تیم پشتیبانی ما تا راه‌اندازی کامل قالب همراه شماست.</p></div>
    </div>
  </div>
</section>

<section class="section" id="comments" style="padding-top:10px">
  <div class="container">
    <div class="section-head"><h2>مشتریان چه می‌گویند؟</h2></div>
    <div class="grid-products" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
      ${approved.map(c => `
      <div class="card card-pad">
        <div class="flex" style="align-items:flex-start">
          <div class="avatar">${esc(c.name.trim().charAt(0))}</div>
          <div class="grow">
            <b>${esc(c.name)}</b>
            <div>${starsSvg(c.rating)}</div>
          </div>
          <span class="muted small">${timeAgo(c.createdAt)}</span>
        </div>
        <p class="muted" style="margin-top:12px; font-size:.9rem">«${esc(c.body)}»</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

  return page({
    user,
    active: 'home',
    title: `${APP_NAME} | خرید قالب سایت حرفه‌ای، راست‌چین و بهینه سئو`,
    desc: 'خرید آنلاین قالب وب‌سایت حرفه‌ای در اپ‌تم؛ قالب فروشگاهی، شرکتی، شخصی و استارتاپی با دانلود آنی، آپدیت رایگان و پشتیبانی.',
    url: baseUrl + '/',
    body, jsonld, csrf,
  });
}

// ─── کارت محصول (مشترک) ───
export function productCard(p, user = null, cartIds = []) {
  const { rating, count } = productRating(p.id);
  const likes = productLikes(p.id);
  const liked = user ? !!findOne('likes', l => l.productId === p.id && l.userId === user.id) : false;
  const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const cat = findOne('categories', c => c.id === (p.categoryIds || [])[0]);
  const inCart = cartIds.includes(p.id);
  const effP = p.salePrice || p.price;
  const tier = effP < 500000 ? '<span class="badge ok">اقتصادی</span>' : effP < 1200000 ? '<span class="badge primary">استاندارد</span>' : '<span class="badge warn">حرفه‌ای</span>';
  return `
<article class="card product-card">
  <div class="thumb">
    <a href="/templates/${esc(p.slug)}" aria-label="${esc(p.title)}">${svgThumb(p)}</a>
    <div class="fw-badges">${(p.frameworks || []).map(f => `<span class="badge">${FRAMEWORKS[f] ? FRAMEWORKS[f].short : esc(f)}</span>`).join('')}</div>
    ${off ? `<span class="off-badge">${fa(off)}٪ تخفیف</span>` : ''}
  </div>
  <div class="body">
    <h3><a href="/templates/${esc(p.slug)}">${esc(p.title)}</a></h3>
    <div class="meta">
      ${cat ? `<span>${esc(cat.name)}</span>` : ''}
      <span>${fa(p.pages)} صفحه</span>
      <span>${fa(p.downloads)} دانلود</span>
    </div>
    <div class="meta">${starsSvg(rating)} ${count ? `<span>(${fa(count)} نظر)</span>` : '<span class="muted">بدون نظر</span>'}</div>
    <div class="price-row">
      <div>
        ${tier}
        <span class="price">${money(p.salePrice || p.price)}</span>
        ${p.salePrice ? `<del class="muted small">${money(p.price)}</del>` : ''}
      </div>
      <button class="like-btn ${liked ? 'liked' : ''}" data-like="${p.id}" aria-label="لایک" title="لایک">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        <span>${fa(likes)}</span>
      </button>
    </div>
    <div class="card-buy-row">
      <button class="btn sm ${inCart ? 'ghost cart-in' : ''}" data-cart-toggle="${p.id}" data-title="${esc(p.title)}">
        ${inCart ? 'در سبد — حذف' : 'افزودن به سبد'}
      </button>
      <a class="btn sm soft" href="/checkout?items=${p.id}">خرید سریع</a>
    </div>
  </div>
</article>`;
}

// ─── فهرست قالب‌ها با فیلتر ───
export function catalogPage(req, res, { user, baseUrl, query, csrf, cart = [] }) {
  let products = findMany('products', p => p.published);
  const q = (query.q || '').trim();
  const cat = query.cat || '';
  const fw = query.fw || '';
  const sort = query.sort || 'new';
  const tier = query.tier || '';
  const sale = query.sale === '1';
  const time = query.time || '';

  if (q) products = products.filter(p => (p.title + ' ' + (p.tags || []).join(' ') + ' ' + p.description).includes(q));
  if (tier) products = products.filter(p => {
    const eff = p.salePrice || p.price;
    return tier === 'eco' ? eff < 500000 : tier === 'std' ? (eff >= 500000 && eff < 1200000) : eff >= 1200000;
  });
  if (sale) products = products.filter(p => !!p.salePrice);
  if (time) {
    const days = { day: 1, week: 7, month: 30 }[time] || 0;
    const cutoff = Date.now() - (time === 'old' ? 32 * 864e5 : days * 864e5);
    products = products.filter(p => time === 'old' ? new Date(p.createdAt).getTime() < cutoff : new Date(p.createdAt).getTime() >= cutoff);
  }
  if (cat) {
    const c = findOne('categories', x => x.slug === cat);
    if (c) products = products.filter(p => p.categoryIds.includes(c.id));
  }
  if (fw) products = products.filter(p => (p.frameworks || []).includes(fw));
  if (sort === 'cheap') products = products.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  else if (sort === 'popular') products = products.sort((a, b) => b.downloads - a.downloads);
  else if (sort === 'rating') products = products.sort((a, b) => productRating(b.id).rating - productRating(a.id).rating);
  else products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const checked = v => v ? 'checked' : '';
  const qs = extra => {
    const p = new URLSearchParams(query);
    Object.entries(extra).forEach(([k, v]) => (v === null ? p.delete(k) : p.set(k, v)));
    return '/templates' + (p.toString() ? '?' + p.toString() : '');
  };

  const chip = (active_, href_, label_) => `<a class="chip ${active_ ? 'chip-on' : ''}" href="${href_}" data-finst>${label_}</a>`;
  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>قالب‌ها</span></nav>
  <div class="section-head"><h2>فروشگاه قالب‌ها</h2><span class="sub">${fa(products.length)} قالب یافت شد</span></div>

  <div class="card card-pad filter-bar" style="margin-bottom:22px">
    <div class="flex wrap" style="gap:10px;align-items:center" id="liveSearchWrap">
      <div class="search grow" style="min-width:220px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input class="input" type="search" id="liveSearch" value="${esc(q)}" placeholder="جستجوی زنده در قالب‌ها… (مثلا فروشگاه)" autocomplete="off">
        <span class="muted small" id="searchHint" hidden>… در حال جستجو</span>
      </div>
    </div>
    <div class="filter-row"><b class="small muted">دسته:</b>
      ${chip(!cat, qs({ cat: null, page: null }), 'همه')}
      ${getDb().categories.map(c => chip(cat === c.slug, qs({ cat: c.slug, page: null }), c.icon + ' ' + c.name)).join('')}
    </div>
    <div class="filter-row"><b class="small muted">فناوری:</b>
      ${chip(!fw, qs({ fw: null, page: null }), 'همه')}
      ${Object.entries(FRAMEWORKS).filter(([k]) => ['html', 'tailwind', 'bootstrap', 'react'].includes(k)).map(([k, v]) => chip(fw === k, qs({ fw: k, page: null }), `<span style="color:${v.color}">⬤</span> ${v.label}`)).join('')}
    </div>
    <div class="filter-row"><b class="small muted">مرتب‌سازی:</b>
      ${[['new', 'جدیدترین'], ['popular', 'پرفروش‌ترین'], ['cheap', 'ارزان‌ترین'], ['rating', 'بهترین امتیاز']].map(([k, l]) => chip(sort === k, qs({ sort: k, page: null }), l)).join('')}
    </div>
    <div class="filter-row between">
      <div class="flex" style="gap:8px;flex-wrap:wrap;align-items:center">
        <b class="small muted">سطح:</b>
        ${chip(!tier, qs({ tier: null, page: null }), 'همه')}
        ${chip(tier === 'eco', qs({ tier: 'eco', page: null }), 'اقتصادی')}
        ${chip(tier === 'std', qs({ tier: 'std', page: null }), 'استاندارد')}
        ${chip(tier === 'pro', qs({ tier: 'pro', page: null }), 'حرفه‌ای')}
        ${chip(sale, qs(Object.assign({ sale: sale ? null : '1' }, { page: null })), 'فقط تخفیف‌دار')}
      </div>
      ${(q || cat || fw || tier || sale || time || sort !== 'new') ? `<a class="btn sm ghost" href="/templates">حذف فیلترها</a>` : ''}
    </div>
    <div class="filter-row"><b class="small muted">زمان ساخت:</b>
      ${chip(!time, qs({ time: null, page: null }), 'همه')}
      ${chip(time === 'day', qs({ time: 'day', page: null }), '۲۴ ساعت اخیر')}
      ${chip(time === 'week', qs({ time: 'week', page: null }), 'هفته اخیر')}
      ${chip(time === 'month', qs({ time: 'month', page: null }), 'ماه اخیر')}
      ${chip(time === 'old', qs({ time: 'old', page: null }), 'بیش از یک ماه')}
    </div>
    <div class="filter-row muted small" data-rescount>${fa(products.length)} قالب مطابق فیلترها ${cart.length ? `· ${fa(cart.length)} قالب در سبد شما` : ''}</div>
  </div>
  <div id="catalogGrid">
  ${products.length
    ? (() => {
        const PER = 9;
        const pages = Math.ceil(products.length / PER);
        const cur = Math.min(Math.max(1, parseInt(query.page) || 1), pages);
        const slice = products.slice((cur - 1) * PER, cur * PER);
        const pager = pages > 1 ? (() => {
          const pgBtn = (href, label, cls, isCur, title = '') => `<a class="btn sm ${cls}" href="${href}" ${isCur ? 'aria-current="page"' : ''} ${title ? `title="${title}"` : ''}>${label}</a>`;
          let nums = [];
          for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || Math.abs(i - cur) <= 1) nums.push(i);
            else if (nums[nums.length - 1] !== '…') nums.push('…');
          }
          const numHtml = nums.map(n => n === '…'
            ? '<span class="pg-dots">•••</span>'
            : pgBtn(qs({ page: n }), fa(n), (n === cur ? '' : 'ghost ') + 'pg-num', n === cur)).join('');
          return `<div class="pager">
            ${cur > 1 ? pgBtn(qs({ page: 1 }), '« اول', 'ghost', false, 'اولین صفحه') : ''}
            ${cur > 1 ? pgBtn(qs({ page: cur - 1 }), '→ قبلی', 'ghost', false, 'صفحه قبل') : ''}
            ${numHtml}
            ${cur < pages ? pgBtn(qs({ page: cur + 1 }), 'بعدی ←', 'ghost', false, 'صفحه بعد') : ''}
            ${cur < pages ? pgBtn(qs({ page: pages }), 'آخر »', 'ghost', false, 'آخرین صفحه') : ''}
            <span class="pg-info">نمایش ${fa((cur - 1) * PER + 1)} تا ${fa(Math.min(cur * PER, products.length))} از ${fa(products.length)} قالب — صفحه ${fa(cur)} از ${fa(pages)}</span>
          </div>`;
        })() : '';
        return `<div class="grid-products">${slice.map(x => productCard(x, user, cart.map(c => c.id))).join('')}</div>${pager}`;
      })()
    : `<div class="card empty-state"><div class="ic">🔍</div><p>قالبی با این مشخصات پیدا نشد.</p><a class="btn soft sm" style="margin-top:14px" href="/templates">حذف فیلترها</a></div>`}
  </div>
</div>
<script src="/assets/js/catalog.js" defer></script>`;
  return page({
    user, active: 'templates',
    title: q ? `جستجو: ${q} | ${APP_NAME}` : `فروشگاه قالب‌های حرفه‌ای وب | ${APP_NAME}`,
    desc: 'فهرست کامل قالب‌های حرفه‌ای وب سایت؛ فیلتر بر اساس دسته‌بندی و فریمورک (Tailwind، Bootstrap، React، HTML).',
    url: baseUrl + '/templates', body, csrf,
  });
}

// ─── صفحه محصول ───
export function productPage(req, res, ctx) {
  const { user, baseUrl, product, csrf, ok = '', error = '' } = ctx;
  // سطح قالب بر اساس قیمت
  const effP = product.salePrice || product.price;
  const tier = effP < 500000 ? { t: 'اقتصادی', c: 'ok' } : effP < 1200000 ? { t: 'استاندارد', c: 'primary' } : { t: 'حرفه‌ای 👑', c: 'warn' };
  // قالب قبلی/بعدی برای ناوبری
  const all = findMany('products', x => x.published).sort((a, b) => a.id - b.id);
  const idx = all.findIndex(x => x.id === product.id);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const { rating, count } = productRating(product.id);
  const likes = productLikes(product.id);
  const liked = user ? !!findOne('likes', l => l.productId === product.id && l.userId === user.id) : false;
  const comments = findMany('comments', c => c.productId === product.id && c.status === 'approved')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const cat = findOne('categories', c => c.id === (product.categoryIds || [])[0]);
  const price = product.salePrice || product.price;

  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'Product',
    name: product.title, description: product.description, sku: 'AT-' + product.id,
    brand: { '@type': 'Brand', name: APP_NAME }, url: `${baseUrl}/templates/${product.slug}`,
    offers: { '@type': 'Offer', price: price, priceCurrency: 'IRR', availability: 'https://schema.org/InStock', url: `${baseUrl}/templates/${product.slug}` },
    ...(count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, reviewCount: count } } : {}),
  }];

  const body = `
<div class="container section">
  ${ok ? `<div class="alert ok notif-ok">${esc(ok)}</div>` : ''}
  ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
  <nav class="breadcrumb">
    <a href="/">خانه</a> <span>/</span> <a href="/templates">قالب‌ها</a>
    ${cat ? `<span>/</span> <a href="/templates?cat=${esc(cat.slug)}">${esc(cat.name)}</a>` : ''}
    <span>/</span> <span>${esc(product.title)}</span>
  </nav>

  <div class="product-hero">
    <div>
      <div class="preview">${svgThumb(product)}</div>
      <div class="tabs" style="margin-top:26px">
        <button class="active" type="button" data-tab="desc">توضیحات</button>
        <button type="button" data-tab="comments">نظرات (${fa(comments.length)})</button>
      </div>
      <div id="tab-desc">
        <p>${esc(product.longDescription || product.description)}</p>
        <div class="section-head" style="margin-top:26px"><h2>مشخصات فنی</h2></div>
        <div class="table-wrap"><table class="tbl">
          <tr><td>فریمورک‌ها</td><td>${(product.frameworks || []).map(f => `<span class="badge primary">${FRAMEWORKS[f] ? FRAMEWORKS[f].label : esc(f)}</span>`).join(' ')}</td></tr>
          <tr><td>تعداد صفحات</td><td>${fa(product.pages)} صفحه کامل</td></tr>
          <tr><td>تاریخ انتشار</td><td>${faDate(product.createdAt)}</td></tr>
          <tr><td>آخرین بروزرسانی</td><td>${faDate(product.updatedAt || product.createdAt)}</td></tr>
          <tr><td>دانلودها</td><td>${fa(product.downloads)} بار</td></tr>
        </table></div>
      </div>
      <div id="tab-comments" hidden>
        ${comments.map(c => `
        <div class="comment">
          <div class="avatar">${esc(c.name.trim().charAt(0))}</div>
          <div class="body">
            <div class="head"><b>${esc(c.name)}</b> ${starsSvg(c.rating)} <span class="muted small">${timeAgo(c.createdAt)}</span></div>
            <p style="margin-top:6px; font-size:.93rem">${esc(c.body)}</p>
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="ic">💬</div><p>اولین نفری باشید که نظر می‌دهد!</p></div>'}

        <div class="card card-pad" style="margin-top:22px">
          <h3 style="margin-bottom:14px">ثبت نظر شما</h3>
          ${user ? `
          <form method="post" action="/templates/${esc(product.slug)}/comment">
            <input type="hidden" name="_csrf" value="${esc(ctx.csrf || '')}">
            <div class="field"><label class="req">امتیاز شما</label>
              <div class="rate-pick" id="ratePick">
                ${[1, 2, 3, 4, 5].map(i => `<button type="button" aria-label="${i}">★</button>`).join('')}
              </div>
              <input type="hidden" name="rating" id="ratingInput" value="5">
            </div>
            <div class="field"><label class="req">متن نظر</label>
              <textarea class="textarea" name="body" required minlength="5" maxlength="700" placeholder="تجربه‌ خود از این قالب را بنویسید…"></textarea>
            </div>
            <button class="btn" type="submit">ارسال نظر</button>
            <p class="hint" style="margin-top:8px">نظرات پس از تأیید مدیر منتشر می‌شوند.</p>
          </form>` : `
          <p class="muted">برای ثبت نظر <a href="/login" style="color:var(--primary)">وارد شوید</a> یا <a href="/register" style="color:var(--primary)">ثبت‌نام کنید</a>.</p>`}
        </div>
      </div>
    </div>

    <div>
      <div class="card card-pad buy-card">
        <div class="between" style="margin-bottom:6px">
          <div class="flex">${starsSvg(rating)} ${count ? `<span class="muted small">(${fa(count)})</span>` : ''}</div>
          <button class="like-btn ${liked ? 'liked' : ''}" data-like="${product.id}" aria-label="لایک">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
            <span>${fa(likes)}</span>
          </button>
        </div>
        <h1 style="font-size:1.2rem; line-height:1.7">${esc(product.title)}</h1>
        <p class="muted small" style="margin:8px 0 10px">${esc(product.description)}</p>
        <span class="badge ${tier.c}" style="margin-bottom:8px">سطح ${tier.t}</span> <span class="badge soft">${fa((product.features || []).length)} امکان</span>
        ${product.salePrice ? `<div class="muted small"><del>${money(product.price)}</del></div>` : ''}
        <div class="p-off">${money(price)}</div>
        <div style="display:grid; gap:10px; margin:18px 0">
          <button class="btn lg" data-add-to-cart="${product.id}">افزودن به سبد خرید</button>
          <a class="btn-lg-live" href="/templates/${esc(product.slug)}/preview" target="_blank" rel="noopener">پیش‌نمایش زنده قالب</a>
        </div>
        <ul class="feature-list">
          ${(product.features || []).map(f => `<li>${esc(f)}</li>`).join('')}
          <li>لینک دانلود آنی پس از پرداخت</li>
          <li>به‌روزرسانی رایگان مادام‌العمر</li>
        </ul>
      </div>
    </div>
    <div class="card card-pad" style="margin-top:22px">
      <div class="between flex-wrap" style="gap:10px">
        <a class="btn ghost sm" href="/templates/${esc(prev.slug)}">→ ${esc(prev.title.split('—')[0].trim())}</a>
        <span class="muted small">جابه‌جایی بین قالب‌ها</span>
        <a class="btn ghost sm" href="/templates/${esc(next.slug)}">${esc(next.title.split('—')[0].trim())} ←</a>
      </div>
    </div>
  </div>
</div>`;

  return page({
    user, active: 'templates',
    title: `${product.title} | خرید با دانلود آنی | ${APP_NAME}`,
    desc: product.description,
    url: `${baseUrl}/templates/${product.slug}`, body, jsonld, csrf,
  });
}

// ─── سبد خرید (رندر سمت کلاینت داخل پوسته SSR) ───
export function cartPage(req, res, { user, baseUrl, csrf, cart }) {
  const { rows, subtotal } = cartSummary(cart);
  const saved = rows.reduce((s, r) => s + Math.max(0, ((findOne('products', x => x.id === r.id && x.published) || {}).price || 0) - r.price) * r.qty, 0);
  const count = rows.reduce((s, r) => s + r.qty, 0);
  const itemsStr = cart.map(x => x.id).join(',') || '';
  const FREE = 500000, shipLeft = Math.max(0, FREE - subtotal), shipPct = Math.min(100, Math.round((subtotal / FREE) * 100));
  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>سبد خرید</span></nav>
  <div class="cart-page-head">
    <div class="section-head" style="margin-bottom:0"><h2>سبد خرید شما ${count ? `<span class="badge primary">${fa(count)} کالا</span>` : ''}</h2></div>
    ${rows.length ? `<button class="btn sm ghost" id="cartClearAll" type="button">خالی کردن سبد</button>` : ''}
  </div>
  ${rows.length ? `
  <div class="admin-2col" style="grid-template-columns:1.65fr 1fr;align-items:start">
    <div class="card card-pad" id="cartBox" style="display:grid;gap:0;padding:6px 20px">
      ${rows.map((r, i) => { const p = findOne('products', x => x.id === r.id && x.published) || {}; const off = p.price && p.salePrice ? p.price - p.salePrice : 0; return `
      <div class="cart-item" data-cart-row="${r.id}" style="${i ? 'border-top:1px dashed var(--border)' : ''}">
        <div class="ct-thumb">${svgThumb({ id: r.id, title: r.title, palette: r.palette, accent: r.accent })}</div>
        <div class="grow">
          <b><a href="/templates/${esc(r.slug)}" class="ct-title">${esc(r.title)}</a></b>
          <div class="muted small" style="margin-top:3px">
            ${off ? `<del class="muted">${money(r.price + off)}</del> <b class="ct-off">${money(r.price)}</b>` : `<b class="ct-off">${money(r.price)}</b>`} <span>تومان / هر عدد</span>
            ${off ? `<span class="badge ok" style="margin-inline-start:6px">${fa(Math.round((off / (r.price + off)) * 100))}٪ تخفیف</span>` : ''}
          </div>
        </div>
        <form method="post" action="/cart/qty" class="flex" style="gap:6px;align-items:center">
          <input type="hidden" name="_csrf" value="${esc(csrf)}">
          <input type="hidden" name="productId" value="${r.id}">
          <label class="muted small" for="qty-${r.id}" style="margin:0">تعداد:</label>
          <select class="select ct-qty-select" name="qty" id="qty-${r.id}" onchange="this.form.submit()" aria-label="تعداد ${esc(r.title)}">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}" ${n === r.qty ? 'selected' : ''}>${fa(n)}</option>`).join('')}
          </select>
          <noscript><button class="btn sm soft" type="submit">ثبت</button></noscript>
        </form>
        <b class="ct-line">${money(r.line)}</b>
        <form method="post" action="/cart/remove" data-cart-remove-form="${r.id}">
          <input type="hidden" name="_csrf" value="${esc(csrf)}">
          <input type="hidden" name="productId" value="${r.id}">
          <button class="ct-remove" type="submit" title="حذف از سبد" aria-label="حذف ${esc(r.title)}">×</button>
        </form>
      </div>`; }).join('')}
      <div style="padding:14px 8px;border-top:1px dashed var(--border)">
        <a class="btn sm soft" href="/templates">افزودن کالای بیشتر</a>
      </div>
    </div>
    <div class="card card-pad cart-total-panel">
      <h3 style="margin-bottom:4px">خلاصه سفارش</h3>
      <p class="muted small" style="margin-bottom:10px">${fa(count)} کالا در سبد شما</p>
      <div class="ct-row"><span class="muted">جمع کالاها</span><span>${money(subtotal + saved)}</span></div>
      ${saved ? `<div class="ct-row" style="color:var(--ok)"><span class="muted">سود شما</span><span>${money(saved)}−</span></div>` : ''}
      <div class="ct-row"><span class="muted">هزینه ارسال</span>${shipLeft ? `<span>${money(FREE)} − تا رایگان</span>` : `<span class="badge ok">رایگان</span>`}</div>
      <div style="display:grid;gap:5px;padding:4px 0">
        <div class="muted small" style="display:flex;justify-content:space-between"><span>${shipLeft ? `تا ارسال رایگان ${money(shipLeft)} تومان` : 'ارسال این سفارش رایگان است'}</span><b style="color:var(--ok)">${fa(shipPct)}٪</b></div>
        <div class="cd-ship" style="padding:0"><div class="cd-ship-bar" style="height:7px;border-radius:99px;background:color-mix(in srgb,var(--border) 70%,transparent);overflow:hidden"><i style="display:block;height:100%;width:${shipPct}%;background:linear-gradient(90deg,var(--primary),var(--accent,#22d3ee));border-radius:99px;transition:.4s"></i></div></div>
      </div>
      <div class="ct-row total"><span>مبلغ قابل پرداخت</span><b class="price" style="font-size:1.35rem">${money(subtotal)}</b></div>
      <a class="btn lg" style="width:100%;margin-top:8px" href="/checkout?items=${esc(itemsStr)}">ادامه و تسویه حساب</a>
      <div style="display:grid;gap:8px;margin-top:14px" class="muted small">
        <span style="display:flex;align-items:center;gap:8px"><i style="width:7px;height:7px;border-radius:50%;background:var(--ok)"></i> پرداخت امن از طریق درگاه رسمی</span>
        <span style="display:flex;align-items:center;gap:8px"><i style="width:7px;height:7px;border-radius:50%;background:var(--ok)"></i> دانلود آنی پس از پرداخت</span>
        <span style="display:flex;align-items:center;gap:8px"><i style="width:7px;height:7px;border-radius:50%;background:var(--ok)"></i> پشتیبانی ۷ روز هفته</span>
      </div>
    </div>
  </div>` : `
  <div class="card cart-empty">
    <div class="ce-ic" style="font-size:2.6rem;color:var(--primary)"><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2l2.6 12.6a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.6L22 7H6"/></svg></div>
    <h3>سبد خرید شما خالی است</h3>
    <p class="muted small">قالب‌های حرفه‌ای اپ‌تم منتظر شما هستند؛ از همین‌جا شروع کنید.</p>
    <a class="btn lg" style="margin-top:8px" href="/templates">مشاهده کالاها</a>
  </div>`}
</div>
<script>
(function(){
  var csrf = (document.querySelector('meta[name="csrf"]')||{}).content||'';
  var clearBtn = document.getElementById('cartClearAll');
  if (clearBtn) clearBtn.addEventListener('click', function(){
    tlConfirm('همه <b>'+document.querySelectorAll('[data-cart-row]').length+'</b> کالا از سبد حذف شوند؟', { okText:'بله، خالی کن', danger:true, title:'خالی کردن سبد' })
    .then(function(ok){
      if(!ok) return;
      fetch('/cart/clear', { method:'POST', headers:{'X-CSRF':csrf, 'Accept':'application/json'} }).then(function(){ location.reload(); });
    });
  });
  document.addEventListener('submit', function(e){
    var f = e.target.closest('form[data-cart-remove-form]');
    if(!f || f.dataset.confirmed==='1') return;
    e.preventDefault();
    var row = f.closest('[data-cart-row]');
    var name = row ? row.querySelector('.ct-title').textContent : 'این کالا';
    tlConfirm('<b>'+name+'</b> از سبد حذف شود؟', { okText:'بله، حذف کن', danger:true })
    .then(function(ok){
      if(!ok) return;
      f.dataset.confirmed='1';
      f.requestSubmit ? f.requestSubmit() : f.submit();
    });
  });
})();
</script>`;
  return page({
    user, title: `سبد خرید | ${APP_NAME}`, desc: 'سبد خرید فروشگاه قالب اپ‌تم', url: baseUrl + '/cart', body, csrf,
  });
}

// ─── حساب کاربری ───
export function accountPage(req, res, ctx) {
  const { user, baseUrl, csrf, query } = ctx;
  const orders = findMany('orders', o => o.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const projects = findMany('projects', p => p.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const statusMap = { paid: ['پرداخت شده', 'ok'], pending: ['در انتظار پرداخت', 'warn'], failed: ['ناموفق', 'err'], refunded: ['بازگشت داده شده', 'info'] };
  const notices = [];
  if (query.welcome === '1') notices.push(['ok', `خوش آمدید ${esc(user.name)} 🎉 حساب شما ساخته شد.برای دانلود فوری و تخفیف‌های ویژه اعضا، از همین پنل استفاده کنید.`]);
  if (query.verified === '1') notices.push(['ok', 'ایمیل شما با موفقیت تأیید شد ✅ حساب شما کاملاً فعال است.']);
  if (query.verified === '0') notices.push(['err', 'لینک تأیید نامعتبر یا منقضی است؛ دوباره درخواست دهید.']);
  if (query.resent === '1') notices.push(['info', 'ایمیل تأیید دوباره ارسال شد 📧 (در حالت دمو، لینک در لاگ سرور قابل مشاهده است).']);
  if (!user.verified && user.email.includes('@') && !user.email.endsWith('@sms.local')) notices.push(['warn', '⚠️ ایمیل خود را تأیید نکرده‌اید؛ ۷ روز پس از ثبت‌نام حساب حذف می‌شود. از دکمه بالا اقدام کنید.']);
  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>حساب کاربری</span></nav>
  ${notices.map(([t, m]) => `<div class="alert ${t} notif-ok">${m}</div>`).join('')}
  <div class="account-grid">
    <div>
      <div class="card account-side">
        <div class="avatar" style="width:64px;height:64px;font-size:1.5rem;margin:0 auto 12px">${esc(user.name.trim().charAt(0))}</div>
        <b>${esc(user.name)}</b>
        <div class="muted small">${esc(user.email)}</div>
        <div class="muted small" style="margin-top:6px">عضویت: ${faDate(user.createdAt)}</div>
      </div>
      <div class="card card-pad account-nav" style="margin-top:16px">
        <a class="active" href="/account">📦 سفارش‌های من</a>
        <a href="/account/messages">💬 پیام با پشتیبانی</a>
        <a href="/account/wallet">💳 کیف پول</a>
        <a href="/apps">🤖 سفارش / پیگیری اپ</a>
        <a href="/templates">🛍 خرید قالب جدید</a>
        <form method="post" action="/logout" style="margin-top:8px">
          <input type="hidden" name="_csrf" value="${esc(ctx.csrf || '')}">
          <button class="btn ghost sm" type="submit" style="width:100%">خروج از حساب</button>
        </form>
      </div>
    </div>
    <div>
      ${projects.length ? `
      <div class="section-head" style="margin-top:0" id="apps"><h2>پروژه‌های اپلیکیشن</h2><a class="muted small" href="/apps/publish">انتشار اپ‌های ساخته‌شده ←</a></div>
      <div style="display:grid;gap:12px;margin-bottom:26px">
        ${projects.map(pr => {
          const st = { pending: 'در انتظار', started: 'در حال طراحی', preview1: 'پیش‌نمایش ۱', preview2: 'پیش‌نمایش ۲', preview3: 'پیش‌نمایش ۳', awaiting_second: 'نقطه تصمیم ۷۰٪ ⚖️', final_dev: 'توسعه نهایی', delivered_pending_final: 'تحویل اولیه', completed: 'تکمیل شده ✅', cancelled: 'لغو شده' }[pr.status] || pr.status;
          const prog = { pending: 5, started: 15, preview1: 25, preview2: 45, preview3: 65, awaiting_second: 70, final_dev: 85, delivered_pending_final: 95, completed: 100, cancelled: 0 }[pr.status] || 0;
          return `<a class="card card-pad project-mini" href="/apps/track/${esc(pr.code)}">
            <div class="between"><b>📱 ${esc(pr.code)} — ${esc(pr.prompt.slice(0, 50))}…</b><span class="badge ${pr.status === 'cancelled' ? 'err' : pr.status === 'completed' ? 'ok' : 'primary'}">${st}</span></div>
            <div class="progress" style="margin-top:10px"><span style="width:${prog}%"></span></div>
          </a>`;
        }).join('')}
      </div>` : ''}
      <div class="section-head" id="orders"><h2>سفارش‌ها و دانلودها</h2></div>
      ${orders.length ? `
      <div class="table-wrap"><table class="tbl">
        <tr><th>کد سفارش</th><th>قالب‌ها</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th><th>دانلود</th></tr>
        ${orders.map(o => {
          const [lbl, cls] = statusMap[o.status] || [o.status, ''];
          return `<tr>
          <td><b>${esc(o.code)}</b></td>
          <td>${o.items.map(it => {
            const p = findOne('products', x => x.id === it.productId);
            return p ? `<a href="/templates/${esc(p.slug)}" style="color:var(--primary)">${esc(p.title)}</a>` : '—';
          }).join('، ')}</td>
          <td>${money(o.total)}</td>
          <td><span class="badge ${cls}">${lbl}</span></td>
          <td class="muted small">${faDate(o.createdAt)}</td>
          <td>${o.status === 'paid'
            ? o.items.map(it => {
                const p = findOne('products', x => x.id === it.productId);
                return p ? `<a class="btn sm soft" href="/account/downloads/${p.id}" style="margin:2px">⬇️ دانلود</a>` : '';
              }).join('')
            : `<a class="btn sm ghost" href="/checkout/${esc(o.code)}">پرداخت</a>`}</td>
        </tr>`;
        }).join('')}
      </table></div>
      <div class="alert info" style="margin-top:16px">💡 لینک‌های دانلود خریداری‌شده همیشه از این صفحه در دسترس‌اند.</div>`
      : `<div class="card empty-state"><div class="ic">📦</div><p>هنوز سفارشی ثبت نکرده‌اید.</p><a class="btn" style="margin-top:16px" href="/templates">مشاهده قالب‌ها</a></div>`}
    </div>
  </div>
</div>`;
  return page({ user, title: `حساب کاربری | ${APP_NAME}`, desc: 'پنل کاربری اپ‌تم', url: baseUrl + '/account', body, noindex: true, csrf });
}

// ─── صفحات ورود / ثبت‌نام / نصب اولیه (نسخهٔ فوق‌حرفه‌ای — هم‌خانواده با مودال) ───
export function authForm({ mode, baseUrl, error = '', ok = '', csrf = '', user = null, needsSetup = false, query = {} }) {
  const isSetup = mode === 'setup';
  const isLogin = mode === 'login';
  const title = isSetup ? 'نصب اولیه — ساخت حساب مدیر' : (isLogin ? 'ورود به حساب' : 'ساخت حساب کاربری');
  const action = isSetup ? '/setup' : (isLogin ? '/login' : '/register');
  const oauthErr = query.err === 'oauth' ? '<div class="alert err">ورود اجتماعی ناموفق بود یا فعال نیست. با ایمیل/موبایل وارد شوید.</div>' : '';
  const oc = oauthBadges();
  const body = `
<div class="auth-wrap">
  <div class="card auth-card auth-pro">
    <div class="logo" style="justify-content:center;margin-bottom:8px"><span class="mark">پ</span>اپ‌تم</div>
    <h1 style="text-align:center">${isLogin ? 'خوش برگشتید 👋' : title}</h1>
    <p class="sub" style="text-align:center">${isSetup ? 'اولین اجرای فروشگاه؛ حساب مدیر سیستم را بسازید.' : (isLogin ? 'برای ادامه وارد حساب خود شوید.' : 'کمتر از یک دقیقه؛ هدیه <b class="grad-text">WELCOME10</b> انتظار شماست.')}</p>
    ${!isSetup ? `
    <div class="auth-tabs" role="tablist">
      <a href="/login" class="${isLogin ? 'on' : ''}" role="tab">ورود</a>
      <a href="/register" class="${!isLogin ? 'on' : ''}" role="tab">ثبت‌نام</a>
    </div>` : ''}
    ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
    ${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}
    ${oauthErr}
    <form method="post" action="${action}">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      ${isSetup || !isLogin ? `<div class="field"><label class="req">نام و نام خانوادگی</label>
        <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
        <input class="input" type="text" name="name" required minlength="2" maxlength="60" autocomplete="name" placeholder="مثلاً: سارا محمدی"></div></div>` : ''}
      <div class="field"><label class="req">ایمیل یا شماره موبایل</label>
        <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>
        <input class="input" type="text" name="identifier" required autocomplete="username" dir="ltr" placeholder="you@gmail.com یا ۰۹۱۲۳۴۵۶۷۸۹"></div>
        <p class="hint">${isLogin ? '' : 'با جیمیل ثبت‌نام کنید و ایمیل را تأیید کنید؛ یا فقط موبایل بدهید و فوری فعال شوید.'}</p></div>
      <div class="field">
        <div class="between"><label class="req">رمز عبور</label>${isLogin ? '<a class="af-forgot" href="/forgot">فراموشی رمز؟ 🔑</a>' : ''}</div>
        <div class="af-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
        <input class="input" type="password" name="password" required minlength="8" autocomplete="${isLogin ? 'current-password' : 'new-password'}" dir="ltr" placeholder="${isLogin ? '••••••••' : 'حداقل ۸ کاراکتر'}">
        <button type="button" class="af-eye" id="afEye" aria-label="نمایش رمز">👁</button></div>
        <p class="hint">حداقل ۸ کاراکتر.</p>
      </div>
      <button class="btn lg" type="submit" style="width:100%">${isSetup ? 'ساخت حساب مدیر و ورود 🚀' : (isLogin ? 'ورود به حساب 🚀' : 'ساخت حساب + هدیه WELCOME10 🎁')}</button>
    </form>
    ${!isSetup ? `
    <div class="oauth-sep"><span>یا ورود سریع با</span></div>
    <div class="oauth-row">
      ${oc.github}
      ${oc.google}
      ${oc.telegram}
      <a class="oauth-btn off" href="/login" data-needs-setup="bale">💬 بله</a>
      <a class="oauth-btn off" href="/login" data-needs-setup="rubika">🟣 روبیکا</a>
    </div>
    ${isLogin ? '' : '<div class="alert info" style="margin-top:16px">🎁 هدیه ثبت‌نام: کد تخفیف <b>WELCOME10</b> (۱۰٪ اولین خرید) + تخفیف‌های ویژه اعضا</div>'}` : ''}
  </div>
</div>
<script>
(function(){
  var eye = document.getElementById('afEye');
  if (eye) eye.addEventListener('click', function(){
    var inp = eye.parentElement.querySelector('input[type=password], input[type=text]');
    if (!inp) return;
    var isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    eye.textContent = isPass ? '🙈' : '👁';
  });
})();
</script>`;
  return page({ user, title: `${title} | ${APP_NAME}`, desc: title, body, noindex: true, csrf });
}

// دکمه‌های ورود اجتماعی (فعال فقط اگر در تنظیمات ادمین تکمیل شده باشد)
function oauthBadges() {
  const oc = (getDb().settings.oauth) || {};
  const on = (cond, href, html, title) => cond
    ? `<a class="oauth-btn" href="${href}" title="${title}">${html}</a>`
    : `<a class="oauth-btn off" href="/login" title="در تنظیمات ادمین فعال کنید">${html}</a>`;
  return {
    github: on(oc.githubId && oc.githubSecret, '/auth/github', '🐙 گیت‌هاب', 'ورود با گیت‌هاب'),
    google: on(oc.googleId && oc.googleSecret, '/auth/google', '🔴 گوگل', 'ورود با گوگل'),
    telegram: on(oc.telegramBot && oc.telegramToken, '/auth/telegram', '✈️ تلگرام', 'ورود با تلگرام'),
  };
}

// ═══ فرم فراموشی رمز — ۵ کانال ═══
export function forgotForm({ csrf, query = {} }) {
  const ch = query.ch || 'email';
  const desc = {
    email: 'لینک بازیابی به ایمیل شما ارسال می‌شود (SMTP باید در تنظیمات فعال باشد).',
    mobile: 'کارشناس ما در کمتر از ۲۴ ساعت با همین شماره تماس/پیامک می‌گیرد و رمز جدید می‌سازد.',
    telegram: 'درخواست شما ثبت و به پشتیبانی ارسال می‌شود؛ از طریق تلگرام پاسخ می‌گیرید.',
    bale: 'درخواست شما ثبت و به پشتیبانی ارسال می‌شود؛ از طریق بله پاسخ می‌گیرید.',
    rubika: 'درخواست شما ثبت و به پشتیبانی ارسال می‌شود؛ از طریق روبیکا پاسخ می‌گیرید.',
  }[ch];
  const body = `
<div class="auth-wrap">
  <div class="card auth-card auth-pro">
    <h1>🔑 بازیابی رمز عبور</h1>
    <p class="sub">کانال ارتباطی خود را انتخاب کنید</p>
    <div class="oauth-row" style="justify-content:center">
      ${[['email', '📧 جیمیل'], ['mobile', '📱 موبایل'], ['telegram', '✈️ تلگرام'], ['bale', '💬 بله'], ['rubika', '🟣 روبیکا']].map(([k, l]) =>
        `<a class="oauth-btn ${ch === k ? 'chip-on' : ''}" href="/forgot?ch=${k}">${l}</a>`).join('')}
    </div>
    ${query.sent ? '<div class="alert ok">✅ درخواست شما ثبت شد! حداکثر تا ۲۴ ساعت پاسخ می‌گیرید. (اگر ایمیل معتبر بود، لینک بازیابی هم ایمیل شد — پوشه اسپم را ببینید.)</div>' : ''}
    <form method="post" action="/forgot" style="margin-top:14px">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <input type="hidden" name="ch" value="${esc(ch)}">
      <div class="field">
        <label class="req">${ch === 'email' ? 'ایمیل حساب' : ch === 'mobile' ? 'شماره موبایل' : 'شناسه/آیدی شما در ' + ({ telegram: 'تلگرام', bale: 'بله', rubika: 'روبیکا' })[ch]}</label>
        <input class="input" name="identifier" required dir="ltr" placeholder="${ch === 'email' ? 'you@gmail.com' : ch === 'mobile' ? '۰۹۱۲۳۴۵۶۷۸۹' : '@myid'}">
      </div>
      <p class="hint">${desc}</p>
      <button class="btn lg" type="submit" style="width:100%">ارسال درخواست بازیابی</button>
    </form>
    <p class="muted small center" style="margin-top:16px"><a href="/login" style="color:var(--primary)">← بازگشت به ورود</a></p>
  </div>
</div>`;
  return page({ title: `بازیابی رمز عبور | ${APP_NAME}`, desc: 'بازیابی رمز', body, noindex: true, csrf });
}

// ═══ فرم تعیین رمز جدید (از لینک ایمیل) ═══
export function resetForm({ csrf, token, query = {} }) {
  const body = `
<div class="auth-wrap">
  <div class="card auth-card auth-pro">
    <h1>🔐 تعیین رمز جدید</h1>
    ${query.invalid ? '<div class="alert err">لینک نامعتبر یا منقضی است؛ دوباره درخواست دهید.</div>' : `
    <form method="post" action="/reset-password">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <input type="hidden" name="token" value="${esc(token)}">
      <div class="field"><label class="req">رمز جدید</label><input class="input" type="password" name="password" required minlength="8" dir="ltr" placeholder="حداقل ۸ کاراکتر"></div>
      <button class="btn lg" type="submit" style="width:100%">ثبت رمز جدید و ورود</button>
    </form>`}
  </div>
</div>`;
  return page({ title: `رمز جدید | ${APP_NAME}`, desc: 'تعیین رمز', body, noindex: true, csrf });
}


// ═══ صفحه عمومی «شهر هوش مصنوعی» — برای فروش فروشگاه‌ساز/افزونه/قالب ═══
export function aiHub(req, res, { user, baseUrl, csrf }) {
  const tierCards = [
    ['🥉', 'برنزی', '۴۹۰,۰۰۰', 'ساده و سریع — ۱ تا ۳ صفحه، پایه‌ترین امکانات', 'برای شروع و تست ایده'],
    ['🥈', 'نقره‌ای', '۸۹۰,۰۰۰', '۳ تا ۵ صفحه + افکت‌های نئونی و بخش‌های بیشتر', 'سایت شخصی و کسب‌وکار کوچک'],
    ['🥇', 'طلایی', '۱,۴۹۰,۰۰۰', '۵ تا ۸ صفحه + مودال، فیلتر، صفحه تخصصی', 'حرفه‌ای‌ها و فروشگاه‌ها'],
    ['💎', 'VIP', '۲,۴۹۰,۰۰۰', '۸ تا ۱۲ صفحه + سبد خرید، پنل کاربری، درگاه دمو', 'فروشگاه کامل'],
    ['👑', 'لجندری', '۴,۴۹۰,۰۰۰', '۱۲ تا ۱۸ صفحه + پنل ادمین، چندزبانه، انیمیشن سینمایی', 'برندهای جدی'],
    ['🔥', 'اپیک', '۷,۴۹۰,۰۰۰', '۱۸ تا ۳۰ صفحه + PWA، API، سئوی پیشرفته', 'پروژه‌های بزرگ'],
  ];
  const aiProducts = findMany('products', p => p.published && (p.tags || []).includes('هوش مصنوعی')).slice(0, 8);
  const body = `
<section class="hero">
  <div class="container inner" style="grid-template-columns:1fr">
    <div style="text-align:center;max-width:44rem;margin:auto">
      <span class="badge primary" style="margin-bottom:18px; display:inline-flex;">🤖 استودیوی هوش مصنوعی اپ‌تم</span>
      <h1>فروشگاه‌ساز، افزونه، قالب و اپ <span class="grad-text">با یک پرامپت</span></h1>
      <p class="lead" style="margin-inline:auto">لینک بده → هوش مصنوعی تحلیل می‌کند → قالب حرفه‌ای می‌سازد. خروجی برای وردپرس، ووکامرس، جنگو، نود جی‌اس و HTML خالص + فایل راهنمای Word با تصاویر مراحل نصب. ۶ سطح: برنزی تا اپیک.</p>
      <div class="hero-cta" style="justify-content:center">
        <a class="btn lg" href="/apps">📱 سفارش ساخت (با سطح‌بندی)</a>
        <a class="btn lg ghost" href="#tiers">مشاهده سطح‌ها</a>
      </div>
      <p class="muted small" style="margin-top:14px">👥 کاربران می‌توانند با <b>اشتراک پرو</b> (برنزی تا اپیک — تنظیم‌شده توسط مدیریت) خودشان قالب، افزونه، فروشگاه‌ساز و اپ بسازند؛ قدرت هوش مصنوعی بهترین پلن پرو = ۵۰٪ قدرت ادمین.</p>
    </div>
  </div>
</section>

<section class="section" id="tiers" style="padding-top:0">
  <div class="container">
    <div class="section-head"><h2>سطح‌های هوش مصنوعی — هرچه بالاتر، بخش‌های بیشتر</h2><span class="muted small">قیمت‌های پایه؛ در سفارش نهایی با تخفیف/توافق تعدیل می‌شود</span></div>
    <div class="tier-grid">
      ${tierCards.map(([ic, name, price, desc, fit]) => `
      <div class="tier-public">
        <div class="tp-ic">${ic}</div>
        <b class="tp-name">${name}</b>
        <div class="tp-price">${price} <small>تومان</small></div>
        <p class="muted small">${desc}</p>
        <span class="badge soft" style="margin-top:8px">${fit}</span>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="padding-top:6px">
  <div class="container">
    <div class="section-head"><h2>چه چیزهایی می‌توانی سفارش بدهی؟</h2></div>
    <div class="why-grid">
      ${[
        ['🌐', 'سایت از لینک', 'لینک هر سایتی را بده؛ هوش مصنوعی ساختار، رنگ و ناوبری آن را تحلیل و همان سبک را برایت پیاده می‌کند.'],
        ['🏪', 'فروشگاه‌ساز', 'فروشگاه کامل برای ووکامرس، وردپرس، جنگو، نود یا HTML — با سبد خرید و درگاه.'],
        ['🧩', 'افزونه‌ساز', 'پرامپت بده؛ افزونه وردپرس/ووکامرس با فایل راهنمای Word (عکس مراحل نصب) تحویل بگیر.'],
        ['🪄', 'قالب‌ساز', '۸ سبک طراحی (نئون، گلاس، بروتال، لوکس، سایبرپانک، اورورا، مینیمال، ادیتوریال).'],
        ['📦', 'تبدیل قالب', 'فایل ZIP قالب قدیمی‌ات را بده؛ هوش مصنوعی آن را به نسخهٔ حرفه‌ای‌تر تبدیل می‌کند.'],
        ['📱', 'اپ اندروید', 'با همان سطح‌بندی؛ اپ نصب‌شدنی روی گوشی (PWA) با ناوبری، سبد و اعلان.'],
      ].map(([ic, t, d]) => `<div class="card why-card"><div class="ic" style="font-size:1.5rem">${ic}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head"><h2>مراحل کار (فقط ۳ قدم)</h2></div>
    <div class="steps-row">
      <div class="step"><b>۱</b><span>پرامپت یا لینک را بده و سطح را انتخاب کن (برنز → اپیک)</span></div>
      <div class="step"><b>۲</b><span>هوش مصنوعی می‌سازد: فایل‌ها + راهنمای Word با عکس مراحل نصب</span></div>
      <div class="step"><b>۳</b><span>دانلود و نصب روی هاست/سرور خودت — همه‌چیز آماده است</span></div>
    </div>
  </div>
</section>

${aiProducts.length ? `<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head"><h2>ساخته‌شده با هوش مصنوعی (در فروشگاه)</h2><a class="muted small" href="/templates">همه قالب‌ها ←</a></div>
    <div class="grid-products">${aiProducts.map(p => productCard(p, user)).join('')}</div>
  </div>
</section>` : ''}

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="ai-cta">
      <h2>آماده‌ای فروشگاهت را بسازی؟ 🚀</h2>
      <p class="muted">سفارش ساخت را ثبت کن؛ در کمتر از ۲۴ ساعت برآورد قیمت نهایی را می‌گیری.</p>
      <a class="btn lg" href="/apps">📱 ثبت سفارش با هوش مصنوعی</a>
    </div>
  </div>
</section>`;
  return page({ user, title: `استودیوی هوش مصنوعی | ${APP_NAME}`, desc: 'ساخت قالب، افزونه، فروشگاه‌ساز و اپ اندروید با هوش مصنوعی — ۶ سطح از برنزی تا اپیک', url: baseUrl + '/ai', body, csrf });
}


// ─── صفحهٔ عمومی اشتراک پرو ───
export function proPage(req, res, { user, baseUrl, csrf }) {
  const db = getDb();
  const plans = proPlansOf(db).filter(p => p.active);
  const cards = plans.map(p => `
    <div class="tier-public pro-plan-card">
      <div class="tp-ic">${p.icon}</div>
      <b class="tp-name">${esc(p.label)}</b>
      <div class="tp-price">${money(p.price)} <small>تومان</small></div>
      <p class="muted small">${esc(p.desc || '')}</p>
      <div class="pro-power"><span>قدرت هوش مصنوعی</span><b>${fa(p.ai)}٪ از قدرت ادمین</b></div>
      <span class="badge soft" style="margin-top:6px">${fa(p.days)} روز دسترسی کامل</span>
      <a class="btn" style="margin-top:12px;width:100%" href="${user ? '/ai' : '/login?next=/ai'}">${user ? 'فعال‌سازی از استودیو' : 'ورود و فعال‌سازی'}</a>
    </div>`).join('');
  const body = `
<section class="section" style="padding-top:26px">
  <div class="container">
    <div class="section-head" style="flex-direction:column;align-items:center;text-align:center;gap:8px;margin-bottom:22px">
      <h1 style="font-size:1.7rem">اشتراک پرو — استودیوی هوش مصنوعی</h1>
      <p class="muted" style="max-width:42rem">قالب‌ساز، افزونه‌ساز، فروشگاه‌ساز و اپ اندروید با هوش مصنوعی؛ هر پلن سطح قدرت مخصوص خودش را دارد و <b>بهترین پلن دقیقاً ۵۰٪ قدرت هوش مصنوعی ادمین</b> است.</p>
    </div>
    <div class="tier-grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">${cards}</div>
    <div class="card card-pad" style="margin-top:26px;max-width:50rem;margin-inline:auto">
      <h3 style="margin-bottom:10px">چه چیزهایی در اشتراک پرو می‌گیرید؟</h3>
      <ul class="feature-list">
        <li>قالب سایت حرفه‌ای با ۸ سبک طراحی و خروجی ریسپانسیو</li>
        <li>افزونهٔ وردپرس / ووکامرس + فایل راهنمای Word با تصاویر نصب</li>
        <li>فروشگاه‌ساز کامل (HTML، Tailwind، Bootstrap، React، Vue)</li>
        <li>تبدیل قالب خام به نسخهٔ حرفه‌ای یا کپی سبک از هر سایت دلخواه</li>
        <li>اپ اندروید PWA نصب‌شدنی + امکان انتشار با لینک عمومی</li>
        <li>پیش‌نمایش زنده، ویرایش فارسی و دانلود فایل کامل ZIP</li>
      </ul>
      <p class="hint center" style="margin-top:12px">پرداخت مستقیم از کیف پول (شارژ از صفحهٔ کیف پول) — بلافاصله فعال می‌شود.</p>
    </div>
  </div>
</section>`;
  return page({ user, title: 'اشتراک پرو | اپ‌تم', desc: 'اشتراک پرو استودیوی هوش مصنوعی اپ‌تم — ساخت قالب، افزونه، فروشگاه و اپ اندروید', url: baseUrl + '/pro', body, csrf });
}
