// ─── اپ‌تم | اسکریپت مشترک فروشگاه (بدون وابستگی) ───
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

  var tBtn = document.getElementById('themeToggle');
  if (tBtn) tBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    lsSet('tl-theme', cur);
  });

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
    if (!deferredPrompt) { window.tlToast('برای نصب، از منوی مرورگر گزینه «Add to Home Screen» را بزنید 📱'); return; }
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

  // ── توست ──
  var toastBox = null;

  // ── سبد خرید (localStorage) ──
  var CART = 'tl_cart';
  // ═══ سبد خرید سروری (کوکی) — بدون وابستگی به localStorage ═══
  function api(method, url, body) {
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
  }
  var CART_CSS = '.cart-drawer{position:fixed;top:0;bottom:0;inset-inline-start:0;width:min(380px,92vw);background:var(--card,#fff);z-index:99990;box-shadow:0 0 60px rgba(8,12,32,.3);transform:translateX(115%);transition:.28s;display:flex;flex-direction:column;border-inline-end:1px solid var(--border,#e7eaf4)}.cart-drawer.on{transform:none}.cart-drawer header{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--border,#e7eaf4);position:static;background:none}.cart-drawer header b{font-size:1rem}.cart-drawer .cd-items{flex:1;overflow:auto;padding:12px 18px;display:grid;gap:10px;align-content:start}.cart-drawer .cd-it{display:flex;gap:10px;justify-content:space-between;align-items:center;border:1px solid var(--border,#e7eaf4);border-radius:12px;padding:10px 12px}.cart-drawer .cd-it b{font-size:.86rem}.cart-drawer .cd-it small{color:var(--muted,#66708c)}.cart-drawer footer{padding:14px 18px;border-top:1px solid var(--border,#e7eaf4);display:grid;gap:8px}.cart-drawer .cd-total{display:flex;justify-content:space-between;font-weight:700}.cd-x{border:0;background:none;font-size:1.3rem;cursor:pointer;color:inherit}';
  var st = document.createElement('style'); st.textContent = CART_CSS; document.head.appendChild(st);

  var drawerEl = null;
  function ensureDrawer() {
    if (drawerEl) return drawerEl;
    drawerEl = document.createElement('div');
    drawerEl.className = 'cart-drawer';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.innerHTML = '<header><b>🛒 سبد خرید شما</b><button class="cd-x" type="button" aria-label="بستن">×</button></header><div class="cd-items"></div><footer><div class="cd-total"><span>جمع:</span><b class="cd-sum">—</b></div><a class="btn lg" style="text-align:center" href="/cart">مشاهده سبد و تسویه</a></footer>';
    document.body.appendChild(drawerEl);
    drawerEl.querySelector('.cd-x').addEventListener('click', function () { drawerEl.classList.remove('on'); });
    document.addEventListener('click', function (e) { if (drawerEl.classList.contains('on') && !drawerEl.contains(e.target) && e.target.id !== 'cartBtn' && !e.target.closest('#cartBtn')) drawerEl.classList.remove('on'); });
    return drawerEl;
  }
  function faN(n) { return Number(n || 0).toLocaleString('fa-IR'); }
  window.tlCart = {
    summary: null,
    refresh: function () { return api('GET', '/cart/summary').then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; }); },
    add: function (id, silent) {
      return api('POST', '/cart/add', { productId: id }).then(function (d) {
        window.tlCart.summary = d; updateBadge(d.count);
        if (!silent) { window.tlToast('به سبد خرید اضافه شد ✓', 'ok'); openDrawer(d); }
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
    }).join('') || '<p class="muted" style="text-align:center;padding:20px">سبد خالی است</p>';
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
  function closeAuth() { authModal.classList.remove('on'); setTimeout(function () { authModal.hidden = true; }, 180); }
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
        github: 'برای فعال‌سازی ورود با گیت‌هاب:\n۱) در github.com/settings/developers یک OAuth App بسازید\n۲) آدرس کال‌بک: آدرس‌سایت/auth/github/callback\n۳) Client ID و Secret را در «ادمین → تنظیمات → ورود اجتماعی» وارد کنید\nفعلاً با ایمیل/موبایل وارد شوید 💡',
        google: 'برای فعال‌سازی ورود با گوگل (جیمیل):\n۱) در Google Cloud Console → Credentials یک OAuth Client (Web) بسازید\n۲) آدرس کال‌بک: آدرس‌سایت/auth/google/callback\n۳) Client ID و Secret را در «ادمین → تنظیمات → ورود اجتماعی» وارد کنید\nفعلاً با ایمیل/موبایل وارد شوید 💡',
        telegram: 'برای فعال‌سازی ورود با تلگرام:\n۱) از @BotFather ربات جدید بسازید (/newbot)\n۲) نام‌کاربری و توکن ربات را در «ادمین → تنظیمات → ورود اجتماعی» وارد کنید\nفعلاً با ایمیل/موبایل وارد شوید 💡',
        bale: 'بله هنوز OAuth استاندارد عمومی ندارد؛ راه جایگزین: ثبت‌نام با ایمیل/موبایل و پیام از داخل حساب به پشتیبانی 💡',
        rubika: 'روبیکا هنوز OAuth استاندارد عمومی دارد اما نیازمند ثبت‌نام توسعه‌دهنده در پنل روبیکاست؛ فعلاً با ایمیل/موبایل وارد شوید 💡'
      };
      window.tlAlert((guides[need.getAttribute('data-needs-setup')] || 'این روش هنوز فعال نشده؛ فعلاً با ایمیل/موبایل وارد شوید.').replace(/\\n/g, '<br>'));
    }
  });

  // دکمه سبد در هدر → drawer
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
          window.tlToast(d.error === 'auth' ? 'برای لایک ابتدا وارد شوید' : 'خطا در ثبت لایک', 'err');
        }
      }).catch(function () { delete like.dataset.busy; window.tlToast('خطای شبکه', 'err'); });
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
