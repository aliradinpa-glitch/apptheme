// ═══ اپ‌تم | اسکریپت مشترک فروشگاه نئونی 2.0 (بدون وابستگی) ═══
(function () {
  'use strict';

  // ── ذخیره‌سازی امن (اگر iframe اجازه نداد، کرش نکن) ──
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

  // ── منوی کاربری (دراپ‌داون) ──
  var chip = document.getElementById('userChip');
  var menu = document.getElementById('userMenu');
  if (chip && menu) {
    chip.addEventListener('click', function (e) {
      if (e.target.closest('.user-menu')) return;
      menu.classList.toggle('on');
      chip.setAttribute('aria-expanded', menu.classList.contains('on') ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('on') && !chip.contains(e.target)) {
        menu.classList.remove('on');
        chip.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { menu.classList.remove('on'); chip.setAttribute('aria-expanded', 'false'); }
    });
  }

  // ── نصب اپ موبایل (PWA) ──
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var ib = document.getElementById('installBtn');
    if (ib) ib.hidden = false;
  });
  var ib = document.getElementById('installBtn');
  if (ib) ib.addEventListener('click', function () {
    if (!deferredPrompt) { window.tlToast('برای نصب، از منوی مرورگر «Add to Home Screen» را بزنید 📱', 'info', { title: 'نصب اپ' }); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () { deferredPrompt = null; ib.hidden = true; });
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // ── منوی موبایل ──
  var burger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  if (burger && navLinks) burger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });

  // ═══ سبد خرید سروری (کوکی) ═══
  function api(method, url, body) {
    var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF': csrf },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
  }

  // ── استایل کشوی سبد (نئونی) ──
  var DRAWER_CSS = [
    '.cart-drawer{position:fixed;top:0;bottom:0;inset-inline-start:0;width:min(390px,94vw);z-index:99980;display:flex;flex-direction:column;background:linear-gradient(170deg,color-mix(in srgb,var(--surface,#161b31) 90%,var(--primary,#7c5cff) 10%),var(--surface,#161b31));border-inline-end:1px solid var(--border,#283163);box-shadow:0 0 80px rgba(2,4,16,.7);transform:translateX(115%);transition:.3s cubic-bezier(.3,.9,.3,1)}',
    '.cart-drawer.on{transform:none}',
    '.cart-drawer::before{content:\'\';position:absolute;top:0;inset-inline:0;height:3px;background:linear-gradient(90deg,var(--primary,#7c5cff),#22d3ee,#f472b6);background-size:220% 100%;animation:cdFlow 6s linear infinite}',
    '@keyframes cdFlow{to{background-position:220% 0}}',
    '.cart-drawer header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--border,#283163)}',
    '.cart-drawer header b{font-size:1.02rem}',
    '.cart-drawer .cd-items{flex:1;overflow:auto;padding:14px 18px;display:grid;gap:10px;align-content:start}',
    '.cart-drawer .cd-it{display:flex;gap:10px;justify-content:space-between;align-items:center;border:1px solid var(--border,#283163);border-radius:14px;padding:12px 14px;background:color-mix(in srgb,var(--surface-2,#1a2250) 70%,transparent);transition:.18s}',
    '.cart-drawer .cd-it:hover{border-color:color-mix(in srgb,var(--primary,#7c5cff) 45%,var(--border,#283163))}',
    '.cart-drawer .cd-it b{font-size:.86rem}',
    '.cart-drawer .cd-it small{color:var(--muted,#96a1cd)}',
    '.cart-drawer footer{padding:16px 20px;border-top:1px solid var(--border,#283163);display:grid;gap:10px;background:color-mix(in srgb,var(--surface-2,#1a2250) 55%,transparent)}',
    '.cart-drawer .cd-total{display:flex;justify-content:space-between;font-weight:800;font-size:1rem}',
    '.cd-x{border:0;background:none;font-size:1.4rem;cursor:pointer;color:inherit;opacity:.6;transition:.2s;line-height:1}',
    '.cd-rm{flex-shrink:0;width:30px;height:30px;border-radius:9px;border:1px solid rgba(251,113,133,.3);background:rgba(251,113,133,.1);color:#fb7185;font-size:.85rem;cursor:pointer;transition:.18s;line-height:1}',
    '.cd-rm:hover{background:#fb7185;color:#fff;box-shadow:0 6px 16px rgba(251,113,133,.35);transform:rotate(90deg)}',
    '.cd-x:hover{opacity:1;color:#fb7185;transform:rotate(90deg)}',
    '[dir="rtl"] .cart-drawer{inset-inline-start:auto;inset-inline-end:0;transform:translateX(-115%)}',
    '[dir="rtl"] .cart-drawer.on{transform:none}'
  ].join('');
  var st = document.createElement('style'); st.textContent = DRAWER_CSS; document.head.appendChild(st);

  var drawerEl = null;
  function ensureDrawer() {
    if (drawerEl) return drawerEl;
    drawerEl = document.createElement('div');
    drawerEl.className = 'cart-drawer';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-label', 'سبد خرید');
    drawerEl.innerHTML = '<header><b>🛒 سبد خرید شما</b><button class="cd-x" type="button" aria-label="بستن">×</button></header><div class="cd-items"></div><footer><div class="cd-total"><span>جمع سبد:</span><b class="cd-sum">—</b></div><a class="btn lg" style="text-align:center;width:100%" href="/cart">مشاهده سبد و تسویه</a></footer>';
    document.body.appendChild(drawerEl);
    drawerEl.querySelector('.cd-x').addEventListener('click', function () { drawerEl.classList.remove('on'); });
    document.addEventListener('click', function (e) {
      if (drawerEl.classList.contains('on') && !drawerEl.contains(e.target) && e.target.id !== 'cartBtn' && !e.target.closest('#cartBtn')) drawerEl.classList.remove('on');
    });
    return drawerEl;
  }
  function faN(n) { return Number(n || 0).toLocaleString('fa-IR'); }

  window.tlCart = {
    summary: null,
    refresh: function () { return api('GET', '/cart/summary').then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; }); },
    add: function (id, silent) {
      return api('POST', '/cart/add', { productId: id }).then(function (d) {
        window.tlCart.summary = d; updateBadge(d.count);
        if (!silent) { window.tlToast('به سبد خرید اضافه شد', 'ok', { title: 'سبد خرید' }); openDrawer(d); }
        return d;
      }).catch(function () { location.href = '/cart'; });
    },
    remove: function (id) { return api('POST', '/cart/remove', { productId: id }).then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; }); },
    setQty: function (id, qty) { return api('POST', '/cart/qty', { productId: id, qty: qty }).then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; }); }
  };

  function openDrawer(d) {
    var dr = ensureDrawer();
    var box = dr.querySelector('.cd-items');
    box.innerHTML = (d.items || []).map(function (it) {
      return '<div class="cd-it"><div class="grow"><b>' + it.title + '</b><br><small>' + faN(it.qty) + ' × ' + faN(it.price) + ' تومان</small></div><b>' + faN(it.line) + '</b><button class="cd-rm" type="button" data-drawer-remove="' + it.id + '" aria-label="حذف ' + it.title + '" title="حذف از سبد">✕</button></div>';
    }).join('') || '<p class="muted" style="text-align:center;padding:24px">سبد خرید شما خالی است 🛒</p>';
    dr.querySelector('.cd-sum').textContent = faN(d.subtotal) + ' تومان';
    dr.querySelector('footer a.btn').href = d.items && d.items.length ? '/checkout?items=' + d.items.map(function (x) { return x.id; }).join(',') : '/cart';
    dr.classList.add('on');
  }
  function updateBadge(n) {
    var el = document.getElementById('cartCount');
    if (!el) return;
    el.hidden = !n;
    el.textContent = faN(n);
  }

  // بوت: خواندن سبد از سرور + مهاجرت یک‌باره از localStorage قدیمی
  (function () {
    var legacy = null;
    try { legacy = JSON.parse(localStorage.getItem('tl_cart')); } catch (e) {}
    var boot = legacy && legacy.length
      ? api('POST', '/cart/sync', { items: legacy }).then(function (d) { try { localStorage.removeItem('tl_cart'); } catch (e) {} return d; })
      : window.tlCart.refresh();
    boot.then(function (d) { window.tlCart.summary = d; updateBadge(d.count); }).catch(function () {});
  })();

  // ═══ مودال ورود/ثبت‌نام/بازیابی رمز (سه وضعیت در یک مودال) ═══
  var authModal = document.getElementById('authModal');
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && authModal && !authModal.hidden) closeAuth(); });
  function openAuth(view) {
    if (!authModal) { location.href = '/' + (view || 'login'); return; }
    var forgotBox = document.getElementById('forgotDone');
    if (forgotBox) forgotBox.classList.add('hide');
    authModal.hidden = false;
    requestAnimationFrame(function () { authModal.classList.add('on'); });
    switchView(view || 'login');
    document.body.style.overflow = 'hidden';
  }
  function closeAuth() {
    authModal.classList.remove('on');
    setTimeout(function () { authModal.hidden = true; document.body.style.overflow = ''; }, 220);
  }
  function switchView(view) {
    if (!authModal) return;
    authModal.querySelectorAll('.auth-view').forEach(function (v) { v.classList.toggle('on', v.getAttribute('data-view') === view); });
    var sw = document.getElementById('authSwitchTxt'), swr = document.getElementById('authSwitchTxtR');
    if (sw) sw.classList.toggle('hide', view === 'login');
    if (swr) swr.classList.toggle('hide', view !== 'login');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-auth]');
    if (t) { e.preventDefault(); openAuth(t.getAttribute('data-auth')); return; }
    if (e.target.closest('[data-close-auth]')) { if (authModal) closeAuth(); return; }
    var ov = e.target.closest('[data-open-view]');
    if (ov && authModal) { e.preventDefault(); switchView(ov.getAttribute('data-open-view')); return; }
    // نمایش/مخفی رمز عبور
    var eye = e.target.closest('[data-eye]');
    if (eye) {
      var inp = document.getElementById(eye.getAttribute('data-eye'));
      if (inp) {
        var isPass = inp.type === 'password';
        inp.type = isPass ? 'text' : 'password';
        eye.textContent = isPass ? '🙈' : '👁';
      }
    }

    // ── قدرت رمز عبور (نوار ۴ قسمتی) ──
    var regPass = document.getElementById('regPass');
    if (regPass && !regPass.dataset.bound) {
      regPass.dataset.bound = '1';
      regPass.addEventListener('input', function () {
        var box = document.getElementById('passStrength');
        if (!box) return;
        var v = regPass.value || '';
        var score = 0;
        if (v.length >= 8) score++;
        if (v.length >= 12) score++;
        if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
        if (/[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
        box.className = 'af-strength' + (v ? ' s' + score : '');
      });
    }

    // ── بازیابی رمز بدون رفرش (در مودال) ──
    var forgotForm = document.getElementById('authFormForgot');
    if (forgotForm && !forgotForm.dataset.bound) {
      forgotForm.dataset.bound = '1';
      forgotForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var btn = forgotForm.querySelector('button[type=submit]');
        var idf = forgotForm.querySelector('[name=identifier]');
        if (!idf || !idf.value.trim()) { window.tlToast('ایمیل را وارد کن', 'err', { title: 'بازیابی رمز' }); return; }
        btn.disabled = true; btn.textContent = '… در حال ارسال';
        var fd = new FormData(forgotForm);
        fetch('/forgot', { method: 'POST', body: fd, headers: { 'X-Requested-With': 'fetch' } })
          .then(function () {
            forgotForm.classList.add('hide');
            document.getElementById('forgotDone').classList.remove('hide');
          })
          .catch(function () { window.tlToast('خطای شبکه؛ دوباره تلاش کن', 'err', { title: 'بازیابی رمز' }); })
          .finally(function () { btn.disabled = false; btn.textContent = 'ارسال لینک بازنشانی ✉️'; });
      });
    }
    // راهنمای فعال‌سازی ورود اجتماعی
    var need = e.target.closest('[data-needs-setup]');
    if (need) {
      e.preventDefault();
      var guides = {
        github: 'برای فعال‌سازی ورود با گیت‌هاب:<br>۱) در github.com/settings/developers یک OAuth App بسازید<br>۲) آدرس کال‌بک: <b>آدرس‌سایت/auth/github/callback</b><br>۳) Client ID و Secret را در «ادمین ← تنظیمات ← ورود اجتماعی» وارد کنید<br>فعلاً با ایمیل/موبایل وارد شوید 💡',
        google: 'برای فعال‌سازی ورود با گوگل (جیمیل):<br>۱) در Google Cloud Console ← Credentials یک OAuth Client (Web) بسازید<br>۲) آدرس کال‌بک: <b>آدرس‌سایت/auth/google/callback</b><br>۳) Client ID و Secret را در «ادمین ← تنظیمات ← ورود اجتماعی» وارد کنید<br>فعلاً با ایمیل/موبایل وارد شوید 💡',
        telegram: 'برای فعال‌سازی ورود با تلگرام:<br>۱) از <b>@BotFather</b> ربات جدید بسازید (/newbot)<br>۲) نام‌کاربری و توکن ربات را در «ادمین ← تنظیمات ← ورود اجتماعی» وارد کنید<br>فعلاً با ایمیل/موبایل وارد شوید 💡',
        bale: 'بله هنوز OAuth استاندارد عمومی ندارد؛ راه جایگزین: ثبت‌نام با ایمیل/موبایل و پیام از داخل حساب به پشتیبانی 💡',
        rubika: 'روبیکا هنوز OAuth استاندارد عمومی دارد اما نیازمند ثبت‌نام توسعه‌دهنده در پنل روبیکاست؛ فعلاً با ایمیل/موبایل وارد شوید 💡'
      };
      window.tlAlert((guides[need.getAttribute('data-needs-setup')] || 'این روش هنوز فعال نشده؛ فعلاً با ایمیل/موبایل وارد شوید.'), 'info', 'راهنمای فعال‌سازی');
    }
  });

  // دکمه سبد در هدر → کشو
  document.addEventListener('click', function (e) {
    var cb = e.target.closest('#cartBtn');
    if (cb) {
      e.preventDefault();
      window.tlCart.refresh().then(openDrawer).catch(function () { location.href = '/cart'; });
    }
  });

  // ── حذف آیتم از کشوی سبد (با تأیید + بازگردانی) ──
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-drawer-remove]');
    if (!rm) return;
    e.preventDefault();
    var id = rm.getAttribute('data-drawer-remove');
    window.tlConfirm('این قالب از سبد حذف شود؟', { okText: 'بله، حذف کن', danger: true, icon: '🗑', title: 'حذف از سبد' })
      .then(function (ok) {
        if (!ok) return;
        return window.tlCart.remove(id).then(function () {
          if (window.tlCart.summary) openDrawerSilent(window.tlCart.summary);
          window.tlToast('قالب از سبد حذف شد', 'warn', {
            title: 'حذف شد',
            duration: 6000,
            action: { label: '↩ بازگردانی', fn: function () { window.tlCart.add(id, true).then(function (d) { openDrawerSilent(d); }); } },
          });
        });
      });
  });
  function openDrawerSilent(d) {
    if (!drawerEl || !drawerEl.classList.contains('on')) return; // فقط اگر کشو باز است رفرش کن
    var box = drawerEl.querySelector('.cd-items');
    box.innerHTML = (d.items || []).map(function (it) {
      return '<div class="cd-it"><div class="grow"><b>' + it.title + '</b><br><small>' + faN(it.qty) + ' × ' + faN(it.price) + ' تومان</small></div><b>' + faN(it.line) + '</b><button class="cd-rm" type="button" data-drawer-remove="' + it.id + '" title="حذف از سبد">✕</button></div>';
    }).join('') || '<p class="muted" style="text-align:center;padding:24px">سبد خرید شما خالی است 🛒</p>';
    drawerEl.querySelector('.cd-sum').textContent = faN(d.subtotal) + ' تومان';
  }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add-to-cart]');
    if (add) { e.preventDefault(); window.tlCart.add(add.getAttribute('data-add-to-cart')); return; }

    var rm = e.target.closest('[data-cart-remove]');
    if (rm) {
      e.preventDefault();
      window.tlCart.remove(rm.getAttribute('data-cart-remove')).then(function () { location.reload(); });
      return;
    }

    // ── لایک ──
    var like = e.target.closest('[data-like]');
    if (like) {
      e.preventDefault();
      if (like.dataset.busy) return;
      like.dataset.busy = '1';
      var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
      fetch('/api/products/' + like.getAttribute('data-like') + '/like', {
        method: 'POST',
        headers: { 'X-CSRF': csrf }
      }).then(function (r) { return r.json(); }).then(function (d) {
        delete like.dataset.busy;
        if (d.ok) {
          like.classList.toggle('liked', d.liked);
          var cnt = like.querySelector('span');
          if (cnt) cnt.textContent = Number(d.count).toLocaleString('fa-IR');
        } else {
          window.tlToast(d.error === 'auth' ? 'برای لایک ابتدا وارد شوید' : 'خطا در ثبت لایک', 'err', { title: 'لایک' });
        }
      }).catch(function () { delete like.dataset.busy; window.tlToast('خطای شبکه', 'err', { title: 'لایک' }); });
    }
  });

  // ── تغییر تعداد در صفحه سبد ──
  document.addEventListener('change', function (e) {
    var q = e.target.closest && e.target.closest('[data-cart-qty]');
    if (q) {
      window.tlCart.setQty(q.getAttribute('data-cart-qty'), parseInt(q.value, 10) || 1);
      if (window.renderCart) window.renderCart();
    }
  });

  // ── انتخاب امتیاز در فرم نظر ──
  var ratePick = document.getElementById('ratePick');
  if (ratePick) {
    var stars = ratePick.querySelectorAll('button');
    var input = document.getElementById('ratingInput');
    stars.forEach(function (s, i) {
      s.addEventListener('mouseenter', function () { paint(i + 1); });
      s.addEventListener('mouseleave', function () { paint(parseInt((input && input.value) || 0, 10)); });
      s.addEventListener('click', function () {
        if (input) input.value = i + 1;
        paint(i + 1);
      });
    });
    function paint(n) { stars.forEach(function (s2, j) { s2.classList.toggle('on', j < n); }); }
  }

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
