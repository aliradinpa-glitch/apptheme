// ─── قالب‌ساز هوشمند: تعامل سمت کلاینت ───
(function () {
  'use strict';
  var btn = document.getElementById('genBtn');
  if (!btn) return;
  var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
  var specBox = document.getElementById('genSpec');
  var frame = document.getElementById('genFrame');
  var empty = document.getElementById('genEmpty');
  var actions = document.getElementById('genActions');
  var pubForm = document.getElementById('genPublish');
  var tokenInput = document.getElementById('genToken');
  var fwSel = document.getElementById('genFw');

  // نمونه‌ها
  document.querySelectorAll('.chip-ex').forEach(function (c) {
    c.addEventListener('click', function () {
      document.getElementById('genPrompt').value = c.getAttribute('data-ex');
    });
  });

  function showSpec(s) {
    var fa = function (n) { return Number(n).toLocaleString('fa-IR'); };
    var secs = { menu: 'منو/آیتم‌ها', gallery: 'گالری', team: 'تیم', pricing: 'قیمت‌گذاری', testimonials: 'نظرات', blog: 'وبلاگ', hours: 'ساعات کاری', map: 'نقشه', faq: 'سوالات متداول' };
    specBox.innerHTML =
      '<div class="alert ok notif-ok" style="margin-top:6px">' +
      '<b>' + s.brand + '</b> — ' + s.typeLabel + ' · ' + (s.dark ? '🌙 تیره' : '☀️ روشن') +
      '<span class="pal-dots">' + s.palette.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' +
      '<div class="small" style="margin-top:6px">' + s.sections.map(function (k) { return '✓ ' + (secs[k] || k); }).join(' · ') + '</div></div>';
  }

  btn.addEventListener('click', function () {
    var prompt = document.getElementById('genPrompt').value || '';
    if (prompt.trim().length < 8) { alert('پرامپت طولانی‌تری بنویس (حداقل ۸ حرف).'); return; }
    btn.disabled = true; btn.textContent = '… در حال ساخت قالب';
    fetch('/admin/generator/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf },
      body: JSON.stringify({ prompt: prompt, fw: fwSel.value })
    }).then(function (r) { return r.json(); }).then(function (d) {
      btn.disabled = false; btn.textContent = '✨ تولید قالب';
      if (!d.ok) { specBox.innerHTML = '<div class="alert err" style="margin-top:6px">' + (d.error || 'خطا') + '</div>'; return; }
      showSpec(d.spec);
      frame.src = '/preview/gen/' + d.token;
      frame.hidden = false; empty.hidden = true;
      actions.hidden = false;
      document.getElementById('genNewTab').href = '/preview/gen/' + d.token;
      document.getElementById('genZip').href = '/admin/generator/download/' + d.token;
      tokenInput.value = d.token;
      pubForm.hidden = false;
    }).catch(function () {
      btn.disabled = false; btn.textContent = '✨ تولید قالب';
      specBox.innerHTML = '<div class="alert err" style="margin-top:6px">خطای شبکه</div>';
    });
  });

  var pubBtn = document.getElementById('genPublishBtn');
  pubBtn.addEventListener('click', function () {
    var fd = new FormData(pubForm);
    pubBtn.disabled = true;
    fetch('/admin/generator/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf },
      body: JSON.stringify({ token: fd.get('token'), price: fd.get('price'), published: fd.get('published') === 'on' ? 'on' : '' })
    }).then(function (r) { return r.json(); }).then(function (d) {
      pubBtn.disabled = false;
      var msg = document.getElementById('genPubMsg');
      if (d.ok) {
        msg.innerHTML = '<a href="/admin/products/' + d.id + '/edit" style="color:var(--ok)">✓ منتشر شد! ویرایش قالب ←</a>' + (d.published ? ' <a href="/templates/' + d.slug + '" target="_blank" style="color:var(--primary)">(مشاهده در فروشگاه)</a>' : '');
        if (window.tlToast) window.tlToast('قالب با موفقیت به فروشگاه اضافه شد ✓');
      } else { msg.textContent = d.error || 'خطا'; }
    }).catch(function () { pubBtn.disabled = false; });
  });
})();
