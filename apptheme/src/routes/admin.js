// ═══ پنل مدیریت — همه بخش‌ها ═══
import { esc, money, faNum, faDate, faDateTime, slugify, parseMoney } from '../util.js';
import { adminPage } from '../render.js';
import { findMany, findOne, insert, updateOne, removeOne, getDb, persist, replaceDb } from '../db.js';
import { login } from '../auth.js';
import { FRAMEWORKS } from '../config.js';
import { OCCASIONS, occasionRangeLabel } from '../occasions.js';
import { parsePrompt, generateFromSpec, generateSpecZip, SPEC_TYPE_LABELS } from '../promptgen.js';
import { makeZip } from '../zip.js';
import { PROJECT_STATUS, SPEC_LABELS, POLICY } from '../apporder.js';
import * as walletMod from '../wallet.js';
import { cleanText } from '../security.js';

const fa = n => Number(n).toLocaleString('fa-IR');

// ─── نمودار فروش ───
function revenueChart(days = 30) {
  const orders = findMany('orders', o => o.status === 'paid');
  const byDay = new Array(days).fill(0);
  const today = new Date(); today.setHours(23, 59, 59, 999);
  for (const o of orders) {
    const d = Math.floor((today - new Date(o.paidAt || o.createdAt)) / 86400000);
    if (d >= 0 && d < days) byDay[days - 1 - d] += o.total;
  }
  const max = Math.max(...byDay, 1);
  const W = 720, H = 190, PAD = 26;
  const step = (W - PAD * 2) / (days - 1);
  const pts = byDay.map((v, i) => [PAD + i * step, H - 22 - (v / max) * (H - 60)]);
  const line = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  const area = `${line} L ${W - PAD} ${H - 22} L ${PAD} ${H - 22} Z`;
  const dots = pts.filter((_, i) => byDay[i] > 0).map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="var(--primary)"/>`).join('');
  const labels = [0, Math.floor(days / 2), days - 1].map(i => {
    const d = new Date(today - (days - 1 - i) * 86400000);
    return `<text x="${(PAD + i * step).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--muted)">${new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="نمودار فروش">
    <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--primary)" stop-opacity=".32"/><stop offset="1" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>
    ${[0.25, 0.5, 0.75, 1].map(k => `<line x1="${PAD}" x2="${W - PAD}" y1="${(H - 22) - k * (H - 60)}" y2="${(H - 22) - k * (H - 60)}" stroke="var(--border)" stroke-dasharray="3 5"/>`).join('')}
    <path d="${area}" fill="url(#areaGrad)"/><path d="${line}" fill="none" stroke="var(--primary)" stroke-width="2.6" stroke-linecap="round"/>${dots}${labels}</svg>`;
}

const statusMap = { paid: ['پرداخت شده', 'ok'], pending: ['در انتظار', 'warn'], failed: ['ناموفق', 'err'], refunded: ['برگشتی', 'info'] };

// ═══ داشبورد ═══
export function dashboard(req, res, { user }) {
  const db = getDb();
  const paid = findMany('orders', o => o.status === 'paid');
  const totalRevenue = paid.reduce((s, o) => s + o.total, 0);
  const monthAgo = Date.now() - 30 * 86400000;
  const monthRevenue = paid.filter(o => new Date(o.paidAt || o.createdAt) > monthAgo).reduce((s, o) => s + o.total, 0);
  const customers = findMany('users', u => u.role === 'customer');
  const unverified = customers.filter(u => !u.verified);
  const activeProjects = findMany('projects', p => !['completed', 'cancelled'].includes(p.status));
  const unreadMsgs = findMany('messages', m => m.fromRole === 'user' && !m.readByAdmin);
  const submittedProjects = findMany('projects', p => p.status === 'submitted');
  const pendingWds = findMany('withdrawals', w => w.status === 'processing');
  const recentOrders = [...db.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 7);
  const topProducts = [...db.products].sort((a, b) => b.downloads - a.downloads).slice(0, 5);

  const stat = (lbl, val, sub, icon, href = '') => `
  <a class="card stat-card" ${href ? `href="${href}"` : ''}>
    <div class="stat-ic">${icon}</div>
    <div><div class="stat-val">${val}</div><div class="stat-lbl">${lbl}</div>${sub ? `<div class="stat-sub">${sub}</div>` : ''}</div>
  </a>`;

  const body = `
<div class="stats-grid">
  ${stat('فروش کل', money(totalRevenue), `${fa(paid.length)} سفارش موفق`, '💰', '/admin/orders')}
  ${stat('فروش ۳۰ روز اخیر', money(monthRevenue), 'روند فروش ماه', '📊')}
  ${stat('مشتریان', fa(customers.length), unverified.length ? `⚠️ ${fa(unverified.length)} تأییدنشده` : 'همه تأییدشده', '👥', '/admin/customers')}
  ${stat('قالب‌ها', fa(findMany('products', p => p.published).length), `${fa(db.products.length)} کل`, '🧩', '/admin/products')}
  ${stat('پروژه اپ در جریان', fa(activeProjects.length), 'سفارش‌های اندروید', '📱', '/admin/app-projects')}
  ${stat('پیام خوانده‌نشده', fa(unreadMsgs.length), unreadMsgs.length ? 'پاسخ دهید' : 'همه پاسخ داده شد', '💬', '/admin/messages')}
  ${stat('اپ در انتظار تایید', fa(submittedProjects.length), submittedProjects.length ? 'قیمت‌گذاری کنید' : 'موردی نیست', '📥', '/admin/app-projects')}
  ${stat('برداشت در پردازش', fa(pendingWds.length), pendingWds.length ? 'بررسی کنید' : 'همه واریز شد', '💸', '/admin/withdrawals')}
</div>

${unverified.length ? `<div class="alert warn">⚠️ ${fa(unverified.length)} حساب کاربری ایمیل‌شان را تأیید نکرده‌اند و تا ۷ روز دیگر به‌صورت خودکار حذف می‌شوند. <a href="/admin/customers" style="color:inherit;font-weight:700">مشاهده</a></div>` : ''}
${(() => {
  const last = db.meta.lastBackupAt;
  const days = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
  if (days === null || days > 3) {
    return `<div class="alert info">💾 روی هاست رایگان، داده‌ها با ری‌استارت پاک می‌شوند!${last ? ` آخرین بکاپ: ${fa(days)} روز پیش.` : ' هنوز بکاپی نگرفته‌اید.'} <a href="/admin/backup" style="color:inherit;font-weight:700">دانلود پشتیبان</a></div>`;
  }
  return '';
})()}

<div class="admin-2col">
  <div class="card panel">
    <div class="between" style="margin-bottom:8px"><h3>📈 فروش ۳۰ روز اخیر</h3><span class="badge primary">${money(monthRevenue)}</span></div>
    ${revenueChart(30)}
  </div>
  <div class="card panel">
    <div class="between" style="margin-bottom:14px"><h3>🏆 پرفروش‌ترین‌ها</h3></div>
    ${topProducts.map((p, i) => `
    <div class="top-product">
      <span class="rank rank-${i + 1}">${fa(i + 1)}</span>
      <div class="grow"><b class="small">${esc(p.title)}</b><div class="progress"><span style="width:${Math.round((p.downloads / topProducts[0].downloads) * 100)}%"></span></div></div>
      <span class="muted small">⬇️ ${fa(p.downloads)}</span>
    </div>`).join('')}
  </div>
</div>

<div class="card panel">
  <div class="between" style="margin-bottom:14px"><h3>🧾 آخرین سفارش‌ها</h3><a class="btn sm ghost" href="/admin/orders">همه سفارش‌ها</a></div>
  <div class="table-wrap" style="border:none"><table class="tbl">
    <tr><th>کد</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr>
    ${recentOrders.map(o => {
      const u = findOne('users', x => x.id === o.userId);
      const [lbl, cls] = statusMap[o.status] || [o.status, ''];
      return `<tr><td><b>${esc(o.code)}</b></td><td>${esc(u?.name || 'مهمان')}</td><td>${money(o.total)}</td><td><span class="badge ${cls}">${lbl}</span></td><td class="muted small">${faDateTime(o.createdAt)}</td></tr>`;
    }).join('')}
  </table></div>
</div>`;

  return adminPage({ user, csrf: user.__csrf || '', title: 'داشبورد', active: 'dashboard', body });
}

// ═══ قالب‌ها ═══

// ─── صفحه‌بندی مشترک لیست‌های ادمین ───
function paginate(arr, query, per = 15) {
  const pages = Math.max(1, Math.ceil(arr.length / per));
  const cur = Math.min(Math.max(1, parseInt(query?.page) || 1), pages);
  return { slice: arr.slice((cur - 1) * per, cur * per), cur, pages };
}
function pagerHtml(cur, pages, basePath) {
  if (pages <= 1) return '';
  let h = '<div class="pager" style="margin-top:16px">';
  if (cur > 1) h += `<a class="btn ghost sm" href="${basePath}?page=${cur - 1}">قبلی →</a>`;
  for (let i = 1; i <= pages; i++) h += `<a class="btn ${i === cur ? '' : 'ghost'} sm" href="${basePath}?page=${i}">${faNum(i)}</a>`;
  if (cur < pages) h += `<a class="btn ghost sm" href="${basePath}?page=${cur + 1}">← بعدی</a>`;
  return h + '</div>';
}

export function productsList(req, res, { user, query }) {
  const products = [...getDb().products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const { slice, cur, pages } = paginate(products, query);
  const body = `
<div class="between" style="margin-bottom:18px">
  <span class="muted small">${fa(products.length)} قالب</span>
  <a class="btn" href="/admin/products/new">➕ قالب جدید</a>
</div>
<div class="table-wrap"><table class="tbl">
  <tr><th>قالب</th><th>قیمت</th><th>فریمورک</th><th>دانلود</th><th>وضعیت</th><th>عملیات</th></tr>
  ${slice.map(p => `<tr>
    <td><b>${esc(p.title)}</b><div class="muted small">/${esc(p.slug)}</div></td>
    <td>${money(p.salePrice || p.price)}${p.salePrice ? `<div class="muted small"><del>${money(p.price)}</del></div>` : ''}</td>
    <td>${(p.frameworks || []).map(f => `<span class="badge">${FRAMEWORKS[f]?.short || f}</span>`).join(' ')}</td>
    <td>${fa(p.downloads)}</td>
    <td><span class="badge ${p.published ? 'ok' : 'warn'}">${p.published ? 'منتشرشده' : 'پیش‌نویس'}</span></td>
    <td class="ops">
      <a class="btn sm ghost" href="/templates/${esc(p.slug)}" target="_blank">👁</a>
      <a class="btn sm ghost" href="/admin/products/${p.id}/edit">✏️</a>
      <form method="post" action="/admin/products/${p.id}/delete" data-confirm="قالب «${esc(p.title)}» برای همیشه حذف شود؟" data-ok-text="بله، حذف کن"><input type="hidden" name="_csrf" value="${user.__csrf}"><button class="btn sm danger" type="submit">🗑</button></form>
    </td>
  </tr>`).join('')}
</table></div>${pagerHtml(cur, pages, '/admin/products')}`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'مدیریت قالب‌ها', active: 'products', body });
}

export function productForm(req, res, { user, product = null, error = '' }) {
  const cats = getDb().categories;
  const p = product || { title: '', slug: '', description: '', longDescription: '', price: '', salePrice: '', categoryIds: [], frameworks: [], pages: 5, features: [], tags: [], palette: ['#6d5ef2', '#22d3ee'], accent: '#f59e0b', published: true };
  const action = product ? `/admin/products/${product.id}/edit` : '/admin/products/new';
  const body = `
${error ? `<div class="alert err">${esc(error)}</div>` : ''}
<form method="post" action="${action}" class="card card-pad">
  <input type="hidden" name="_csrf" value="${user.__csrf}">
  <div class="form-grid">
    <div class="field"><label class="req">عنوان قالب</label><input class="input" name="title" required value="${esc(p.title)}"></div>
    <div class="field"><label>اسلاگ (خودکار)</label><input class="input" name="slug" value="${esc(p.slug)}" placeholder="خودکار از روی عنوان" dir="ltr"></div>
    <div class="field"><label class="req">قیمت (تومان)</label><input class="input" name="price" required value="${p.price ?? ''}" placeholder="مثلاً 850000"></div>
    <div class="field"><label>قیمت با تخفیف (اختیاری)</label><input class="input" name="salePrice" value="${p.salePrice ?? ''}" placeholder="مثلاً 590000"></div>
    <div class="field"><label>تعداد صفحات</label><input class="input" name="pages" type="number" min="1" value="${p.pages}"></div>
    <div class="field"><label>رنگ‌ها (c1 / c2 / تاکید)</label>
      <div class="flex">
        <input class="input" type="color" name="c1" value="${p.palette[0]}" style="padding:4px;height:44px;width:70px">
        <input class="input" type="color" name="c2" value="${p.palette[1] || '#22d3ee'}" style="padding:4px;height:44px;width:70px">
        <input class="input" type="color" name="accent" value="${p.accent || '#f59e0b'}" style="padding:4px;height:44px;width:70px">
      </div>
    </div>
  </div>
  <div class="field"><label class="req">توضیح کوتاه</label><input class="input" name="description" required value="${esc(p.description)}"></div>
  <div class="field"><label>توضیح کامل</label><textarea class="textarea" name="longDescription">${esc(p.longDescription || '')}</textarea></div>
  <div class="form-grid">
    <div class="field"><label>ویژگی‌ها (هر خط یکی)</label><textarea class="textarea" name="features" style="min-height:90px">${esc((p.features || []).join('\n'))}</textarea></div>
    <div class="field"><label>برچسب‌ها (با کاما)</label><input class="input" name="tags" value="${esc((p.tags || []).join('، '))}"></div>
  </div>
  <div class="form-grid">
    <div class="field"><label>دسته‌بندی‌ها</label>
      ${cats.map(c => `<label class="check-line"><input type="checkbox" name="cats" value="${c.id}" ${(p.categoryIds || []).includes(c.id) ? 'checked' : ''}> ${c.icon} ${esc(c.name)}</label>`).join('')}
    </div>
    <div class="field"><label>فریمورک‌ها</label>
      ${Object.entries(FRAMEWORKS).map(([k, v]) => `<label class="check-line"><input type="checkbox" name="fws" value="${k}" ${(p.frameworks || []).includes(k) ? 'checked' : ''}> <span style="color:${v.color}">⬤</span> ${v.label}</label>`).join('')}
    </div>
  </div>
  <label class="check-line"><input type="checkbox" name="published" ${p.published ? 'checked' : ''}> 🟢 انتشار در فروشگاه</label>
  <div class="flex" style="margin-top:18px">
    <button class="btn" type="submit">💾 ذخیره</button>
    <a class="btn ghost" href="/admin/products">انصراف</a>
  </div>
</form>`;
  return adminPage({ user: { ...user, __csrf: user.__csrf || csrf }, csrf: user.__csrf || csrf, title: product ? `ویرایش: ${product.title}` : 'قالب جدید', active: 'products', body });
}

export function handleProductSave(req, res, ctx, id = null) {
  const { body, user } = ctx;
  const title = cleanText(body.title, 120);
  if (title.length < 3) return { render: productForm(req, res, { user: { ...user, __csrf: ctx.csrf }, product: id ? findOne('products', p => p.id === id) : null, error: 'عنوان خیلی کوتاه است.' }) };
  const doc = {
    title,
    slug: slugify(body.slug || title),
    description: cleanText(body.description, 300),
    longDescription: cleanText(body.longDescription, 3000),
    price: Math.max(0, parseMoney(body.price) || 0),
    salePrice: body.salePrice ? (Number.isFinite(parseMoney(body.salePrice)) ? Math.max(0, parseMoney(body.salePrice)) : null) : null,
    pages: Math.max(1, Number(body.pages) || 1),
    features: String(body.features || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12),
    tags: String(body.tags || '').split(/[،,]/).map(x => x.trim()).filter(Boolean).slice(0, 10),
    categoryIds: (body.cats ? [].concat(body.cats) : []).map(Number),
    frameworks: (body.fws ? [].concat(body.fws) : []),
    palette: [body.c1 || '#6d5ef2', body.c2 || '#22d3ee'],
    accent: body.accent || '#f59e0b',
    published: body.published === 'on',
  };
  if (id) {
    updateOne('products', p => p.id === id, doc);
  } else {
    insert('products', { ...doc, downloads: 0 });
  }
  return { redirect: '/admin/products' };
}

export function handleProductDelete(req, res, ctx, id) {
  removeOne('products', p => p.id === id);
  return { redirect: '/admin/products' };
}

// ═══ سفارش‌ها ═══
export function ordersList(req, res, { user, query }) {
  const orders = [...getDb().orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const { slice, cur, pages } = paginate(orders, query);
  const body = `
<div class="table-wrap"><table class="tbl">
  <tr><th>کد</th><th>مشتری</th><th>قالب‌ها</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th><th>تغییر وضعیت</th></tr>
  ${slice.map(o => {
    const u = findOne('users', x => x.id === o.userId);
    const [lbl, cls] = statusMap[o.status] || [o.status, ''];
    return `<tr>
    <td><b>${esc(o.code)}</b>${o.refId ? `<div class="muted small" dir="ltr">${esc(o.refId)}</div>` : ''}</td>
    <td>${esc(u?.name || 'مهمان')}<div class="muted small">${esc(u?.email || '')}</div></td>
    <td class="small">${o.items.map(it => esc(findOne('products', p => p.id === it.productId)?.title || '—')).join('، ')}</td>
    <td>${money(o.total)}${o.discount ? `<div class="muted small">−${money(o.discount)} تخفیف</div>` : ''}</td>
    <td><span class="badge ${cls}">${lbl}</span></td>
    <td class="muted small">${faDate(o.createdAt)}</td>
    <td>
      <form method="post" action="/admin/orders/${o.id}/status" class="flex" style="gap:6px">
        <input type="hidden" name="_csrf" value="${user.__csrf}">
        <select class="select" name="status" style="padding:6px 10px;width:auto">
          ${Object.entries(statusMap).map(([k, [l]]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <button class="btn sm soft" type="submit">ثبت</button>
      </form>
    </td></tr>`;
  }).join('')}
</table></div>${pagerHtml(cur, pages, '/admin/orders')}`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'مدیریت سفارش‌ها', active: 'orders', body });
}

export function handleOrderStatus(req, res, ctx, id) {
  const order = findOne('orders', o => o.id === id);
  if (!order) return { redirect: '/admin/orders' };
  const patch = { status: ctx.body.status };
  if (ctx.body.status === 'paid' && !order.paidAt) {
    patch.paidAt = new Date().toISOString();
    patch.gateway = patch.gateway || 'manual';
    if (!findMany('licenses', l => l.orderId === order.id).length) {
      for (const it of order.items) {
        insert('licenses', { token: require_token(), orderId: order.id, productId: it.productId, userId: order.userId, downloads: 0, createdAt: new Date().toISOString() });
      }
    }
  }
  updateOne('orders', o => o.id === id, patch);
  return { redirect: '/admin/orders' };
}
import { randomToken } from '../security.js';
const require_token = () => randomToken(16);

// ═══ مشتریان ═══
export function customersList(req, res, { user }) {
  const customers = findMany('users', u => u.role === 'customer').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const body = `
<div class="alert info">⚠️ حساب‌های «تأییدنشده» که ایمیل‌شان را فعال نکرده باشند، ۷ روز پس از ثبت‌نام به‌صورت خودکار حذف می‌شوند (قوانین سایت).</div>
<div class="table-wrap"><table class="tbl">
  <tr><th>مشتری</th><th>موبایل</th><th>وضعیت ایمیل</th><th>سفارش‌ها</th><th>عضویت</th><th>عملیات</th></tr>
  ${customers.map(u => {
    const orders = findMany('orders', o => o.userId === u.id && o.status === 'paid');
    const days = Math.max(0, 7 - Math.floor((Date.now() - new Date(u.createdAt)) / 86400000));
    return `<tr class="${u.active ? '' : 'inactive-row'}">
    <td><b>${esc(u.name)}</b><div class="muted small" dir="ltr">${esc(u.email)}</div></td>
    <td dir="ltr" style="text-align:right">${esc(u.mobile || '—')}</td>
    <td>${u.verified ? '<span class="badge ok">✓ تأییدشده</span>' : `<span class="badge err">تأییدنشده — ${fa(days)} روز تا حذف</span>`}</td>
    <td>${fa(orders.length)} / ${money(orders.reduce((s, o) => s + o.total, 0))}</td>
    <td class="muted small">${faDate(u.createdAt)}</td>
    <td class="ops">
      <a class="btn sm ghost" href="/admin/messages?u=${u.id}">💬</a>
      <form method="post" action="/admin/customers/${u.id}/toggle">
        <input type="hidden" name="_csrf" value="${user.__csrf}">
        <button class="btn sm ${u.active ? 'danger' : 'soft'}" type="submit">${u.active ? 'مسدود' : 'فعال‌سازی'}</button>
      </form>
    </td></tr>`;
  }).join('')}
</table></div>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'مدیریت مشتریان', active: 'customers', body });
}

export function handleCustomerToggle(req, res, ctx, id) {
  const u = findOne('users', x => x.id === id);
  if (u && u.role !== 'admin') updateOne('users', x => x.id === id, { active: !u.active });
  return { redirect: '/admin/customers' };
}

// ═══ نظرات ═══
export function commentsList(req, res, { user }) {
  const pending = findMany('comments', c => c.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const approved = findMany('comments', c => c.status === 'approved').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const row = (c, act) => `<div class="comment-row card card-pad">
    <div class="between" style="align-items:flex-start">
      <div class="grow">
        <div class="flex"><b>${esc(c.name)}</b><span class="muted small">${faDateTime(c.createdAt)}</span><span class="badge primary">${esc(findOne('products', p => p.id === c.productId)?.title || '—')}</span></div>
        <p class="small" style="margin-top:8px">${esc(c.body)}</p>
      </div>
      <div class="ops" style="display:grid;gap:6px">
        ${act.includes('approve') ? `<form method="post" action="/admin/comments/${c.id}/approve"><input type="hidden" name="_csrf" value="${user.__csrf}"><button class="btn sm soft" type="submit">✓ تأیید</button></form>` : ''}
        ${act.includes('reject') ? `<form method="post" action="/admin/comments/${c.id}/reject"><input type="hidden" name="_csrf" value="${user.__csrf}"><button class="btn sm ghost" type="submit">✖ رد</button></form>` : ''}
        ${act.includes('delete') ? `<form method="post" action="/admin/comments/${c.id}/delete"><input type="hidden" name="_csrf" value="${user.__csrf}"><button class="btn sm danger" type="submit">🗑 حذف</button></form>` : ''}
      </div>
    </div>
  </div>`;
  const body = `
<h3 style="margin-bottom:12px">در انتظار تأیید (${fa(pending.length)})</h3>
<div style="display:grid;gap:12px;margin-bottom:26px">${pending.map(c => row(c, ['approve', 'reject'])).join('') || '<p class="muted small">موردی نیست.</p>'}</div>
<h3 style="margin-bottom:12px">منتشرشده (${fa(approved.length)})</h3>
<div style="display:grid;gap:12px">${approved.map(c => row(c, ['delete'])).join('') || '<p class="muted small">موردی نیست.</p>'}</div>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'مدیریت نظرات', active: 'comments', body });
}

export function handleCommentAction(req, res, ctx, id, action) {
  if (action === 'delete') removeOne('comments', c => c.id === id);
  else updateOne('comments', c => c.id === id, { status: action === 'approve' ? 'approved' : 'rejected' });
  return { redirect: '/admin/comments' };
}

// ═══ کدهای تخفیف ═══
export function couponsList(req, res, { user, ok = '' }) {
  const coupons = [...getDb().coupons].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const body = `
${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}
<div class="admin-2col">
  <div class="card panel">
    <h3 style="margin-bottom:14px">کدهای فعال</h3>
    <div class="table-wrap" style="border:none"><table class="tbl">
      <tr><th>کد</th><th>مقدار</th><th>استفاده</th><th>انقضا</th><th>وضعیت</th><th></th></tr>
      ${coupons.map(c => `<tr>
        <td><b dir="ltr">${esc(c.code)}</b></td>
        <td>${c.type === 'percent' ? `${fa(c.value)}٪` : money(c.value)}</td>
        <td>${fa(c.uses)} / ${fa(c.maxUses)}</td>
        <td class="muted small">${faDate(c.expiresAt)}</td>
        <td><span class="badge ${c.active && new Date(c.expiresAt) > new Date() ? 'ok' : 'err'}">${c.active ? 'فعال' : 'غیرفعال'}</span></td>
        <td class="ops">
          <form method="post" action="/admin/coupons/${c.id}/toggle"><input type="hidden" name="_csrf" value="${user.__csrf}"><button class="btn sm ghost">${c.active ? 'خاموش' : 'روشن'}</button></form>
          <form method="post" action="/admin/coupons/${c.id}/delete"><input type="hidden" name="_csrf" value="${user.__csrf}"><button class="btn sm danger">🗑</button></form>
        </td>
      </tr>`).join('')}
    </table></div>
  </div>
  <div class="card panel">
    <h3 style="margin-bottom:14px">➕ کد جدید</h3>
    <form method="post" action="/admin/coupons/new">
      <input type="hidden" name="_csrf" value="${user.__csrf}">
      <div class="field"><label class="req">کد</label><input class="input" name="code" required dir="ltr" placeholder="SUMMER20" style="text-align:right"></div>
      <div class="form-grid">
        <div class="field"><label>نوع</label><select class="select" name="type"><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت</option></select></div>
        <div class="field"><label class="req">مقدار</label><input class="input" name="value" type="number" min="1" required placeholder="20 یا 200000"></div>
      </div>
      <div class="form-grid">
        <div class="field"><label>ظرفیت</label><input class="input" name="maxUses" type="number" min="1" value="100"></div>
        <div class="field"><label>انقضا</label><select class="select" name="days"><option value="30">۳۰ روز</option><option value="90">۹۰ روز</option><option value="180">۶ ماه</option><option value="365">یک سال</option></select></div>
      </div>
      <button class="btn" type="submit">ساخت کد</button>
    </form>
  </div>
</div>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'کدهای تخفیف', active: 'coupons', body });
}

export function handleCouponCreate(req, res, ctx) {
  const { body } = ctx;
  const code = cleanText(body.code, 24).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (code.length < 3) return { redirect: '/admin/coupons' };
  if (findOne('coupons', c => c.code === code)) return couponsList(req, res, { user: ctx.user, ok: 'این کد قبلاً ساخته شده است!' });
  insert('coupons', {
    code, type: body.type === 'fixed' ? 'fixed' : 'percent',
    value: Math.max(1, Number(body.value) || 1),
    maxUses: Math.max(1, Number(body.maxUses) || 100),
    uses: 0, active: true,
    expiresAt: new Date(Date.now() + (Number(body.days) || 30) * 86400000).toISOString(),
  });
  return { redirect: '/admin/coupons?ok=1' };
}

export function handleCouponToggle(req, res, ctx, id) {
  const c = findOne('coupons', x => x.id === id);
  if (c) updateOne('coupons', x => x.id === id, { active: !c.active });
  return { redirect: '/admin/coupons' };
}
export function handleCouponDelete(req, res, ctx, id) {
  removeOne('coupons', c => c.id === id);
  return { redirect: '/admin/coupons' };
}

// ═══ پروژه‌های اپ ═══
export function appProjectsList(req, res, { user }) {
  const projects = [...getDb().projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const body = `
<div class="table-wrap"><table class="tbl">
  <tr><th>کد</th><th>مشتری</th><th>توصیف</th><th>برآورد</th><th>پرداختی</th><th>پیشرفت</th><th>وضعیت</th><th></th></tr>
  ${projects.map(p => {
    const u = findOne('users', x => x.id === p.userId);
    const st = PROJECT_STATUS[p.status] || {};
    const paid = (p.payments || []).reduce((s, x) => s + x.amount, 0);
    return `<tr>
    <td><b>${esc(p.code)}</b></td>
    <td>${esc(u?.name || '—')}</td>
    <td class="small" style="max-width:220px">${esc(p.prompt.slice(0, 80))}…</td>
    <td class="small">${p.estimate ? money(p.estimate.low) + ' — ' + money(p.estimate.high) : '—'}</td>
    <td>${money(paid)}</td>
    <td style="min-width:110px"><div class="progress"><span style="width:${st.prog || 0}%"></span></div><span class="muted small">${fa(st.prog || 0)}٪</span></td>
    <td><span class="badge ${p.status === 'cancelled' ? 'err' : p.status === 'completed' ? 'ok' : 'primary'}">${st.label || p.status}</span></td>
    <td class="ops">
      <a class="btn sm soft" href="/admin/app-projects/${p.id}">${p.status === 'submitted' ? '⚡ بررسی و قیمت‌گذاری' : 'مدیریت'}</a>
      ${p.spec ? `<a class="btn sm ghost" href="/admin/app-projects/${p.id}/spec.json" title="فایل مشخصات کم‌حجم">📋</a>` : ''}
    </td>
  </tr>`;
  }).join('') || '<tr><td colspan="8" class="center muted">هنوز سفارش اپی ثبت نشده است.</td></tr>'}
</table></div>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'سفارش‌های اپلیکیشن', active: 'app-projects', body });
}

export function appProjectDetail(req, res, { user, project, query }) {
  const u = findOne('users', x => x.id === project.userId);
  const msgs = findMany('messages', m => m.threadKey === 'u:' + project.userId);
  const st = PROJECT_STATUS[project.status] || {};
  const priceErr = query.err === 'price' ? `<div class="alert err">⛔ قیمت واردشده نامعتبر یا کمتر از حداقل (۵۰۰٬۰۰۰ تومان) است. می‌توانید بنویسید: <b>2,000,000</b> یا <b>۲ میلیون</b>.</div>` : '';
  
  const body = `
${priceErr}
<div class="admin-2col">
  <div style="display:grid;gap:18px">
    <div class="card panel">
      <h3 style="margin-bottom:10px">📋 توصیف مشتری</h3>
      <p class="small" style="background:var(--surface-2);padding:14px;border-radius:10px">${esc(project.prompt)}</p>
      ${project.spec ? specTable(project.spec) : ''}
      <div class="small" style="margin-top:12px;display:grid;gap:6px">
        <div class="between"><span class="muted">مشتری</span><b>${esc(u?.name || '—')} (${esc(u?.email || '')})</b></div>
        <div class="between"><span class="muted">پلتفرم‌ها</span><b>اندروید${project.ios ? ' + iOS' : ''}${project.web ? ' + وب' : ''}</b></div>
        <div class="between"><span class="muted">ثبت</span><b>${faDateTime(project.createdAt)}</b></div>
        ${project.finalPrice ? `<div class="between"><span class="muted">قیمت نهایی</span><b>${money(project.finalPrice)}</b></div>` : ''}
        ${project.refund ? `<div class="between"><span class="muted">بازگشت وجه</span><b style="color:var(--err)">${money(project.refund)}</b></div>` : ''}
      </div>
      ${(project.estimate?.features || []).length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">${project.estimate.features.map(f => `<span class="badge primary">${esc(f)}</span>`).join('')}</div>` : ''}
      <a class="btn sm ghost" style="margin-top:12px" href="/admin/app-projects/${project.id}/spec.json">⬇️ دانلود فایل مشخصات (JSON کم‌حجم)</a>
    </div>

    ${project.status === 'submitted' ? `
    <div class="card panel" style="border-color: color-mix(in srgb, var(--warn) 45%, var(--border))">
      <h3 style="margin-bottom:6px">⚡ تایید پرامپت و قیمت‌گذاری نهایی</h3>
      <p class="muted small" style="margin-bottom:14px">مشخصات بالا را بررسی کنید و قیمت منصفانه (نسبت به حجم پروژه) را تعیین کنید. برآورد سیستم: ${project.estimate ? money(project.estimate.low) + ' — ' + money(project.estimate.high) : '—'}</p>
      <form method="post" action="/admin/app-projects/${project.id}/quote" style="display:grid;gap:10px">
        <input type="hidden" name="_csrf" value="${user.__csrf}">
        <div class="form-grid">
          <div class="field"><label class="req">قیمت نهایی (تومان)</label><input class="input" name="price" required value="${project.estimate?.total || ''}" placeholder="مثلاً 12,000,000 یا ۱۲ میلیون"></div>
          <div class="field"><label>یادداشت برای مشتری (اختیاری)</label><input class="input" name="note" maxlength="400" placeholder="مثلاً: شامل ۶ ماه پشتیبانی رایگان"></div>
        </div>
        <div class="flex">
          <button class="btn" type="submit">✅ تایید و اعلام به مشتری</button>
        </div>
      </form>
      <form method="post" action="/admin/app-projects/${project.id}/reject" style="margin-top:10px" data-confirm="این سفارش رد شود؟ پیام دلیل برای کاربر ارسال می‌شود." data-ok-text="بله، رد کن">
        <input type="hidden" name="_csrf" value="${user.__csrf}">
        <input class="input" name="reason" maxlength="300" placeholder="دلیل رد (به مشتری اعلام می‌شود)" style="margin-bottom:8px">
        <button class="btn ghost sm" type="submit">✖ رد سفارش</button>
      </form>
    </div>` : ''}

    <div class="card panel">
      <h3 style="margin-bottom:14px">⚙️ تغییر وضعیت و پیشرفت (${fa(st.prog || 0)}٪)</h3>
      <form method="post" action="/admin/app-projects/${project.id}/status">
        <input type="hidden" name="_csrf" value="${user.__csrf}">
        <div class="field"><label>وضعیت پروژه</label>
          <select class="select" name="status">
            ${Object.entries(PROJECT_STATUS).map(([k, v]) => `<option value="${k}" ${project.status === k ? 'selected' : ''}>${v.label} (${v.prog}٪)</option>`).join('')}
          </select>
        </div>
        <button class="btn" type="submit">ثبت و اطلاع به مشتری</button>
        <p class="hint" style="margin-top:8px">با تغییر وضعیت، پیام سیستمی برای مشتری ارسال می‌شود.</p>
      </form>
    </div>

    <div class="card panel">
      <h3 style="margin-bottom:14px">👁 افزودن پیش‌نمایش مرحله‌ای</h3>
      <form method="post" action="/admin/app-projects/${project.id}/preview">
        <input type="hidden" name="_csrf" value="${user.__csrf}">
        <div class="field"><label>یادداشت این مرحله</label><input class="input" name="note" required placeholder="مثلاً: صفحه اصلی و ورود پیاده شد"></div>
        <div class="field"><label class="req">لینک پیش‌نمایش (فایل APK / ویدیو / نمونه آنلاین)</label><input class="input" name="url" required dir="ltr" placeholder="https://…"></div>
        <button class="btn soft" type="submit">افزودن پیش‌نمایش</button>
      </form>
      ${(project.previews || []).map((pv, i) => `<div class="between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
        <span class="small">مرحله ${fa(i + 1)}: ${esc(pv.note)}</span>
        <a class="btn sm ghost" href="${esc(pv.url)}" target="_blank" rel="noopener">مشاهده</a>
      </div>`).join('')}
    </div>
  </div>

  <div style="display:grid;gap:18px">
    <div class="card panel">
      <h3 style="margin-bottom:12px">💳 پرداخت‌ها</h3>
      ${(project.payments || []).map(p => `<div class="between" style="padding:7px 0;border-bottom:1px dashed var(--border)">
        <span class="small">${esc(p.label)} <span class="muted">— ${faDate(p.at)}</span></span><b class="small">${money(p.amount)}</b>
      </div>`).join('') || '<p class="muted small">پرداختی ثبت نشده.</p>'}
    </div>
    <div class="card panel">
      <h3 style="margin-bottom:12px">💬 پیام‌های این مشتری</h3>
      <a class="btn sm" href="/admin/messages?u=${project.userId}">رفتن به گفتگو (${fa(msgs.length)} پیام)</a>
    </div>
  </div>
</div>`;
  return adminPage({ user, csrf: user.__csrf || '', title: `پروژه ${project.code}`, active: 'app-projects', body });
}

export function handleProjectStatus(req, res, ctx, id) {
  const project = findOne('projects', p => p.id === id);
  if (!project) return { redirect: '/admin/app-projects' };
  const st = PROJECT_STATUS[ctx.body.status];
  if (st) {
    updateOne('projects', p => p.id === id, { status: ctx.body.status });
    insert('messages', { threadKey: 'u:' + project.userId, fromUserId: null, fromRole: 'admin', body: `وضعیت پروژه ${project.code} به‌روزرسانی شد:\n«${st.label}» — پیشرفت: ${st.prog}٪`, readByAdmin: true, readByUser: false });
  }
  return { redirect: `/admin/app-projects/${id}` };
}

export function handleProjectPreview(req, res, ctx, id) {
  const project = findOne('projects', p => p.id === id);
  if (!project) return { redirect: '/admin/app-projects' };
  const previews = project.previews || [];
  previews.push({ note: cleanText(ctx.body.note, 200), url: cleanText(ctx.body.url, 500), at: new Date().toISOString() });
  updateOne('projects', p => p.id === id, { previews });
  insert('messages', { threadKey: 'u:' + project.userId, fromUserId: null, fromRole: 'admin', body: `پیش‌نمایش مرحله ${previews.length} پروژه ${project.code} آماده است 👀\n«${cleanText(ctx.body.note, 200)}»\nاز صفحه پیگیری پروژه مشاهده کنید.`, readByAdmin: true, readByUser: false });
  return { redirect: `/admin/app-projects/${id}` };
}

// جدول مشخصات ویزارد (spec کم‌حجم)
function specTable(sp) {
  if (!sp) return '';
  const DL = { asap: 'فوری', 1: '۱ ماهه', 2: '۲-۳ ماه', flex: 'انعطاف‌پذیر' };
  const rows = [
    ['نوع اپ', SPEC_LABELS.types[sp.t] || sp.t || '—'],
    ['نام اپ', sp.n || '—'],
    ['توضیح', esc(sp.d || '—')],
    ['امکانات', (sp.f || []).map(k => SPEC_LABELS.feats[k] || k).join('، ') || '—'],
    ['پلتفرم‌ها', ((sp.pf || []).join('، ') || '—') + (sp.be ? ' + سرور' : '')],
    ['رنگ اصلی', sp.th ? `<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${esc(sp.th)};vertical-align:middle"></span> ${esc(sp.th)}` : '—'],
    ['حالت تاریک', sp.dk ? 'دارد' : 'ندارد'],
    ['لوگو', sp.lg ? 'دارد' : 'ندارد'],
    ['مهلت', DL[sp.dl] || sp.dl || '—'],
    ['بودجه حدودی', sp.bud ? money(sp.bud) : 'نامشخص'],
    ['الهام', sp.ins ? `<a href="${esc(sp.ins)}" target="_blank" rel="noopener" style="color:var(--primary)">${esc(sp.ins.slice(0, 40))}</a>` : '—'],
    ['ارتباط', esc(sp.ct || '—')],
  ];
  return `<div style="margin-top:12px;border:1px dashed var(--border);border-radius:12px;padding:14px">
    <b class="small">🧙 مشخصات ویزارد</b>
    <table class="tbl" style="margin-top:8px;font-size:.84rem">${rows.map(([k, v]) => `<tr><td style="width:120px;color:var(--muted)">${k}</td><td>${v}</td></tr>`).join('')}</table>
  </div>`;
}

// ═══ خروجی JSON مشخصات (فایل کم‌حجم) ═══
export function specDownload(req, res, project) {
  const payload = JSON.stringify({ code: project.code, userId: project.userId, createdAt: project.createdAt, estimate: project.estimate, finalPrice: project.finalPrice, status: project.status, spec: project.spec });
  return payload;
}

// ═══ قالب‌ساز هوشمند ═══
export function generatorPage(req, res, { user }) {
  const examples = [
    'یه رستوران ایتالیایی می‌خوام به اسم رومیکا با منو و گالری و رزرو میز، رنگ قرمز و تم تیره',
    'فروشگاه آنلاین لوازم دیجیتال با سبد خرید و نظرات مشتری‌ها، رنگ آبی',
    'سایت شرکتی به نام گروه آریا با تیم و ساعت کاری و نقشه، رنگ سرمه‌ای',
    'لندینگ استارتاپ با تعرفه و سوالات متداول، رنگ بنفش و دارک',
    'پورتفولیوی شخصی عکاسی با گالری و نمونه‌کارها',
    'کلینیک دندانپزشکی به اسم «لبخند طلایی» با نوبت‌دهی آنلاین، رنگ فیروزه‌ای',
  ];
  const body = `
<div class="gen-grid">
  <div class="card panel">
    <h3 style="margin-bottom:6px">🪄 پرامپتت رو بنویس</h3>
    <p class="muted small" style="margin-bottom:14px">نوع سایت، اسم برند، رنگ و بخش‌ها — هرچی دقیق‌تر، قالب بهتر. تحلیل کاملاً خودکار و آفلاین است.</p>
    <div class="field">
      <textarea id="genPrompt" class="textarea" style="min-height:120px" placeholder="مثلاً: ${esc(examples[0])}"></textarea>
    </div>
    <div class="gen-examples">
      ${examples.map(e => `<button type="button" class="chip-ex" data-ex="${esc(e)}">${esc(e.slice(0, 38))}…</button>`).join('')}
    </div>
    <div class="form-grid">
      <div class="field"><label>فریمورک خروجی</label>
        <select class="select" id="genFw">
          <option value="html">HTML/CSS خالص</option>
          <option value="tailwind">Tailwind CSS</option>
          <option value="bootstrap">Bootstrap 5</option>
          <option value="react">React</option>
          <option value="vue">Vue 3</option>
        </select>
      </div>
      <div class="field"><label>&nbsp;</label>
        <button class="btn lg" id="genBtn" style="width:100%" type="button">✨ تولید قالب</button>
      </div>
    </div>
    <div id="genSpec"></div>
  </div>
  <div class="card panel gen-preview-panel">
    <div class="between" style="margin-bottom:10px">
      <h3>👁 پیش‌نمایش زنده</h3>
      <div class="flex" id="genActions" hidden>
        <a class="btn sm soft" id="genNewTab" target="_blank" rel="noopener">تب جدید</a>
        <a class="btn sm ghost" id="genZip">⬇️ ZIP</a>
      </div>
    </div>
    <div class="gen-frame-wrap">
      <iframe id="genFrame" class="gen-frame" title="پیش‌نمایش قالب"></iframe>
      <div class="gen-empty" id="genEmpty"><div style="font-size:2.6rem">🪄</div><p class="muted small">پرامپت را بنویس و «تولید قالب» را بزن؛ پیش‌نمایش همین‌جا نمایش داده می‌شود.</p></div>
    </div>
    <form id="genPublish" style="margin-top:14px" hidden>
      <input type="hidden" name="_csrf" value="${user.__csrf}">
      <input type="hidden" name="token" id="genToken">
      <div class="form-grid">
        <div class="field"><label>قیمت فروش (تومان)</label><input class="input" name="price" id="genPrice" value="690000" placeholder="مثلاً 690000"></div>
        <div class="field"><label>&nbsp;</label><label class="check-line"><input type="checkbox" name="published" checked> 🟢 انتشار فوری در فروشگاه</label></div>
      </div>
      <button class="btn" type="button" id="genPublishBtn">🚀 انتشار در فروشگاه</button>
      <span class="hint" id="genPubMsg" style="margin-inline-start:10px"></span>
    </form>
  </div>
</div>
<script src="/assets/js/generator.js" defer></script>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'قالب‌ساز هوشمند ⭐', active: 'generator', body });
}

export function handleGenerate(req, res, ctx) {
  const prompt = cleanText(ctx.body.prompt, 500);
  if (prompt.length < 8) return { json: { ok: false, error: 'پرامپت طولانی‌تری بنویس (حداقل ۸ حرف).' } };
  const fw = ['html', 'tailwind', 'bootstrap', 'react', 'vue'].includes(ctx.body.fw) ? ctx.body.fw : 'html';
  const spec = parsePrompt(prompt);
  const token = randomToken(16);
  insert('generatedTemplates', { token, prompt, spec, framework: fw, productId: null, createdAt: new Date().toISOString() });
  return { json: { ok: true, token, spec: { type: spec.type, typeLabel: SPEC_TYPE_LABELS[spec.type], brand: spec.brand, palette: spec.palette, dark: spec.dark, sections: spec.sections } } };
}

export function handleGenPublish(req, res, ctx) {
  const gen = findOne('generatedTemplates', g => g.token === ctx.body.token);
  if (!gen) return { json: { ok: false, error: 'قالبی با این شناسه پیدا نشد؛ دوباره تولید کنید.' } };
  const spec = gen.spec;
  const T = SPEC_TYPE_LABELS[spec.type] || 'سایت';
  const doc = {
    title: `${spec.brand} — قالب ${T}`,
    slug: slugify(spec.brand),
    description: `قالب ${T} با طراحی ${spec.dark ? 'تیره و مدرن' : 'روشن و مینیمال'}؛ تولیدشده با قالب‌ساز هوشمند اپ‌تم از پرامپت کاربر.`,
    longDescription: `این قالب با قالب‌ساز هوشمند اپ‌تم و بر اساس پرامپت «${spec.prompt.slice(0, 200)}» تولید شده است. شامل صفحات کامل (خانه، درباره ما، تماس) با پالت رنگی اختصاصی و بخش‌های: ${spec.sections.join('، ')}. خروجی HTML خالص بهینه به‌همراه نسخه‌های شروع Tailwind/Bootstrap/React/Vue در بسته دانلودی.`,
    price: Math.max(0, parseMoney(ctx.body.price) || 690000), salePrice: null,
    categoryIds: [({ shop: 1, corporate: 2, portfolio: 3, landing: 4, restaurant: 5, agency: 6, clinic: 2, edu: 2, travel: 4, blog: 3 })[spec.type] || 4],
    frameworks: [gen.framework],
    pages: 3,
    features: ['ریسپانسیو کامل', 'بدون عکس سنگین (SVG/CSS)', 'پالت رنگی قابل تغییر', `نسخه شروع ${gen.framework.toUpperCase()}`, 'SEO پایه'],
    tags: [T, spec.brand, spec.dark ? 'تیره' : 'روشن'],
    palette: spec.palette, accent: spec.palette[2],
    published: ctx.body.published === 'on',
  };
  const product = insert('products', { ...doc, downloads: 0 });
  updateOne('generatedTemplates', g => g.id === gen.id, { productId: product.id });
  return { json: { ok: true, id: product.id, slug: product.slug, published: doc.published } };
}

export function handleGenDownload(req, res, gen) {
  const zip = makeZip(generateSpecZip(gen.spec, gen.framework));
  res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="apptheme-template-${gen.token.slice(0, 8)}.zip"` });
  res.end(zip);
  return true;
}

export function serveGenPreview(req, res, gen) {
  const { home } = generateFromSpec(gen.spec, { styleInline: true });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(home);
  return true;
}

// ═══ پاک‌سازی داده‌های دمو (برای شروع واقعی) ═══
export function handlePurgeDemo(req, res, ctx) {
  const db = getDb();
  const demoEmails = ['sara@demo.ir', 'amir@demo.ir', 'negar@demo.ir'];
  const ids = db.users.filter(u => demoEmails.includes(u.email)).map(u => u.id);
  const inDemo = uid => ids.includes(uid);
  db.users = db.users.filter(u => !inDemo(u.id));
  db.orders = db.orders.filter(o => !inDemo(o.userId));
  db.licenses = db.licenses.filter(l => !inDemo(l.userId));
  db.likes = db.likes.filter(l => !inDemo(l.userId));
  db.comments = db.comments.filter(c => !inDemo(c.userId));
  db.messages = db.messages.filter(m => !inDemo(Number(m.threadKey.split(':')[1])));
  db.projects = db.projects.filter(p => !inDemo(p.userId));
  db.transactions = db.transactions.filter(t => !inDemo(t.userId));
  db.withdrawals = db.withdrawals.filter(w => !inDemo(w.userId));
  db.sessions = db.sessions.filter(s => !inDemo(s.userId)); // نشست ادمین حفظ می‌شود
  persist();
  console.log(`[purge-demo] ${ids.length} کاربر دمو و داده‌هایشان حذف شدند.`);
  return { json: { ok: true, removed: ids.length } };
}

// ═══ بازیابی پشتیبان ═══
export function handleRestore(req, res, ctx) {
  const { body, user } = ctx;
  const payload = body;
  if (!payload || !Array.isArray(payload.users) || !Array.isArray(payload.products) || !payload.meta) {
    return { json: { ok: false, error: 'فایل پشتیبان معتبر نیست (ساختار داده نامعتبر).' } };
  }
  const me = payload.users.find(u => u.email === user.email && u.role === 'admin' && u.active !== false);
  if (!me) {
    return { json: { ok: false, error: 'در این فایل پشتیبان، مدیری با ایمیل شما وجود ندارد؛ بازیابی برای امنیت انجام نشد.' } };
  }
  try {
    replaceDb(payload);
    login(res, me.id, ctx.isHttps); // نشست تازه در دیتابیس جدید
    console.log(`[restore] بازیابی پشتیبان توسط ${user.email} — ${payload.users.length} کاربر، ${payload.products.length} قالب`);
    return { json: { ok: true } };
  } catch (e) {
    return { json: { ok: false, error: 'خطا در بازیابی: ' + e.message } };
  }
}

// ═══ پیام‌ها ═══
export function messagesAdmin(req, res, { user, query }) {
  const db = getDb();
  const targetId = parseInt(query.u || '0', 10);
  const threads = {};
  for (const m of db.messages) {
    const uid = Number(m.threadKey.split(':')[1]);
    if (!threads[uid]) threads[uid] = { uid, last: m, unread: 0, count: 0 };
    threads[uid].count++;
    if (m.fromRole === 'user' && !m.readByAdmin) threads[uid].unread++;
    if (new Date(m.createdAt) > new Date(threads[uid].last.createdAt)) threads[uid].last = m;
  }
  const list = Object.values(threads).sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt));

  let convo = '';
  if (targetId) {
    const target = findOne('users', u => u.id === targetId);
    const msgs = findMany('messages', m => m.threadKey === 'u:' + targetId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    for (const m of msgs) if (!m.readByAdmin && m.fromRole === 'user') updateOne('messages', x => x.id === m.id, { readByAdmin: true });
    convo = `
  <div class="card panel">
    <div class="between" style="margin-bottom:14px">
      <h3>💬 گفتگو با ${esc(target?.name || '؟')} <span class="muted small" dir="ltr">${esc(target?.email || '')}</span></h3>
      <a class="btn sm ghost" href="/admin/messages">← همه گفتگوها</a>
    </div>
    <div class="chat-scroll admin-chat">
      ${msgs.map(m => `<div class="msg ${m.fromRole === 'user' ? 'support' : 'me'}">
        <div class="msg-bubble"><div class="msg-head"><b>${m.fromRole === 'user' ? esc(target?.name || 'کاربر') : 'پشتیبانی'}</b><span class="muted small">${faDateTime(m.createdAt)}</span></div><div class="msg-body">${esc(m.body)}</div></div>
      </div>`).join('') || '<p class="muted small">گفتگویی وجود ندارد.</p>'}
    </div>
    <form method="post" action="/admin/messages/reply" class="chat-form">
      <input type="hidden" name="_csrf" value="${user.__csrf}">
      <input type="hidden" name="userId" value="${targetId}">
      <textarea class="textarea grow" name="body" required maxlength="1500" placeholder="پاسخ…"></textarea>
      <button class="btn" type="submit">ارسال ➤</button>
    </form>
  </div>`;
  }

  const body = `
<div class="admin-2col" style="grid-template-columns:340px 1fr">
  <div class="card panel">
    <h3 style="margin-bottom:12px">گفتگوها (${fa(list.length)})</h3>
    ${list.map(t => {
      const u = findOne('users', x => x.id === t.uid);
      return `<a class="thread-item ${t.uid === targetId ? 'active' : ''}" href="/admin/messages?u=${t.uid}">
        <div class="avatar">${esc((u?.name || '؟').charAt(0))}</div>
        <div class="grow"><b class="small">${esc(u?.name || 'کاربر حذف‌شده')}</b><div class="muted small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc((t.last.body || '').slice(0, 42))}</div></div>
        ${t.unread ? `<span class="badge err">${fa(t.unread)}</span>` : ''}
      </a>`;
    }).join('') || '<p class="muted small">هنوز گفتگویی نیست.</p>'}
  </div>
  ${convo || '<div class="card panel center" style="display:grid;place-content:center"><div style="font-size:2.6rem">💬</div><p class="muted">یک گفتگو را انتخاب کنید</p></div>'}
</div>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'پیام با مشتریان', active: 'messages', body });
}

export function handleAdminReply(req, res, ctx) {
  const { body, user } = ctx;
  const userId = Number(body.userId);
  const target = findOne('users', u => u.id === userId);
  const text = cleanText(body.body, 1500);
  if (target && text.length >= 2) {
    insert('messages', { threadKey: 'u:' + userId, fromUserId: user.id, fromRole: 'admin', body: text, readByAdmin: true, readByUser: false });
  }
  return { redirect: `/admin/messages?u=${userId}` };
}

// ═══ تنظیمات ═══
export function settingsPage(req, res, { user, ok = '' }) {
  const db = getDb();
  const s = db.settings;
  const body = `
${ok ? '<div class="alert ok">تنظیمات ذخیره شد ✓</div>' : ''}
<form method="post" action="/admin/settings/save">
  <input type="hidden" name="_csrf" value="${user.__csrf}">
  <div class="admin-2col">
    <div style="display:grid;gap:18px">
      <div class="card panel">
        <h3 style="margin-bottom:14px">🏪 عمومی</h3>
        <div class="field"><label>نام فروشگاه</label><input class="input" name="shopName" value="${esc(s.shopName)}"></div>
        <div class="field"><label>شعار</label><input class="input" name="tagline" value="${esc(s.tagline)}"></div>
        <div class="field"><label>توضیحات (سئو)</label><textarea class="textarea" name="description" style="min-height:80px">${esc(s.description)}</textarea></div>
        <div class="form-grid">
          <div class="field"><label>تلگرام</label><input class="input" name="tg" dir="ltr" value="${esc(s.socials?.telegram || '')}"></div>
          <div class="field"><label>اینستاگرام</label><input class="input" name="ig" dir="ltr" value="${esc(s.socials?.instagram || '')}"></div>
        </div>
      </div>
      <div class="card panel">
        <h3 style="margin-bottom:14px">💳 پرداخت (زرین‌پال)</h3>
        <div class="form-grid">
          <div class="field"><label>حالت</label>
            <select class="select" name="payProvider">
              <option value="demo" ${s.payment?.provider === 'demo' ? 'selected' : ''}>دمو (آزمایشی)</option>
              <option value="zarinpal" ${s.payment?.provider === 'zarinpal' ? 'selected' : ''}>زرین‌پال واقعی</option>
            </select>
          </div>
          <div class="field"><label>مرچنت‌کد</label><input class="input" name="merchantId" dir="ltr" value="${esc(s.payment?.merchantId || '')}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" title="مرچنت‌کد باید UUID باشد: ۸-۴-۴-۴-۱۲ رقم و حرف"></div>
        </div>
        <label class="check-line"><input type="checkbox" name="sandbox" ${s.payment?.sandbox ? 'checked' : ''}> 🧪 حالت آزمایشی (Sandbox زرین‌پال — بدون تراکنش واقعی)</label>
        <p class="hint" style="margin-top:8px">با انتخاب «زرین‌پال» + وارد کردن مرچنت‌کد، درگاه <b>واقعی</b> فعال می‌شود. آدرس بازگشت (Callback) به‌صورت خودکار از SITE_URL ساخته می‌شود: <span dir="ltr">SITE_URL/payment/callback</span></p>
      </div>
    </div>
    <div style="display:grid;gap:18px">
      <div class="card panel">
        <h3 style="margin-bottom:4px">🎉 تخفیف‌های هوشمند مناسبت‌ها</h3>
        <p class="muted small" style="margin-bottom:14px">سایت به‌صورت خودکار مناسبت‌های تقویم ایران را تشخیص می‌دهد و تخفیف را اعمال می‌کند. درصدها را اینجا ویرایش کنید یا هر جشنواره را دستی روشن/خاموش کنید.</p>
        ${OCCASIONS.map(o => {
          const ov = s.occasions?.[o.key] || {};
          const today = new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' }).format(new Date());
          return `<div class="occ-row">
          <div class="grow">
            <b>${o.icon} ${o.label}</b>
            <div class="muted small">${occasionRangeLabel(o)}${o.note ? ' — ' + o.note : ''}</div>
          </div>
          <div class="flex" style="gap:8px">
            <div class="flex" style="gap:4px"><input class="input" style="width:74px;padding:7px" type="number" min="0" max="60" name="occ_${o.key}_percent" value="${ov.percent ?? o.percent}"><span class="muted small">٪</span></div>
            <select class="select" style="width:auto;padding:7px" name="occ_${o.key}_forced">
              <option value="" ${!ov.forced ? 'selected' : ''}>خودکار</option>
              <option value="on" ${ov.forced === 'on' ? 'selected' : ''}>روشن کن</option>
              <option value="off" ${ov.forced === 'off' ? 'selected' : ''}>خاموش کن</option>
            </select>
          </div>
        </div>`;
        }).join('')}
      </div>
      <div class="card panel">
        <h3 style="margin-bottom:14px">📧 ایمیل (SMTP — برای وریفای جیمیل)</h3>
        <div class="form-grid">
          <div class="field"><label>میزبان</label><input class="input" name="smtpHost" dir="ltr" value="${esc(s.smtp?.host || '')}" placeholder="smtp.gmail.com"></div>
          <div class="field"><label>پورت</label><input class="input" name="smtpPort" type="number" value="${s.smtp?.port || 587}"></div>
          <div class="field"><label>کاربر</label><input class="input" name="smtpUser" dir="ltr" value="${esc(s.smtp?.user || '')}"></div>
          <div class="field"><label>رمز اپ</label><input class="input" name="smtpPass" type="password" dir="ltr" value="${esc(s.smtp?.pass || '')}"></div>
        </div>
        <p class="hint">تا زمانی که پر نشود، لینک تأیید در لاگ سرور نمایش داده می‌شود (حالت دمو).</p>
      </div>
      <div class="card panel" style="border-color: color-mix(in srgb, var(--info) 35%, var(--border))">
        <h3 style="margin-bottom:6px">💾 پشتیبان‌گیری و انتقال هاست</h3>
        <p class="muted small" style="margin-bottom:12px">همه داده‌های فروشگاه در یک فایل JSON سبک. برای مهاجرت به هر هاست دیگر (یا امنیت روی هاست رایگان): دانلود کنید و در هاست جدید «بازیابی» بزنید.</p>
        <a class="btn soft" href="/admin/backup">⬇️ دانلود فایل پشتیبان</a>
        <div style="margin-top:16px;border-top:1px dashed var(--border);padding-top:14px">
          <b class="small">بازیابی از فایل:</b>
          <div class="flex" style="margin-top:8px;flex-wrap:wrap">
            <input type="file" id="restoreFile" accept="application/json,.json" class="small" style="flex:1;min-width:180px">
            <button class="btn ghost sm" id="restoreBtn" type="button">♻️ بازیابی</button>
          </div>
          <p class="hint" style="margin-top:8px">⚠️ داده‌های فعلی کاملاً با فایل پشتیبان جایگزین می‌شوند. آخرین بکاپ: ${db.meta.lastBackupAt ? faDateTime(db.meta.lastBackupAt) : '—'}</p>
        </div>
      </div>
      <div class="card panel" style="border-color: color-mix(in srgb, var(--err) 30%, var(--border))">
        <h3 style="margin-bottom:6px">🧹 شروع واقعی (حذف داده‌های دمو)</h3>
        <p class="muted small" style="margin-bottom:12px">سه کاربر نمونه (سارا/امیر/نگار) با سفارش‌ها، پیام‌ها و پروژه‌هایشان حذف می‌شوند. قالب‌ها و تنظیمات می‌ماند (از بخش قالب‌ها قابل ویرایش/حذف‌اند).</p>
        <button class="btn danger sm" id="purgeDemoBtn" type="button">حذف کاربران و داده‌های دمو</button>
      </div>
    </div>
  </div>
  <button class="btn lg" type="submit" style="margin-top:18px">💾 ذخیره تنظیمات</button>
</form>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'تنظیمات فروشگاه', active: 'settings', body });
}

export function handleSettingsSave(req, res, ctx) {
  const { body } = ctx;
  const db = getDb();
  db.settings.shopName = cleanText(body.shopName, 60) || db.settings.shopName;
  db.settings.tagline = cleanText(body.tagline, 120);
  db.settings.description = cleanText(body.description, 400);
  db.settings.socials.telegram = cleanText(body.tg, 200);
  db.settings.socials.instagram = cleanText(body.ig, 200);
  db.settings.payment.provider = body.payProvider === 'zarinpal' ? 'zarinpal' : 'demo';
  db.settings.payment.merchantId = cleanText(body.merchantId, 100);
  db.settings.payment.sandbox = body.sandbox === 'on';
  db.settings.smtp.host = cleanText(body.smtpHost, 190);
  db.settings.smtp.port = Number(body.smtpPort) || 587;
  db.settings.smtp.user = cleanText(body.smtpUser, 190);
  db.settings.smtp.pass = cleanText(body.smtpPass, 190);
  const occ = {};
  for (const o of OCCASIONS) {
    occ[o.key] = {
      percent: Math.min(60, Math.max(0, Number(body['occ_' + o.key + '_percent'] ?? o.percent))),
      forced: ['on', 'off'].includes(body['occ_' + o.key + '_forced']) ? body['occ_' + o.key + '_forced'] : undefined,
    };
  }
  db.settings.occasions = occ;
  persist();
  return { redirect: '/admin/settings?ok=1' };
}
