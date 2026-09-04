// ═══════════════════════════════════════════════════════════════
// اپ‌تم — کیت رابط کاربری «اورا» نسخه 3.0
// مودال بدون اسکرول (همیشه وسط صفحه) + اعلان با دکمهٔ اکشن و نوار زمان
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  if (window.tlUiReady) return; window.tlUiReady = true;

  var css = document.createElement('style');
  css.textContent = [
    /* ─── مودال: همیشه وسط صفحه، بدون اسکرول صفحه ─── */
    '.tl-wrap{position:fixed;inset:0;z-index:99990;display:none;place-items:center;padding:14px;font-family:Vazirmatn,Tahoma,sans-serif;overflow:hidden}',
    '.tl-wrap.on{display:grid}',
    '.tl-ov{position:absolute;inset:0;background:rgba(4,6,18,.72);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);animation:tlFade .3s ease}',
    '@keyframes tlFade{from{opacity:0}to{opacity:1}}',
    '.tl-box{position:relative;width:min(100%,450px);max-height:calc(100dvh - 28px);display:flex;flex-direction:column;background:linear-gradient(168deg,#171e4d,#10153a 60%);border:1px solid rgba(124,92,255,.34);border-radius:24px;box-shadow:0 40px 120px rgba(2,3,14,.8),0 0 0 1px rgba(255,255,255,.04) inset,0 0 70px rgba(124,92,255,.16);animation:tlPop .38s cubic-bezier(.16,1,.3,1.15);overflow:hidden}',
    '.tl-box::before{content:\'\';position:absolute;inset:0;border-radius:inherit;padding:1.5px;background:linear-gradient(135deg,rgba(124,92,255,.75),rgba(34,211,238,.5) 45%,rgba(244,114,182,.65));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}',
    '.tl-box::after{content:\'\';position:absolute;inset:0;pointer-events:none;background:radial-gradient(26rem 10rem at 88% -12%,rgba(124,92,255,.2),transparent 60%),radial-gradient(20rem 8rem at 0% 110%,rgba(34,211,238,.12),transparent 60%)}',
    'html[data-theme="light"] .tl-box{background:linear-gradient(168deg,#ffffff,#f5f3ff 60%);border-color:rgba(124,92,255,.3);box-shadow:0 40px 110px rgba(40,36,120,.3),0 0 0 1px rgba(255,255,255,.6) inset}',
    '@keyframes tlPop{from{transform:translateY(26px) scale(.94);opacity:0;filter:blur(6px)}to{transform:none;opacity:1;filter:blur(0)}}',
    '@keyframes tlLeave{to{transform:translateY(14px) scale(.97);opacity:0;filter:blur(4px)}}',
    '.tl-close{position:absolute;top:13px;inset-inline-end:15px;z-index:3;width:32px;height:32px;border-radius:10px;border:1px solid rgba(148,158,220,.2);background:rgba(20,25,60,.5);color:#c3cbf2;font-size:1.05rem;cursor:pointer;transition:.2s;line-height:1;display:grid;place-items:center}',
    '.tl-close:hover{color:#fff;border-color:#fb7185;background:rgba(251,113,133,.14);transform:rotate(90deg)}',
    'html[data-theme="light"] .tl-close{background:#f3f1fd;color:#4d567f;border-color:#ddd8f6}',
    '.tl-ic{width:58px;height:58px;margin:4px auto 12px;border-radius:18px;display:grid;place-items:center;font-size:1.7rem;background:linear-gradient(135deg,rgba(124,92,255,.22),rgba(34,211,238,.16));border:1px solid rgba(124,92,255,.4);box-shadow:0 10px 32px rgba(124,92,255,.22),0 0 0 6px rgba(124,92,255,.05);animation:icFloat 3.2s ease-in-out infinite}',
    '.tl-ic.danger{background:linear-gradient(135deg,rgba(251,113,133,.22),rgba(225,29,72,.16));border-color:rgba(251,113,133,.45);box-shadow:0 10px 32px rgba(251,113,133,.25),0 0 0 6px rgba(251,113,133,.06)}',
    '@keyframes icFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
    '.tl-title{font-size:1.05rem;font-weight:800;margin-bottom:6px;letter-spacing:-.2px}',
    '.tl-msg{line-height:2;font-size:.9rem;color:#c3cbf2;overflow-wrap:anywhere}',
    'html[data-theme="light"] .tl-msg{color:#4d567f}',
    '.tl-btns{display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap}',
    '.tl-btn{border:0;cursor:pointer;border-radius:14px;padding:11px 26px;font-family:inherit;font-size:.9rem;font-weight:700;transition:.2s;min-width:118px;letter-spacing:-.2px}',
    '.tl-btn:hover{transform:translateY(-2px)}',
    '.tl-ok{background:linear-gradient(135deg,#7c5cff,#22d3ee);color:#fff;box-shadow:0 12px 30px rgba(124,92,255,.42)}',
    '.tl-ok.danger{background:linear-gradient(135deg,#fb7185,#e11d48);box-shadow:0 12px 30px rgba(225,29,72,.4)}',
    '.tl-no{background:transparent;border:1.5px solid rgba(148,158,220,.3);color:#c3cbf2}',
    '.tl-no:hover{border-color:#7c5cff;color:#fff;background:rgba(124,92,255,.08)}',
    'html[data-theme="light"] .tl-no{color:#4d567f;border-color:#ddd8f6}',
    '.tl-input{width:100%;margin-top:14px;padding:12px 15px;border-radius:14px;border:1.5px solid rgba(148,158,220,.3);background:rgba(10,14,38,.55);color:inherit;font-family:inherit;text-align:center;transition:.2s;outline:none}',
    '.tl-input:focus{border-color:#7c5cff;box-shadow:0 0 0 4px rgba(124,92,255,.18)}',
    'html[data-theme="light"] .tl-input{background:#f6f4ff;border-color:#ddd8f6}',
    /* ─── اعلان ─── */
    '.tl-toasts{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));inset-inline-start:calc(18px + env(safe-area-inset-left,0px));z-index:99999;display:grid;gap:10px;font-family:Vazirmatn,Tahoma,sans-serif;max-width:min(380px,calc(100vw - 28px))}',
    '.tl-toast{position:relative;overflow:hidden;display:flex;gap:11px;align-items:flex-start;background:linear-gradient(160deg,rgba(26,32,72,.97),rgba(17,22,52,.97));border:1px solid #343e7e;border-radius:16px;padding:12px 13px;color:#eef1ff;box-shadow:0 22px 60px rgba(2,4,16,.65);animation:tlUp .4s cubic-bezier(.2,.9,.3,1.2);backdrop-filter:blur(14px)}',
    '.tl-toast .t-ic{width:34px;height:34px;flex-shrink:0;border-radius:11px;display:grid;place-items:center;font-size:1rem}',
    '.tl-toast .t-body{flex:1;min-width:0}',
    '.tl-toast .t-title{font-size:.85rem;font-weight:800;margin-bottom:1px}',
    '.tl-toast .t-msg{font-size:.78rem;opacity:.82;line-height:1.7;overflow-wrap:anywhere}',
    '.tl-toast .t-act{display:inline-flex;margin-top:7px;padding:4px 14px;border-radius:9px;border:1px solid var(--t-c,#7c5cff);background:color-mix(in srgb,var(--t-c,#7c5cff) 12%,transparent);color:var(--t-c,#7c5cff);font-size:.75rem;font-weight:700;cursor:pointer;transition:.15s}',
    '.tl-toast .t-act:hover{background:var(--t-c,#7c5cff);color:#0a0e22}',
    '.tl-toast .t-x{border:0;background:none;color:inherit;opacity:.5;font-size:1.02rem;cursor:pointer;padding:0 2px;transition:.15s}',
    '.tl-toast .t-x:hover{opacity:1;color:#fb7185}',
    '.tl-toast .t-bar{position:absolute;bottom:0;inset-inline-start:0;height:3px;border-radius:99px;background:linear-gradient(90deg,var(--t-c,#7c5cff),#22d3ee);animation:tbar linear forwards}',
    '.tl-toast.ok{--t-c:#34d399;border-color:rgba(52,211,153,.36)}.tl-toast.ok .t-ic{background:rgba(52,211,153,.16);color:#34d399}',
    '.tl-toast.err{--t-c:#fb7185;border-color:rgba(251,113,133,.36)}.tl-toast.err .t-ic{background:rgba(251,113,133,.16);color:#fb7185}',
    '.tl-toast.warn{--t-c:#fbbf24;border-color:rgba(251,191,36,.36)}.tl-toast.warn .t-ic{background:rgba(251,191,36,.16);color:#fbbf24}',
    '.tl-toast.info{--t-c:#38bdf8;border-color:rgba(56,189,248,.36)}.tl-toast.info .t-ic{background:rgba(56,189,248,.16);color:#38bdf8}',
    '@keyframes tlUp{from{transform:translateY(18px) scale(.95);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes tbar{from{width:100%}to{width:0}}',
    'html[data-theme="light"] .tl-toast{background:linear-gradient(160deg,#ffffff,#f5f2ff);color:#1a2044;border-color:#ded9f7;box-shadow:0 22px 60px rgba(40,36,120,.22)}',
    'html[data-theme="light"] .tl-toast .t-msg{color:#5a638c}'
  ].join('');
  document.head.appendChild(css);

  // ═══ اعلان (Toast) با دکمهٔ اکشن ═══
  var toastBox = null;
  var ICONS = { ok: '✓', err: '✕', warn: '!', info: 'i' };
  var TITLES = { ok: 'موفقیت', err: 'خطا', warn: 'هشدار', info: 'اطلاع' };

  window.tlToast = function (msg, type, opts) {
    opts = opts || {};
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'tl-toasts'; toastBox.setAttribute('aria-live', 'polite'); document.body.appendChild(toastBox); }
    var t = document.createElement('div');
    t.className = 'tl-toast ' + (type || 'info');
    t.innerHTML =
      '<span class="t-ic">' + (ICONS[type] || 'i') + '</span>' +
      '<div class="t-body">' + (opts.title ? '<div class="t-title">' + opts.title + '</div>' : '') + '<div class="t-msg"></div>' + (opts.action ? '<button class="t-act" type="button">' + opts.action.label + '</button>' : '') + '</div>' +
      '<button class="t-x" type="button" aria-label="بستن">×</button>' +
      '<span class="t-bar" style="animation-duration:' + (opts.duration || 4200) + 'ms"></span>';
    t.querySelector('.t-msg').textContent = msg;
    if (opts.action) t.querySelector('.t-act').addEventListener('click', function () { opts.action.fn(); kill(true); });
    toastBox.appendChild(t);

    var killed = false, timer = null;
    function kill(silent) {
      if (killed) return; killed = true;
      clearTimeout(timer);
      if (silent) { t.remove(); return; }
      t.style.transition = '.3s'; t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(function () { t.remove(); }, 320);
    }
    timer = setTimeout(kill, opts.duration || 4200);
    t.addEventListener('mouseenter', function () { clearTimeout(timer); t.querySelector('.t-bar').style.animationPlayState = 'paused'; });
    t.addEventListener('mouseleave', function () { timer = setTimeout(kill, 1800); t.querySelector('.t-bar').style.animationPlayState = 'running'; });
    t.querySelector('.t-x').addEventListener('click', kill);
    while (toastBox.children.length > 4) toastBox.firstElementChild.remove();
    return { close: kill };
  };

  // ═══ مودال پایه (همیشه وسط؛ بدون اسکرول) ═══
  function tlModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var w = document.createElement('div');
      w.className = 'tl-wrap';
      w.innerHTML =
        '<div class="tl-ov" data-close></div>' +
        '<div class="tl-box" role="dialog" aria-modal="true">' +
          '<button class="tl-close" type="button" data-close aria-label="بستن">×</button>' +
          '<div style="overflow:auto;padding:26px 22px 20px">' +
            '<div class="tl-ic' + (opts.danger ? ' danger' : '') + '">' + (opts.icon || '💡') + '</div>' +
            (opts.title ? '<div class="tl-title">' + opts.title + '</div>' : '') +
            '<div class="tl-msg">' + (opts.html || '') + '</div>' +
            (opts.input ? '<input class="tl-input" type="text" value="' + (opts.inputValue || '') + '" placeholder="' + (opts.inputPlaceholder || '') + '">' : '') +
            '<div class="tl-btns">' +
              (opts.cancel ? '<button class="tl-btn tl-no" data-r="0" type="button">' + (opts.cancelText || 'انصراف') + '</button>' : '') +
              '<button class="tl-btn tl-ok' + (opts.danger ? ' danger' : '') + '" data-r="1" type="button">' + (opts.okText || 'باشه') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(w);
      var input = w.querySelector('.tl-input');
      requestAnimationFrame(function () {
        w.classList.add('on');
        if (input) setTimeout(function () { input.focus(); input.select(); }, 140);
      });
      var done = false;
      function close(v, skip) {
        if (done) return; done = true;
        var box = w.querySelector('.tl-box');
        box.style.animation = 'tlLeave .18s ease forwards';
        setTimeout(function () { w.remove(); }, !skip ? 190 : 0);
        if (!skip) resolve(v); else resolve(v);
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

  // ── فرم‌های data-confirm: مودال حرفه‌ای به‌جای confirm مرورگر ──
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
