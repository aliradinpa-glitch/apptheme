// ═══ کیت رابط کاربر مشترک: توست + مودال زیبا (جایگزین alert/confirm) ═══
(function () {
  'use strict';
  if (window.tlUiReady) return; window.tlUiReady = true;

  var css = document.createElement('style');
  css.textContent = [
    '.tl-wrap{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:18px;font-family:Vazirmatn,Tahoma,sans-serif}',
    '.tl-wrap.on{display:flex}',
    '.tl-ov{position:absolute;inset:0;background:rgba(10,14,30,.55);backdrop-filter:blur(4px)}',
    '.tl-box{position:relative;background:var(--card,#fff);color:var(--ink,#1c2333);border:1px solid var(--border,#e7eaf4);border-radius:18px;max-width:420px;width:100%;padding:26px 22px 20px;text-align:center;box-shadow:0 24px 70px rgba(8,12,32,.35);animation:tlPop .22s ease}',
    '@keyframes tlPop{from{transform:translateY(14px) scale(.97);opacity:0}to{transform:none;opacity:1}}',
    '.tl-ic{width:58px;height:58px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;font-size:1.7rem;background:linear-gradient(135deg,#6d5ef233,#22d3ee33)}',
    '.tl-msg{line-height:1.9;font-size:.95rem}',
    '.tl-btns{display:flex;gap:10px;justify-content:center;margin-top:18px}',
    '.tl-btn{border:0;cursor:pointer;border-radius:12px;padding:10px 22px;font-family:inherit;font-size:.9rem;font-weight:600}',
    '.tl-ok{background:linear-gradient(135deg,#6d5ef2,#22d3ee);color:#fff}',
    '.tl-no{background:transparent;border:1.5px solid var(--border,#dfe3f0)!important;color:inherit}',
    '.tl-toasts{position:fixed;bottom:18px;inset-inline-start:18px;z-index:99998;display:grid;gap:8px;font-family:Vazirmatn,Tahoma,sans-serif}',
    '.tl-toast{background:#1c2240;color:#eef1ff;border:1px solid #323a63;border-radius:13px;padding:11px 16px;font-size:.86rem;box-shadow:0 10px 30px rgba(8,12,32,.4);animation:tlUp .25s ease;max-width:320px}',
    '.tl-toast.ok{border-color:#22895e}.tl-toast.err{border-color:#c2455a}',
    '@keyframes tlUp{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}'
  ].join('');
  document.head.appendChild(css);

  var toastBox = null;
  window.tlToast = function (msg, type) {
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'tl-toasts'; document.body.appendChild(toastBox); }
    var t = document.createElement('div');
    t.className = 'tl-toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    toastBox.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(function () { t.remove(); }, 320); }, 3400);
  };

  function tlModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var w = document.createElement('div');
      w.className = 'tl-wrap';
      w.innerHTML = '<div class="tl-ov"></div><div class="tl-box" role="dialog" aria-modal="true">' +
        '<div class="tl-ic">' + (opts.icon || '💡') + '</div>' +
        '<div class="tl-msg">' + (opts.html || '') + '</div>' +
        '<div class="tl-btns">' +
        (opts.cancel ? '<button class="tl-btn tl-no" data-r="0" type="button">' + (opts.cancelText || 'انصراف') + '</button>' : '') +
        '<button class="tl-btn tl-ok" data-r="1" type="button">' + (opts.okText || 'باشه') + '</button>' +
        '</div></div>';
      document.body.appendChild(w);
      requestAnimationFrame(function () { w.classList.add('on'); });
      function close(v) { w.classList.remove('on'); setTimeout(function () { w.remove(); }, 160); resolve(v); }
      w.addEventListener('click', function (e) {
        if (e.target.classList.contains('tl-ov')) return close(false);
        var b = e.target.closest('[data-r]');
        if (b) close(b.getAttribute('data-r') === '1');
      });
      document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); } });
    });
  }
  window.tlAlert = function (msg, type) {
    return tlModal({ icon: type === 'err' ? '⛔' : type === 'ok' ? '✅' : '💡', html: msg });
  };
  window.tlConfirm = function (msg, o) {
    o = o || {};
    return tlModal({ icon: o.icon || '⚠️', html: msg, cancel: true, okText: o.okText || 'تایید', okClass: o.danger ? 'danger' : '' });
  };

  // فرم‌های دارای data-confirm: به‌جای confirm بومی، مودال زیبا
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-confirm]');
    if (!f || f.dataset.confirmed === '1') return;
    e.preventDefault();
    window.tlConfirm(f.getAttribute('data-confirm'), { okText: f.dataset.okText || 'بله، انجام بده' }).then(function (ok) {
      if (!ok) return;
      f.dataset.confirmed = '1';
      if (typeof f.requestSubmit === 'function') f.requestSubmit(); else f.submit();
      setTimeout(function () { delete f.dataset.confirmed; }, 800);
    });
  });
})();
