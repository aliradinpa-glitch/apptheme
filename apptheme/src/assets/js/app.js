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
  function cart() { try { return JSON.parse(lsGet(CART)) || []; } catch (e) { return []; } }
  function cartSave(items) { lsSet(CART, JSON.stringify(items)); updateBadge(); }
  window.tlCart = {
    add: function (id) {
      var items = cart();
      var found = items.filter(function (x) { return String(x.id) === String(id); })[0];
      if (found) found.qty = (found.qty || 1) + 1; else items.push({ id: String(id), qty: 1 });
      cartSave(items);
      window.tlToast('به سبد خرید اضافه شد ✓', 'ok');
    },
    remove: function (id) { cartSave(cart().filter(function (x) { return String(x.id) !== String(id); })); },
    setQty: function (id, qty) {
      var items = cart();
      for (var i = 0; i < items.length; i++)
        if (String(items[i].id) === String(id)) items[i].qty = Math.max(1, Math.min(10, qty || 1));
      cartSave(items);
    },
    items: cart
  };
  function updateBadge() {
    var el = document.getElementById('cartCount');
    if (!el) return;
    var n = cart().reduce(function (s, x) { return s + (x.qty || 1); }, 0);
    el.hidden = n === 0;
    el.textContent = n.toLocaleString('fa-IR');
  }
  updateBadge();

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add-to-cart]');
    if (add) { e.preventDefault(); window.tlCart.add(add.getAttribute('data-add-to-cart')); return; }

    var rm = e.target.closest('[data-cart-remove]');
    if (rm) {
      e.preventDefault();
      window.tlCart.remove(rm.getAttribute('data-cart-remove'));
      if (window.renderCart) window.renderCart();
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
