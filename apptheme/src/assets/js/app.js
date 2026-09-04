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

  // ═══ سبد خرید سروری (کوکی) — نسخه حرفه‌ای ═══
  function api(method, url, body) {
    var csrf = (document.querySelector('meta[name="csrf"]') || {}).content || '';
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF': csrf },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
  }

  // ── استایل کشوی سبد ──
  var DRAWER_CSS = [
    '.cd-backdrop{position:fixed;inset:0;background:rgba(4,7,18,.62);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:.25s;z-index:99970}',
    '.cd-backdrop.on{opacity:1;pointer-events:auto}',
    '.cart-drawer{position:fixed;top:0;bottom:0;inset-inline-start:0;width:min(420px,100vw);z-index:99980;display:flex;flex-direction:column;background:var(--surface,#161b31);border-inline-end:1px solid var(--border,#283163);box-shadow:0 0 90px rgba(2,4,16,.75);transform:translateX(115%);transition:transform .32s cubic-bezier(.32,.9,.28,1)}',
    '.cart-drawer.on{transform:none}',
    '[dir="rtl"] .cart-drawer{inset-inline-start:auto;inset-inline-end:0;transform:translateX(-115%)}',
    '[dir="rtl"] .cart-drawer.on{transform:none}',
    '.cart-drawer header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border,#283163);gap:10px}',
    '.cart-drawer header .cd-h{display:flex;align-items:center;gap:10px}',
    '.cart-drawer header b{font-size:1.05rem}',
    '.cd-count{background:var(--primary,#7c5cff);color:#fff;font-size:.72rem;font-weight:800;padding:3px 9px;border-radius:99px;min-width:22px;text-align:center}',
    '.cd-x{border:0;background:none;font-size:1.35rem;cursor:pointer;color:inherit;opacity:.55;transition:.2s;line-height:1;width:34px;height:34px;border-radius:10px}',
    '.cd-x:hover{opacity:1;background:color-mix(in srgb,var(--border,#283163) 60%,transparent);transform:rotate(90deg)}',
    '.cd-ship{padding:12px 20px;border-bottom:1px solid var(--border,#283163);display:grid;gap:6px}',
    '.cd-ship .cd-ship-t{font-size:.76rem;color:var(--muted,#96a1cd);display:flex;justify-content:space-between}',
    '.cd-ship .cd-ship-t b{color:var(--ok,#34d399)}',
    '.cd-ship .cd-ship-bar{height:6px;border-radius:99px;background:color-mix(in srgb,var(--border,#283163) 70%,transparent);overflow:hidden}',
    '.cd-ship .cd-ship-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--primary,#7c5cff),#22d3ee);transition:width .4s}',
    '.cd-items{flex:1;overflow:auto;padding:12px 16px;display:grid;gap:10px;align-content:start}',
    '.cd-it{display:flex;gap:12px;align-items:flex-start;border:1px solid var(--border,#283163);border-radius:16px;padding:12px;background:color-mix(in srgb,var(--surface-2,#1a2250) 62%,transparent);position:relative;transition:.18s}',
    '.cd-it:hover{border-color:color-mix(in srgb,var(--primary,#7c5cff) 42%,var(--border,#283163))}',
    '.cd-thumb{width:52px;height:52px;border-radius:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}',
    '.cd-main{flex:1;min-width:0;display:grid;gap:3px}',
    '.cd-title{font-size:.9rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cd-title a{color:inherit;text-decoration:none}',
    '.cd-title a:hover{color:var(--primary,#7c5cff)}',
    '.cd-price{font-size:.75rem;color:var(--muted,#96a1cd)}',
    '.cd-old{text-decoration:line-through;opacity:.6;margin-inline-end:6px}',
    '.cd-ctl{display:flex;justify-content:space-between;align-items:center;margin-top:6px}',
    '.cd-qty{display:flex;align-items:center;gap:2px;border:1px solid var(--border,#283163);border-radius:10px;overflow:hidden}',
    '.cd-qty button{width:26px;height:26px;border:0;background:color-mix(in srgb,var(--surface-2,#1a2250) 70%,transparent);color:inherit;cursor:pointer;font-size:.95rem;line-height:1;transition:.15s}',
    '.cd-qty button:hover{background:var(--primary,#7c5cff);color:#fff}',
    '.cd-qty span{min-width:26px;text-align:center;font-size:.85rem;font-weight:700}',
    '.cd-line{font-size:.92rem}',
    '.cd-rm{width:26px;height:26px;border-radius:8px;border:1px solid rgba(251,113,133,.3);background:rgba(251,113,133,.08);color:#fb7185;cursor:pointer;transition:.18s;font-size:.8rem;line-height:1;flex-shrink:0}',
    '.cd-rm:hover{background:#fb7185;color:#fff;box-shadow:0 5px 14px rgba(251,113,133,.3)}',
    '.cart-drawer footer{padding:14px 20px 18px;border-top:1px solid var(--border,#283163);display:grid;gap:8px;background:color-mix(in srgb,var(--surface-2,#1a2250) 55%,transparent)}',
    '.cd-save{display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted,#96a1cd)}',
    '.cd-save b{color:var(--ok,#34d399)}',
    '.cd-total{display:flex;justify-content:space-between;align-items:baseline}',
    '.cd-total b{font-size:1.15rem}',
    '.cd-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}',
    '.cd-acts .btn{justify-content:center;text-align:center}',
    '.cd-empty{text-align:center;padding:36px 16px;color:var(--muted,#96a1cd)}',
    '.cd-empty b{display:block;font-size:1rem;color:var(--fg,#e9edff);margin-bottom:6px}',
    '@media (max-width:640px){.cart-drawer{width:100vw;border-inline-end:0}.cd-acts{grid-template-columns:1fr}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = DRAWER_CSS; document.head.appendChild(st);

  var drawerEl = null, backdropEl = null;
  function ensureDrawer() {
    if (drawerEl) return drawerEl;
    backdropEl = document.createElement('div'); backdropEl.className = 'cd-backdrop'; document.body.appendChild(backdropEl);
    drawerEl = document.createElement('div');
    drawerEl.className = 'cart-drawer';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-modal', 'true');
    drawerEl.setAttribute('aria-label', 'سبد خرید');
    drawerEl.innerHTML =
      '<header><div class="cd-h"><b>سبد خرید</b><span class="cd-count">۰</span></div>' +
      '<button class="cd-x" type="button" aria-label="بستن">×</button></header>' +
      '<div class="cd-ship"><div class="cd-ship-t"><span class="cd-ship-msg"></span><b class="cd-ship-ok" hidden>ارسال رایگان فعال شد</b></div>' +
      '<div class="cd-ship-bar"><i style="width:0%"></i></div></div>' +
      '<div class="cd-items"></div>' +
      '<footer>' +
      '<div class="cd-save"><span>سود شما از خرید</span><b class="cd-savings">—</b></div>' +
      '<div class="cd-total"><span class="muted">جمع سبد</span><b class="cd-sum">—</b></div>' +
      '<div class="cd-acts"><a class="btn lg" href="/cart">مشاهده سبد</a><a class="btn lg soft" href="/checkout">تسویه حساب</a></div>' +
      '</footer>';
    document.body.appendChild(drawerEl);
    drawerEl.querySelector('.cd-x').addEventListener('click', closeDrawer);
    backdropEl.addEventListener('click', closeDrawer);
    drawerEl.addEventListener('click', function (e) {
      var q = e.target.closest('[data-dq]');
      if (q) {
        var row = q.closest('[data-cid]'); if (!row) return;
        var id = row.getAttribute('data-cid');
        var cur = Number(row.querySelector('.cd-qty span').textContent.replace(/[^\d]/g, '')) || 1;
        var next = Math.max(1, Math.min(10, cur + (Number(q.getAttribute('data-dq')) || 0)));
        if (next === cur) return;
        window.tlCart.setQty(id, next).then(function (d) { if (window.tlCart.summary) renderDrawer(window.tlCart.summary); }).catch(function () {});
        return;
      }
      var rm = e.target.closest('[data-drm]');
      if (rm) {
        var row2 = rm.closest('[data-cid]'); if (!row2) return;
        var id2 = row2.getAttribute('data-cid');
        window.tlCart.remove(id2).then(function (d) {
          if (window.tlCart.summary) renderDrawer(window.tlCart.summary);
          window.tlToast('از سبد حذف شد', 'warn', {
            title: 'حذف شد', duration: 6000,
            action: { label: 'بازگردانی', fn: function () { window.tlCart.add(id2, true).then(function (d2) { if (window.tlCart.summary) renderDrawer(window.tlCart.summary); }); } },
          });
        }).catch(function () {});
        return;
      }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && drawerEl.classList.contains('on')) closeDrawer();
    });
    return drawerEl;
  }
  function closeDrawer() {
    if (!drawerEl) return;
    drawerEl.classList.remove('on');
    if (backdropEl) backdropEl.classList.remove('on');
  }
  function openDrawer(d) {
    ensureDrawer();
    renderDrawer(d || window.tlCart.summary);
    drawerEl.classList.add('on');
    if (backdropEl) backdropEl.classList.add('on');
  }
  function faN(n) { return Number(n || 0).toLocaleString('fa-IR'); }
  function thumbHTML(it) {
    var pal = (it.palette && it.palette[0] && it.palette[1]) ? it.palette : ['#7c5cff', '#22d3ee'];
    var letter = (it.title || '؟').trim().charAt(0);
    return '<div class="cd-thumb" style="background:linear-gradient(135deg,' + pal[0] + ',' + pal[1] + ')"><span>' + letter + '</span></div>';
  }
  function renderDrawer(d) {
    if (!drawerEl) return;
    var items = (d && d.items) || [];
    drawerEl.querySelector('.cd-count').textContent = faN(d ? d.count : 0);
    var box = drawerEl.querySelector('.cd-items');
    box.innerHTML = items.length ? items.map(function (it) {
      return '<div class="cd-it" data-cid="' + it.id + '">' +
        thumbHTML(it) +
        '<div class="cd-main">' +
        '<div class="cd-title"><a href="/templates/' + it.slug + '">' + it.title + '</a></div>' +
        '<div class="cd-price"><span class="cd-old">' + (it.oldPrice ? faN(it.oldPrice) : '') + '</span>' + faN(it.price) + ' تومان</div>' +
        '<div class="cd-ctl"><div class="cd-qty"><button type="button" data-dq="-1" aria-label="کمتر">−</button><span>' + faN(it.qty) + '</span><button type="button" data-dq="1" aria-label="بیشتر">+</button></div>' +
        '<b class="cd-line">' + faN(it.line) + ' تومان</b></div></div>' +
        '<button class="cd-rm" type="button" data-drm aria-label="حذف ' + it.title + '" title="حذف از سبد">×</button></div>';
    }).join('') : '<div class="cd-empty"><b>سبد خرید شما خالی است</b>قالب‌های حرفه‌ای اپ‌تم منتظر شما هستند.</div>';
    var ship = drawerEl.querySelector('.cd-ship');
    if (items.length) {
      var left = Number(d.freeShipLeft || 0);
      var has = Number(window.FREE_SHIP_THRESHOLD || 500000);
      var pct = Math.min(100, Math.round((Number(d.subtotal || 0) / has) * 100));
      ship.hidden = false;
      drawerEl.querySelector('.cd-ship-msg').textContent = left > 0 ? 'تا ارسال رایگان ' + faN(left) + ' تومان مانده' : 'ارسال رایگان';
      drawerEl.querySelector('.cd-ship-ok').hidden = left > 0;
      drawerEl.querySelector('.cd-ship-bar i').style.width = pct + '%';
    } else ship.hidden = true;
    drawerEl.querySelector('.cd-savings').textContent = faN(d.savings) + (d.savings ? ' تومان' : '');
    drawerEl.querySelector('.cd-sum').textContent = faN(d.subtotal) + ' تومان';
    var acts = drawerEl.querySelectorAll('.cd-acts a');
    if (acts[1]) acts[1].href = items.length ? '/checkout?items=' + items.map(function (x) { return x.id; }).join(',') : '/cart';
  }

  window.tlCart = {
    summary: null,
    refresh: function () {
      return api('GET', '/cart/summary').then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; });
    },
    add: function (id, silent) {
      return api('POST', '/cart/add', { productId: id }).then(function (d) {
        window.tlCart.summary = d; updateBadge(d.count);
        if (!silent) {
          window.tlToast('به سبد خرید اضافه شد', 'ok', { title: 'سبد خرید' });
          openDrawer(d);
        }
        return d;
      }).catch(function () { location.href = '/cart'; });
    },
    remove: function (id) {
      return api('POST', '/cart/remove', { productId: id }).then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; });
    },
    setQty: function (id, qty) {
      return api('POST', '/cart/qty', { productId: id, qty: qty }).then(function (d) { window.tlCart.summary = d; updateBadge(d.count); return d; });
    },
    open: openDrawer, close: closeDrawer
  };

  // بوت: خواندن سبد از سرور + مهاجرت یک‌باره از localStorage قدیمی
  (function () {
    var legacy = null;
    try { legacy = JSON.parse(localStorage.getItem('tl_cart')); } catch (e) {}
    var boot = legacy && legacy.length
      ? api('POST', '/cart/sync', { items: legacy }).then(function (d) { try { localStorage.removeItem('tl_cart'); } catch (e) {} return d; })
      : window.tlCart.refresh();
    boot.then(function (d) { window.tlCart.summary = d; updateBadge(d.count); }).catch(function () {});
  })();

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
