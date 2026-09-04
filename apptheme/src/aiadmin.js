// ═══════════════════════════════════════════════════════════════
// «استودیوی هوش مصنوعی» ادمین — ۶ قابلیت با ۶ سطح (برنز→اپیک)
//  ۱) سایتساز از لینک  ۲) قالبساز هوشمند  ۳) افزونهساز
//  ۴) فروشگاهساز  ۵) تبدیل قالب (ZIP)  ۶) اپ اندروید
// ═══════════════════════════════════════════════════════════════
import { adminPage } from './render.js';
import { TIERS, tierOf, estimatePrice, detectTier, strengthFor, varySpec, applyEdit, estimateBuild, proPlansOf } from './gencore.js';
import { parsePluginPrompt, generatePlugin } from './plugingen.js';
import { parseStorePrompt, generateStore } from './storegen.js';
import { buildFromUrl } from './sitegen.js';
import { convertTemplate } from './converter.js';
import { makeZip } from './zip.js';
import { generateFromSpec, parsePrompt, SPEC_TYPE_LABELS, MODE_LABELS } from './promptgen.js';
import { esc, money, faNum, slugify } from './util.js';
import { analyzeIntelligence, enrichSpec } from './ai-intelligence.js';
const fa = faNum;
import { randomToken } from './security.js';
import fs from 'node:fs';
import path from 'node:path';

export function saveAiBuildFile(token, buf) {
  try { const dir = path.join(process.cwd(), 'data', 'ai-builds'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, token + '.zip'), buf); } catch (e) { console.error('saveAiBuildFile:', e.message); }
}
import { insert, findOne, updateOne, findMany, getDb, persist } from './db.js';

const TIER_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇', vip: '💎', legendary: '👑', epic: '🔥' };

// ═══════════ صفحهٔ استودیو ═══════════
export function aiStudioPage(req, res, { user }) {
  const tiersCards = TIERS.map(t => `
    <div class="tier-card" data-tier="${t.key}" data-level="${t.level}">
      <div class="tc-ic">${t.icon}</div>
      <div class="tc-name">${t.label} <small>سطح ${t.level}</small></div>
      <div class="tc-price">${money(t.base)} <small>تومان</small></div>
      <div class="tc-desc">${t.details}</div>
      <div class="tc-bars">${Array(6).fill(0).map((_, i) => `<i class="${i < t.level ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tc-feats">
        <span>📄 ${t.pages[0]}–${t.pages[1]} صفحه</span>
        <span>✨ ${t.effects} سطح افکت</span>
        <span>🧠 ${t.ai} قدرت هوش مصنوعی</span>
      </div>
    </div>`).join('');
  const body = `
<div class="ai-hero">
  <div class="ai-hero-in">
    <div><span class="badge primary" style="font-size:.75rem">⚡ نسخهٔ لجندری</span>
      <h2 style="margin:8px 0 6px">استودیوی هوش مصنوعی — هرچی بخواهی، میسازد 🪄</h2>
      <p class="muted">سطح را انتخاب کن (برنز → اپیک)؛ هرچه بالاتر، هوش مصنوعی بخشهای بیشتری میسازد: قالب، افزونه، فروشگاهساز، اپ اندروید حتی تبدیل قالب خام تو به نسخهٔ حرفهای.</p>
    </div>
  </div>
  <div class="tier-row" id="tierRow">${tiersCards}</div>
</div>
<div class="studio-grid">
  <div class="card panel" id="studioForm">
    <div class="sf-head"><div class="flex" style="gap:8px">
      <button type="button" class="sf-tab on" data-tab="link">سایت از لینک</button>
      <button type="button" class="sf-tab" data-tab="template">قالبساز</button>
      <button type="button" class="sf-tab" data-tab="plugin">افزونهساز</button>
      <button type="button" class="sf-tab" data-tab="store">فروشگاهساز</button>
      <button type="button" class="sf-tab" data-tab="convert">تبدیل قالب</button>
      <button type="button" class="sf-tab" data-tab="app">اپ اندروید</button>
    </div></div>
    <label class="sf-simple-line" title="پنهان کردن تنظیمات پیشرفته"><input type="checkbox" id="sfSimple"> 🧸 حالت ساده — فقط URL یا پرامپت را بنویس، بقیه خودکار میشود</label>

    <div class="sf-panel on" data-panel="link">
      <h3>🌐 سایتساز از لینک</h3>
      <p class="muted small">لینک سایت موردنظر (مثل دیجیکالا) را بده؛ هوش مصنوعی آن را تحلیل میکند و دقیقاً از ساختار، رنگها و ناوبریاش الهام میگیرد.</p>
      <div class="field"><label class="req">لینک سایت</label><input class="input ltr" id="sfUrl" dir="ltr" placeholder="https://www.digikala.com"></div>
      <div class="form-grid sf-adv">
        <div class="field"><label>نام برند (اختیاری)</label><input class="input" id="sfBrand" placeholder="مثلاً: فروشگاه من"></div>
        <div class="field"><label>توضیحات بیشتر</label><input class="input" id="sfUrlNote" placeholder="مثلاً: فقط بخش فروشگاه + نظرات"></div>
      </div>
    </div>

    <div class="sf-panel" data-panel="template">
      <h3>🪄 قالبساز کلاسیک</h3>
      <p class="muted small">پرامپت بنویس؛ ۸ سبک طراحی (نئون/گلاس/بروتال/لوکس/سایبر/اورورا/مینیمال/ادیتوریال) خودکار انتخاب یا دستی میشود.</p>
      <div class="field"><label class="req">پرامپت</label><textarea class="textarea" id="sfPrompt" style="min-height:90px" placeholder="مثلاً: سایت رستوران لوکس برند «شب طلایی» با منو، گالری و ساعات کاری"></textarea></div>
      <div class="form-grid sf-adv">
        <div class="field"><label>فریمورک خروجی</label><select class="select" id="sfFw"><option value="html">HTML/CSS خالص</option><option value="tailwind">Tailwind</option><option value="bootstrap">Bootstrap</option><option value="react">React</option><option value="vue">Vue 3</option></select></div>
        <div class="field"><label>قیمت فروش (تومان)</label><input class="input ltr" id="sfPrice" value="690000" dir="ltr"></div>
      </div>
    </div>

    <div class="sf-panel" data-panel="plugin">
      <h3>🧩 افزونهساز وردپرس/ووکامرس</h3>
      <p class="muted small">پرامپت بده؛ افزونهٔ کامل PHP میسازد + <b>فایل راهنمای Word با عکس مراحل نصب</b>.</p>
      <div class="field"><label class="req">پرامپت افزونه</label><textarea class="textarea" id="pfPrompt" style="min-height:80px" placeholder="مثلاً: افزونه «فرم تماس پرو» با فرم تماس و اعلان سفارش ووکامرس و کد تخفیف"></textarea></div>
    </div>

    <div class="sf-panel" data-panel="store">
      <h3>🏪 فروشگاهساز</h3>
      <p class="muted small">فروشگاه کامل برای هر پلتفرم: ووکامرس / وردپرس / جنگو / نود جیاس / HTML خالص — با راهنمای ورد.</p>
      <div class="field"><label class="req">پرامپت فروشگاه</label><textarea class="textarea" id="stPrompt" style="min-height:80px" placeholder="مثلاً: فروشگاه دیجیتال برند «تکشاپ» با پرداخت آنلاین و سبد خرید، ووکامرس"></textarea></div>
      <div class="gen-modes sf-adv" id="stFwRow" style="margin-top:10px">
        ${['woocommerce', 'wordpress', 'django', 'node', 'html'].map((f, i) => `<button type="button" class="mode-chip ${i === 0 ? 'on' : ''}" data-fw="${f}">${['🛒 ووکامرس', '📰 وردپرس', '🐍 جنگو', '🟩 نود جیاس', '📄 HTML'][i]}</button>`).join('')}
      </div>
    </div>

    <div class="sf-panel" data-panel="convert">
      <h3>📦 تبدیل قالب (از چیز به چیزی)</h3>
      <p class="muted small">فایل <b>ZIP</b> قالب قدیمیات را بده (RAR را قبلاً ZIP کن)؛ هوش مصنوعی تحلیل میکند و با سطح انتخابی، نسخهٔ حرفهایتر + راهنمای ورد تحویل میدهد.</p>
      <div class="field"><label class="req">فایل ZIP قالب</label><input class="input" type="file" id="cvFile" accept=".zip" style="padding:9px"></div>
      <div class="form-grid sf-adv">
        <div class="field"><label>خروجی برای</label><select class="select" id="cvTarget"><option value="html">HTML/CSS (پیشفرض)</option><option value="wordpress">وردپرس</option><option value="woocommerce">ووکامرس</option><option value="django">جنگو</option><option value="node">نود جیاس</option></select></div>
        <div class="field"><label>برند (اختیاری)</label><input class="input" id="cvBrand" placeholder="اگر خالی بود از خود قالب تشخیص میدهد"></div>
      </div>
    </div>

    <div class="sf-panel" data-panel="app">
      <h3>📱 اپ اندروید (PWA + سطحبندی)</h3>
      <p class="muted small">همان پرامپت را بده؛ با همان سطح، نسخهٔ اپ اندروید نصبشدنی (PWA) با راهنمای ورد ساخته میشود.</p>
      <div class="field"><label class="req">پرامپت اپ</label><textarea class="textarea" id="apPrompt" style="min-height:80px" placeholder="مثلاً: اپ فروشگاهی برند «شاپینو» با دوربین اسکن بارکد و اعلان تخفیف"></textarea></div>
    </div>

    <div id="sfTierNote" class="tier-note"></div>
    <div class="bt-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;padding:8px 2px">
      <span class="muted small">زمان ساخت:</span>
      <button type="button" class="mode-chip" data-bt="fast">سریع</button>
      <button type="button" class="mode-chip on" data-bt="standard">استاندارد</button>
      <button type="button" class="mode-chip" data-bt="deep">دقیق و کامل</button>
      <span class="muted small" style="font-size:.72rem">زمان بیشتر = جزئیات و بخشهای بیشتر</span>
    </div>
    <button class="btn lg" id="sfRun" style="width:100%;margin-top:12px">ساخت با هوش مصنوعی</button>
    <div id="sfResult" style="margin-top:14px"></div>
  </div>

  <div class="card panel sf-out-panel">
    <div class="between" style="margin-bottom:10px"><h3>👁 خروجی / دانلود</h3><div class="flex" id="sfOutActions" hidden>
      <button type="button" class="btn sm soft" id="sfPrevNew">تب جدید</button>
      <button type="button" class="btn sm ghost" id="sfDl">⬇️ ZIP</button>
    </div></div>
    <div id="sfOut" class="sf-out"><div class="gen-empty"><div style="font-size:2.6rem">🤖</div><p class="muted small">سطح را انتخاب کن و یک روش بساز؛ خروجی و قیمت اینجا میآید. (قیمت پیشنهادی را میتوانی با تیک تخفیف تغییر بدهی و منتشر کنی)</p></div></div>
    <div id="sfPublishZone" style="margin-top:14px"></div>
  </div>
</div>
<script src="/assets/js/aiadmin.js" defer></script>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'استودیوی هوش مصنوعی ⚡', active: 'ai-studio', body });
}

// ═══════════ API: تحلیل اولیه (قیمت + پیشنمایش) ═══════════
export function apiAiAnalyze(req, res, { body, session }) {
  const kind = String(body.kind || 'template');
  const tierKey = TIERS.some(t => t.key === body.tier) ? body.tier : (body.tier ? detectTier(String(body.tier)) : 'gold');
  const prompt = String(body.prompt || '').slice(0, 1600);
  const intelligence = analyzeIntelligence(prompt, kind, tierKey);
  let out;
  const base = tierOf(tierKey);
  const strength = Math.round(strengthFor('admin', tierKey) * 100);
  const eta = estimateBuild(kind, strengthFor('admin', tierKey));
  if (kind === 'plugin') {
    const spec = parsePluginPrompt(prompt, tierKey);
    const p = estimatePrice(tierKey, { sections: spec.features, prompt, dark: false });
    out = { label: `افزونه «${spec.name}»`, platform: spec.isWoocommerce ? 'ووکامرس' : 'وردپرس', features: spec.features, price: p.price };
  } else if (kind === 'store') {
    const spec = parseStorePrompt(prompt, tierKey);
    const p = estimatePrice(tierKey, spec);
    out = { label: `فروشگاه «${spec.brand}»`, platform: { woocommerce: 'ووکامرس', wordpress: 'وردپرس', django: 'جنگو', node: 'نود جیاس', html: 'HTML' }[spec.framework], features: [
      spec.needsPayment ? '💳 درگاه پرداخت' : '', spec.needsAuth ? '👤 ورود/ثبتنام' : '', '🛒 سبد خرید', '📦 پنل مدیریت'].filter(Boolean), price: p.price };
  } else if (kind === 'app') {
    const spec = parsePrompt(prompt);
    const p = estimatePrice(tierKey, spec);
    out = { label: `اپ «${spec.brand}»`, platform: 'اندروید (PWA/APK قابل نصب)', features: ['📱 نصب روی گوشی', '🔔 اعلان', '⚡ آفلاین', '📄 راهنمای ورد'], price: p.price };
  } else if (kind === 'convert') {
    out = { label: 'تبدیل قالب (ZIP)', platform: 'تحلیل خودکار', features: ['📦 خواندن ZIP', '🧠 تحلیل هوشمند', '🎨 ارتقای طراحی', '📄 راهنمای ورد'], price: base.base };
  } else {
    const spec = parsePrompt(prompt);
    const p = estimatePrice(tierKey, spec);
    out = { label: `قالب «${spec.brand}»`, platform: SPEC_TYPE_LABELS[spec.type], features: [`🎨 ${MODE_LABELS[spec.mode] || spec.mode}`, spec.dark ? '🌙 دارک' : '☀️ روشن', ...spec.sections.slice(0, 3)], price: p.price };
  }
  return { json: { ok: true, intelligence, tier: tierKey, tierInfo: { icon: TIER_ICONS[tierKey], label: base.label, level: base.level, pages: base.pages }, strength, eta: eta.label, out } };
}

// ═══════════ API: ساخت واقعی ═══════════
export function apiAiBuild(req, res, { body, session }) {
  const kind = String(body.kind || 'template');
  const tierKey = TIERS.some(t => t.key === body.tier) ? body.tier : 'gold';
  const token = randomToken(20);
  const BTMAP = { fast: { k: 'fast', d: -0.07 }, standard: { k: 'standard', d: 0 }, deep: { k: 'deep', d: 0.10 } };
  const bt = BTMAP[String(body.buildTime || 'standard')] || BTMAP.standard;
  const depth = Math.min(1, Math.max(0.08, strengthFor('admin', tierKey) + bt.d)); // ادمین: مافوق حرفهای
  const seed = Math.abs(parseInt(body.seed, 10) || 0);
  const eta = estimateBuild(kind, depth, seed);
  if (kind === 'link') {
    const url = String(body.url || '');
    if (!/^https?:\/\//i.test(url)) return { json: { ok: false, error: 'لینک معتبر بده (http/https)' } };
    return { json: { ok: true, kind, token, url, note: 'در حال تحلیل و ساخت… (برای سایتهای بکاپدار چند لحظه صبر کن)' } };
  }
  if (kind === 'plugin') {
    const intelligence = analyzeIntelligence(String(body.prompt || '').slice(0, 1600), kind, tierKey);
    let spec = parsePluginPrompt(String(body.prompt || '').slice(0, 1600), tierKey);
    if (seed) spec = varySpec(spec, seed);
    spec = enrichSpec(spec, intelligence);
    const { files } = generatePlugin(spec, depth);
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    const price = estimatePrice(tierKey, { sections: spec.features }).price;
    insert('aiProducts', { token, kind, title: `افزونه ${spec.name}`, price, discount: 0, published: false, depth, seed, tier: tierKey, data: { spec, prompt: body.prompt }, createdAt: new Date().toISOString() });
    return { json: { ok: true, kind, token, name: spec.name, sizeKB: Math.round(zipBuf.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), intelligence, varied: !!seed } };
  }
  if (kind === 'store') {
    const intelligence = analyzeIntelligence(String(body.prompt || '').slice(0, 1600), kind, tierKey);
    let spec = parseStorePrompt(String(body.prompt || '').slice(0, 1600), tierKey);
    if (body.fw) spec.framework = body.fw;
    if (seed) spec = varySpec(spec, seed);
    spec = enrichSpec(spec, intelligence);
    const { files, zipName } = generateStore(spec, depth);
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    const price = estimatePrice(tierKey, spec).price;
    insert('aiProducts', { token, kind, title: `فروشگاهساز ${spec.brand} (${spec.framework})`, price, discount: 0, published: false, depth, seed, tier: tierKey, data: { spec, prompt: body.prompt }, createdAt: new Date().toISOString() });
    return { json: { ok: true, kind, token, name: spec.brand, sizeKB: Math.round(zipBuf.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), intelligence, varied: !!seed } };
  }
  if (kind === 'app') {
    const intelligence = analyzeIntelligence(String(body.prompt || '').slice(0, 1600), kind, tierKey);
    let spec = enrichSpec(parsePrompt(String(body.prompt || '').slice(0, 1600)), intelligence);
    if (seed) spec = varySpec(spec, seed);
    const { files } = generateApp(spec, tierKey, depth);
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    const price = estimatePrice(tierKey, spec).price;
    insert('aiProducts', { token, kind, title: `اپ اندروید ${spec.brand}`, price, discount: 0, published: false, depth, seed, tier: tierKey, data: { spec, prompt: body.prompt }, createdAt: new Date().toISOString() });
    return { json: { ok: true, kind, token, name: spec.brand, sizeKB: Math.round(zipBuf.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), intelligence, varied: !!seed } };
  }
  if (kind === 'convert') {
    // مسیر جدا: آپلود فایل → analyze → build (در route جدا)
    return { json: { ok: false, error: 'تبدیل قالب باید با فایل انجام شود (دکمه ساخت را دوباره بزن)' } };
  }
  // قالبساز
  const prompt = String(body.prompt || '').slice(0, 1600);
  const intelligence = analyzeIntelligence(prompt, kind, tierKey);
  let spec = enrichSpec(parsePrompt(prompt), intelligence);
  if (body.mode && MODE_LABELS[body.mode]) spec.mode = body.mode;
  if (seed) spec = varySpec(spec, seed);
  const gen = generateFromSpec(spec, { styleInline: true, depth });
  const price = estimatePrice(tierKey, spec).price;
  insert('aiProducts', { token, kind: 'template', title: `قالب ${spec.brand}`, price, discount: 0, published: false, depth, seed, tier: tierKey, data: { spec, prompt, html: gen.home, full: { home: gen.home, about: gen.about, contact: gen.contact, style: gen.style } }, createdAt: new Date().toISOString() });
  return { json: { ok: true, kind: 'template', token, name: spec.brand, sizeKB: Math.round(gen.home.length / 1024), previewable: true, eta: eta.label, strength: Math.round(depth * 100), intelligence, varied: !!seed } };
}

// ═══════════ ویرایش مجدد خروجی (ادمین) ═══════════
export function apiAiRework(req, res, { body, session }) {
  const rec = findOne('aiProducts', x => x.token === String(body.token || ''));
  if (!rec) return { json: { ok: false, error: 'پروژه پیدا نشد' } };
  const edit = String(body.edit || '');
  const spec0 = rec.data?.spec || {};
  const { spec: spec1, notes } = applyEdit(spec0, edit);
  const depth = strengthFor('admin', rec.tier || 'gold');
  const tierKey = rec.tier || 'gold';
  const token = randomToken(20);
  const seedNew = (parseInt(rec.seed, 10) || 0) + 1;
  const eta = estimateBuild(rec.kind, depth, seedNew);
  let name = spec1.brand || spec1.name || 'نسخه جدید';
  if (rec.kind === 'plugin') {
    const spec = { ...spec1, prompt: (rec.data?.prompt || '') + ' — ویرایش: ' + edit };
    const { files } = generatePlugin(spec, depth);
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    insert('aiProducts', { token, kind: 'plugin', title: `افزونه ${spec.name}`, price: rec.price, discount: 0, published: false, depth, seed: seedNew, tier: tierKey, data: { spec, prompt: spec.prompt }, parent: rec.token, version: (rec.version || 0) + 1, userId: rec.userId || null, role: rec.role || 'admin', createdAt: new Date().toISOString() });
    name = spec.name;
    appendVersion(rec, token, edit);
    return { json: { ok: true, kind: 'plugin', token, name, notes, eta: eta.label, previewable: true } };
  }
  if (rec.kind === 'store') {
    const spec = { ...spec1, prompt: (rec.data?.prompt || '') + ' — ویرایش: ' + edit };
    const { files } = generateStore(spec, depth);
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    insert('aiProducts', { token, kind: 'store', title: `فروشگاهساز ${spec.brand}`, price: rec.price, discount: 0, published: false, depth, seed: seedNew, tier: tierKey, data: { spec, prompt: spec.prompt }, parent: rec.token, version: (rec.version || 0) + 1, userId: rec.userId || null, role: rec.role || 'admin', createdAt: new Date().toISOString() });
    name = spec.brand;
    appendVersion(rec, token, edit);
    return { json: { ok: true, kind: 'store', token, name, notes, eta: eta.label, previewable: true } };
  }
  if (rec.kind === 'app') {
    const spec = { ...spec1, prompt: (rec.data?.prompt || '') + ' — ویرایش: ' + edit };
    const { files } = generateApp(spec, tierKey, depth);
    const zipBuf = makeZip(files);
    saveAiBuildFile(token, zipBuf);
    insert('aiProducts', { token, kind: 'app', title: `اپ اندروید ${spec.brand}`, price: rec.price, discount: 0, published: false, depth, seed: seedNew, tier: tierKey, data: { spec, prompt: spec.prompt }, parent: rec.token, version: (rec.version || 0) + 1, userId: rec.userId || null, role: rec.role || 'admin', createdAt: new Date().toISOString() });
    name = spec.brand;
    appendVersion(rec, token, edit);
    return { json: { ok: true, kind: 'app', token, name, notes, eta: eta.label, previewable: true } };
  }
  // قالب
  const spec = { ...spec1, prompt: (rec.data?.prompt || '') + ' — ویرایش: ' + edit };
  const gen = generateFromSpec(spec, { styleInline: true, depth });
  insert('aiProducts', { token, kind: 'template', title: `قالب ${spec.brand}`, price: rec.price, discount: 0, published: false, depth, seed: seedNew, tier: tierKey, data: { spec, prompt: spec.prompt, html: gen.home, full: { home: gen.home, about: gen.about, contact: gen.contact, style: gen.style } }, parent: rec.token, version: (rec.version || 0) + 1, userId: rec.userId || null, role: rec.role || 'admin', createdAt: new Date().toISOString() });
  name = spec.brand;
  appendVersion(rec, token, edit);
  return { json: { ok: true, kind: 'template', token, name, notes, eta: eta.label, previewable: true } };
}

function appendVersion(rec, token, edit) {
  try { updateOne('aiProducts', x => x.token === rec.token, { versions: [...(rec.versions || []), { token, edit: String(edit || '').slice(0, 80), at: new Date().toISOString() }] }); } catch {}
}

// ═══════════ صفحه ادمین: پلنهای پرو ═══════════
export function aiProPage(req, res, { user }) {
  const plans = proPlansOf(getDb());
  const rows = plans.map(p => `
  <div class="plan-row" data-key="${p.key}">
    <div class="pr-name">${p.icon} ${p.label} <small class="muted">سطح ${TIERS.find(t => t.key === p.key)?.level || '-'}</small></div>
    <label class="field"><span>قیمت ماهانه (تومان)</span><input class="input ltr" data-f="price" type="number" value="${p.price}"></label>
    <label class="field"><span>درصد هوش مصنوعی (٪)</span><input class="input ltr" data-f="ai" type="number" min="4" max="50" value="${p.ai}"></label>
    <label class="field"><span>مدت (روز)</span><input class="input ltr" data-f="days" type="number" min="7" max="365" value="${p.days}"></label>
    <label class="check-line"><input data-f="active" type="checkbox" ${p.active ? 'checked' : ''}> فعال</label>
  </div>`).join('');
  const body = `
<div class="ai-hero"><div class="ai-hero-in">
  <div><span class="badge primary" style="font-size:.75rem">👥 اشتراک پرو کاربران</span>
    <h2 style="margin:8px 0 6px">پلنهای پرو — تنظیم از این صفحه</h2>
    <p class="muted">کاربران با خرید اشتراک، همان قالبساز/افزونهساز/فروشگاهساز/اپساز را دارند؛ اما قدرت هوش مصنوعیشان طبق درصد این صفحه است. <b>بهترین پلن پرو پیشفرض ۵۰٪ قدرت ادمین است</b> (ادمین ۱۰۰٪ مافوق حرفهای).</p>
  </div>
</div></div>
<div class="card panel" style="margin-top:14px;padding:18px">
  <div class="plan-head"><span>پلن</span><span>قیمت</span><span>قدرت AI</span><span>مدت</span><span>وضعیت</span></div>
  ${rows}
  <div class="between" style="margin-top:14px"><button class="btn" id="savePlans">💾 ذخیره پلنها</button><span class="hint" id="plansMsg"></span></div>
  <p class="muted small" style="margin-top:10px">📌 قدرت هر پلن را بین ۴٪ تا ۵۰٪ بگذار؛ صفر کردن درصد = پلن غیرفعال نمایش داده میشود ولی خرید آن خطا میگیرد. تغییرات بلافاصله روی صفحهٔ /ai کاربران اعمال میشود.</p>
</div>
<script>
document.getElementById('savePlans').addEventListener('click', function () {
  const plans = [];
  document.querySelectorAll('.plan-row').forEach(function (row) {
    plans.push({
      key: row.getAttribute('data-key'),
      price: parseInt(row.querySelector('[data-f=price]').value, 10) || 0,
      ai: parseInt(row.querySelector('[data-f=ai]').value, 10) || 0,
      days: parseInt(row.querySelector('[data-f=days]').value, 10) || 30,
      active: row.querySelector('[data-f=active]').checked,
    });
  });
  fetch('/admin/ai/proplans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plans: plans }) })
    .then(function (r) { return r.json(); })
    .then(function (d) { document.getElementById('plansMsg').textContent = d.ok ? '✓ ذخیره شد' : (d.error || 'خطا'); })
    .catch(function () { document.getElementById('plansMsg').textContent = 'خطا در ارتباط'; });
});
</script>`;
  return adminPage({ user, csrf: user.__csrf || '', title: 'پلنهای پرو 👥', active: 'ai-pro', body });
}

export function apiProPlansSave(req, res, { body }) {
  const db = getDb();
  const src = Array.isArray(body.plans) ? body.plans : [];
  const saved = { ...(db.settings?.proPlans || {}) };
  for (const p of src) {
    if (!p || typeof p.key !== 'string') continue;
    saved[p.key] = { price: Math.max(0, parseInt(p.price, 10) || 0), ai: Math.min(50, Math.max(0, parseInt(p.ai, 10) || 0)), days: Math.min(365, Math.max(7, parseInt(p.days, 10) || 30)), active: !!p.active };
  }
  db.settings = db.settings || {};
  db.settings.proPlans = saved;
  persist();
  return { json: { ok: true, plans: proPlansOf(db) } };
}

// ═══════════ اپ اندروید (PWA کامل + راهنما) ═══════════
import { makeDocx } from './docx.js';
export function generateApp(spec, tierKey = 'gold', depth = 1) {
  const tier = tierOf(tierKey);
  const [c1, c2, ac] = spec.palette;
  const manifest = JSON.stringify({
    name: spec.brand, short_name: spec.brand.slice(0, 12), start_url: './index.html', scope: './',
    display: 'standalone', orientation: 'portrait', dir: 'rtl', lang: 'fa',
    background_color: '#0c0f1e', theme_color: c1,
    icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }, null, 1);
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><text x="256" y="330" font-size="240" text-anchor="middle" fill="#fff">${spec.brand.trim().charAt(0)}</text></svg>`;
  const index = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${c1}"><link rel="manifest" href="manifest.json"><link rel="icon" href="icon.svg"><link rel="apple-touch-icon" href="icon.svg"><title>${spec.brand} — اپلیکیشن</title>
<style>${appCss(spec, tier, depth)}</style></head><body>
<header class="hdr"><div class="app-bar"><a class="lg">${spec.brand.trim().charAt(0)}</a><b>${spec.brand}</b><button id="installBtn" class="mini">⬇ نصب</button></div>
<nav class="tabs"><a class="on" data-v="home">🏠 خانه</a><a data-v="cats">🗂 دستهها</a>${depth >= 0.75 ? '<a data-v="offers">🎁 تخفیفها</a>' : ''}<a data-v="cart">🛒 سبد</a><a data-v="profile">👤 پروفایل</a></nav></header>
<main>
  <section class="view on" id="v-home">
    <div class="banner">🔥 تخفیفهای ${spec.brand} — تا ٪۵۰</div>
    <h3>پیشنهاد امروز</h3>
    <div class="grid">${Array(Math.max(4, Math.round(4 + 6 * depth))).fill(0).map((_, i) => `<div class="pcard"><div class="pi" style="background:linear-gradient(135deg,${c1}cc,${c2}cc)">${['🛍️','📱','⌚','🎧','👟','🧸','💻','📷','🔊','🧺','🕶️','🎮'][i % 12]}</div><b>${['محصول ${i+1}','گجت هوشمند','ساعت مچی','هدفون پرو','کتانی راحتی','عروسک فانتزی','لپتاپ سبک','دوربین دیجیتال','اسپیکر بلوتوثی','سبد چیدمان','عینک آفتابی','کنترل بازی'][i % 12]}</b><span>${(480000 + i * 130000).toLocaleString('fa-IR')} تومان</span><button class="add">افزودن +</button></div>`).join('')}</div>
  </section>
  <section class="view" id="v-cats"><h3>دستهبندیها</h3><div class="cats">${['📱 دیجیتال','👕 پوشاک','🏠 خانه','⚽ ورزشی','📚 کتاب','🧴 آرایشی'].map(c => `<div class="cat">${c}</div>`).join('')}</div></section>
  ${depth >= 0.75 ? `<section class="view" id="v-offers"><h3>🎁 تخفیفهای ویژه</h3><div class="grid">${['🔋 پاوربانک','🎧 هدفون نویزکنسلینگ','⌚ ساعت هوشمند','🧥 کاپشن پاییزه'].map((n, i) => `<div class="pcard"><div class="pi" style="background:linear-gradient(135deg,${ac}cc,${c1}cc)">${['🔋','🎧','⌚','🧥'][i]}</div><b>${n}</b><span>${(720000 + i * 210000).toLocaleString('fa-IR')} تومان</span><button class="add">افزودن +</button></div>`).join('')}</div></section>` : ''}
  <section class="view" id="v-cart"><h3>🛒 سبد خرید</h3><div class="cartbox empty">سبد شما خالی است — از خانه شروع کنید!</div><button class="buy">تسویه حساب 💳</button></section>
  <section class="view" id="v-profile"><h3>👤 حساب کاربری</h3><div class="prof"><div class="av">م</div><div><b>کاربر مهمان</b><br><small>برای تاریخچه سفارشها وارد شوید</small></div></div><button class="buy">ورود / ثبتنام</button></section>
</main>
<footer class="whatsnew">${tier.icon} ساختهشده با سطح ${tier.label} — ${tier.details}</footer>
<script>
const $ = s => document.querySelector(s);
document.querySelectorAll('.tabs a').forEach(a => a.addEventListener('click', () => {
  document.querySelectorAll('.tabs a').forEach(x => x.classList.toggle('on', x === a));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + a.dataset.v));
}));
document.querySelectorAll('.add').forEach(b => b.addEventListener('click', () => {
  const box = $('#v-cart .cartbox'); box.className = 'cartbox'; box.innerHTML = '✓ یک محصول اضافه شد — برای تسویه به سبد بروید';
  window.tlToast && window.tlToast('به سبد اضافه شد', 'ok');
}));
let deferred; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').disabled = false; });
$('#installBtn').addEventListener('click', async () => { if (deferred) { deferred.prompt(); } else alert('در اندروید: منوی مرورگر → افزودن به صفحه اصلی 📱'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
</script>
${tier.level >= 5 ? '<script src="toast.js"></script>' : ''}
</body></html>`;
  const sw = `const C='${spec.brand.replace(/\s+/g,'-')}-v1';\nself.addEventListener('install',e=>{self.skipWaiting()});\nself.addEventListener('activate',e=>{e.waitUntil(clients.claim())});\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{c.put(e.request,n.clone());return n}).catch(()=>c.match('./index.html')))));});`;
  const toastJs = `function tl(msg){const t=document.createElement('div');t.className='tl-t';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}window.tlToast=tl;`;
  const guide = makeDocx({
    title: `راهنمای اپلیکیشن ${spec.brand} (اندروید و آیفون)`,
    blocks: [
      { h1: `نصب و استفاده از اپ «${spec.brand}»` },
      { p: `سطح: ${tier.icon} ${tier.label} · پلتفرم: وباپ Progressive (PWA) — روی اندروید و آیفون نصب میشود.` },
      { h2: '۱) نصب در اندروید (کروم)' },
      { list: ['فایل را روی هاست آپلود کنید (یا همین پوشه را روی سرور بگذارید)', 'در گوشی، لینک سایت را در کروم باز کنید', 'دکمه «⬇ نصب» یا منوی ⋮ → افزودن به صفحه اصلی را بزنید', 'آیکن اپ روی صفحهٔ گوشی ظاهر میشود؛ مثل اپ واقعی باز میشود'] },
      { img: { kind: 'phone-app', cap: 'اپ نصبشده روی گوشی', step: 1 } },
      { h2: '۲) نصب در آیفون (سافاری)' },
      { list: ['سایت را در سافاری باز کنید', 'دکمه Share (مربع با فلش) را بزنید', 'Add to Home Screen را انتخاب کنید'] },
      { h2: '۳) شخصیسازی' },
      { list: [`رنگها: در index.html مقدار ${c1} و ${c2} را عوض کنید`, 'نام اپ: در manifest.json مقدار name', 'محصولات: بخش grid در کد index.html'] },
      { h2: '۴) انتشار در گوگل پلی (اختیاری)' },
      { p: 'با ابزارهای پلهای مثل PWABuilder یا فریمورک کوردووا/Capacitor میتوانید همین وباپ را به APK بستهبندی کنید. راهنمای دقیقتر در فایل README.md است.' },
    ],
  });
  return { files: [
    { name: 'index.html', data: index },
    { name: 'manifest.json', data: manifest },
    { name: 'icon.svg', data: iconSvg },
    { name: 'sw.js', data: sw },
    { name: 'preview.html', data: index },
    { name: 'toast.js', data: tier.level >= 5 ? toastJs : '// سطح پایینتر: بدون توست' },
    { name: 'README.md', data: `# اپ ${spec.brand}\n1. این پوشه را روی هاست (سرویس HTTPS) آپلود کن\n2. گوشی → کروم → باز کردن لینک → افزودن به صفحه اصلی\n3. بر اساس سطح ${tier.label}، امکانات: ${['پایه', 'ناوبری کامل', 'سبد خرید دمو', 'آفلاین', 'اعلان', 'همهچیز'][tier.level - 1]}` },
    { name: 'راهنمای اپ (Word).docx', data: guide },
  ], name: `${spec.brand.replace(/\s+/g, '-')}-app` };
}

function appCss(spec, tier, depth = 1) {
  const [c1, c2, ac] = spec.palette;
  return `
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;background:#f2f3f7;color:#1e2244;padding-bottom:70px}
.hdr{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid #eceef5}
.app-bar{display:flex;align-items:center;gap:10px;max-width:520px;margin:auto;padding:12px 14px}
.app-bar .lg{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,${c1},${c2});color:#fff;display:grid;place-items:center;font-weight:900}
.app-bar b{font-size:1rem}.app-bar .mini{margin-inline-start:auto;background:#fff;border:1.4px solid ${c1};color:${c1};border-radius:999px;padding:6px 14px;font:inherit;font-weight:700;cursor:pointer}
.tabs{display:flex;max-width:520px;margin:auto;gap:4px;padding:0 10px 10px}
.tabs a{flex:1;text-align:center;padding:9px 4px;border-radius:11px;font-size:.84rem;color:#5c6382;cursor:pointer}
.tabs a.on{background:${c1};color:#fff;box-shadow:0 8px 18px color-mix(in srgb,${c1} 40%,transparent)}
main{max-width:520px;margin:auto;padding:12px 14px}
.view{display:none}.view.on{display:block;animation:vi .3s ease}@keyframes vi{from{opacity:0;transform:translateY(10px)}}
.banner{background:linear-gradient(120deg,${c1},${c2});color:#fff;border-radius:16px;padding:26px 18px;font-weight:800;margin-bottom:14px}
h3{font-size:1.02rem;margin:12px 0 10px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pcard{background:#fff;border:1px solid #eceef5;border-radius:14px;padding:12px;text-align:center}
.pcard .pi{aspect-ratio:1.4;border-radius:10px;display:grid;place-items:center;font-size:2rem;margin-bottom:8px}
.pcard b{font-size:.85rem;display:block}.pcard span{color:${c1};font-weight:800;font-size:.85rem;display:block;margin:6px 0}.pcard .add{background:none;border:1.4px solid ${c1};color:${c1};border-radius:999px;padding:6px 18px;font:inherit;font-weight:700;cursor:pointer}
.cats{display:grid;gap:8px}.cat{background:#fff;border:1px solid #eceef5;border-radius:12px;padding:13px 16px;font-size:.92rem}
.cartbox{background:#fff;border:1px dashed #d9dce8;border-radius:14px;padding:22px;text-align:center;color:#5c6382;margin-bottom:12px}
.buy{width:100%;background:linear-gradient(135deg,${c1},${c2});color:#fff;border:0;border-radius:13px;padding:13px;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 10px 22px color-mix(in srgb,${c1} 35%,transparent)}
.prof{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #eceef5;border-radius:14px;padding:14px;margin-bottom:12px}
.prof .av{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,${c1},${c2});color:#fff;display:grid;place-items:center;font-weight:800}
.whatsnew{text-align:center;color:#9aa0b8;font-size:.72rem;padding:14px}
.tl-t{position:fixed;bottom:84px;inset-inline:auto;left:50%;transform:translateX(50%);background:#1e2244;color:#fff;padding:10px 20px;border-radius:999px;font-size:.82rem;z-index:99;animation:tp .3s}
@media(min-width:640px){.grid{grid-template-columns:1fr 1fr 1fr}}
.tabs a{min-height:44px;display:grid;place-items:center}.add{min-height:40px}
@media(max-width:400px){main{padding:10px}.pcard{padding:10px}.tabs a{font-size:.78rem}}
@media(prefers-reduced-motion:reduce){.view.on{animation:none}}`;
}

// ═══════════ دانلود فایلهای ساختهشده ═══════════
export function apiAiDownload(req, res, { query }) {
  const token = String(query.token || '');
  const rec = findOne('aiProducts', x => x.token === token);
  if (!rec) return { download: null, error: 'پروژه پیدا نشد' };
  const kind = rec.kind;
  let zipBuf;
  try {
    if (kind === 'template') {
      const { home, about, contact, style } = rec.data.full || {};
      zipBuf = makeZip([
        { name: 'index.html', data: home || '' },
        { name: 'about.html', data: about || '' },
        { name: 'contact.html', data: contact || '' },
        { name: 'css/style.css', data: style || '' },
        { name: 'README.md', data: `# ${rec.data.spec?.brand}\nقالب ${rec.data.spec?.mode} سطح ${rec.tier || 'gold'}\nراهنما: «راهنمای قالب (Word).docx»` },
      ]);
    } else if (kind === 'plugin') {
      const spec = rec.data?.spec && Object.keys(rec.data.spec).length ? { ...rec.data.spec, prompt: rec.data.prompt || '' } : parsePluginPrompt(rec.data.prompt || rec.title, rec.tier || 'gold');
      const { files } = generatePlugin(spec, rec.depth || 1);
      zipBuf = makeZip(files);
    } else if (kind === 'store') {
      const spec = rec.data?.spec && Object.keys(rec.data.spec).length ? { ...rec.data.spec, prompt: rec.data.prompt || '' } : parseStorePrompt(rec.data.prompt || 'فروشگاه', rec.tier || 'gold');
      const { files } = generateStore(spec, rec.depth || 1);
      zipBuf = makeZip(files);
    } else if (kind === 'app') {
      const spec = rec.data?.spec && Object.keys(rec.data.spec).length ? { ...rec.data.spec, prompt: rec.data.prompt || '' } : parsePrompt(rec.data.prompt || 'اپ');
      const { files } = generateApp(spec, rec.tier || 'gold', rec.depth || 1);
      zipBuf = makeZip(files);
    } else {
      return { download: null, error: 'نوع نامشخص' };
    }
  } catch (e) { return { download: null, error: 'خطا در ساخت: ' + e.message }; }
  return { download: { name: `ai-${kind}-${token.slice(0, 8)}.zip`, buf: zipBuf } };
}

// ═══════════ انتشار با تخفیف ═══════════
export function aiPublish(req, res, { body }) {
  const rec = findOne('aiProducts', x => x.token === String(body.token || ''));
  if (!rec) return { json: { ok: false, error: 'پروژه پیدا نشد; دوباره بسازید' } };
  const price = Math.max(0, parseInt(body.price, 10) || rec.price);
  const discountPct = Math.max(0, Math.min(90, parseInt(body.discount, 10) || 0));
  const salePrice = discountPct > 0 ? Math.round(price * (100 - discountPct) / 100 / 1000) * 1000 : null;
  const isPublished = body.published === 'on';
  const d = rec.data || {};
  const doc = {
    title: rec.title,
    slug: slugify((d.spec?.brand || 'ai') + '-' + rec.kind + '-' + rec.token.slice(0, 5)),
    description: `${rec.title} — تولیدشده توسط استودیوی هوش مصنوعی اپتم (${rec.kind === 'template' ? 'قالب' : rec.kind === 'plugin' ? 'افزونه' : rec.kind === 'store' ? 'فروشگاهساز' : 'اپ'})`,
    longDescription: `این محصول با هوش مصنوعی و بر اساس پرامپت «${(rec.data.prompt || '').slice(0, 180)}» ساخته شده است. شامل فایل راهنمای Word با تصاویر مراحل نصب.`,
    price, salePrice,
    categoryIds: [rec.kind === 'template' ? 4 : rec.kind === 'store' ? 1 : 3],
    frameworks: rec.kind === 'plugin' ? ['wordpress'] : rec.kind === 'store' ? ['html'] : ['react'],
    pages: 3, features: ['تولیدشده با هوش مصنوعی', 'فایل راهنمای Word با عکس', 'ریسپانسیو کامل', 'پشتیبانی'],
    tags: [rec.kind, d.spec?.brand || '', 'هوش مصنوعی'].filter(Boolean),
    palette: d.spec?.palette || ['#7c5cff', '#22d3ee'], accent: d.spec?.palette?.[2] || '#f472b6',
    published: isPublished, downloads: 0,
  };
  const product = insert('products', doc);
  updateOne('aiProducts', x => x.token === rec.token, { productId: product.id, price, salePrice, published: isPublished });
  return { json: { ok: true, id: product.id, slug: product.slug, published: isPublished, salePrice } };
}

// ═══════════ مدیریت انتشار اپ‌ها (ادمین) ═══════════
export function adminAppsPage(req, res, { user, baseUrl }) {
  const builds = findMany('aiProducts').sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const kindL = { template: 'قالب', plugin: 'افزونه', store: 'فروشگاه‌ساز', convert: 'تبدیل', link: 'از لینک', app: 'اپ اندروید' };
  const tierL = { bronze: 'برنز', silver: 'نقره', gold: 'طلا', vip: 'VIP', legendary: 'لجندری', epic: 'اپیک' };
  const dateF = t => { try { return new Date(t).toLocaleDateString('fa-IR'); } catch { return '-'; } };
  const rows = builds.map(b => {
    const owner = b.userId ? findOne('users', u => u.id === b.userId) : null;
    const pub = !!b.published;
    return `<tr data-ap="${esc(b.token)}" data-kind="${b.kind}" data-pub="${pub ? '1' : '0'}" data-date="${b.createdAt || ''}">
      <td><b>${esc((b.title || 'خروجی AI').slice(0, 48))}</b>${b.productId ? '<div class="muted small">فروشگاه: ' + esc(b.productId) + '</div>' : ''}</td>
      <td>${kindL[b.kind] || esc(b.kind)}</td>
      <td><span class="badge ${tierL[b.tier] ? 'primary' : 'soft'}">${tierL[b.tier] || esc(b.tier || '-')}</span></td>
      <td class="small">${owner ? esc(owner.name) : '<span class="muted">ادمین</span>'}</td>
      <td class="small">${dateF(b.createdAt)}</td>
      <td><span class="badge ${pub ? 'ok' : 'soft'}" data-pub-badge>${pub ? 'منتشرشده' : 'پیش‌نویس'}</span></td>
      <td>
        <div class="flex" style="gap:6px;flex-wrap:wrap">
          <button class="btn sm ${pub ? 'ghost' : ''}" type="button" data-toggle-pub="${esc(b.token)}">${pub ? 'توقف' : 'انتشار'}</button>
          <a class="btn sm ghost" href="/app/${esc(b.token)}" target="_blank" rel="noopener">صفحه عمومی</a>
          <a class="btn sm soft" href="/preview/ai/${esc(b.token)}" target="_blank" rel="noopener">پیش‌نمایش</a>
          <a class="btn sm ghost" href="/admin/ai/download?token=${esc(b.token)}">دانلود</a>
        </div>
      </td>
    </tr>`;
  }).join('');
  const body = `
<div class="admin-card" style="padding:22px">
  <div class="between flex-wrap" style="gap:12px;margin-bottom:16px">
    <div>
      <h2 style="margin:0">انتشار اپ‌ها و خروجی‌های هوش مصنوعی</h2>
      <p class="muted small" style="margin-top:6px">همهٔ خروجی‌های کاربران و ادمین؛ انتشار = فعال شدن صفحهٔ عمومی <code>/app/…</code> برای همه.</p>
    </div>
    <div class="flex" style="gap:8px">
      <span class="badge soft" id="afCount">${fa(builds.length)}</span> کل
      <span class="badge ok">${fa(builds.filter(b => b.published).length)} منتشرشده</span>
    </div>
  </div>
  <div class="bt-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 14px">
    <span class="muted small">نوع:</span>
    <button type="button" class="mode-chip on" data-fk="all">همه</button>
    <button type="button" class="mode-chip" data-fk="template">قالب</button>
    <button type="button" class="mode-chip" data-fk="plugin">افزونه</button>
    <button type="button" class="mode-chip" data-fk="store">فروشگاهساز</button>
    <button type="button" class="mode-chip" data-fk="app">اپ</button>
    <span class="muted small" style="margin-inline-start:8px">وضعیت:</span>
    <button type="button" class="mode-chip on" data-fp="all">همه</button>
    <button type="button" class="mode-chip" data-fp="1">منتشرشده</button>
    <button type="button" class="mode-chip" data-fp="0">پیشنویس</button>
    <span class="muted small" style="margin-inline-start:8px">زمان ساخت:</span>
    <button type="button" class="mode-chip on" data-ft="all">همه</button>
    <button type="button" class="mode-chip" data-ft="week">هفته اخیر</button>
    <button type="button" class="mode-chip" data-ft="month">ماه اخیر</button>
  </div>
  ${builds.length ? `<div class="table-wrap"><table class="tbl">
    <tr><th>عنوان</th><th>نوع</th><th>سطح</th><th>سازنده</th><th>تاریخ</th><th>وضعیت</th><th>عملیات</th></tr>
    ${rows}
  </table></div>` : '<div class="empty-state"><p>هنوز خروجی‌ای ساخته نشده است.</p></div>'}
</div>
<script>
(function () {
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
  var fk = 'all', fp = 'all', ft = 'all';
  function applyF() {
    var rows = document.querySelectorAll('tr[data-kind]');
    var vis = 0, now = Date.now();
    rows.forEach(function (r) {
      var okK = fk === 'all' || r.getAttribute('data-kind') === fk;
      var okP = fp === 'all' || r.getAttribute('data-pub') === fp;
      var d = new Date(r.getAttribute('data-date') || 0).getTime();
      var okT = ft === 'all' || (ft === 'week' && now - d < 7 * 864e5) || (ft === 'month' && now - d < 30 * 864e5);
      r.hidden = !(okK && okP && okT);
      if (okK && okP && okT) vis++;
    });
    var c = document.getElementById('afCount');
    if (c) c.textContent = vis;
  }
  [['data-fk', function (v) { fk = v; }], ['data-fp', function (v) { fp = v; }], ['data-ft', function (v) { ft = v; }]].forEach(function (pair) {
    document.querySelectorAll('[' + pair[0] + ']').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('[' + pair[0] + ']').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on'); pair[1](c.getAttribute(pair[0])); applyF();
      });
    });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-toggle-pub]');
    if (!b) return;
    if (b.dataset.busy) return;
    b.dataset.busy = '1';
    fetch('/admin/ai/toggle', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf, 'Accept': 'application/json' },
      body: JSON.stringify({ token: b.getAttribute('data-toggle-pub') })
    }).then(function (r) { return r.json(); }).then(function (d) {
      delete b.dataset.busy;
      if (!d.ok) { window.tlToast && tlToast(d.error || 'خطا', 'err', { title: 'انتشار اپ' }); return; }
      var row = b.closest('tr');
      var badge = row.querySelector('[data-pub-badge]');
      badge.textContent = d.published ? 'منتشرشده' : 'پیش‌نویس';
      badge.className = 'badge ' + (d.published ? 'ok' : 'soft');
      b.textContent = d.published ? 'توقف' : 'انتشار';
      b.classList.toggle('ghost', d.published);
      window.tlToast && tlToast(d.published ? 'اپ منتشر شد و صفحهٔ عمومی فعال است' : 'انتشار متوقف شد', d.published ? 'ok' : 'warn', { title: 'انتشار اپ' });
    }).catch(function () { delete b.dataset.busy; });
  });
})();
</script>`;
  return adminPage({ user, title: 'انتشار اپ‌ها', active: 'apps-pub', body });
}

export function apiAppToggle(req, res, { body, user }) {
  if (!user || user.role !== 'admin') return { json: { ok: false, error: 'دسترسی ندارید' } };
  const rec = findOne('aiProducts', x => x.token === String(body.token || ''));
  if (!rec) return { json: { ok: false, error: 'پروژه پیدا نشد' } };
  const pub = !rec.published;
  updateOne('aiProducts', x => x.token === rec.token, { published: pub, publishedAt: pub ? new Date().toISOString() : null });
  return { json: { ok: true, published: pub } };
}
