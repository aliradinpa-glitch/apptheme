// ─── رندر سمت کاربرِ سبد خرید ───
(function () {
  'use strict';
  var box = document.getElementById('cartBox');
  var dataEl = document.getElementById('cartData');
  if (!box || !dataEl) return;
  var products;
  try { products = JSON.parse(dataEl.textContent); } catch (e) { products = []; }
  var byId = {};
  products.forEach(function (p) { byId[String(p.id)] = p; });

  window.renderCart = function () {
    var items = window.tlCart ? window.tlCart.items() : [];
    if (!items.length) {
      box.innerHTML = '<div class="empty-state"><div class="ic">🛒</div><p>سبد خرید شما خالی است.</p>' +
        '<a class="btn" style="margin-top:16px" href="/templates">مشاهده قالب‌ها</a></div>';
      return;
    }
    var total = 0;
    var rows = items.map(function (it) {
      var p = byId[String(it.id)];
      if (!p) return '';
      var t = p.price * (it.qty || 1);
      total += t;
      return '<tr>' +
        '<td><a href="/templates/' + p.slug + '" style="color:var(--primary)">' + p.title + '</a></td>' +
        '<td style="width:120px"><input class="input" type="number" min="1" max="10" value="' + (it.qty || 1) + '" data-cart-qty="' + p.id + '" style="padding:7px 10px"></td>' +
        '<td style="white-space:nowrap">' + t.toLocaleString('fa-IR') + ' تومان</td>' +
        '<td style="width:60px"><button class="btn sm ghost" data-cart-remove="' + p.id + '" aria-label="حذف">🗑</button></td>' +
        '</tr>';
    }).join('');
    box.innerHTML =
      '<div class="table-wrap" style="border:none"><table class="tbl">' +
      '<tr><th>قالب</th><th>تعداد</th><th>مبلغ</th><th></th></tr>' + rows + '</table></div>' +
      '<div class="between" style="margin-top:18px">' +
      '<div><span class="muted small">مبلغ قابل پرداخت: </span><b class="price" style="font-size:1.2rem">' + total.toLocaleString('fa-IR') + ' تومان</b></div>' +
      '<a class="btn lg" href="/checkout?items=' + items.map(function (x) { return x.id; }).join(',') + '">ادامه و پرداخت</a>' +
      '</div>';
  };
  if (window.tlCart) window.renderCart();
  else window.addEventListener('load', function () { window.renderCart(); });
})();
