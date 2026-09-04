// ─── صفحات عمومی فروشگاه ───
import { esc, money, faNum, faDate, timeAgo, starsSvg, svgThumb, isEmail } from '../util.js';
import { page } from '../render.js';
import { findMany, findOne, productRating, productLikes, getDb } from '../db.js';
import { FRAMEWORKS, APP_NAME } from '../config.js';
import { anonCsrf } from '../auth.js';

const fa = n => Number(n).toLocaleString('fa-IR');

// ─── خانه ───
export function home(req, res, { user, baseUrl, csrf }) {
  const db = getDb();
  const products = findMany('products', p => p.published).sort((a, b) => b.downloads - a.downloads);
  const featured = products.slice(0, 6);
  const totalDownloads = products.reduce((s, p) => s + p.downloads, 0);
  const customers = findMany('users', u => u.role === 'customer').length + 1240; // پایه + دمو
  const approved = findMany('comments', c => c.status === 'approved').slice(0, 3);

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: APP_NAME, url: baseUrl, inLanguage: 'fa-IR' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'قالب‌های پرفروش', itemListElement: featured.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${baseUrl}/templates/${p.slug}`, name: p.title })) },
  ];

  const body = `
<section class="hero">
  <div class="container inner">
    <div>
      <span class="badge primary" style="margin-bottom:18px; display:inline-flex;">🚀 بیش از ${fa(totalDownloads)} دانلود قالب</span>
      <h1>قالب وب سایت حرفه‌ای بساز، <span class="grad-text">فارغ از کدنویسی</span></h1>
      <p class="lead">مجموعه‌ای از بهترین قالب‌های راست‌چین و بهینه برای سئو — فروشگاهی، شرکتی، شخصی و استارتاپی. خرید امن، دانلود آنی و آپدیت رایگان.</p>
      <div class="hero-cta">
        <a class="btn lg" href="/templates">مشاهده قالب‌ها</a>
        <a class="btn lg ghost" href="#why">چرا اپ‌تم؟</a>
      </div>
      <div class="hero-stats">
        <div><div class="num">${fa(products.length)}</div><div class="lbl">قالب حرفه‌ای</div></div>
        <div><div class="num">${fa(totalDownloads)}</div><div class="lbl">دانلود موفق</div></div>
        <div><div class="num">${fa(customers)}</div><div class="lbl">مشتری فعال</div></div>
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

<section class="section" id="why">
  <div class="container">
    <div class="section-head"><h2>چرا اپ‌تم؟</h2></div>
    <div class="why-grid">
      <div class="card why-card"><div class="ic">⚡</div><h3>سرعت و سئو</h3><p>همه قالب‌ها با نمره ۹۰+ PageSpeed و ساختار سئوی استاندارد تحویل می‌شوند.</p></div>
      <div class="card why-card"><div class="ic">⬇️</div><h3>دانلود آنی</h3><p>بلافاصله پس از پرداخت، لینک دانلود اختصاصی در پنل کاربری فعال می‌شود.</p></div>
      <div class="card why-card"><div class="ic">🔄</div><h3>آپدیت رایگان</h3><p>خرید یک‌بارمِمیز؛ همه به‌روزرسانی‌های بعدی قالب برای شما رایگان است.</p></div>
      <div class="card why-card"><div class="ic">💬</div><h3>پشتیبانی واقعی</h3><p>تیم پشتیبانی ما تا راه‌اندازی کامل قالب همراه شماست.</p></div>
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
export function productCard(p, user = null) {
  const { rating, count } = productRating(p.id);
  const likes = productLikes(p.id);
  const liked = user ? !!findOne('likes', l => l.productId === p.id && l.userId === user.id) : false;
  const off = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const cat = findOne('categories', c => c.id === (p.categoryIds || [])[0]);
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
      ${cat ? `<span>${cat.icon} ${esc(cat.name)}</span>` : ''}
      <span>📄 ${fa(p.pages)} صفحه</span>
      <span>⬇️ ${fa(p.downloads)}</span>
    </div>
    <div class="meta">${starsSvg(rating)} ${count ? `<span>(${fa(count)} نظر)</span>` : '<span class="muted">بدون نظر</span>'}</div>
    <div class="price-row">
      <div>
        <span class="price">${money(p.salePrice || p.price)}</span>
        ${p.salePrice ? `<del class="muted small">${money(p.price)}</del>` : ''}
      </div>
      <button class="like-btn ${liked ? 'liked' : ''}" data-like="${p.id}" aria-label="لایک" title="لایک">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        <span>${fa(likes)}</span>
      </button>
    </div>
  </div>
</article>`;
}

// ─── فهرست قالب‌ها با فیلتر ───
export function catalogPage(req, res, { user, baseUrl, query, csrf }) {
  let products = findMany('products', p => p.published);
  const q = (query.q || '').trim();
  const cat = query.cat || '';
  const fw = query.fw || '';
  const sort = query.sort || 'new';

  if (q) products = products.filter(p => (p.title + ' ' + (p.tags || []).join(' ') + ' ' + p.description).includes(q));
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

  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>قالب‌ها</span></nav>
  <div class="section-head"><h2>فروشگاه قالب‌ها</h2><span class="sub">${fa(products.length)} قالب یافت شد</span></div>
  <div class="catalog">
    <form class="card card-pad filter-card" method="get" action="/templates" id="filterForm">
      ${q ? `<input type="hidden" name="q" value="${esc(q)}">` : ''}
      <h3>🗂 فیلترها</h3>
      <div class="filter-group">
        <b class="small">دسته‌بندی</b>
        ${getDb().categories.map(c => `<label class="check-line"><input type="radio" name="cat" value="${esc(c.slug)}" ${cat === c.slug ? 'checked' : ''} onchange="this.form.submit()"> ${c.icon} ${esc(c.name)}</label>`).join('')}
        <label class="check-line"><input type="radio" name="cat" value="" ${!cat ? 'checked' : ''} onchange="this.form.submit()"> همه</label>
      </div>
      <div class="filter-group">
        <b class="small">فریمورک</b>
        ${Object.entries(FRAMEWORKS).filter(([k]) => ['html', 'tailwind', 'bootstrap', 'react'].includes(k)).map(([k, v]) => `<label class="check-line"><input type="radio" name="fw" value="${k}" ${fw === k ? 'checked' : ''} onchange="this.form.submit()"> <span style="color:${v.color}">⬤</span> ${v.label}</label>`).join('')}
        <label class="check-line"><input type="radio" name="fw" value="" ${!fw ? 'checked' : ''} onchange="this.form.submit()"> همه</label>
      </div>
      <div class="filter-group">
        <b class="small">مرتب‌سازی</b>
        <select class="select" name="sort" onchange="this.form.submit()">
          <option value="new" ${sort === 'new' ? 'selected' : ''}>جدیدترین</option>
          <option value="popular" ${sort === 'popular' ? 'selected' : ''}>پرفروش‌ترین</option>
          <option value="cheap" ${sort === 'cheap' ? 'selected' : ''}>ارزان‌ترین</option>
          <option value="rating" ${sort === 'rating' ? 'selected' : ''}>بهترین امتیاز</option>
        </select>
      </div>
      <button class="btn ghost sm" type="submit">اعمال فیلتر</button>
    </form>
    <div>
      <form class="toolbar" method="get" action="/templates">
        ${cat ? `<input type="hidden" name="cat" value="${esc(cat)}">` : ''}
        ${fw ? `<input type="hidden" name="fw" value="${esc(fw)}">` : ''}
        ${sort !== 'new' ? `<input type="hidden" name="sort" value="${esc(sort)}">` : ''}
        <div class="search grow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input class="input" type="search" name="q" value="${esc(q)}" placeholder="جستجو در قالب‌ها…">
        </div>
        <button class="btn soft" type="submit">جستجو</button>
      </form>
      ${products.length
        ? (() => {
            const PER = 9;
            const pages = Math.ceil(products.length / PER);
            const cur = Math.min(Math.max(1, parseInt(query.page) || 1), pages);
            const slice = products.slice((cur - 1) * PER, cur * PER);
            const pager = pages > 1 ? `<div class="pager">${[
              cur > 1 ? `<a class="btn ghost sm" href="${qs({ page: cur - 1 })}">قبلی →</a>` : '',
              ...Array.from({ length: pages }, (_, i) =>
                `<a class="btn ${i + 1 === cur ? '' : 'ghost'} sm pg-num" href="${qs({ page: i + 1 })}" ${i + 1 === cur ? 'aria-current="page"' : ''}>${fa(i + 1)}</a>`),
              cur < pages ? `<a class="btn ghost sm" href="${qs({ page: cur + 1 })}">← بعدی</a>` : '',
            ].join('')}</div>` : '';
            return `<div class="grid-products">${slice.map(x => productCard(x, user)).join('')}</div>${pager}`;
          })()
        : `<div class="card empty-state"><div class="ic">🔍</div><p>قالبی با این مشخصات پیدا نشد.</p><a class="btn soft sm" style="margin-top:14px" href="/templates">حذف فیلترها</a></div>`}
    </div>
  </div>
</div>`;

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
export function cartPage(req, res, { user, baseUrl, csrf }) {
  const products = findMany('products', p => p.published);
  const data = products.map(p => ({ id: p.id, title: p.title, price: p.salePrice || p.price, slug: p.slug }));
  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>سبد خرید</span></nav>
  <div class="section-head"><h2>سبد خرید شما</h2></div>
  <div class="card card-pad" id="cartBox">در حال بارگذاری…</div>
</div>
<script src="/assets/js/cart.js" defer></script>
<script type="application/json" id="cartData">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
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
      <div class="section-head" style="margin-top:0"><h2>پروژه‌های اپلیکیشن</h2></div>
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
      <div class="section-head"><h2>سفارش‌ها و دانلودها</h2></div>
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

// ─── صفحات ورود / ثبت‌نام / نصب اولیه ───
export function authForm({ mode, baseUrl, error = '', ok = '', csrf = '', user = null, needsSetup = false }) {
  const isSetup = mode === 'setup';
  const isLogin = mode === 'login';
  const title = isSetup ? 'نصب اولیه — ساخت حساب مدیر' : (isLogin ? 'ورود به حساب' : 'ساخت حساب کاربری');
  const action = isSetup ? '/setup' : (isLogin ? '/login' : '/register');
  const body = `
<div class="auth-wrap">
  <div class="card auth-card">
    <div class="logo" style="margin-bottom:18px"><span class="mark">پ</span>اپ‌تم</div>
    <h1>${title}</h1>
    <p class="sub">${isSetup ? 'اولین اجرای فروشگاه؛ حساب مدیر سیستم را بسازید.' : (isLogin ? 'خوش آمدید! برای ادامه وارد شوید.' : 'در کمتر از یک دقیقه عضو اپ‌تم شوید.')}</p>
    ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
    ${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}
    <form method="post" action="${action}">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      ${isLogin ? '' : `<div class="field"><label class="req">نام و نام خانوادگی</label><input class="input" type="text" name="name" required minlength="2" maxlength="60" autocomplete="name"></div>`}
      <div class="field"><label class="req">ایمیل یا شماره موبایل</label><input class="input" type="text" name="identifier" required autocomplete="username" dir="ltr" placeholder="you@gmail.com یا ۰۹۱۲۳۴۵۶۷۸۹"><p class="hint">${isLogin ? '' : 'با جیمیل ثبت‌نام کنید و ایمیل را تأیید کنید؛ یا فقط موبایل بدهید و فوری فعال شوید.'}</p></div>
      <div class="field"><label class="req">رمز عبور</label><input class="input" type="password" name="password" required minlength="8" autocomplete="${isLogin ? 'current-password' : 'new-password'}" dir="ltr"><p class="hint">حداقل ۸ کاراکتر.</p></div>
      <button class="btn lg" type="submit" style="width:100%">${isSetup ? 'ساخت حساب مدیر و ورود' : (isLogin ? 'ورود' : 'ثبت‌نام')}</button>
    </form>
    ${!isSetup && !isLogin ? '<div class="alert info" style="margin-top:16px">🎁 هدیه ثبت‌نام: کد تخفیف <b>WELCOME10</b> (۱۰٪ اولین خرید) + تخفیف‌های ویژه اعضا</div>' : ''}
    ${!isSetup ? `<p class="muted small center" style="margin-top:18px">${isLogin ? 'حساب ندارید؟ <a href="/register" style="color:var(--primary)">ثبت‌نام کنید</a>' : 'قبلاً عضو شده‌اید؟ <a href="/login" style="color:var(--primary)">وارد شوید</a>'}</p>` : ''}
  </div>
</div>`;
  return page({ user, title: `${title} | ${APP_NAME}`, desc: title, body, noindex: true, csrf });
}
