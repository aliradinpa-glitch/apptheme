// ═══ فروشگاه: جستجوی زنده + دکمه خرید/حذف کارت‌ها بدون رفرش ═══
(function () {
  'use strict';
  var input = document.getElementById('liveSearch');
  var grid = document.getElementById('catalogGrid');
  if (!grid) return;

  // ── جستجوی زنده ──
  var timer = null;
  function fetchGrid(url) {
    var hint = document.getElementById('searchHint');
    if (hint) hint.hidden = false;
    fetch(url, { headers: { 'X-Partial': 'grid' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.getElementById('catalogGrid');
        if (fresh) { grid.innerHTML = fresh.innerHTML; bindToggles(); }
        if (hint) hint.hidden = true;
      })
      .catch(function () { if (hint) hint.hidden = true; });
  }
  if (input) input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var u = new URL(location.href);
      if (input.value.trim()) u.searchParams.set('q', input.value.trim()); else u.searchParams.delete('q');
      u.searchParams.delete('page');
      history.replaceState(null, '', u);
      fetchGrid(u);
    }, 320);
  });

  // ── خرید/حذف روی کارت — بدون رفرش ──
  function api(method, url, body) {
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
  }
  function paintBtn(btn, inCart) {
    btn.classList.toggle('ghost', inCart);
    btn.classList.toggle('cart-in', inCart);
    btn.textContent = inCart ? '✓ در سبد — حذف' : '🛒 افزودن به سبد';
  }
  function bindToggles() {
    grid.querySelectorAll('[data-cart-toggle]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-cart-toggle');
        var wasIn = btn.classList.contains('cart-in');
        btn.disabled = true;
        api('POST', wasIn ? '/cart/remove' : '/cart/add', { productId: id }).then(function (d) {
          btn.disabled = false;
          if (!d.ok) return;
          paintBtn(btn, !wasIn);
          if (window.tlCart) { window.tlCart.summary = d; }
          var badge = document.getElementById('cartCount');
          if (badge) { badge.hidden = !d.count; badge.textContent = Number(d.count || 0).toLocaleString('fa-IR'); }
          window.tlToast(wasIn ? 'از سبد حذف شد' : 'به سبد خرید اضافه شد ✓', wasIn ? '' : 'ok');
        }).catch(function () { btn.disabled = false; window.tlAlert('خطای شبکه', 'err'); });
      });
    });
  }
  bindToggles();
})();
