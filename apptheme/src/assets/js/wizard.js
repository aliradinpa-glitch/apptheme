// ─── ویزارد چندمرحله‌ای سفارش اپ ───
(function () {
  'use strict';
  var form = document.getElementById('wizForm');
  if (!form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll('.wiz-step'));
  var prev = document.getElementById('wizPrev');
  var next = document.getElementById('wizNext');
  var lbl = document.getElementById('wizLbl');
  var bar = document.querySelector('#wizProgress span');
  var cur = 0;
  var TOTAL = steps.length;
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
  var estimated = false;

  function paint() {
    steps.forEach(function (s, i) { s.hidden = i !== cur; });
    prev.hidden = cur === 0;
    next.hidden = cur === TOTAL - 1;
    lbl.textContent = 'مرحله ' + Number(cur + 1).toLocaleString('fa-IR') + ' از ' + Number(TOTAL).toLocaleString('fa-IR');
    bar.style.width = ((cur + 1) / TOTAL * 100) + '%';
    if (cur === TOTAL - 1 && !estimated) { estimate(); estimated = true; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function collectPrompt() {
    var type = (form.querySelector('input[name="type"]:checked') || {}).value || '';
    var typeLbl = { shop: 'فروشگاه', food: 'رستوران غذا', service: 'خدمات', edu: 'آموزش دوره', health: 'سلامت', travel: 'سفر حمل', social: 'شبکه اجتماعی چت', finance: 'مالی بانک', game: 'بازی', media: 'ویدیو موزیک استریم', other: '' }[type] || '';
    var feats = Array.prototype.slice.call(form.querySelectorAll('input[name="feat"]:checked')).map(function (x) { return x.parentElement.textContent.trim(); }).join(' ');
    var name = (form.querySelector('[name="name"]') || {}).value || '';
    var desc = (form.querySelector('[name="desc"]') || {}).value || '';
    return (typeLbl + ' ' + feats + ' ' + name + ' ' + desc).trim();
  }

  function estimate() {
    var out = document.getElementById('wizEstimate');
    var prompt = collectPrompt();
    if (prompt.length < 10) { out.innerHTML = '<div class="alert err">لطفاً اول توضیح ایده (مرحله ۲) را کامل کن.</div>'; cur = 1; paint(); estimated = false; return; }
    var ios = !!form.querySelector('input[name="pf"][value="ios"]').checked;
    var web = !!form.querySelector('input[name="pf"][value="web"]').checked;
    var backend = !!form.querySelector('input[name="backend"]').checked;
    out.innerHTML = '<div class="alert info">… در حال محاسبه برآورد منصفانه</div>';
    fetch('/api/apps/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf },
      body: JSON.stringify({ prompt: prompt, ios: ios, web: web, backend: backend })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) { out.innerHTML = '<div class="alert err">' + (d.error || 'خطا') + '</div>'; return; }
      var fa = function (n) { return Number(n).toLocaleString('fa-IR'); };
      out.innerHTML =
        '<div class="est-result">' +
        '<div class="est-price">' + fa(d.low) + ' <span>تا</span> ' + fa(d.high) + ' <small>تومان</small></div>' +
        '<div class="est-meta">⏱ حدود ' + fa(d.weeks) + ' هفته · 📄 ' + fa(d.pages) + ' صفحه' + (d.needsBackend ? ' · 🖥 با سرور' : '') + ' · 💵 پرداخت ۳۰+۳۰+۴۰٪</div>' +
        (d.features.length ? '<div class="est-feats">' + d.features.map(function (f) { return '<span class="badge primary">✓ ' + f + '</span>'; }).join('') + '</div>' : '') +
        '<p class="hint">این برآوردِ سیستم است؛ قیمت نهایی دقیق پس از بررسی مدیر حداکثر تا ۲۴ ساعت اعلام می‌شود.</p></div>';
    }).catch(function () { out.innerHTML = '<div class="alert err">خطای شبکه</div>'; });
  }

  next.addEventListener('click', function () {
    // اعتبارسنجی مرحله جاری
    var s = steps[cur];
    var bad = Array.prototype.slice.call(s.querySelectorAll('[required]')).filter(function (i) { return !i.value.trim() || (i.type === 'checkbox' && !i.checked); });
    if (bad.length) { bad[0].focus(); return; }
    if (cur < TOTAL - 1) { cur++; paint(); }
  });
  prev.addEventListener('click', function () { if (cur > 0) { cur--; paint(); } });
  paint();
})();
