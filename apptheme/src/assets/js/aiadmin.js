// ═══ استودیوی هوش مصنوعی — تعامل کامل ═══
(function () {
  'use strict';
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
  var tierKey = 'gold';
  var current = null; // آخرین خروجی {token, kind, name, previewable}

  // ── تبها ──
  var tabs = document.querySelectorAll('.sf-tab');
  var panels = document.querySelectorAll('.sf-panel');
  function showTab(k) {
    tabs.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-tab') === k); });
    panels.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-panel') === k); });
    updateTierNote();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.getAttribute('data-tab')); }); });

  // ── سطحها ──
  var tierCards = document.querySelectorAll('.tier-card');
  tierCards.forEach(function (c) {
    c.addEventListener('click', function () {
      tierCards.forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on');
      tierKey = c.getAttribute('data-tier');
      if (window.tlToast) window.tlToast('سطح «' + c.querySelector('.tc-name').textContent.trim() + '» انتخاب شد', 'info', { title: 'قدرت هوش مصنوعی', duration: 2500 });
      updateTierNote();
    });
  });
  var TIER_PRICES = { bronze: 490000, silver: 890000, gold: 1490000, vip: 2490000, legendary: 4490000, epic: 7490000 };
  function updateTierNote() {
    var note = document.getElementById('sfTierNote');
    if (!note) return;
    var act = document.querySelector('.tier-card.on');
    var label = act ? act.getAttribute('data-tier') : 'gold';
    note.innerHTML = '💰 قیمت پیشنهادی این سطح: <b>' + Number(TIER_PRICES[label] || 1490000).toLocaleString('fa-IR') + ' تومان</b> — بعد از ساخت میتوانی با تیک تخفیف، قیمت نهایی را تعیین و منتشر کنی.';
  }
  updateTierNote();

  // ── فریمورک فروشگاهساز ──
  var fw = 'woocommerce';
  document.querySelectorAll('#stFwRow .mode-chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('#stFwRow .mode-chip').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on');
      fw = c.getAttribute('data-fw');
    });
  });

  // ── ابزارهای مشترک ──
  function $(id) { return document.getElementById(id); }
  // ── حالت ساده: پنهان کردن تنظیمات پیشرفته ──
  var sfSimple = $('sfSimple');
  if (sfSimple) sfSimple.addEventListener('change', function () {
    document.querySelectorAll('.sf-adv').forEach(function (el) { el.style.display = sfSimple.checked ? 'none' : ''; });
    if (sfSimple.checked && window.tlToast) window.tlToast('حالت ساده فعال شد — تنظیمات پیشرفته پنهان شد', 'ok', { title: 'حالت ساده' });
  });
  function api(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf, 'Accept': 'application/json' }, body: JSON.stringify(body || {}) }).then(function (r) { return r.json(); });
  }
  function setRun(msg) { var b = $('sfRun'); b.disabled = !!msg; b.textContent = msg || '🚀 ساخت با هوش مصنوعی'; }
  function showOut(html) { $('sfOut').innerHTML = html; }
  function showActions(token, previewable, name) {
    current = { token: token };
    $('sfOutActions').hidden = false;
    var pv = $('sfPrevNew');
    pv.hidden = !previewable;
    pv.href = '/preview/ai/' + token;
    $('sfDl').onclick = function () { location.href = '/admin/ai/download?token=' + token; };
    if (!$('sfVar')) {
      $('sfOutActions').insertAdjacentHTML('beforeend',
        '<button type="button" class="btn sm ghost" id="sfVar">🎲 متفاوت</button>' +
        '<input class="input ltr" id="sfEditIn" style="max-width:210px;padding:7px 10px" placeholder="ویرایش: رنگ آبی کن">' +
        '<button type="button" class="btn sm soft" id="sfRw">✍️ ویرایش</button>');
      var vb = $('sfVar'), rb = $('sfRw');
      vb.onclick = function () {
        if (!lastBody) { window.tlToast('اول یک نسخه بساز', 'err'); return; }
        seedNow++; doBuild(lastBody, seedNow);
      };
      rb.onclick = function () {
        var t = $('sfEditIn').value.trim();
        if (!t) { window.tlToast('دستور ویرایش را بنویس؛ مثلاً: رنگ اصلی آبی کن', 'err'); return; }
        api('/admin/ai/rework', { token: token, edit: t }).then(function (d) {
          if (!d.ok) { window.tlToast(d.error || 'خطا', 'err'); return; }
          var n = (d.notes || []).join('؛ ');
          showOut('<div class="alert ok"><b>✅ نسخهٔ ویرایششده ساخته شد: ' + (d.name || '') + '</b><br><span class="small">زمان: ' + (d.eta || '') + (n ? '<br>تغییرات: ' + n : '') + '</span></div>');
          showActions(d.token, true, d.name);
          publishZone(d.token, TIER_PRICES[tierKey] || 1490000);
        });
      };
    }
  }
  function publishZone(token, defPrice) {
    $('sfPublishZone').innerHTML =
      '<div class="card card-pad" style="border-color:color-mix(in srgb,var(--primary) 35%,var(--border))">' +
      '<h3 style="margin-bottom:10px">🚀 انتشار در فروشگاه</h3>' +
      '<div class="form-grid">' +
      '<div class="field"><label>قیمت (تومان)</label><input class="input ltr" id="pubPrice" dir="ltr" value="' + defPrice + '"></div>' +
      '<div class="field"><label>💸 تخفیف ٪</label><input class="input ltr" id="pubDisc" dir="ltr" placeholder="مثلاً 20 — خالی = بدون تخفیف"></div>' +
      '</div>' +
      '<label class="check-line" style="margin:8px 0 12px"><input type="checkbox" id="pubNow" checked> 🟢 انتشار فوری در فروشگاه</label>' +
      '<button class="btn" id="pubBtn">✅ منتشر کن</button> <span class="hint" id="pubMsg"></span></div>';
    $('pubBtn').addEventListener('click', function () {
      var btn = $('pubBtn'); btn.disabled = true;
      api('/admin/ai/publish', { token: token, price: $('pubPrice').value, discount: $('pubDisc').value, published: $('pubNow').checked ? 'on' : '' })
        .then(function (d) {
          btn.disabled = false;
          var msg = $('pubMsg');
          if (d.ok) {
            msg.innerHTML = '<b style="color:var(--ok)">✓ منتشر شد!</b> ' + (d.published ? '<a href="/templates/' + d.slug + '" target="_blank" style="color:var(--primary)">مشاهده در فروشگاه ←</a>' : '');
            if (window.tlToast) window.tlToast('با موفقیت منتشر شد ✓', 'ok', { title: 'انتشار' });
          } else { msg.textContent = d.error || 'خطا'; }
        });
    });
  }

  // ── تحلیل سریع قبل از ساخت (قیمت + امکانات) ──
  function kindNow() {
    var t = document.querySelector('.sf-tab.on');
    return t ? t.getAttribute('data-tab') : 'template';
  }
  function liveAnalyze() {
    var kind = kindNow();
    if (kind === 'convert' || kind === 'link') return; // بدون پرامپت
    var prompt = (kind === 'plugin' ? $('pfPrompt') : kind === 'store' ? $('stPrompt') : kind === 'app' ? $('apPrompt') : $('sfPrompt') || {}).value || '';
    if (prompt.length < 4) return;
    api('/admin/ai/analyze', { kind: kind, prompt: prompt, tier: tierKey }).then(function (d) {
      if (!d.ok) return;
      var o = d.out;
      showOut('<div class="alert info" style="margin-top:4px"><b>🔮 تحلیل هوش مصنوعی:</b> ' + o.label +
        ' — پلتفرم: <b>' + o.platform + '</b><br><span class="small">' + (o.features || []).map(function (f) { return '✓ ' + f; }).join(' · ') + '</span>' +
        '<br>💰 قیمت پیشنهادی: <b>' + Number(o.price).toLocaleString('fa-IR') + ' تومان</b> · ⏱ زمان تخمینی ساخت: <b>' + (d.eta || '') + '</b> <span class="small muted">(سطح ' + (d.tierInfo ? d.tierInfo.icon + ' ' + d.tierInfo.label : '') + ' — ' + (d.tierInfo ? d.tierInfo.pages[0] + ' تا ' + d.tierInfo.pages[1] + ' صفحه' : '') + ')</span></div>');
    });
  }
  ['pfPrompt', 'stPrompt', 'apPrompt', 'sfPrompt'].forEach(function (id) {
    var el = $(id); if (el) el.addEventListener('input', function () { clearTimeout(el._t); el._t = setTimeout(liveAnalyze, 600); });
  });

  // ── نسخهها و ویرایش ──
  var seedNow = 0, lastBody = null;

  // ── ساخت ──
  $('sfRun').addEventListener('click', function () {
    var kind = kindNow();
    if (kind === 'link') {
      var url = $('sfUrl').value.trim();
      if (!url) { window.tlToast('لینک سایت را بنویس', 'err'); return; }
      setRun('🌐 در حال تحلیل سایت… (۱۰ تا ۳۰ ثانیه)');
      showOut('<div class="gen-empty"><div style="font-size:2.2rem">🔎</div><p class="muted small">هوش مصنوعی در حال رفتن به «' + url + '» و تحلیل ساختار، رنگها و ناوبری آن است…</p></div>');
      var brand = $('sfBrand').value.trim();
      var qs = '?tier=' + tierKey + (brand ? '&brand=' + encodeURIComponent(brand) : '');
      fetch('/admin/ai/linkbuild' + qs, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf, 'Accept': 'application/json' },
        body: JSON.stringify({ url: url, tier: tierKey })
      }).then(function (r) { return r.json(); }).then(function (d) {
        setRun(null);
        if (!d.ok) { showOut('<div class="alert err">' + (d.error || 'خطا') + '</div>'); return; }
        showOut('<div class="alert ok"><b>✅ وبسایت «' + d.name + '» ساخته شد!</b><br><span class="small">الهام از: ' + d.sourceUrl + ' · سبک: ' + (d.modeLabel || 'حرفهای') + ' · حجم: ' + Number(d.sizeKB).toLocaleString('fa-IR') + ' کیلوبایت</span><br><span class="small muted">شامل: index.html + فایل راهنمای Word با تصاویر مراحل</span></div>');
        showActions(d.token, false, d.name);
        $('sfPublishZone').innerHTML = '<p class="hint">💡 اگر میخواهی این وبسایت در فروشگاهت بفروشی، از بخش «فروشگاهساز» بساز (قابل انتشار با قیمت و تخفیف).</p>';
      }).catch(function () { setRun(null); showOut('<div class="alert err">خطای شبکه — دوباره تلاش کن</div>'); });
      return;
    }
    if (kind === 'convert') {
      var f = $('cvFile');
      if (!f.files || !f.files[0]) { window.tlToast('فایل ZIP را انتخاب کن', 'err'); return; }
      var mk = f.files[0].size > 20 * 1024 * 1024 ? 'فایل بزرگ است؛ شاید چند ثانیه طول بکشد' : 'در حال تحلیل و تبدیل…';
      setRun('📦 ' + mk);
      showOut('<div class="gen-empty"><div style="font-size:2.2rem">📦</div><p class="muted small">هوش مصنوعی فایل را باز میکند، پالت رنگ/صفحات/پلتفرم را تشخیص میدهد و نسخهٔ ارتقایافته میسازد…</p></div>');
      var fd = new FormData(); fd.append('file', f.files[0]);
      var qs2 = '?tier=' + tierKey + '&target=' + encodeURIComponent($('cvTarget').value) + '&brand=' + encodeURIComponent($('cvBrand').value);
      fetch('/admin/ai/convert' + qs2, {
        method: 'POST', headers: { 'X-CSRF': csrf, 'Accept': 'application/json', 'Content-Type': 'application/zip' },
        body: f.files[0] // باینری خام ZIP
      }).then(function (r) { return r.json(); }).then(function (d) {
        setRun(null);
        if (!d.ok) { showOut('<div class="alert err">' + (d.error || 'خطا') + '</div>'); return; }
        var a = d.analysis || {};
        showOut('<div class="alert ok"><b>✅ تبدیل شد: «' + d.name + '»</b><br><span class="small">مبدأ: ' + a.brand + ' (' + a.pages + ' صفحه، ' + a.platform + ') → خروجی: سطح ' + d.tier + '<br>پالت جدید: ' + (a.palette || []).map(function (c) { return '<i style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + c + ';margin-inline:2px"></i>'; }).join('') + '</span></div>');
        showActions(d.token, false, d.name);
        publishZone(d.token, TIER_PRICES[tierKey] || 1490000);
      }).catch(function () { setRun(null); showOut('<div class="alert err">خطا در ارسال فایل</div>'); });
      return;
    }
    // بقیه: پرامپتمحور
    var promptEl = kind === 'plugin' ? $('pfPrompt') : kind === 'store' ? $('stPrompt') : kind === 'app' ? $('apPrompt') : $('sfPrompt');
    var prompt = (promptEl && promptEl.value || '').trim();
    if (prompt.length < 6) { window.tlToast('پرامپت را بنویس (حداقل ۶ حرف)', 'err'); return; }
    var body = { kind: kind, prompt: prompt, tier: tierKey };
    if (kind === 'store') body.fw = fw;
    doBuild(body, 0);
  });

  function doBuild(body, seed) {
    lastBody = body;
    setRun(seed ? '🎲 در حال ساخت نسخهٔ متفاوت…' : '🧠 هوش مصنوعی مافوقحرفهای در حال ساخت…');
    showOut('<div class="gen-empty"><div style="font-size:2.2rem">🤖</div><p class="muted small">پرامپت تحلیل شد؛ در حال تولید فایلها (با راهنمای ورد + پیشنمایش)…</p></div>');
    var b2 = Object.assign({}, body, { seed: seed || 0 });
    api('/admin/ai/build', b2).then(function (d) {
      setRun(null);
      if (!d.ok) { showOut('<div class="alert err">' + (d.error || 'خطا') + '</div>'); return; }
      var str = 'قدرت: ' + (d.strength || 100) + '٪ · زمان: ' + (d.eta || '') + (d.varied ? ' · 🎲 نسخهٔ متفاوت' : '');
      showOut('<div class="alert ok"><b>✅ ' + d.name + ' ساخته شد!</b><br><span class="small muted">حجم: ' + Number(d.sizeKB).toLocaleString('fa-IR') + ' کیلوبایت · ' + str + '<br>شامل: پیشنمایش زنده + فایل راهنمای Word با تصاویر مراحل نصب</span></div>');
      showActions(d.token, !!d.previewable, d.name);
      publishZone(d.token, TIER_PRICES[tierKey] || 1490000);
    }).catch(function () { setRun(null); showOut('<div class="alert err">خطای شبکه</div>'); });
  }
})();
