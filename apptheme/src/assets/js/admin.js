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
    if (!f) { window.tlAlert('اول فایل پشتیبان (JSON) را انتخاب کنید. 📂', 'err'); return; }
    window.tlConfirm('داده‌های فعلی کاملاً با فایل پشتیبان جایگزین می‌شود. مطمئن هستید؟', { okText: 'بله، بازیابی کن' })
      .then(function (ok) { if (ok) doRestore(f); });
  });
  function doRestore(f) {
    var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
    var fr = new FileReader();
    fr.onload = function () {
      fetch('/admin/restore', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf }, body: fr.result })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { window.tlAlert('✅ بازیابی با موفقیت انجام شد — در حال انتقال به داشبورد…', 'ok'); setTimeout(function () { location.href = '/admin'; }, 900); }
          else window.tlAlert(d.error || 'خطا در بازیابی', 'err');
        })
        .catch(function () { window.tlAlert('خطای شبکه', 'err'); });
    };
    fr.readAsText(f);
  }

  var purgeBtn = document.getElementById('purgeDemoBtn');
  if (purgeBtn) purgeBtn.addEventListener('click', function () {
    window.tlConfirm('کاربران دمو (سارا/امیر/نگار) و همه داده‌هایشان حذف شوند؟', { okText: 'بله، پاک‌سازی کن' })
      .then(function (ok) {
        if (!ok) return;
        var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
        fetch('/admin/purge-demo', { method: 'POST', headers: { 'X-CSRF': csrf } })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) { window.tlAlert('✨ پاک‌سازی شد — ' + d.removed + ' کاربر دمو و داده‌هایشان حذف شدند.', 'ok'); setTimeout(function () { location.reload(); }, 1100); }
            else window.tlAlert('خطا در پاک‌سازی', 'err');
          })
          .catch(function () { window.tlAlert('خطای شبکه', 'err'); });
      });
  });

  var tBtn = document.getElementById('themeToggle');
  if (tBtn) tBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    lsSet('tl-theme', cur);
  });
})();
