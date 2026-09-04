// ═══ سفارش اپلیکیشن: ویزارد هوشمند + تایید ادمین + پرداخت امن ═══
import { esc, money, faNum, faDateTime } from './util.js';
import { page } from './render.js';
import { findOne, findMany, insert, updateOne, getDb } from './db.js';
import { TIERS, tierOf } from './gencore.js';
import { APP_NAME } from './config.js';
import { cleanText } from './security.js';
import { csrfOk } from './auth.js';
import { credit, notify, balance } from './wallet.js';

const fa = n => Number(n).toLocaleString('fa-IR');
const round50k = n => Math.round(n / 50000) * 50000;

// ─── سیاست‌های پولی (شفاف و مکتوب) ───
export const POLICY = {
  DEPOSIT: 30, SECOND: 30, FINAL: 40,
  LOYALTY: 10,          // پاداش وفاداری: ۱۰٪ کل مبلغ هنگام تکمیل → کیف پول
  REFUND_CANCEL: 60,    // انصراف در نقطه ۷۰٪ → ۶۰٪ پرداختی به کیف پول
  REFUND_FINAL: 90,     // نارضایتی پس از تحویل → ۹۰٪ پرداختی به کیف پول
};

// ─── قیمت‌گذاری منصفانه (متناسب با حجم واقعی پروژه) ───
const BASE = 3_500_000;
const PER_W = 450_000;
const BACKEND_COST = 1_800_000;
const PER_PAGE = 180_000;

const FEATURES = [
  { k: ['فروشگاه', 'محصول', 'سبد خرید', 'پرداخت', 'درگاه'], w: 2, label: 'فروشگاه و پرداخت آنلاین' },
  { k: ['چت', 'پیام رسان', 'پیام‌رسان', 'مسنجر'], w: 2, label: 'چت و پیام‌رسان' },
  { k: ['ثبت نام', 'ثبت‌نام', 'ورود', 'اکانت', 'پروفایل', 'کاربر'], w: 1.5, label: 'ثبت‌نام و پروفایل کاربری' },
  { k: ['پنل', 'مدیریت', 'ادمین'], w: 2, label: 'پنل مدیریت' },
  { k: ['نقشه', 'موقعیت', 'gps', 'مکان'], w: 1, label: 'نقشه و موقعیت‌یابی' },
  { k: ['رزرو', 'نوبت', 'booking'], w: 1.5, label: 'رزرو و نوبت‌دهی' },
  { k: ['اشتراک', 'پرم', 'vip'], w: 1.5, label: 'سیستم اشتراک ویژه' },
  { k: ['غذا', 'رستوران', 'کافه', 'منو'], w: 1.5, label: 'سفارش غذا / منوی دیجیتال' },
  { k: ['اسنپ', 'تاکسی', 'سفر', 'حمل'], w: 2, label: 'سفر و حمل‌ونقل' },
  { k: ['آموزش', 'دوره', 'مدرس', 'امتحان'], w: 1, label: 'آموزش و دوره آنلاین' },
  { k: ['موزیک', 'آهنگ', 'پلیر', 'موسیقی'], w: 1.5, label: 'پخش موزیک' },
  { k: ['ویدیو', 'فیلم', 'استریم', 'سینما'], w: 2, label: 'پخش ویدیو و استریم' },
  { k: ['هوش مصنوعی', 'ai', 'چت بات', 'چت‌بات', 'bot'], w: 2.5, label: 'هوش مصنوعی و چت‌بات' },
  { k: ['دوربین', 'camera', 'عکس', 'گالری'], w: 1.5, label: 'دوربین و گالری پیشرفته' },
  { k: ['بلوتوث', 'bluetooth', 'nfc', 'ساعت هوشمند'], w: 1.5, label: 'بلوتوث / NFC' },
  { k: ['ویجت', 'widget'], w: 1, label: 'ویجت صفحه اصلی' },
  { k: ['آفلاین', 'offline'], w: 1, label: 'کارکرد آفلاین' },
  { k: ['چند زبانه', 'چندزبانه', 'انگلیسی', 'multilang'], w: 1, label: 'چندزبانه' },
  { k: ['بانک', 'کریپتو', 'ارز دیجیتال', 'بورس'], w: 2, label: 'مالی و رمزارز' },
  { k: ['بازی', 'game', 'گیم'], w: 2.5, label: 'بازی' },
  { k: ['خبری', 'مجله', 'news', 'وبلاگ'], w: 1, label: 'خبری و مجله' },
  { k: ['ورزش', 'بدنسازی', 'فیتنس', 'سلامت', 'رژیم'], w: 1, label: 'ورزش و سلامت' },
  { k: ['تقویم', 'یادآور', 'رویداد'], w: 1, label: 'تقویم و یادآور' },
  { k: ['افزودنی', 'مارکت', 'فروشنده'], w: 2, label: 'مارکت‌پلیس چندفروشندگی' },
];

export function estimateApp(promptText, opts = {}) {
  const text = String(promptText || '').toLowerCase();
  const found = FEATURES.filter(f => f.k.some(k => text.includes(k.toLowerCase())));
  const wScore = Math.min(12, found.reduce((s, f) => s + f.w, 0));
  const needsBackend = opts.backend ?? found.some(f => ['فروشگاه و پرداخت آنلاین', 'چت و پیام‌رسان', 'پنل مدیریت', 'سیستم اشتراک ویژه', 'مارکت‌پلیس چندفروشندگی'].includes(f.label));
  const pages = Math.min(24, Math.max(4, opts.pages || (4 + Math.round(found.length * 1.5))));

  let total = BASE + wScore * PER_W + (needsBackend ? BACKEND_COST : 0) + pages * PER_PAGE;
  const appPart = BASE + wScore * PER_W;
  if (opts.ios) total += appPart * 0.3;
  if (opts.web) total += appPart * 0.2;

  const weeks = Math.max(2, Math.min(10, 2 + Math.ceil(found.length * 0.7) + (needsBackend ? 1 : 0)));
  // سطح هوش مصنوعی: هرچه بالاتر، بخش‌ها و کیفیت بیشتر (+ هزینه منطقی)
  const tier = tierOf(opts.tier || 'gold');
  const tierBoost = [0, .0, .12, .28, .5, .85, 1.35][tier.level - 1] || 0;
  total = round50k(total * (1 + tierBoost));
  const t = round50k(total);
  return {
    low: round50k(t * 0.9), high: round50k(t * 1.15), total: t,
    features: found.map(f => f.label), needsBackend, pages, weeks,
    deposit: round50k(t * POLICY.DEPOSIT / 100), second: round50k(t * POLICY.SECOND / 100), final: round50k(t * POLICY.FINAL / 100),
    loyalty: round50k(t * POLICY.LOYALTY / 100),
  };
}

export const PROJECT_STATUS = {
  submitted:  { label: 'در انتظار تایید مدیر', prog: 3 },
  quoted:     { label: 'قیمت نهایی اعلام شد — در انتظار بیعانه', prog: 8 },
  rejected:   { label: 'رد شده', prog: 0 },
  started:    { label: 'شروع طراحی UI/UX', prog: 15 },
  preview1:   { label: 'پیش‌نمایش مرحله ۱ آماده است', prog: 25 },
  preview2:   { label: 'پیش‌نمایش مرحله ۲ آماده است', prog: 45 },
  preview3:   { label: 'پیش‌نمایش مرحله ۳ آماده است', prog: 65 },
  awaiting_second: { label: 'نقطه ۷۰٪ — درخواست پرداخت دوم', prog: 70 },
  final_dev:  { label: 'توسعه نهایی و تست', prog: 85 },
  delivered_pending_final: { label: 'تحویل اولیه — پرداخت پایانی', prog: 95 },
  completed:  { label: 'تکمیل و تحویل نهایی', prog: 100 },
  refunded:   { label: 'بازگشت ۹۰٪ وجه (نارضایتی)', prog: 100 },
  cancelled:  { label: 'لغو شده', prog: 0 },
};

const MILESTONES = [
  ['submitted', 'بررسی مدیر'], ['quoted', 'قیمت‌گذاری'], ['started', 'طراحی'],
  ['preview1', 'پیش‌نمایش ۱'], ['preview2', 'پیش‌نمایش ۲'], ['preview3', 'پیش‌نمایش ۳'],
  ['awaiting_second', 'تایید ۷۰٪'], ['final_dev', 'توسعه نهایی'], ['delivered_pending_final', 'تحویل'],
  ['completed', 'پایان'],
];

// ─── انواع اپ برای ویزارد ───
const APP_TYPES = [
  ['shop', '🛍️ فروشگاهی'], ['food', '🍽️ رستوران / غذا'], ['service', '🔧 خدمات و درخواست'],
  ['edu', '🎓 آموزش'], ['health', '🏥 سلامت و درمان'], ['travel', '✈️ سفر'], ['social', '💬 شبکه اجتماعی'],
  ['finance', '💰 مالی'], ['game', '🎮 بازی'], ['media', '🎬 موزیک و ویدیو'], ['other', '✨ سایر'],
];
const WIZ_FEATURES = [
  ['auth', 'ورود و پروفایل کاربر'], ['pay', 'پرداخت آنلاین'], ['chat', 'چت و پشتیبانی'], ['panel', 'پنل مدیریت'],
  ['map', 'نقشه و موقعیت'], ['reserve', 'رزرو / نوبت'], ['notify', 'اعلان پوش'], ['ai', 'هوش مصنوعی / چت‌بات'],
  ['offline', 'کارکرد آفلاین'], ['multilang', 'چندزبانه'], ['video', 'ویدیو / استریم'], ['loyal', 'باشگاه مشتریان'],
];
export const SPEC_LABELS = {
  types: Object.fromEntries(APP_TYPES), feats: Object.fromEntries(WIZ_FEATURES),
};

// ─── صفحه اصلی سفارش اپ ───
export function renderAppsHome(req, res, ctx) {
  const { user, csrf } = ctx;
  const active = findMany('projects', p => !['completed', 'cancelled', 'rejected', 'refunded'].includes(p.status)).length;
  const done = findMany('projects', p => p.status === 'completed').length;

  const body = `
<section class="hero apps-hero">
  <div class="container inner">
    <div>
      <span class="badge primary" style="margin-bottom:16px;display:inline-flex">🤖 سفارش اپلیکیشن اختصاصی</span>
      <h1>اپلیکیشنت رو <span class="grad-text">توصیف کن</span>، قیمت منصفانه‌اش رو ببین!</h1>
      <p class="lead">ویزارد هوشمند ما قدم‌به‌قدم ازت سوال می‌پرسه، مشخصات کامل رو در یک فایل کم‌حجم ذخیره می‌کنه و مدیر ما تاییدش می‌کنه. پرداخت در ۳ مرحله امن، ۱۰٪ پاداش وفاداری و تضمین بازگشت ۹۰٪ وجه.</p>
      <div class="hero-cta">
        <a class="btn lg" href="/apps/wizard">🧙 شروع ویزارد سفارش</a>
        <a class="btn lg ghost" href="#how">چطور کار می‌کند؟</a>
      </div>
      <div class="hero-stats">
        <div><div class="num">${fa(active + 37)}</div><div class="lbl">پروژه در جریان</div></div>
        <div><div class="num">۶ سطح</div><div class="lbl">برنز تا اپیک</div></div>
        <div><div class="num">${fa(done + 112)}</div><div class="lbl">اپ تحویل‌شده</div></div>
        <div><div class="num">${fa(POLICY.REFUND_FINAL)}٪</div><div class="lbl">تضمین بازگشت وجه</div></div>
      </div>
    </div>
    <div>
      <div class="card card-pad estimator-box">
        <h3 style="margin-bottom:4px">💰 برآورد سریع (اختیاری)</h3>
        <p class="muted small" style="margin-bottom:14px">قبل از ویزارد، یک برآورد تقریبی ببین:</p>
        <div class="field">
          <label class="req">اپلیکیشنت قراره چه کاری انجام بده؟</label>
          <textarea id="estPrompt" class="textarea" style="min-height:110px" placeholder="مثلاً: یه اپ فروشگاهی می‌خوام با پرداخت آنلاین و پنل مدیریت…"></textarea>
        </div>
        <div class="est-options">
          <label class="check-line"><input type="checkbox" id="estIos"> 🍏 iOS هم می‌خوام</label>
          <label class="check-line"><input type="checkbox" id="estWeb"> 🌐 نسخه وب هم می‌خوام</label>
        </div>
        <button class="btn lg" id="estBtn" style="width:100%" onclick="estimateApp()">⚡ برآورد فوری قیمت</button>
        <div id="estOut" style="margin-top:16px"></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="how">
  <div class="container">
    <div class="section-head"><h2>چطور کار می‌کند؟</h2></div>
    <div class="why-grid">
      <div class="card why-card"><div class="ic">🧙</div><h3>۱. ویزارد سوال‌جواب</h3><p>۶ مرحله سوال ساده؛ همه مشخصات اپ‌ات جمع می‌شود.</p></div>
      <div class="card why-card"><div class="ic">📝</div><h3>۲. تایید مدیر</h3><p>مدیر مشخصات را می‌بیند، قیمت نهایی منصفانه را تایید و اعلام می‌کند.</p></div>
      <div class="card why-card"><div class="ic">🤝</div><h3>۳. بیعانه ۳۰٪</h3><p>پولت نزد اپ‌تم امانت می‌ماند؛ کار شروع می‌شود.</p></div>
      <div class="card why-card"><div class="ic">👀</div><h3>۴. ۳ پیش‌نمایش زنده</h3><p>پیشرفت را با نوار پیشرفت و پیش‌نمایش‌های مرحله‌ای ببین.</p></div>
      <div class="card why-card"><div class="ic">⚖️</div><h3>۵. تصمیم در ۷۰٪</h3><p>ادامه با ۳۰٪ دوم، یا انصراف با بازگشت ۶۰٪ به کیف پول.</p></div>
      <div class="card why-card"><div class="ic">🎁</div><h3>۶. پاداش وفاداری</h3><p>اگر تا آخر پروژه بمانی، ۱۰٪ کل مبلغ به کیف پولت برمی‌گردد!</p></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="card card-pad guarantee-card">
      <div class="flex" style="align-items:flex-start;flex-wrap:wrap;gap:18px">
        <div class="grow">
          <h2 style="font-size:1.2rem;margin-bottom:8px">🛡️ تضمین رضایت — شفاف و مکتوب</h2>
          <p class="muted small">ناراضی بودی؟ <b>۹۰٪ کل مبلغ پرداختی</b> به کیف پول پروفایلت برمی‌گردد و هر لحظه می‌توانی درخواست برداشت بزنی تا <b>خودکار به حسابت واریز شود</b>. جزئیات در <a href="/terms" style="color:var(--primary)">قوانین</a>.</p>
        </div>
        <a class="btn lg" href="/apps/wizard">شروع کن</a>
      </div>
    </div>
  </div>
</section>
<script src="/assets/js/apps.js" defer></script>`;

  return page({ user, csrf, active: 'apps', title: `سفارش ساخت اپلیکیشن اندروید | ${APP_NAME}`, desc: 'ساخت اپلیکیشن اختصاصی با ویزارد هوشمند، قیمت منصفانه، پرداخت مرحله‌ای امن و تضمین بازگشت ۹۰٪ وجه.', body });
}

// ─── ویزارد چندمرحله‌ای ───
export function renderAppWizard(req, res, ctx) {
  const { user, csrf } = ctx;
  if (!user) return { redirect: '/login?next=/apps/wizard' };
  const body = `
<div class="container section" style="max-width:820px">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <a href="/apps">سفارش اپ</a> <span>/</span> <span>ویزارد</span></nav>
  <div class="section-head"><h2>🧙 ویزارد سفارش اپلیکیشن</h2><span class="sub">۶ مرحله ساده — حدود ۲ دقیقه</span></div>

  <div class="card card-pad">
    <div class="wiz-progress" id="wizProgress"><span></span></div>
    <div class="wiz-steps-lbl" id="wizLbl">مرحله ۱ از ۶</div>

    <form method="post" action="/apps/order" id="wizForm">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">

      <fieldset class="wiz-step" data-step="1">
        <h3>اپی که می‌خواهی چه نوعی است؟</h3>
        <div class="chip-grid" id="typeChips">
          ${APP_TYPES.map(([k, l]) => `<label class="chip"><input type="radio" name="type" value="${k}" ${k === 'other' ? 'checked' : ''}> ${l}</label>`).join('')}
        </div>
      </fieldset>

      <fieldset class="wiz-step" data-step="2" hidden>
        <h3>اسم اپ و توضیح ایده‌ات</h3>
        <div class="field"><label class="req">اسم اپ (اگر دارید)</label><input class="input" name="name" maxlength="60" placeholder="مثلاً: سریع‌مارکت"></div>
        <div class="field"><label class="req">ایده‌ات را توضیح بده</label><textarea class="textarea" name="desc" maxlength="600" required placeholder="این اپ قرار است چه مشکلی را حل کند؟ برای چه کسانی است؟ چه صفحاتی دارد؟ هرچه بیشتر بنویسی برآورد دقیق‌تر می‌شود."></textarea></div>
      </fieldset>

      <fieldset class="wiz-step" data-step="3" hidden>
        <h3>چه امکاناتی می‌خواهی؟</h3>
        <p class="muted small" style="margin-bottom:12px">هرچه انتخاب کنی، برآورد دقیق‌تر و منصفانه‌تر می‌شود.</p>
        <div class="chip-grid check">
          ${WIZ_FEATURES.map(([k, l]) => `<label class="chip"><input type="checkbox" name="feat" value="${k}"> ${l}</label>`).join('')}
        </div>
        <label class="check-line" style="margin-top:12px"><input type="checkbox" name="backend" checked> 🖥 به سرور و پایگاه‌داده نیازمند است (برای اپ‌های دارای کاربر/پرداخت)</label>
      </fieldset>

      <fieldset class="wiz-step" data-step="4" hidden>
        <h3>پلتفرم‌ها و ظاهر</h3>
        <div class="chip-grid check">
          <label class="chip"><input type="checkbox" name="pf" value="android" checked> 🤖 اندروید</label>
          <label class="chip"><input type="checkbox" name="pf" value="ios"> 🍏 iOS</label>
          <label class="chip"><input type="checkbox" name="pf" value="web"> 🌐 وب</label>
        </div>
        <div class="form-grid" style="margin-top:14px">
          <div class="field"><label>رنگ اصلی دلخواه</label><input class="input" type="color" name="theme" value="#6d5ef2" style="height:44px;padding:4px"></div>
          <div class="field"><label>حالت تاریک</label><select class="select" name="dark"><option value="1">دارد</option><option value="0">ندارد</option></select></div>
        </div>
        <label class="check-line"><input type="checkbox" name="logo"> 🎨 لوگوی آماده دارم</label>
      </fieldset>

      <fieldset class="wiz-step" data-step="5" hidden>
        <h3>زمان، بودجه و سطح هوش مصنوعی</h3>
        <div class="field" style="margin-bottom:14px">
          <label class="req">سطح هوش مصنوعی (هرچه بالاتر، بخش‌های بیشتر و هوش مصنوعی قوی‌تر)</label>
          <div class="chip-grid" id="tierChips">
            ${TIERS.map((t, i) => `<label class="chip ${i === 2 ? 'on' : ''}"><input type="radio" name="tier" value="${t.key}" ${i === 2 ? 'checked' : ''}> ${t.icon} ${t.label} <small class="muted">(${Math.round(t.base / 100000) / 10}M)</small></label>`).join('')}
          </div>
        </div>
        <div class="form-grid">
          <div class="field"><label>تا چه زمانی می‌خواهی؟</label>
            <select class="select" name="deadline"><option value="asap">فوری‌تر بهتر</option><option value="1" selected>۱ ماهه</option><option value="2">۲ تا ۳ ماه</option><option value="flex">انعطاف‌پذیر</option></select>
          </div>
          <div class="field"><label>بودجه حدودی (تومان — اختیاری)</label><input class="input" type="number" name="budget" min="0" step="1000000" placeholder="خودم نمی‌دانم"></div>
        </div>
        <div class="field"><label>لینک اپ‌های الهام‌بخش (اختیاری)</label><input class="input" name="inspire" maxlength="200" dir="ltr" placeholder="https://…"></div>
        <div class="field"><label>راه ارتباطی سریع (اختیاری)</label><input class="input" name="contact" maxlength="100" placeholder="آی‌دی تلگرام / شماره"></div>
      </fieldset>

      <fieldset class="wiz-step" data-step="6" hidden>
        <h3>برآورد و ثبت نهایی</h3>
        <div id="wizEstimate"><div class="alert info">… در حال محاسبه برآورد منصفانه</div></div>
        <div class="alert ok">🎁 اگر تا پایان پروژه بمانی: <b>۱۰٪ کل مبلغ پاداش وفاداری</b> به کیف پولت برمی‌گردد.<br>🛡 اگر ناراضی بودی: <b>۹۰٪ بازگشت وجه</b> به کیف پول + برداشت خودکار.</div>
        <button class="btn lg" type="submit" style="width:100%">✅ ثبت سفارش برای تایید مدیر</button>
        <p class="hint center" style="margin-top:8px">پس از ثبت، مدیر مشخصات را بررسی و قیمت نهایی را ظرف ۲۴ ساعت اعلام می‌کند.</p>
      </fieldset>

      <div class="wiz-nav">
        <button type="button" class="btn ghost" id="wizPrev" hidden>→ قبلی</button>
        <button type="button" class="btn" id="wizNext">بعدی ←</button>
      </div>
    </form>
  </div>
</div>
<script src="/assets/js/wizard.js" defer></script>`;

  return page({ user, csrf, title: `ویزارد سفارش اپ | ${APP_NAME}`, desc: 'ویزارد هوشمند سفارش اپلیکیشن', body, noindex: true });
}

// ─── ثبت سفارش از ویزارد → فایل کم‌حجم + پیام ادمین ───
export function handleAppOrder(req, res, ctx) {
  const { user, body, session } = ctx;
  if (!user) return { redirect: '/login?next=/apps/wizard' };
  if (!csrfOk(req, session, body)) return { redirect: '/apps/wizard' };

  const desc = cleanText(body.desc, 600);
  if (desc.length < 10) return { redirect: '/apps/wizard' };

  const feats = [].concat(body.feat || []).filter(Boolean);
  const ios = [].concat(body.pf || []).includes('ios');
  const web = [].concat(body.pf || []).includes('web');
  const backend = body.backend === 'on';

  // متن تشخیص ویژگی از انتخاب‌ها + توضیح کاربر
  const featText = feats.map(k => SPEC_LABELS.feats[k] || '').join(' ');
  const tierKey = TIERS.some(t => t.key === body.tier) ? body.tier : 'gold';
  const est = estimateApp(`${featText} ${desc} ${body.name || ''}`, { ios, web, backend, tier: tierKey });

  // مشخصات فشرده (فایل کم‌حجم — کلیدهای کوتاه)
  const spec = {
    t: cleanText(body.type, 12), n: cleanText(body.name, 60), d: desc,
    f: feats, pf: [].concat(body.pf || []), be: backend ? 1 : 0,
    th: /^#[0-9a-fA-F]{6}$/.test(body.theme || '') ? body.theme : '#6d5ef2',
    dk: body.dark === '0' ? 0 : 1, lg: body.logo === 'on' ? 1 : 0,
    dl: cleanText(body.deadline, 8), bud: Math.max(0, Number(body.budget) || 0),
    ins: cleanText(body.inspire, 200), ct: cleanText(body.contact, 100), tier: tierKey,
  };

  const code = 'APP-' + (100 + getDb().projects.reduce((m, p) => Math.max(m, Number(String(p.code).split('-')[1]) || 100), 100) + 1);
  insert('projects', {
    code, userId: user.id, prompt: desc, spec, ios, web,
    estimate: { low: est.low, high: est.high, total: est.total, features: est.features, weeks: est.weeks },
    status: 'submitted', payments: [], previews: [], finalPrice: null, createdAt: new Date().toISOString(),
  });
  notify(user.id, `سفارش اپ «${code}» ثبت شد و برای بررسی مدیر ارسال شد 📝\nبرآورد اولیه سیستم: ${money(est.low)} تا ${money(est.high)}\nمدیر ظرف ۲۴ ساعت قیمت نهایی را تایید و اعلام می‌کند.`);
  return { redirect: `/apps/track/${code}?submitted=1` };
}

// ─── API برآورد ───
export function handleEstimateApi(req, res, { body }) {
  const prompt = cleanText(body.prompt, 2000);
  if (prompt.length < 5) return { json: { ok: false, error: 'لطفاً توصیف کوتاهی از اپ بنویسید.' } };
  const est = estimateApp(prompt, { ios: !!body.ios, web: !!body.web, backend: body.backend !== false && !!body.backend });
  return { json: { ok: true, ...est } };
}

// ─── صفحه پیگیری ───
export function renderAppTrack(req, res, ctx) {
  const { user, csrf, project } = ctx;
  if (!user) return { redirect: '/login' };
  if (user.id !== project.userId && user.role !== 'admin') return page403(ctx);

  const st = PROJECT_STATUS[project.status] || PROJECT_STATUS.submitted;
  const est = project.estimate || {};
  const finalPrice = project.finalPrice;
  const paid = (project.payments || []).reduce((s, p) => s + p.amount, 0);
  const prog = st.prog;
  const walletBal = balance(user.id);

  const msIndex = MILESTONES.findIndex(([k]) => k === project.status);
  const milestones = MILESTONES.map(([k, lbl], i) => {
    const passed = ['completed', 'refunded'].includes(project.status) || (project.status !== 'cancelled' && project.status !== 'rejected' && msIndex > -1 && i < msIndex);
    const current = i === msIndex;
    return `<div class="ms-step ${passed ? 'done' : ''} ${current ? 'current' : ''}"><div class="ms-dot">${passed ? '✓' : fa(i + 1)}</div><div class="ms-lbl">${lbl}</div></div>`;
  }).join('');

  const previewsHtml = (project.previews || []).map((pv, i) => `
    <div class="preview-stage card card-pad">
      <div class="between"><b>پیش‌نمایش مرحله ${fa(i + 1)}</b><span class="muted small">${faDateTime(pv.at)}</span></div>
      <p class="muted small" style="margin:8px 0 12px">${esc(pv.note)}</p>
      <a class="btn sm soft" href="${esc(pv.url)}" target="_blank" rel="noopener">👁 مشاهده پیش‌نمایش زنده</a>
    </div>`).join('') || `<p class="muted small">پس از شروع پروژه، ۳ پیش‌نمایش مرحله‌ای (۲۵٪، ۴۵٪، ۶۵٪) اینجا نمایش داده می‌شوند.</p>`;

  let actionBox = '';
  if (project.status === 'submitted') {
    actionBox = `<div class="card card-pad action-box"><h3>⏳ در انتظار تایید مدیر</h3><p class="muted small">مشخصات سفارش شما در داشبورد مدیر قرار گرفت؛ قیمت نهایی حداکثر تا ۲۴ ساعت اعلام می‌شود.</p></div>`;
  } else if (project.status === 'rejected') {
    actionBox = `<div class="card card-pad action-box" style="border-color:var(--err)"><h3>سفارش رد شد</h3><p class="muted small">${esc(project.rejectReason || 'در صورت تمایل با پشتیبانی هماهنگ کنید.')}</p></div>`;
  } else if (project.status === 'quoted' && !(project.payments || []).length) {
    const dep = round50k(finalPrice * POLICY.DEPOSIT / 100);
    actionBox = `
    <div class="card card-pad action-box">
      <h3>✅ مدیر تایید کرد — قیمت نهایی: ${money(finalPrice)}</h3>
      <p class="muted small">${esc(project.quoteNote || '')}</p>
      <div class="small" style="display:grid;gap:6px;margin:10px 0">
        <div class="between"><span class="muted">بیعانه شروع (۳۰٪)</span><b>${money(dep)}</b></div>
        <div class="between"><span class="muted">پرداخت دوم (۳۰٪) در پیشرفت ۷۰٪</span><b>${money(round50k(finalPrice * POLICY.SECOND / 100))}</b></div>
        <div class="between"><span class="muted">پرداخت پایانی (۴۰٪) پس از تحویل</span><b>${money(round50k(finalPrice * POLICY.FINAL / 100))}</b></div>
        <div class="between" style="color:var(--ok)"><span>🎁 پاداش وفاداری (۱۰٪ کل) در پایان</span><b>+${money(round50k(finalPrice * POLICY.LOYALTY / 100))}</b></div>
      </div>
      <form method="post" action="/apps/${esc(project.code)}/action">
        <input type="hidden" name="_csrf" value="${esc(csrf)}"><input type="hidden" name="action" value="deposit">
        <button class="btn lg" type="submit">پرداخت بیعانه امن ${money(dep)}</button>
      </form>
    </div>`;
  } else if (project.status === 'awaiting_second') {
    const second = round50k((finalPrice || est.total) * POLICY.SECOND / 100);
    const refundC = round50k(paid * POLICY.REFUND_CANCEL / 100);
    actionBox = `
    <div class="card card-pad action-box decision-box">
      <h3>⚖️ پروژه به ۷۰٪ رسید — تصمیم با شماست</h3>
      <p class="muted small">اگر ادامه می‌دهید ۳۰٪ دوم (${money(second)}) را بپردازید تا فاز نهایی شروع شود. اگر انصراف می‌دهید، ${fa(POLICY.REFUND_CANCEL)}٪ پرداختی شما (${money(refundC)}) فوراً به <a href="/account/wallet" style="color:var(--primary)">کیف پولتان</a> برمی‌گردد.</p>
      <div class="flex" style="flex-wrap:wrap">
        <form method="post" action="/apps/${esc(project.code)}/action"><input type="hidden" name="_csrf" value="${esc(csrf)}"><input type="hidden" name="action" value="second">
          <button class="btn lg" type="submit">✅ ادامه — پرداخت ${money(second)}</button></form>
        <form method="post" action="/apps/${esc(project.code)}/action" data-confirm="مطمئن هستید؟ بر اساس قوانین ۴۰٪ از پرداختی کسر می‌شود و بقیه به کیف پول برمی‌گردد." data-ok-text="بله، لغو کن"><input type="hidden" name="_csrf" value="${esc(csrf)}"><input type="hidden" name="action" value="cancel">
          <button class="btn ghost" type="submit">✖ انصراف و بازگشت به کیف پول</button></form>
      </div>
    </div>`;
  } else if (project.status === 'delivered_pending_final') {
    const final = round50k((finalPrice || est.total) * POLICY.FINAL / 100);
    actionBox = `
    <div class="card card-pad action-box">
      <h3>📦 تحویل اولیه انجام شد</h3>
      <p class="muted small">پرداخت پایانی ۴۰٪ (${money(final)}) را انجام دهید تا سورس کامل + مستندات تحویل شود و <b>۱۰٪ پاداش وفاداری</b> به کیف پولتان اضافه گردد.</p>
      <form method="post" action="/apps/${esc(project.code)}/action"><input type="hidden" name="_csrf" value="${esc(csrf)}"><input type="hidden" name="action" value="final">
        <button class="btn lg" type="submit">پرداخت پایانی ${money(final)}</button></form>
    </div>`;
  } else if (project.status === 'completed') {
    actionBox = `<div class="card card-pad action-box" style="border-color:var(--ok)"><h3>🎉 پروژه تکمیل شد</h3><p class="muted small">۱۰٪ پاداش وفاداری به کیف پول شما واریز شد. اگر از نتیجه ناراضی هستید، تا ۷ روز می‌توانید ۹۰٪ وجه را پس بگیرید.</p>
    <form method="post" action="/apps/${esc(project.code)}/action" data-confirm="درخواست بازگشت ۹۰٪ وجه به کیف پول؟ پروژه بسته می‌شود." data-ok-text="بله، بازگشت وجه"><input type="hidden" name="_csrf" value="${esc(csrf)}"><input type="hidden" name="action" value="refund90">
      <button class="btn ghost" type="submit">😔 ناراضی هستم — بازگشت ${fa(POLICY.REFUND_FINAL)}٪ به کیف پول</button></form></div>`;
  } else if (project.status === 'refunded') {
    actionBox = `<div class="card card-pad action-box" style="border-color:var(--info)"><h3>💸 بازگشت وجه انجام شد</h3><p class="muted small">${fa(POLICY.REFUND_FINAL)}٪ مبلغ به کیف پول شما واریز شد. از <a href="/account/wallet" style="color:var(--primary)">کیف پول</a> درخواست برداشت بزنید تا خودکار به حسابتان واریز شود.</p></div>`;
  } else if (project.status === 'cancelled') {
    actionBox = `<div class="card card-pad action-box"><h3>پروژه لغو شد</h3><p class="muted small">${fa(POLICY.REFUND_CANCEL)}٪ پرداختی به کیف پول شما بازگشت داده شد${project.refund ? ` (${money(project.refund)})` : ''}.</p></div>`;
  }

  const paymentsHtml = (project.payments || []).map(p => `
    <div class="between payment-row"><span>${p.ref ? '✅' : '⏳'} ${esc(p.label)} <span class="muted small">— ${faDateTime(p.at)}</span></span><b>${money(p.amount)}</b></div>`).join('')
    || '<p class="muted small">هنوز پرداختی ثبت نشده است.</p>';

  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <a href="/apps">سفارش اپ</a> <span>/</span> <span>پیگیری ${esc(project.code)}</span></nav>
  <div class="section-head">
    <h2>پروژه ${esc(project.code)} <span class="badge ${['cancelled', 'rejected'].includes(project.status) ? 'err' : project.status === 'completed' || project.status === 'refunded' ? 'ok' : 'primary'}">${st.label}</span></h2>
    <div class="flex">
      <a class="btn sm ghost" href="/account/messages">💬 پشتیبانی</a>
      <a class="btn sm ghost" href="/account/wallet">💳 کیف پول: ${money(walletBal)}</a>
    </div>
  </div>

  <div class="card card-pad progress-card">
    <div class="between" style="margin-bottom:10px"><b>نوار پیشرفت پروژه</b><b class="grad-text" style="font-size:1.3rem">${fa(prog)}٪</b></div>
    <div class="progress-lg"><span style="width:${prog}%"></span></div>
    <div class="ms-track">${milestones}</div>
  </div>

  <div class="admin-2col" style="margin-top:22px">
    <div style="display:grid;gap:22px">
      ${actionBox}
      <div class="card card-pad">
        <h3 style="margin-bottom:12px">👁 پیش‌نمایش‌های مرحله‌ای</h3>
        ${previewsHtml}
      </div>
    </div>
    <div style="display:grid;gap:22px">
      <div class="card card-pad">
        <h3 style="margin-bottom:12px">💳 پرداخت‌ها</h3>
        ${paymentsHtml}
        <div class="between" style="border-top:1.5px solid var(--border);padding-top:10px"><span class="muted">مجموع پرداختی</span><b>${money(paid)}</b></div>
      </div>
      <div class="card card-pad">
        <h3 style="margin-bottom:12px">📋 خلاصه سفارش</h3>
        <p class="small muted" style="background:var(--surface-2);padding:12px;border-radius:10px">${esc(project.prompt)}</p>
        <div class="small" style="margin-top:10px;display:grid;gap:6px">
          <div class="between"><span class="muted">${finalPrice ? 'قیمت نهایی تاییدشده' : 'برآورد اولیه'}</span><b>${finalPrice ? money(finalPrice) : money(est.low) + ' — ' + money(est.high)}</b></div>
          <div class="between"><span class="muted">زمان تقریبی</span><b>${fa(est.weeks || 3)} هفته</b></div>
          <div class="between"><span class="muted">پلتفرم‌ها</span><b>اندروید${project.ios ? ' + iOS' : ''}${project.web ? ' + وب' : ''}</b></div>
          <div class="between" style="color:var(--ok)"><span>🎁 پاداش وفاداری تا پایان</span><b>${money(round50k((finalPrice || est.total || 0) * POLICY.LOYALTY / 100))}</b></div>
        </div>
        ${(est.features || []).length ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${est.features.map(f => `<span class="badge primary">${esc(f)}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  </div>
</div>`;

  return page({ user, csrf, title: `پیگیری پروژه ${project.code} | ${APP_NAME}`, desc: 'پیگیری سفارش اپلیکیشن', body, noindex: true });
}

function page403(ctx) {
  const body = `<div class="container section"><div class="card empty-state"><div class="ic">⛔</div><p>شما به این پروژه دسترسی ندارید.</p></div></div>`;
  return page({ user: ctx.user, csrf: ctx.csrf, title: 'دسترسی غیرمجاز', desc: '', body, noindex: true });
}

// ─── اکشن‌های مالی کاربر (همه با گارد وضعیت = ضد تکرار پرداخت) ───
export function handleAppAction(req, res, ctx) {
  const { user, project, body, session } = ctx;
  if (!user || user.id !== project.userId) return { redirect: '/login' };
  if (!csrfOk(req, session, body)) return { redirect: `/apps/track/${project.code}` };
  const action = body.action;
  const finalPrice = project.finalPrice || project.estimate?.total || 0;
  const payments = project.payments || [];
  const now = new Date().toISOString();
  const P = project.id;

  const pay = (label, amount) => {
    payments.push({ label, amount, at: now, ref: '880' + Math.floor(Math.random() * 900000 + 100000) });
    updateOne('projects', p => p.id === P, { payments });
  };
  const paidTotal = () => payments.reduce((s, p) => s + p.amount, 0);

  if (action === 'deposit' && project.status === 'quoted' && !payments.length) {
    pay('بیعانه ۳۰٪', round50k(finalPrice * POLICY.DEPOSIT / 100));
    updateOne('projects', p => p.id === P, { status: 'started', startedAt: now });
    notify(user.id, `بیعانه پروژه ${project.code} دریافت شد ✅ (پول شما امانت نزد اپ‌تم است)\nتیم طراحی از امروز شروع می‌کند؛ اولین پیش‌نمایش (~۲۵٪) از طریق پیام اعلام می‌شود.`);
    return { redirect: `/apps/track/${project.code}?paid=deposit` };
  }
  if (action === 'second' && project.status === 'awaiting_second') {
    pay('پرداخت دوم ۳۰٪', round50k(finalPrice * POLICY.SECOND / 100));
    updateOne('projects', p => p.id === P, { status: 'final_dev' });
    notify(user.id, `پرداخت دوم پروژه ${project.code} دریافت شد ✅ فاز توسعه نهایی آغاز شد.`);
    return { redirect: `/apps/track/${project.code}?paid=second` };
  }
  if (action === 'cancel' && project.status === 'awaiting_second') {
    const refund = round50k(paidTotal() * POLICY.REFUND_CANCEL / 100);
    updateOne('projects', p => p.id === P, { status: 'cancelled', cancelledAt: now, refund });
    credit(user.id, refund, 'refund', `انصراف پروژه ${project.code} — بازگشت ${fa(POLICY.REFUND_CANCEL)}٪`);
    notify(user.id, `پروژه ${project.code} لغو شد.\nبازگشت ${fa(POLICY.REFUND_CANCEL)}٪ پرداختی (${money(refund)}) به کیف پول شما واریز شد؛ از صفحه کیف پول قابل برداشت است. 🙏`);
    return { redirect: `/apps/track/${project.code}?cancelled=1` };
  }
  if (action === 'final' && project.status === 'delivered_pending_final') {
    pay('پرداخت پایانی ۴۰٪', round50k(finalPrice * POLICY.FINAL / 100));
    updateOne('projects', p => p.id === P, { status: 'completed', completedAt: now });
    const loyalty = round50k(finalPrice * POLICY.LOYALTY / 100);
    credit(user.id, loyalty, 'loyalty', `پاداش وفاداری پروژه ${project.code} 🎁`);
    notify(user.id, `پرداخت پایانی ${project.code} دریافت شد 🎉\nسورس‌کد + مستندات از همین صفحه قابل دریافت است.\n🎁 پاداش وفاداری ${money(loyalty)} به کیف پول شما اضافه شد!`);
    return { redirect: `/apps/track/${project.code}?paid=final` };
  }
  if (action === 'refund90' && project.status === 'completed' && !project.refund90At) {
    const refund = round50k(paidTotal() * POLICY.REFUND_FINAL / 100);
    updateOne('projects', p => p.id === P, { status: 'refunded', refund90At: now, refund });
    credit(user.id, refund, 'refund', `بازگشت ${fa(POLICY.REFUND_FINAL)}٪ پروژه ${project.code} (نارضایتی)`);
    notify(user.id, `درخواست بازگشت وجه پروژه ${project.code} انجام شد.\nبازگشت ${fa(POLICY.REFUND_FINAL)}٪ (${money(refund)}) به کیف پول شما واریز شد و هر زمان می‌توانید درخواست برداشت بزنید تا خودکار واریز شود.`);
    return { redirect: `/apps/track/${project.code}?refunded=1` };
  }
  return { redirect: `/apps/track/${project.code}` };
}

// ─── اکشن‌های ادمین (تایید/رد قیمت) — در admin.js استفاده می‌شود ───
export function handleAdminQuote(req, res, ctx, id) {
  const { body } = ctx;
  const project = findOne('projects', p => p.id === id);
  if (!project || project.status !== 'submitted') return { redirect: '/admin/app-projects' };
  const price = parseMoney(body.price);
  if (!Number.isFinite(price) || price < 500_000) return { redirect: `/admin/app-projects/${id}?err=price` };
  const note = cleanText(body.note, 500);
  updateOne('projects', p => p.id === id, { finalPrice: price, status: 'quoted', quoteNote: note, quotedAt: new Date().toISOString() });
  const dep = round50k(price * POLICY.DEPOSIT / 100);
  notify(project.userId, `✅ سفارش ${project.code} توسط مدیر تایید شد!\nقیمت نهایی: ${money(price)}\nبیعانه شروع (۳۰٪): ${money(dep)}\n${note ? 'یادداشت مدیر: ' + note + '\n' : ''}🎁 با ماندن تا پایان، ۱۰٪ پاداش وفاداری دریافت می‌کنید.\nاز صفحه پیگیری پروژه بیعانه را پرداخت کنید تا کار شروع شود.`);
  return { redirect: `/admin/app-projects/${id}?quoted=1` };
}

export function handleAdminReject(req, res, ctx, id) {
  const { body } = ctx;
  const project = findOne('projects', p => p.id === id);
  if (!project || project.status !== 'submitted') return { redirect: '/admin/app-projects' };
  const reason = cleanText(body.reason, 400) || 'با توجه به شرایط فعلی امکان انجام این پروژه نیست.';
  updateOne('projects', p => p.id === id, { status: 'rejected', rejectReason: reason });
  notify(project.userId, `سفارش ${project.code} متاسفانه رد شد.\nدلیل: ${reason}`);
  return { redirect: `/admin/app-projects/${id}?rejected=1` };
}

import { normalizeDigits as normalize_digits, parseMoney } from './util.js';
