// ═══ پنل مدیریت | اسکریپت نئونی 2.0 ── تم، سایدبار، زنگ اعلان، منو ──
(function () {
  'use strict';
  var mem = {};
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }

  // ── تم ──
  var saved = lsGet('tl-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', 'dark');

  function paintThemeIcon() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('#themeToggle').forEach(function (b) {
      b.innerHTML = dark
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>'
        : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });
  }
  paintThemeIcon();
  var tBtn = document.getElementById('themeToggle');
  if (tBtn) tBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    lsSet('tl-theme', cur);
    paintThemeIcon();
  });

  // ── سایدبار (موبایل) ──
  var side = document.getElementById('adminSidebar');
  var sideOv = document.getElementById('sideOv');
  var sideToggle = document.getElementById('sideToggle');
  if (side && sideToggle) {
    function closeSide() { side.classList.remove('open'); if (sideOv) sideOv.hidden = true; }
    sideToggle.addEventListener('click', function () {
      side.classList.toggle('open');
      if (sideOv) sideOv.hidden = !side.classList.contains('open');
    });
    if (sideOv) sideOv.addEventListener('click', closeSide);
    document.querySelectorAll('.admin-nav a').forEach(function (a) { a.addEventListener('click', closeSide); });
  }

  // ── دراپ‌داون‌های سراسری (زنگ اعلان + منوی کاربر) ──
  function bindDropdown(btnId, panelId) {
    var btn = document.getElementById(btnId), panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    function toggle() {
      var on = panel.classList.toggle('on');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('on') && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('on'); btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { panel.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }
  bindDropdown('notifBell', 'notifPanel');
  bindDropdown('adminUserBtn', 'adminUserMenu');

  // ── بازیابی پشتیبان ──
  var restoreBtn = document.getElementById('restoreBtn');
  if (restoreBtn) restoreBtn.addEventListener('click', function () {
    var input = document.getElementById('restoreFile');
    var f = input && input.files && input.files[0];
    if (!f) { window.tlToast('اول فایل پشتیبان (JSON) را انتخاب کنید 📂', 'err', { title: 'فایل پیدا نشد' }); return; }
    window.tlConfirm('داده‌های فعلی <b>کاملاً</b> با فایل پشتیبان جایگزین می‌شود. مطمئن هستید؟', {
      okText: 'بله، بازیابی کن', danger: true, icon: '♻️', title: 'بازیابی پشتیبان',
    }).then(function (ok) {
      if (ok) doRestore(f);
    });
  });
  function doRestore(f) {
    var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
    var fr = new FileReader();
    fr.onload = function () {
      fetch('/admin/restore', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF': csrf }, body: fr.result })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            window.tlToast('بازیابی انجام شد — در حال انتقال به داشبورد…', 'ok', { title: 'موفقیت', duration: 2600 });
            setTimeout(function () { location.href = '/admin'; }, 900);
          } else window.tlToast(d.error || 'خطا در بازیابی', 'err', { title: 'ناموفق' });
        })
        .catch(function () { window.tlToast('خطای شبکه؛ دوباره تلاش کنید', 'err', { title: 'ناموفق' }); });
    };
    fr.readAsText(f);
  }

  // ── پاک‌سازی داده‌های دمو ──
  var purgeBtn = document.getElementById('purgeDemoBtn');
  if (purgeBtn) purgeBtn.addEventListener('click', function () {
    window.tlConfirm('کاربران دمو (سارا/امیر/نگار) و همه داده‌هایشان حذف شوند؟', {
      okText: 'بله، پاک‌سازی کن', danger: true, icon: '🧹', title: 'شروع واقعی',
    }).then(function (ok) {
      if (!ok) return;
      var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
      fetch('/admin/purge-demo', { method: 'POST', headers: { 'X-CSRF': csrf } })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            window.tlToast(d.removed + ' کاربر دمو و داده‌هایشان حذف شدند ✨', 'ok', { title: 'پاک‌سازی شد', duration: 2200 });
            setTimeout(function () { location.reload(); }, 1200);
          } else window.tlToast('خطا در پاک‌سازی', 'err', { title: 'ناموفق' });
        })
        .catch(function () { window.tlToast('خطای شبکه', 'err', { title: 'ناموفق' }); });
    });
  });

  // ── برچسب ستون جدول‌ها برای حالت کارت موبایل ──
  document.querySelectorAll('table.tbl').forEach(function (t) {
    t.querySelectorAll('th').forEach(function (th, i) {
      var txt = th.textContent.trim();
      t.querySelectorAll('tbody td:nth-child(' + (i + 1) + ')').forEach(function (td) {
        td.setAttribute('data-th', txt);
      });
    });
  });
})();
