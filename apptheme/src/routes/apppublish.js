// ═══════════════════════════════════════════════════════════════
// انتشار اپ‌های ساخته‌شده با استودیوی هوش مصنوعی (کاربر + ادمین)
//  - /apps/publish   صفحهٔ مدیریت انتشار کاربر
//  - /app/:token     صفحهٔ عمومی منتشرشده (لینک اشتراک‌گذاری)
// ═══════════════════════════════════════════════════════════════
import { page } from '../render.js';
import { esc, faNum, timeAgo } from '../util.js';
import { findOne, findMany, updateOne } from '../db.js';

const fa = faNum;
const KIND_LABEL = { template: 'قالب سایت', plugin: 'افزونه وردپرس', store: 'فروشگاه‌ساز', convert: 'تبدیل قالب', link: 'سایت از لینک', app: 'اپ اندروید' };
const TIER_LABEL = { bronze: 'برنز', silver: 'نقره', gold: 'طلا', vip: 'VIP', legendary: 'لجندری', epic: 'اپیک' };
const TIER_BADGE = { bronze: 'ok', silver: 'primary', gold: 'warn', vip: 'primary', legendary: 'warn', epic: 'err' };

function kindLabel(k) { return KIND_LABEL[k] || k; }
function tierLabel(t) { return TIER_LABEL[t] || t; }

// ─── صفحهٔ «انتشار اپ» کاربر ───
export function appsPublishPage(req, res, { user, baseUrl, csrf }) {
  const builds = findMany('aiProducts', x => x.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const counts = { all: builds.length, pub: builds.filter(b => b.published).length, draft: builds.filter(b => !b.published).length };
  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <a href="/apps">سفارش اپ</a> <span>/</span> <span>انتشار اپ</span></nav>
  <div class="cart-page-head">
    <div class="section-head" style="margin-bottom:0">
      <h2>انتشار اپ و خروجی‌های هوش مصنوعی</h2>
      <p class="muted small" style="margin-top:6px">خروجی‌های ساخته‌شده را منتشر کنید تا با یک لینک عمومی قابل مشاهده باشند؛ هر زمان هم می‌توانید انتشار را متوقف کنید.</p>
    </div>
    <div class="flex" style="gap:8px">
      <span class="badge soft">${fa(counts.all)} ساخته‌شده</span>
      <span class="badge ok">${fa(counts.pub)} منتشرشده</span>
      <span class="badge warn">${fa(counts.draft)} پیش‌نویس</span>
    </div>
  </div>
  ${builds.length ? `
  <div style="display:grid;gap:14px">
    ${builds.map(b => {
      const pub = !!b.published;
      const ownerView = `/app/${esc(b.token)}`;
      return `
      <div class="card card-pad" data-ap="${esc(b.token)}" style="display:grid;gap:14px">
        <div class="between flex-wrap" style="gap:12px">
          <div class="grow" style="min-width:220px">
            <div class="flex" style="gap:8px;align-items:center;flex-wrap:wrap">
              <b style="font-size:1rem">${esc(b.title || 'خروجی هوش مصنوعی')}</b>
              <span class="badge ${pub ? 'ok' : 'soft'}">${pub ? 'منتشرشده' : 'پیش‌نویس'}</span>
            </div>
            <div class="muted small" style="margin-top:6px;display:flex;gap:14px;flex-wrap:wrap">
              <span>${kindLabel(b.kind)}</span>
              <span>سطح <b class="badge ${TIER_BADGE[b.tier] || 'soft'}" style="font-size:.68rem">${tierLabel(b.tier)}</b></span>
              <span>ساخت: ${timeAgo(b.createdAt)}</span>
              ${b.parent ? '<span>نسخه به‌روزرسانی</span>' : ''}
            </div>
          </div>
          <div class="flex" style="gap:8px;flex-wrap:wrap">
            <form method="post" action="/apps/publish/${esc(b.token)}" data-pub-form>
              <input type="hidden" name="_csrf" value="${esc(csrf)}">
              <input type="hidden" name="action" value="${pub ? 'unpublish' : 'publish'}">
              <button class="btn sm ${pub ? 'ghost' : ''}" type="submit">${pub ? 'توقف انتشار' : 'انتشار اپ'}</button>
            </form>
            <a class="btn sm soft" href="/preview/ai/${esc(b.token)}" target="_blank" rel="noopener">پیش‌نمایش</a>
            <a class="btn sm ghost" href="/ai/download?token=${esc(b.token)}">دانلود فایل</a>
          </div>
        </div>
        <div class="ap-link-row" style="display:flex;gap:8px;align-items:center;background:color-mix(in srgb,var(--surface-2,#1a2250) 55%,transparent);border:1px dashed var(--border);border-radius:12px;padding:10px 14px">
          <span class="muted small" style="white-space:nowrap">لینک عمومی:</span>
          <code class="ltr grow" style="font-size:.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:left">${baseUrl}${ownerView}</code>
          <button class="btn sm ghost" type="button" data-copy="${baseUrl}${ownerView}">کپی</button>
          ${pub ? `<a class="btn sm soft" href="${ownerView}" target="_blank" rel="noopener">مشاهده</a>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>
  <p class="hint" style="margin-top:14px">با انتشار اپ، پیش‌نمایش زندهٔ آن برای همه قابل مشاهده می‌شود؛ فایل کامل فقط از حساب خودتان قابل دانلود است.</p>` : `
  <div class="card cart-empty">
    <h3>هنوز چیزی نساخته‌اید</h3>
    <p class="muted small">از استودیوی هوش مصنوعی قالب، افزونه، فروشگاه یا اپ بسازید؛ سپس همین‌جا منتشرش کنید.</p>
    <div class="flex" style="gap:10px;margin-top:10px">
      <a class="btn lg" href="/ai">رفتن به استودیوی هوش مصنوعی</a>
      <a class="btn lg ghost" href="/apps">سفارش اپ اندروید</a>
    </div>
  </div>`}
</div>
<script>
(function () {
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
  function copyLink(url, btn) {
    function done() { var t = btn.textContent; btn.textContent = 'کپی شد'; setTimeout(function () { btn.textContent = t; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var i = document.createElement('input'); i.value = url; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(i); }
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) { e.preventDefault(); copyLink(c.getAttribute('data-copy'), c); return; }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-pub-form]');
    if (!f) return;
    var act = f.querySelector('[name=action]').value;
    var pub = act === 'publish';
    if (!window.tlConfirm) return;
    e.preventDefault();
    tlConfirm(pub
      ? '<b>این خروجی منتشر شود؟</b><br><span class="muted small">پیش‌نمایش زنده برای همه قابل مشاهده می‌شود و لینک عمومی فعال می‌گردد.</span>'
      : 'انتشار این خروجی متوقف شود؟<br><span class="muted small">لینک عمومی دیگر برای بازدیدکنندگان در دسترس نخواهد بود.</span>',
      { okText: pub ? 'انتشار' : 'توقف انتشار', title: pub ? 'انتشار اپ' : 'توقف انتشار' })
      .then(function (ok) { if (ok) { f.submit(); } });
  });
})();
</script>`;
  return page({ user, title: 'انتشار اپ | اپ‌تم', desc: 'انتشار و مدیریت اپ‌های ساخته‌شده با هوش مصنوعی', url: baseUrl + '/apps/publish', body, csrf });
}

// ─── صفحهٔ عمومی منتشرشده ───
export function appPage(req, res, { user, baseUrl, csrf, token }) {
  const rec = findOne('aiProducts', x => x.token === String(token || ''));
  if (!rec) return null;
  const owner = rec.userId ? findOne('users', u => u.id === rec.userId) : null;
  const isOwner = !!(user && (user.role === 'admin' || rec.userId === user.id));
  const pub = !!rec.published;
  if (!pub && !isOwner) return null;
  const url = `${baseUrl}/app/${esc(token)}`;
  const body = `
<div class="container section" style="padding-top:26px">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <span>اپ منتشرشده</span></nav>
  ${!pub ? `<div class="alert warn" style="margin-bottom:14px">این خروجی هنوز <b>منتشر نشده</b> است و فقط شما آن را می‌بینید. <a href="/apps/publish" style="text-decoration:underline">از صفحهٔ انتشار</a> آن را فعال کنید.</div>` : ''}
  <div class="card card-pad" style="margin-bottom:16px">
    <div class="between flex-wrap" style="gap:14px">
      <div>
        <div class="flex" style="gap:8px;align-items:center;flex-wrap:wrap">
          <h1 style="font-size:1.35rem;margin:0">${esc(rec.title || 'خروجی هوش مصنوعی')}</h1>
          <span class="badge ok">منتشرشده</span>
        </div>
        <div class="muted small" style="margin-top:8px;display:flex;gap:16px;flex-wrap:wrap">
          <span>نوع: <b>${kindLabel(rec.kind)}</b></span>
          <span>سطح: <span class="badge ${TIER_BADGE[rec.tier] || 'soft'}" style="font-size:.68rem">${tierLabel(rec.tier)}</span></span>
          <span>زمان ساخت: <b>${timeAgo(rec.createdAt)}</b></span>
          <span>سازنده: <b>${owner ? esc(owner.name) : 'استودیوی هوش مصنوعی'}</b></span>
        </div>
      </div>
      <div class="flex" style="gap:8px;flex-wrap:wrap">
        <a class="btn" href="/preview/ai/${esc(token)}" target="_blank" rel="noopener">باز کردن در تب جدید</a>
        <button class="btn ghost" type="button" data-copy="${url}">کپی لینک</button>
        ${isOwner ? `<a class="btn soft" href="/ai/download?token=${esc(token)}">دانلود فایل</a><a class="btn ghost" href="/apps/publish">مدیریت انتشار</a>` : ''}
      </div>
    </div>
  </div>
  <div class="card" style="overflow:hidden;padding:10px;background:color-mix(in srgb,var(--surface-2,#1a2250) 45%,transparent)">
    <iframe src="/preview/ai/${esc(token)}" title="${esc(rec.title || 'پیش‌نمایش')}" loading="lazy"
      style="width:100%;height:min(74vh,720px);border:1px solid var(--border);border-radius:14px;background:#fff"></iframe>
  </div>
  <p class="hint center" style="margin-top:14px">دستگاه‌های موبایل: در «باز کردن در تب جدید» از منوی مرورگر گزینهٔ Add to Home Screen / نصب اپ را بزنید.</p>
</div>
<script>
(function () {
  function copyLink(url, btn) {
    function done() { var t = btn.textContent; btn.textContent = 'کپی شد'; setTimeout(function () { btn.textContent = t; }, 1600); }
    function fallback() { var i = document.createElement('input'); i.value = url; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(i); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback);
    else fallback();
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) { e.preventDefault(); copyLink(c.getAttribute('data-copy'), c); }
  });
})();
</script>`;
  return page({ user, title: `${rec.title || 'اپ'} | اپ‌تم`, desc: 'پیش‌نمایش زندهٔ اپ ساخته‌شده با هوش مصنوعی اپ‌تم', url, body, csrf });
}


// ─── تغییر وضعیت انتشار (مالک یا ادمین) ───
export function togglePublish(req, res, { user, body, token }) {
  if (!user) return { ok: false, error: 'auth' };
  const rec = findOne('aiProducts', x => x.token === String(token || ''));
  if (!rec) return { ok: false, error: 'پروژه پیدا نشد' };
  if (rec.userId !== user.id && user.role !== 'admin') return { ok: false, error: 'دسترسی ندارید' };
  const want = String(body.action || '') === 'publish' ? true : String(body.action || '') === 'unpublish' ? false : !rec.published;
  updateOne('aiProducts', x => x.token === rec.token, { published: want, publishedAt: want ? new Date().toISOString() : null });
  return { ok: true, published: want };
}
