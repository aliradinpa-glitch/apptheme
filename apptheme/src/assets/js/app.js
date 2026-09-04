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
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
      return '<div class="cd-it"><div><b>' + it.title + '</b><br><small>' + faN(it.qty) + ' × ' + faN(it.price) + ' تومان</small></div><b>' + faN(it.line) + '</b></div>';
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

  // ═══ مودال ورود/ثبت‌نام ═══
  var authModal = document.getElementById('authModal');
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && authModal && !authModal.hidden) closeAuth(); });
  function openAuth(tab) {
    if (!authModal) { location.href = '/' + (tab || 'login'); return; }
    authModal.hidden = false;
    requestAnimationFrame(function () { authModal.classList.add('on'); });
    switchTab(tab || 'login');
  }
  function closeAuth() { authModal.classList.remove('on'); setTimeout(function () { authModal.hidden = true; }, 200); }
  function switchTab(tab) {
    if (!authModal) return;
    authModal.querySelectorAll('#authTabs a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === tab); });
    var f1 = document.getElementById('authFormLogin'), f2 = document.getElementById('authFormReg');
    if (f1) f1.hidden = tab !== 'login';
    if (f2) f2.hidden = tab !== 'register';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-auth]');
    if (t) { e.preventDefault(); openAuth(t.getAttribute('data-auth')); return; }
    if (e.target.closest('[data-close-auth]')) { if (authModal) closeAuth(); return; }
    var tab = e.target.closest('#authTabs a');
    if (tab && authModal) { e.preventDefault(); switchTab(tab.getAttribute('data-tab')); return; }
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
})();
