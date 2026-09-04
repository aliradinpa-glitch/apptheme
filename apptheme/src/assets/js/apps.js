// ─── بودجه‌سنج هوشمند سفارش اپ ───
(function () {
  'use strict';
  var btn = document.getElementById('estBtn');
  if (!btn) return;
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';

  window.estimateApp = function () {
    var prompt = document.getElementById('estPrompt').value || '';
    var ios = document.getElementById('estIos').checked;
    var web = document.getElementById('estWeb').checked;
    var out = document.getElementById('estOut');
    if (prompt.trim().length < 5) {
      out.innerHTML = '<div class="alert err">لطفاً چند کلمه درباره اپلیکیشنت بنویس 🙂</div>';
      return;
    }
    btn.disabled = true; btn.textContent = 'در حال برآورد…';
    fetch('/api/apps/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf },
      body: JSON.stringify({ prompt: prompt, ios: ios, web: web })
    }).then(function (r) { return r.json(); }).then(function (d) {
      btn.disabled = false; btn.textContent = '⚡ برآورد دوباره';
      if (!d.ok) { out.innerHTML = '<div class="alert err">' + (d.error || 'خطا') + '</div>'; return; }
      var fa = function (n) { return Number(n).toLocaleString('fa-IR'); };
      out.innerHTML =
        '<div class="est-result">' +
        '<div class="est-price">' + fa(d.low) + ' <span>تا</span> ' + fa(d.high) + ' <small>تومان</small></div>' +
        '<div class="est-meta">⏱ حدود ' + fa(d.weeks) + ' هفته · 📄 ' + fa(d.pages) + ' صفحه' + (d.needsBackend ? ' · 🖥 نیازمند سرور' : '') + '</div>' +
        (d.features.length ? '<div class="est-feats">' + d.features.map(function (f) { return '<span class="badge primary">✓ ' + f + '</span>'; }).join('') + '</div>' : '') +
        '<div class="est-pay">بیعانه شروع (' + fa(Math.round(d.low * 0.3)) + ' تومان) · تضمین بازگشت وجه 🛡️</div>' +
        '<form method="post" action="/apps/order" class="est-order">' +
        '<input type="hidden" name="_csrf" value="' + csrf + '">' +
        '<input type="hidden" name="prompt" value="' + prompt.replace(/"/g, '&quot;') + '">' +
        (ios ? '<input type="hidden" name="ios" value="on">' : '') +
        (web ? '<input type="hidden" name="web" value="on">' : '') +
        '<button class="btn lg" type="submit">🚀 ثبت سفارش با همین برآورد</button>' +
        '<p class="hint">برای ثبت، ابتدا وارد حساب خودت شوید (یا ثبت‌نام کن — ۱ دقیقه!).</p>' +
        '</form></div>';
    }).catch(function () {
      btn.disabled = false; btn.textContent = '⚡ برآورد فوری قیمت';
      out.innerHTML = '<div class="alert err">خطای شبکه؛ دوباره تلاش کن.</div>';
    });
  };
})();
