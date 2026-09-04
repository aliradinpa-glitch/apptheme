// ═══════════════════════════════════════════════════════════════
// «استودیوی پرو» — اشتراک کاربران (۲ سطح پایینتر از ادمین)
//   کاربر با خرید پلن پرو: قالبساز + افزونهساز + فروشگاهساز + اپساز
//   قدرت هوش مصنوعی هر پلن را ادمین از /admin/ai-pro تنظیم میکند
//   پیشفرض: بهترین پلن (اپیک) = ۵۰٪ قدرت ادمین (دمین = ۱۰۰٪ مافوق حرفهای)
// ═══════════════════════════════════════════════════════════════
import { page } from './render.js';
import { findOne, findMany, insert, updateOne, getDb } from './db.js';
import { esc, money, faNum, faDate } from './util.js';
import { TIERS, tierOf, proPlansOf, strengthFor, varySpec, applyEdit, estimateBuild } from './gencore.js';
import { parsePrompt, generateFromSpec, MODE_LABELS, SPEC_TYPE_LABELS } from './promptgen.js';
import { parsePluginPrompt, generatePlugin } from './plugingen.js';
import { parseStorePrompt, generateStore } from './storegen.js';
import { generateApp, saveAiBuildFile } from './aiadmin.js';
import { makeZip } from './zip.js';
import { randomToken, cleanText } from './security.js';
import { balance, credit, notify } from './wallet.js';

const fa = faNum;

// ─── وضعیت اشتراک کاربر ───
export function proState(user) {
  if (!user || !user.pro || !user.pro.key) return { active: false };
  const exp = new Date(user.pro.expiresAt || 0).getTime();
  if (exp < Date.now()) return { active: false, expired: true, plan: user.pro };
  return { active: true, plan: user.pro, daysLeft: Math.max(0, Math.ceil((exp - Date.now()) / 864e5)) };
}

function planOf(db, key) {
  return proPlansOf(db).find(p => p.key === key) || null;
}

// ═══════════ صفحه استودیو (پلنها یا استودیو) ═══════════
export function userStudioPage(req, res, { user, csrf, baseUrl }) {
  const db = getDb();
  const plans = proPlansOf(db);
  const st = proState(user);
  const wal = balance(user.id);

  if (!st.active) {
    const cards = plans.filter(p => p.active).map(p => `
      <div class="tier-public pro-plan-card${st.expired && st.plan?.key === p.key ? ' own' : ''}">
        <div class="tp-ic">${p.icon}</div>
        <b class="tp-name">${p.label}</b>
        <div class="tp-price">${money(p.price)} <small>/ ماه</small></div>
        <p class="muted small">${p.desc}</p>
        <div class="pro-power"><span>قدرت هوش مصنوعی</span><b>${fa(p.ai)}٪ از قدرت ادمین</b></div>
        <span class="badge soft" style="margin-top:6px">${fa(p.days)} روز دسترسی به استودیو</span>
        <button class="btn" style="margin-top:12px;width:100%" data-sub="${p.key}">${st.expired && st.plan?.key === p.key ? '🔄 تمدید' : '🚀 خرید اشتراک'}</button>
      </div>`).join('');
    const body = `
<section class="section" style="padding-top:26px">
  <div class="container">
    <div class="section-head"><h1 style="font-size:1.6rem">👥 استودیوی پرو — اشتراک ماهانه</h1>
      <span class="muted">قالبساز، افزونهساز، فروشگاهساز و اپ اندروید؛ قدرت هوش مصنوعی هر پلن را مدیریت تنظیم میکند. <b>بهترین پلن = ۵۰٪ قدرت هوش مصنوعی ادمین</b> — ادمین ۱۰۰٪ مافوق حرفهای.</span>
    </div>
    <div class="alert info" style="max-width:46rem;margin:0 auto 18px">💰 موجودی کیف پول شما: <b>${money(wal)}</b> — اگر کافی نیست از <a href="/account/wallet" style="color:var(--primary)">صفحه کیف پول</a> شارژ کن. پرداخت مستقیم از کیف پول کسر میشود و بلافاصله فعال است.</div>
    <div class="tier-grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">${cards}</div>
    <p class="muted small" style="text-align:center;margin-top:16px">🔓 بدون اشتراک هم میتوانی از <a href="/apps">سفارش ساخت اپ</a> و خرید قالبهای آماده استفاده کنی.</p>
  </div>
</section>
<script>
(function () {
  var csrf = (document.querySelector('meta[name=csrf]') || {}).content || '';
  document.querySelectorAll('[data-sub]').forEach(function (b) {
    b.addEventListener('click', function () {
      b.disabled = true; b.textContent = 'در حال پرداخت…';
      fetch('/ai/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf }, body: JSON.stringify({ plan: b.getAttribute('data-sub') }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { location.href = '/ai?ok=sub'; }
          else { b.disabled = false; b.textContent = '🚀 خرید اشتراک'; alert(d.error || 'خطا'); }
        })
        .catch(function () { b.disabled = false; b.textContent = '🚀 خرید اشتراک'; });
    });
  });
})();
</script>`;
    return page({ user, title: `استودیوی پرو | ${'اپتم'}`, desc: 'اشتراک پرو: قالبساز، افزونهساز، فروشگاهساز و اپ اندروید با هوش مصنوعی', url: baseUrl + '/ai', body, csrf });
  }

  // ─── استودیوی فعال ───
  const plan = planOf(db, st.plan.key) || { ...st.plan };
  const power = Math.max(4, Math.min(50, plan.ai || 0));
  const builds = findMany('aiProducts', x => x.userId === user.id && x.role === 'pro').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12);
  const kinds = [
    ['template', 'قالبساز', 'مثلاً: سایت رستوران لوکس برند «شب طلایی» با منو و گالری', true],
    ['plugin', 'افزونهساز', 'مثلاً: افزونه «فرم تماس پرو» با اعلان سفارش ووکامرس', false],
    ['store', 'فروشگاهساز', 'مثلاً: فروشگاه دیجیتال برند «تکشاپ» با پرداخت آنلاین', false],
    ['app', 'اپ اندروید', 'مثلاً: اپ فروشگاهی «شاپینو» با اعلان تخفیف و جستجو', false],
  ];
  const tabs = kinds.map(([k, t], i) => `<button type="button" class="sf-tab${i === 0 ? ' on' : ''}" data-tab="${k}">${t}</button>`).join('');
  const panels = kinds.map(([k, t, ph]) => `
    <div class="sf-panel${k === 'template' ? ' on' : ''}" data-panel="${k}">
      <h3>${t}</h3>
      <div class="field"><label class="req">پرامپت فارسی — هر چقدر دقیقتر بگویی، بهتر میفهمد</label>
      <textarea class="textarea" id="p-${k}" style="min-height:84px" placeholder="${ph}"></textarea></div>
      ${k === 'template' ? `<div class="field"><label>سبک طراحی (اختیاری)</label><select class="select" id="m-template">${Object.entries(MODE_LABELS).map(([key, v]) => `<option value="">خودت انتخاب کن</option><option value="${key}">${v}</option>`).join('')}</select></div>` : ''}
      ${k === 'store' ? `<div class="gen-modes" style="margin-top:6px"><button type="button" class="mode-chip on" data-fw="woocommerce">🛒 ووکامرس</button><button type="button" class="mode-chip" data-fw="wordpress">📰 وردپرس</button><button type="button" class="mode-chip" data-fw="django">🐍 جنگو</button><button type="button" class="mode-chip" data-fw="node">🟩 نود</button><button type="button" class="mode-chip" data-fw="html">📄 HTML</button></div>` : ''}
    </div>`).join('');
  const rows = builds.map(b => `
    <div class="mybuild" data-kind="${b.kind}" data-date="${b.createdAt || ''}">
      <div class="mb-info"><b>${esc(b.title)}</b>
        <small class="muted">${faDate(b.createdAt)} · قدرت ${Math.round((b.depth || 0.5) * 100)}٪${b.version ? ' · نسخه ' + fa(b.version) : ''}</small></div>
      <div class="mb-act">
        <a class="btn sm ghost" href="/preview/ai/${b.token}" target="_blank" rel="noopener">پیشنمایش</a>
        <a class="btn sm soft" href="/ai/download?token=${b.token}">دانلود ZIP</a>
        <a class="btn sm ghost" href="/apps/publish" title="انتشار و لینک عمومی">انتشار</a>
        <button type="button" class="btn sm ghost" data-var="${b.token}">نسخه متفاوت</button>
        <input class="input ltr" style="max-width:190px;padding:7px 10px" placeholder="ویرایش: مثلاً رنگ آبی کن" data-edit="${b.token}">
        <button type="button" class="btn sm" data-rw="${b.token}">اعمال ویرایش</button>
      </div>
    </div>`).join('') || '<p class="muted small">هنوز چیزی نساختهای — از بالای همین صفحه شروع کن ⬆</p>';

  const body = `
<div class="ai-hero"><div class="ai-hero-in">
  <div><span class="badge primary" style="font-size:.75rem">👑 اشتراک فعال ${plan.icon} ${plan.label}</span>
    <h2 style="margin:8px 0 6px">استودیوی پرو — هوش مصنوعی در خدمت تو</h2>
    <p class="muted">قدرت هوش مصنوعی تو: <b>${fa(power)}٪ از قدرت ادمین</b> (ادمین مافوق حرفهای = ۱۰۰٪) · ${fa(st.daysLeft)} روز مانده · موجودی: ${money(wal)} <a href="/account/wallet" style="color:var(--primary)">شارژ ←</a></p>
  </div>
</div></div>

<div class="studio-grid" style="grid-template-columns:1fr">
  <div class="card panel">
    <div class="sf-head"><div class="flex" style="gap:8px">${tabs}</div></div>
    ${panels}
    <div class="bt-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px;padding:10px 0">
      <span class="muted small">زمان ساخت:</span>
      <button type="button" class="mode-chip" data-bt="fast">سریع</button>
      <button type="button" class="mode-chip on" data-bt="standard">استاندارد</button>
      <button type="button" class="mode-chip" data-bt="deep">دقیق و کامل</button>
      <span class="muted small" style="font-size:.72rem">زمان بیشتر = هوش مصنوعی بخشهای بیشتری میسازد و کیفیت بالاتر میرود</span>
    </div>
    <div id="myEta" class="tier-note"></div>
    <button class="btn lg" id="proRun" style="width:100%;margin-top:12px">ساخت با هوش مصنوعی (${fa(power)}٪ قدرت)</button>
    <div id="proOut" style="margin-top:14px"></div>
  </div>
</div>

<section class="section" style="padding-top:6px">
  <div class="container">
    <div class="section-head"><h2>ساختههای من</h2><span class="sub"><span id="mbTotal">${fa(builds.length)}</span> خروجی</span><a class="muted small" href="/apps/publish">انتشار اپها ←</a></div>
    <div class="bt-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px">
      <span class="muted small">نوع:</span>
      <button type="button" class="mode-chip on" data-mbf="all">همه</button>
      <button type="button" class="mode-chip" data-mbf="template">قالب</button>
      <button type="button" class="mode-chip" data-mbf="plugin">افزونه</button>
      <button type="button" class="mode-chip" data-mbf="store">فروشگاه</button>
      <button type="button" class="mode-chip" data-mbf="app">اپ</button>
      <span class="muted small" style="margin-inline-start:8px">زمان ساخت:</span>
      <button type="button" class="mode-chip on" data-mbt="all">همه</button>
      <button type="button" class="mode-chip" data-mbt="week">هفته اخیر</button>
      <button type="button" class="mode-chip" data-mbt="month">ماه اخیر</button>
    </div>
    <div class="card-pad card" id="myBuilds" style="display:grid;gap:10px">${rows}</div>
  </div>
</section>

<script>
(function () {
  var csrf = (document.querySelector('meta[name=csrf]') || {}).content || '';
  var fwSel = 'woocommerce';
  document.querySelectorAll('#store-panel .mode-chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('#store-panel .mode-chip').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on'); fwSel = c.getAttribute('data-fw');
    });
  });
  function kindNow() { var t = document.querySelector('.sf-tab.on'); return t ? t.getAttribute('data-tab') : 'template'; }
  var btSel = 'standard';
  document.querySelectorAll('[data-bt]').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('[data-bt]').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on'); btSel = c.getAttribute('data-bt');
    });
  });
  // فیلتر درجای ساختهها (نوع + زمان ساخت) — همان رفتار فیلتر در کل سایت
  var mbKind = 'all', mbTime = 'all';
  function applyMbFilter() {
    var rows = document.querySelectorAll('#myBuilds .mybuild');
    var vis = 0, now = Date.now();
    rows.forEach(function (r) {
      var okK = mbKind === 'all' || r.getAttribute('data-kind') === mbKind;
      var d = new Date(r.getAttribute('data-date') || 0).getTime();
      var okT = mbTime === 'all' || (mbTime === 'week' && now - d < 7 * 864e5) || (mbTime === 'month' && now - d < 30 * 864e5);
      r.hidden = !(okK && okT);
      if (okK && okT) vis++;
    });
    var total = document.getElementById('mbTotal');
    if (total) total.textContent = vis;
  }
  document.querySelectorAll('[data-mbf]').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('[data-mbf]').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on'); mbKind = c.getAttribute('data-mbf'); applyMbFilter();
    });
  });
  document.querySelectorAll('[data-mbt]').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('[data-mbt]').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on'); mbTime = c.getAttribute('data-mbt'); applyMbFilter();
    });
  });
  function etaLine(d) { var e = document.getElementById('myEta'); if (e && d && d.eta) e.innerHTML = '⏱ زمان تخمینی ساخت: <b>' + d.eta + '</b>' + (d.strength ? ' · قدرت: <b>' + d.strength + '٪</b>' : ''); }
  function build(seed, token) {
    var kind = token ? document.querySelector('[data-build-kind]')?.getAttribute('data-build-kind') : kindNow();
    var prompt = token ? null : document.getElementById('p-' + kind).value;
    var mode = (kind === 'template' && !token) ? document.getElementById('m-template').value : '';
    var body = { kind: kind, prompt: prompt, seed: seed || 0, buildTime: btSel };
    if (mode) body.mode = mode;
    if (kind === 'store') body.fw = fwSel;
    var btn = document.getElementById('proRun'); btn.disabled = true; btn.textContent = 'در حال ساخت… (این ممکن است چند دقیقه طول بکشد)';
    fetch('/ai/build', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        btn.disabled = false; btn.textContent = 'ساخت با هوش مصنوعی (' + d.strength + '٪ قدرت)';
        if (!d.ok) { document.getElementById('proOut').innerHTML = '<div class="alert err">' + (d.error || 'خطا') + '</div>'; return; }
        etaLine(d);
        document.getElementById('proOut').innerHTML =
          '<div class="card card-pad" style="border-color:color-mix(in srgb,var(--primary) 30%,var(--border))">' +
          '<h3 style="margin-bottom:6px">ساخته شد: ' + d.name + '</h3>' +
          '<p class="muted small">نوع: ' + d.kind + ' · حجم: ' + d.sizeKB + 'KB · قدرت: ' + d.strength + '٪ · زمان: ' + d.eta + (d.varied ? ' · 🎲 نسخه متفاوت' : '') + '</p>' +
          '<div class="flex" style="gap:8px;margin-top:8px;flex-wrap:wrap">' +
          '<a class="btn sm" href="/preview/ai/' + d.token + '" target="_blank" rel="noopener">پیشنمایش زنده</a>' +
          '<a class="btn sm soft" href="/ai/download?token=' + d.token + '">دانلود ZIP</a>' +
          '<a class="btn sm ghost" href="/apps/publish">انتشار اپ</a>' +
          '<button type="button" class="btn sm ghost" data-v2="' + d.token + '">خروجی متفاوت</button>' +
          '<input class="input ltr" style="max-width:220px;padding:7px 10px" placeholder="مثلاً: رنگ اصلی آبی کن" id="rwIn">' +
          '<button type="button" class="btn sm" data-rw2="' + d.token + '">اعمال ویرایش</button></div>' +
          '<div class="small muted" id="rwNote" style="margin-top:8px"></div></div>';
        bindOutButtons();
      })
      .catch(function () { btn.disabled = false; btn.textContent = 'ساخت با هوش مصنوعی'; });
  }
  function rework(token, edit) {
    fetch('/ai/rework', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf }, body: JSON.stringify({ token: token, edit: edit }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var n = document.getElementById('rwNote');
        if (!d.ok) { if (n) n.textContent = d.error || 'خطا'; else alert(d.error || 'خطا'); return; }
        if (n) { n.innerHTML = '<b style="color:var(--ok)">✓ ساخته شد!</b> ' + (d.notes || []).join('، ') + ' — نسخه جدید: <a href="/preview/ai/' + d.token + '" target="_blank" style="color:var(--primary)">پیشنمایش</a> · <a href="/ai/download?token=' + d.token + '" style="color:var(--primary)">دانلود</a>'; }
        setTimeout(function () { location.reload(); }, 2500);
      });
  }
  function bindOutButtons() {
    document.querySelectorAll('[data-v2]').forEach(function (b) {
      if (!b.__b) { b.__b = 1; b.addEventListener('click', function () { build(parseInt(b.dataset.s || '0', 10) + 1 < 0 ? 0 : (parseInt(b.dataset.s || '0', 10) + 1), null); }); }
    });
    document.querySelectorAll('[data-rw2]').forEach(function (b) {
      if (!b.__b) { b.__b = 1; b.addEventListener('click', function () { var inp = document.getElementById('rwIn'); rework(b.getAttribute('data-rw2'), inp ? inp.value : ''); }); }
    });
  }
  function kindPanel(k) { return document.querySelector('.sf-panel[data-panel="' + k + '"]'); }
  document.querySelectorAll('.sf-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.sf-tab').forEach(function (x) { x.classList.remove('on'); });
      t.classList.add('on');
      document.querySelectorAll('.sf-panel').forEach(function (p) { p.classList.remove('on'); });
      kindPanel(t.getAttribute('data-tab')).classList.add('on');
    });
  });
  // پرش مستقیم به تب از ناوبری (مثلاً /ai#tab-plugin)
  (function () {
    var h = (location.hash || '').match(/^#tab-([a-z]+)/);
    if (!h) return;
    var target = document.querySelector('.sf-tab[data-tab="' + h[1] + '"]');
    if (target) target.click();
  })();
  document.getElementById('proRun').addEventListener('click', function () { build(0, null); });
  document.querySelectorAll('[data-var]').forEach(function (b) {
    b.addEventListener('click', function () { rework(b.getAttribute('data-var'), ''); });
  });
  document.querySelectorAll('[data-rw]').forEach(function (b) {
    b.addEventListener('click', function () {
      var token = b.getAttribute('data-rw');
      var inp = document.querySelector('[data-edit="' + token + '"]');
      rework(token, inp ? inp.value : '');
    });
  });
})();
</script>`;
  return page({ user, title: `استودیوی پرو | ${'اپتم'}`, desc: 'ساخت قالب، افزونه، فروشگاهساز و اپ اندروید با اشتراک پرو', url: baseUrl + '/ai', body, csrf });
}

// ═══════════ API: ساخت (کاربر پرو) ═══════════
export function apiUserBuild(req, res, { body, user }) {
  const st = proState(user);
  if (!st.active) return { json: { ok: false, error: 'اشتراک پرو فعال نیست — از صفحه استودیو اشتراک بخر' } };
  const db = getDb();
  const plan = planOf(db, st.plan.key) || { ...st.plan, ai: 50 };
  const tierKey = plan.key;
  // انتخاب زمان ساخت: سریع / استاندارد / دقیق (دقیق‌تر = بخش‌های بیشتر و زمان بیشتر)
  const BTMAP = { fast: { k: 'fast', d: -0.07 }, standard: { k: 'standard', d: 0 }, deep: { k: 'deep', d: 0.10 } };
  const bt = BTMAP[String(body.buildTime || 'standard')] || BTMAP.standard;
  const depth = Math.min(1, Math.max(0.08, strengthFor('pro', tierKey, plan) + bt.d));
  const kind = String(body.kind || 'template');
  if (!['template', 'plugin', 'store', 'app'].includes(kind)) return { json: { ok: false, error: 'نوع نامعتبر' } };
  const seed = Math.abs(parseInt(body.seed, 10) || 0);
  const prompt = cleanText(String(body.prompt || ''));
  if (prompt.length < 4) return { json: { ok: false, error: 'پرامپت خیلی کوتاه است — چند کلمه بیشتر بنویس' } };
  const eta = estimateBuild(kind, depth, seed);
  const token = randomToken(20);
  let spec, files, zipBuf, price = 0, name = '';
  try {
    if (kind === 'template') {
      spec = parsePrompt(prompt);
      if (body.mode && MODE_LABELS[body.mode]) spec.mode = body.mode;
      if (seed) spec = varySpec(spec, seed);
      const gen = generateFromSpec(spec, { styleInline: true, depth });
      insert('aiProducts', { token, kind, title: `قالب ${spec.brand}`, price, discount: 0, published: false, role: 'pro', userId: user.id, plan: tierKey, buildTime: bt.k, depth, seed, tier: tierKey, data: { spec, prompt, html: gen.home, full: { home: gen.home, about: gen.about, contact: gen.contact, style: gen.style } }, createdAt: new Date().toISOString() });
      return { json: { ok: true, kind, token, name: spec.brand, sizeKB: Math.round(gen.home.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), varied: !!seed, power: plan.ai } };
    }
    if (kind === 'plugin') {
      spec = parsePluginPrompt(prompt, tierKey);
      if (seed) spec = varySpec(spec, seed);
      const g = generatePlugin(spec, depth);
      zipBuf = makeZip(g.files);
      saveAiBuildFile(token, zipBuf);
      insert('aiProducts', { token, kind, title: `افزونه ${spec.name}`, price, discount: 0, published: false, role: 'pro', userId: user.id, plan: tierKey, buildTime: bt.k, depth, seed, tier: tierKey, data: { spec, prompt }, createdAt: new Date().toISOString() });
      return { json: { ok: true, kind, token, name: spec.name, sizeKB: Math.round(zipBuf.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), varied: !!seed, power: plan.ai } };
    }
    if (kind === 'store') {
      spec = parseStorePrompt(prompt, tierKey);
      if (body.fw) spec.framework = body.fw;
      if (seed) spec = varySpec(spec, seed);
      const g = generateStore(spec, depth);
      zipBuf = makeZip(g.files);
      saveAiBuildFile(token, zipBuf);
      insert('aiProducts', { token, kind, title: `فروشگاهساز ${spec.brand}`, price, discount: 0, published: false, role: 'pro', userId: user.id, plan: tierKey, buildTime: bt.k, depth, seed, tier: tierKey, data: { spec, prompt }, createdAt: new Date().toISOString() });
      return { json: { ok: true, kind, token, name: spec.brand, sizeKB: Math.round(zipBuf.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), varied: !!seed, power: plan.ai } };
    }
    spec = parsePrompt(prompt);
    if (seed) spec = varySpec(spec, seed);
    const g = generateApp(spec, tierKey, depth);
    zipBuf = makeZip(g.files);
    saveAiBuildFile(token, zipBuf);
    insert('aiProducts', { token, kind, title: `اپ اندروید ${spec.brand}`, price, discount: 0, published: false, role: 'pro', userId: user.id, plan: tierKey, buildTime: bt.k, depth, seed, tier: tierKey, data: { spec, prompt }, createdAt: new Date().toISOString() });
    return { json: { ok: true, kind, token, name: spec.brand, sizeKB: Math.round(zipBuf.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), varied: !!seed, power: plan.ai } };
  } catch (e) {
    return { json: { ok: false, error: 'خطا در ساخت: ' + e.message } };
  }
}

// ═══════════ API: ویرایش مجدد (کاربر پرو) ═══════════
export function apiUserRework(req, res, { body, user }) {
  const st = proState(user);
  if (!st.active) return { json: { ok: false, error: 'اشتراک پرو فعال نیست' } };
  const rec = findOne('aiProducts', x => x.token === String(body.token || ''));
  if (!rec || rec.role !== 'pro' || rec.userId !== user.id) return { json: { ok: false, error: 'پروژه پیدا نشد' } };
  const edit = String(body.edit || ''); // خالی = فقط خروجی متفاوت (واریاسیون)
  const depth = rec.depth || 0.5;
  const tierKey = rec.tier || st.plan.key;
  const token = randomToken(20);
  let spec1, notes;
  try { const r = applyEdit(rec.data?.spec || {}, edit); spec1 = r.spec; notes = r.notes; } catch (e) { return { json: { ok: false, error: 'متوجه دستور نشدم: ' + e.message } }; }
  const promptAll = (rec.data?.prompt || '') + ' — ویرایش: ' + edit;
  const eta = estimateBuild(rec.kind, depth);
  try {
    if (rec.kind === 'template') {
      const gen = generateFromSpec({ ...spec1, prompt: promptAll }, { styleInline: true, depth });
      insert('aiProducts', { token, kind: 'template', title: `قالب ${spec1.brand}`, price: 0, discount: 0, published: false, role: 'pro', userId: user.id, plan: tierKey, depth, seed: (rec.seed || 0) + 1, tier: tierKey, data: { spec: spec1, prompt: promptAll, html: gen.home, full: { home: gen.home, about: gen.about, contact: gen.contact, style: gen.style } }, parent: rec.token, version: (rec.version || 0) + 1, createdAt: new Date().toISOString() });
      rec.versions = [...(rec.versions || []), { token, edit: edit.slice(0, 80), at: new Date().toISOString() }];
      updateOne('aiProducts', x => x.token === rec.token, { versions: rec.versions });
      return { json: { ok: true, kind: 'template', token, name: spec1.brand, notes, eta: eta.label, previewable: true, strength: Math.round(depth * 100) } };
    }
    let files;
    if (rec.kind === 'plugin') files = generatePlugin({ ...spec1, prompt: promptAll }, depth).files;
    else if (rec.kind === 'store') files = generateStore({ ...spec1, prompt: promptAll }, depth).files;
    else files = generateApp({ ...spec1, prompt: promptAll }, tierKey, depth).files;
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    insert('aiProducts', { token, kind: rec.kind, title: `${rec.kind === 'app' ? 'اپ اندروید' : rec.kind === 'store' ? 'فروشگاهساز' : 'افزونه'} ${spec1.brand || spec1.name || ''}`, price: 0, discount: 0, published: false, role: 'pro', userId: user.id, plan: tierKey, depth, seed: (rec.seed || 0) + 1, tier: tierKey, data: { spec: spec1, prompt: promptAll }, parent: rec.token, version: (rec.version || 0) + 1, createdAt: new Date().toISOString() });
    rec.versions = [...(rec.versions || []), { token, edit: edit.slice(0, 80), at: new Date().toISOString() }];
    updateOne('aiProducts', x => x.token === rec.token, { versions: rec.versions });
    return { json: { ok: true, kind: rec.kind, token, name: spec1.brand || spec1.name || '', notes, eta: eta.label, previewable: true, strength: Math.round(depth * 100) } };
  } catch (e) {
    return { json: { ok: false, error: 'خطا در ویرایش: ' + e.message } };
  }
}

// ═══════════ API: خرید / تمدید اشتراک ═══════════
export function apiUserSubscribe(req, res, { body, user }) {
  const db = getDb();
  const plan = planOf(db, String(body.plan || ''));
  if (!plan || !plan.active) return { json: { ok: false, error: 'این پلن در دسترس نیست' } };
  const price = plan.price;
  const wal = balance(user.id);
  if (wal < price) return { json: { ok: false, error: `موجودی کیف پول کافی نیست (${money(wal)}) — از صفحه کیف پول شارژ کن` } };
  credit(user.id, -price, 'pro-sub', `اشتراک پرو ${plan.label} (${faNum(plan.days)} روز)`);
  const now = Date.now();
  const expiresAt = new Date(now + plan.days * 864e5).toISOString();
  updateOne('users', x => x.id === user.id, { pro: { key: plan.key, label: plan.label, icon: plan.icon, ai: plan.ai, days: plan.days, price, activatedAt: new Date().toISOString(), expiresAt } });
  notify(user.id, `🎉 اشتراک پرو «${plan.label}» فعال شد! ${faNum(plan.days)} روز دسترسی به استودیوی پرو داری — قدرت هوش مصنوعی: ${faNum(plan.ai)}٪ از ادمین.`);
  return { json: { ok: true, plan: plan.key, balance: balance(user.id), expiresAt } };
}
