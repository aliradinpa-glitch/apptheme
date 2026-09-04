// ═══════════════════════════════════════════════════════════════
// اپ‌تم — کیت رابط کاربری نئونی (نسخه 2.0)
// مودال‌های حرفه‌ای + اعلان (Toast) با نوار پیشرفت + تأیید خطرناک
// کاملاً بدون وابستگی؛ سازگار با تم روشن/تاریک
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  if (window.tlUiReady) return; window.tlUiReady = true;

  // ── استایل کیت (تزریق یک‌باره) ──
  var css = document.createElement('style');
  css.textContent = [
    /* ─── اعلان‌ها (Toast) ─── */
    '.tl-toasts{position:fixed;bottom:20px;inset-inline-start:20px;z-index:99999;display:grid;gap:10px;font-family:Vazirmatn,Tahoma,sans-serif;max-width:min(370px,92vw)}',
    '.tl-toast{position:relative;overflow:hidden;display:flex;gap:11px;align-items:flex-start;background:linear-gradient(160deg,rgba(24,30,66,.97),rgba(18,23,52,.97));border:1px solid #313b74;border-radius:15px;padding:12px 14px;color:#eef1ff;box-shadow:0 18px 50px rgba(3,6,20,.6);animation:tlUp .35s cubic-bezier(.2,.9,.3,1.2);backdrop-filter:blur(12px);min-width:250px}',
    '.tl-toast .t-ic{width:34px;height:34px;flex-shrink:0;border-radius:11px;display:grid;place-items:center;font-size:1rem}',
    '.tl-toast .t-body{flex:1;min-width:0}',
    '.tl-toast .t-title{font-size:.86rem;font-weight:700;margin-bottom:1px}',
    '.tl-toast .t-msg{font-size:.79rem;opacity:.8;line-height:1.7}',
    '.tl-toast .t-x{border:0;background:none;color:inherit;opacity:.5;font-size:1.05rem;cursor:pointer;padding:0 2px;transition:.15s}',
    '.tl-toast .t-x:hover{opacity:1;color:#fb7185}',
    '.tl-toast .t-bar{position:absolute;bottom:0;inset-inline-start:0;height:3px;border-radius:99px;background:linear-gradient(90deg,var(--t-c,#7c5cff),#22d3ee);animation:tbar linear forwards}',
    '.tl-toast.ok{--t-c:#34d399;border-color:rgba(52,211,153,.35)}.tl-toast.ok .t-ic{background:rgba(52,211,153,.16);color:#34d399}',
    '.tl-toast.err{--t-c:#fb7185;border-color:rgba(251,113,133,.35)}.tl-toast.err .t-ic{background:rgba(251,113,133,.16);color:#fb7185}',
    '.tl-toast.warn{--t-c:#fbbf24;border-color:rgba(251,191,36,.35)}.tl-toast.warn .t-ic{background:rgba(251,191,36,.16);color:#fbbf24}',
    '.tl-toast.info{--t-c:#38bdf8;border-color:rgba(56,189,248,.35)}.tl-toast.info .t-ic{background:rgba(56,189,248,.16);color:#38bdf8}',
    '@keyframes tlUp{from{transform:translateY(18px) scale(.95);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes tbar{from{width:100%}to{width:0}}',
    /* ─── مودال حرفه‌ای ─── */
    '.tl-wrap{position:fixed;inset:0;z-index:99990;display:none;align-items:center;justify-content:center;padding:18px;font-family:Vazirmatn,Tahoma,sans-serif}',
    '.tl-wrap.on{display:flex}',
    '.tl-ov{position:absolute;inset:0;background:rgba(5,8,22,.66);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);animation:tlFade .25s ease}',
    '@keyframes tlFade{from{opacity:0}to{opacity:1}}',
    '.tl-box{position:relative;background:linear-gradient(165deg,#181f49,#121737);color:#eef1ff;border:1px solid #333d7c;border-radius:22px;max-width:430px;width:100%;padding:26px 22px 20px;text-align:center;box-shadow:0 30px 90px rgba(2,4,16,.75),0 0 60px rgba(124,92,255,.14);animation:tlPop .3s cubic-bezier(.2,.9,.3,1.25);overflow:hidden}',
    '.tl-box::before{content:\'\';position:absolute;top:0;inset-inline:0;height:3px;background:linear-gradient(90deg,var(--primary,#7c5cff),#22d3ee,#f472b6);background-size:220% 100%;animation:tlFlow 5s linear infinite}',
    '@keyframes tlFlow{to{background-position:220% 0}}',
    '.tl-box::after{content:\'\';position:absolute;inset:0;pointer-events:none;background:radial-gradient(22rem 9rem at 85% -20%,rgba(124,92,255,.16),transparent 65%)}',
    '@keyframes tlPop{from{transform:translateY(22px) scale(.92);opacity:0}to{transform:none;opacity:1}}',
    '.tl-close{position:absolute;top:12px;inset-inline-end:14px;border:0;background:none;color:inherit;opacity:.5;font-size:1.45rem;cursor:pointer;transition:.2s;z-index:2;line-height:1}',
    '.tl-close:hover{opacity:1;color:#fb7185;transform:rotate(90deg)}',
    '.tl-ic{width:66px;height:66px;margin:6px auto 14px;border-radius:20px;display:grid;place-items:center;font-size:1.9rem;background:linear-gradient(135deg,rgba(124,92,255,.2),rgba(34,211,238,.18));border:1px solid rgba(124,92,255,.35);box-shadow:0 0 34px rgba(124,92,255,.25);animation:icFloat 3s ease-in-out infinite}',
    '.tl-ic.danger{background:linear-gradient(135deg,rgba(251,113,133,.2),rgba(225,29,72,.16));border-color:rgba(251,113,133,.4);box-shadow:0 0 34px rgba(251,113,133,.3)}',
    '@keyframes icFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
    '.tl-title{font-size:1.04rem;font-weight:800;margin-bottom:7px}',
    '.tl-msg{line-height:2;font-size:.9rem;color:#c3cbf2}',
    '.tl-btns{display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap}',
    '.tl-btn{border:0;cursor:pointer;border-radius:13px;padding:11px 26px;font-family:inherit;font-size:.9rem;font-weight:700;transition:.2s;min-width:120px}',
    '.tl-btn:hover{transform:translateY(-2px)}',
    '.tl-ok{background:linear-gradient(135deg,#7c5cff,#22d3ee);color:#fff;box-shadow:0 10px 28px rgba(124,92,255,.4)}',
    '.tl-ok.danger{background:linear-gradient(135deg,#fb7185,#e11d48);box-shadow:0 10px 28px rgba(225,29,72,.4)}',
    '.tl-no{background:transparent;border:1.5px solid #3a447f;color:#c3cbf2}',
    '.tl-no:hover{border-color:#7c5cff;color:#fff}',
    /* مودال در تم روشن */
    'html[data-theme="light"] .tl-box{background:linear-gradient(165deg,#ffffff,#f3f1fd);color:#1a2044;border-color:#ddd8f6}',
    'html[data-theme="light"] .tl-msg{color:#4d567f}',
    'html[data-theme="light"] .tl-no{border-color:#ddd8f6;color:#4d567f}',
    'html[data-theme="light"] .tl-toast{background:linear-gradient(160deg,#ffffff,#f4f2fe);color:#1a2044;border-color:#ddd8f6;box-shadow:0 18px 50px rgba(30,34,90,.25)}',
    'html[data-theme="light"] .tl-toast .t-msg{color:#5a638c}',
    /* درون‌داد مودال (پرامپت) */
    '.tl-input{width:100%;margin-top:14px;padding:12px 15px;border-radius:13px;border:1.5px solid #3a447f;background:rgba(10,14,36,.5);color:inherit;font-family:inherit;text-align:center;transition:.2s;outline:none}',
    '.tl-input:focus{border-color:#7c5cff;box-shadow:0 0 0 4px rgba(124,92,255,.18)}',
    'html[data-theme="light"] .tl-input{background:#f6f4ff;border-color:#ddd8f6}'
  ].join('');
  document.head.appendChild(css);

  // ═══ اعلان (Toast) ═══
  var toastBox = null;
  var ICONS = { ok: '✓', err: '✕', warn: '!', info: 'i', '': '•' };
  var TITLES = { ok: 'موفقیت', err: 'خطا', warn: 'هشدار', info: 'اطلاع', '': '' };

  window.tlToast = function (msg, type, opts) {
    opts = opts || {};
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'tl-toasts'; toastBox.setAttribute('aria-live', 'polite'); document.body.appendChild(toastBox); }
    var t = document.createElement('div');
    t.className = 'tl-toast ' + (type || '');
    var title = opts.title || TITLES[type || ''] || '';
    t.innerHTML =
      '<span class="t-ic">' + (ICONS[type || ''] || '•') + '</span>' +
      '<div class="t-body">' + (title ? '<div class="t-title">' + title + '</div>' : '') + '<div class="t-msg"></div></div>' +
      '<button class="t-x" type="button" aria-label="بستن">×</button>' +
      '<span class="t-bar" style="animation-duration:' + (opts.duration || 3800) + 'ms"></span>';
    t.querySelector('.t-msg').textContent = msg;
    toastBox.appendChild(t);

    var killed = false, timer = null;
    function kill() {
      if (killed) return; killed = true;
      clearTimeout(timer);
      t.style.transition = '.28s'; t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(function () { t.remove(); }, 300);
    }
    timer = setTimeout(kill, opts.duration || 3800);
    t.addEventListener('mouseenter', function () { clearTimeout(timer); t.querySelector('.t-bar').style.animationPlayState = 'paused'; });
    t.addEventListener('mouseleave', function () { timer = setTimeout(kill, 1600); t.querySelector('.t-bar').style.animationPlayState = 'running'; });
    t.querySelector('.t-x').addEventListener('click', kill);
    while (toastBox.children.length > 4) toastBox.firstElementChild.remove();
    return { close: kill };
  };

  // ═══ مودال پایه ═══
  function tlModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var w = document.createElement('div');
      w.className = 'tl-wrap';
      w.innerHTML =
        '<div class="tl-ov" data-close></div>' +
        '<div class="tl-box" role="dialog" aria-modal="true" aria-label="' + (opts.title || 'پیام') + '">' +
          '<button class="tl-close" type="button" data-close aria-label="بستن">×</button>' +
          '<div class="tl-ic' + (opts.danger ? ' danger' : '') + '">' + (opts.icon || '💡') + '</div>' +
          (opts.title ? '<div class="tl-title">' + opts.title + '</div>' : '') +
          '<div class="tl-msg">' + (opts.html || '') + '</div>' +
          (opts.input ? '<input class="tl-input" type="text" value="' + (opts.inputValue || '') + '" placeholder="' + (opts.inputPlaceholder || '') + '">' : '') +
          '<div class="tl-btns">' +
            (opts.cancel ? '<button class="tl-btn tl-no" data-r="0" type="button">' + (opts.cancelText || 'انصراف') + '</button>' : '') +
            '<button class="tl-btn tl-ok' + (opts.danger ? ' danger' : '') + '" data-r="1" type="button">' + (opts.okText || 'باشه') + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(w);
      var input = w.querySelector('.tl-input');
      requestAnimationFrame(function () {
        w.classList.add('on');
        if (input) { setTimeout(function () { input.focus(); input.select(); }, 120); }
      });
      var done = false;
      function close(v) {
        if (done) return; done = true;
        w.classList.remove('on');
        setTimeout(function () { w.remove(); }, 180);
        resolve(v);
      }
      w.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-close')) return close(false);
        var b = e.target.closest('[data-r]');
        if (b) {
          var val = b.getAttribute('data-r') === '1';
          if (val && input) val = input.value;
          close(val);
        }
      });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); }
        if (e.key === 'Enter' && input) { document.removeEventListener('keydown', esc); close(input.value); }
      });
    });
  }

  // ── API عمومی (سازگار با کدهای قبلی) ──
  window.tlAlert = function (msg, type, title) {
    var m = { ok: ['✅', 'موفقیت'], err: ['⛔', 'خطا'], warn: ['⚠️', 'هشدار'], info: ['💡', 'اطلاع'] }[type] || ['💡', 'اطلاع'];
    return tlModal({ icon: m[0], title: title || m[1], html: msg, okText: 'متوجه شدم' });
  };
  window.tlConfirm = function (msg, o) {
    o = o || {};
    return tlModal({
      icon: o.icon || (o.danger ? '⚠️' : '❓'),
      title: o.title || (o.danger ? 'تأیید عملیات حساس' : 'تأیید'),
      html: msg, cancel: true,
      okText: o.okText || 'تایید',
      danger: !!o.danger,
    });
  };
  window.tlPrompt = function (msg, o) {
    o = o || {};
    return tlModal({ icon: o.icon || '✏️', title: o.title || '', html: msg, input: true, inputValue: o.value || '', inputPlaceholder: o.placeholder || '', okText: o.okText || 'ثبت', cancel: true });
  };
  window.tlModal = tlModal;

  // ── فرم‌های دارای data-confirm: جایگزین confirm بومی ──
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-confirm]');
    if (!f || f.dataset.confirmed === '1') return;
    e.preventDefault();
    window.tlConfirm(f.getAttribute('data-confirm'), {
      okText: f.dataset.okText || 'بله، انجام بده',
      danger: f.hasAttribute('data-danger'),
    }).then(function (ok) {
      if (!ok) return;
      f.dataset.confirmed = '1';
      if (typeof f.requestSubmit === 'function') f.requestSubmit(); else f.submit();
      setTimeout(function () { delete f.dataset.confirmed; }, 800);
    });
  });
})();
