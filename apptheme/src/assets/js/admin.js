// ─── پنل مدیریت | اسکریپت مشترک ───
(function () {
  'use strict';
  var mem = {};
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }

  var saved = lsGet('tl-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', 'dark');

  // بازیابی پشتیبان
  var restoreBtn = document.getElementById('restoreBtn');
  if (restoreBtn) restoreBtn.addEventListener('click', function () {
    var input = document.getElementById('restoreFile');
    var f = input && input.files && input.files[0];
    if (!f) { alert('اول فایل پشتیبان (JSON) را انتخاب کنید.'); return; }
    if (!confirm('داده‌های فعلی کاملاً جایگزین می‌شود. مطمئن هستید؟')) return;
    var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
    var fr = new FileReader();
    fr.onload = function () {
      fetch('/admin/restore', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf }, body: fr.result })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { alert('بازیابی با موفقیت انجام شد ✓'); location.href = '/admin'; }
          else alert(d.error || 'خطا در بازیابی');
        })
        .catch(function () { alert('خطای شبکه'); });
    };
    fr.readAsText(f);
  });

  var purgeBtn = document.getElementById('purgeDemoBtn');
  if (purgeBtn) purgeBtn.addEventListener('click', function () {
    if (!confirm('کاربران دمو (سارا/امیر/نگار) و همه داده‌هایشان حذف شوند؟')) return;
    var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
    fetch('/admin/purge-demo', { method: 'POST', headers: { 'X-CSRF': csrf } })
      .then(function (r) { return r.json(); })
      .then(function (d) { alert(d.ok ? 'تمیز شد ✓ (' + d.removed + ' کاربر دمو حذف شد)' : 'خطا'); location.reload(); })
      .catch(function () { alert('خطای شبکه'); });
  });

  var tBtn = document.getElementById('themeToggle');
  if (tBtn) tBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    lsSet('tl-theme', cur);
  });
})();
