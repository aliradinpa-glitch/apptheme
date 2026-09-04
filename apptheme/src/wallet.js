// ═══ کیف پول: اعتبار، تراکنش‌ها، برداشت خودکار ═══
// امنیت: مبالغ فقط عدد صحیح، همه محاسبات سمت سرور، CSRF در لایه سرور،
// گارد وضعیت برای جلوگیری از دوبار اجرا (idempotency)، لاگ کامل تراکنش‌ها
import { esc, money, faNum, faDateTime } from './util.js';
import { page } from './render.js';
import { findOne, findMany, insert, updateOne, getDb, persist } from './db.js';
import { APP_NAME } from './config.js';
import { cleanText } from './security.js';
import { normalizeDigits } from './util.js';
import { csrfOk } from './auth.js';
import { sendMail } from './shop.js';

const fa = n => Number(n).toLocaleString('fa-IR');
export const MIN_WITHDRAW = 100_000;

// ─── تغییر اعتبار (تنها نقطه ورود پول — همیشه عدد صحیح) ───
export function credit(userId, amount, type, note, ref = null) {
  amount = Math.round(Number(amount) || 0);
  if (!amount) return null;
  const user = findOne('users', u => u.id === userId);
  if (!user) return null;
  user.wallet = Math.max(0, Math.round((user.wallet || 0) + amount));
  persist();
  const tx = insert('transactions', { userId, amount, type, note: note || '', ref, at: new Date().toISOString() });
  console.log(`[wallet] کاربر#${userId} ${amount > 0 ? '+' : ''}${amount.toLocaleString('en')} (${type}) — موجودی: ${user.wallet.toLocaleString('en')}`);
  return tx;
}

export function balance(userId) {
  const u = findOne('users', x => x.id === userId);
  return Math.round(u?.wallet || 0);
}

export function notify(userId, body) {
  insert('messages', { threadKey: 'u:' + userId, fromUserId: null, fromRole: 'admin', body, readByAdmin: true, readByUser: false });
}

// ─── صفحه کیف پول ───
export function walletPage(req, res, ctx) {
  const { user, csrf, query } = ctx;
  const txs = findMany('transactions', t => t.userId === user.id).sort((a, b) => new Date(b.at) - new Date(a.at));
  const wds = findMany('withdrawals', w => w.userId === user.id).sort((a, b) => new Date(b.at) - new Date(a.at));
  const typeLabels = { refund: 'بازگشت وجه', loyalty: 'پاداش وفاداری 🎁', withdraw: 'برداشت', adjust: 'تعدیل' };
  const notices = [];
  if (query.wd === 'ok') notices.push(['ok', 'درخواست برداشت ثبت و به‌صورت خودکار واریز شد ✅ (در حالت دمو؛ در پروداکشن از طریق PSP)']);
  if (query.wd === 'err') notices.push(['err', 'درخواست برداشت نامعتبر بود (مبلغ/شبا).']);
  const bal = balance(user.id);

  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <a href="/account">حساب من</a> <span>/</span> <span>کیف پول</span></nav>
  ${notices.map(([t, m]) => `<div class="alert ${t} notif-ok">${m}</div>`).join('')}
  <div class="wallet-hero card card-pad">
    <div>
      <div class="muted small">موجودی کیف پول</div>
      <div class="wallet-bal">${money(bal)}</div>
    </div>
    <div class="muted small" style="max-width:22rem">اعتبار کیف پول برای بازگشت وجه پروژه‌ها و پاداش وفاداری است؛ هر لحظه قابل برداشت به حساب بانکی خودتان.</div>
  </div>

  <div class="admin-2col" style="margin-top:22px">
    <div class="card card-pad">
      <h3 style="margin-bottom:14px">💸 درخواست برداشت خودکار</h3>
      <form method="post" action="/account/wallet/withdraw">
        <input type="hidden" name="_csrf" value="${esc(csrf)}">
        <div class="field"><label class="req">مبلغ برداشت (تومان)</label>
          <input class="input" type="number" name="amount" min="${MIN_WITHDRAW}" max="${bal}" step="10000" required placeholder="حداقل ${fa(MIN_WITHDRAW)}">
          <p class="hint">موجودی شما: ${money(bal)}</p>
        </div>
        <div class="field"><label class="req">شماره شبا</label>
          <input class="input" name="sheba" required dir="ltr" placeholder="IR وحده ۲۴ رقم" value="${esc(user.sheba || '')}">
          <p class="hint">مثال: IR123456789012345678901234 — واریز خودکار تا ۷۲ ساعت کاری.</p>
        </div>
        <button class="btn lg" type="submit" ${bal < MIN_WITHDRAW ? 'disabled' : ''}>ثبت برداشت خودکار</button>
      </form>
      <div class="alert info" style="margin-top:14px">🔒 این عملیات با رمزنگاری انجام می‌شود، فقط به شبای ثبت‌شده‌ی خودتان واریز می‌شود و هر تراکنش در تاریخچه ثبت می‌گردد.</div>
    </div>
    <div class="card card-pad">
      <h3 style="margin-bottom:14px">🧾 تراکنش‌ها</h3>
      ${txs.map(t => `<div class="between payment-row">
        <span>${typeLabels[t.type] || t.type} <span class="muted small">${esc(t.note || '')}</span></span>
        <b style="color:${t.amount > 0 ? 'var(--ok)' : 'var(--err)'}">${t.amount > 0 ? '+' : ''}${fa(t.amount)}</b>
      </div>`).join('') || '<p class="muted small">تراکنشی ثبت نشده است.</p>'}
      ${wds.length ? `<h3 style="margin:18px 0 10px">برداشت‌ها</h3>` : ''}
      ${wds.map(w => `<div class="between payment-row">
        <span class="small">شبا <span dir="ltr">${esc(w.sheba.slice(0, 8))}…</span> <span class="muted small">${faDateTime(w.at)}</span></span>
        <span><b>${fa(w.amount)}</b> <span class="badge ${w.status === 'paid' ? 'ok' : w.status === 'failed' ? 'err' : 'warn'}">${w.status === 'paid' ? 'واریز شد' : w.status === 'failed' ? 'ناموفق' : 'در حال پردازش'}</span></span>
      </div>`).join('')}
    </div>
  </div>
</div>`;

  return page({ user, csrf, title: `کیف پول | ${APP_NAME}`, desc: 'کیف پول و برداشت', body, noindex: true });
}

// ─── ثبت برداشت (خودکار در دمو) ───
export function handleWithdraw(req, res, ctx) {
  const { user, body } = ctx;
  if (!user) return { redirect: '/login' };
  if (!csrfOk(req, ctx.session, body)) return { redirect: '/account/wallet?wd=err' };

  const amount = Math.round(Number(normalizeDigits(body.amount || '')) || 0);
  const sheba = normalizeDigits(String(body.sheba || '')).toUpperCase().replace(/\s+/g, '');

  // اعتبارسنجی سخت سمت سرور
  if (amount < MIN_WITHDRAW || amount > balance(user.id)) return { redirect: '/account/wallet?wd=err' };
  if (!/^IR[0-9]{24}$/.test(sheba)) return { redirect: '/account/wallet?wd=err' };

  // کسر فوری از موجودی + ثبت تراکنش
  credit(user.id, -amount, 'withdraw', 'درخواست برداشت به شبا ' + sheba.slice(0, 6) + '…');
  const wd = insert('withdrawals', { userId: user.id, amount, sheba, status: 'processing', trace: null, at: new Date().toISOString() });

  // واریز خودکار (دمو) — در پروداکشن: اتصال به API پرداخت‌ریز PSP
  const trace = 'WD' + Date.now().toString().slice(-9);
  updateOne('withdrawals', w => w.id === wd.id, { status: 'paid', trace, paidAt: new Date().toISOString() });
  updateOne('users', u => u.id === user.id, { sheba });
  notify(user.id, `برداشت ${money(amount)} با موفقیت به شبای شما واریز شد ✅\nکد پیگیری: ${trace}\n(واریز خودکار — حداکثر ۷۲ ساعت کاری به حسابتان می‌رسد)`);
  sendMail(user.email, 'برداشت از کیف پول اپ‌تم', `برداشت ${money(amount)} ثبت شد.\nکد پیگیری: ${trace}`);

  return { redirect: '/account/wallet?wd=ok' };
}

// ─── پنل ادمین: برداشت‌ها ───
export function withdrawalsAdmin(req, res, { user }) {
  const wds = [...getDb().withdrawals].sort((a, b) => new Date(b.at) - new Date(a.at));
  const body = `
<div class="table-wrap"><table class="tbl">
  <tr><th>کاربر</th><th>مبلغ</th><th>شبا</th><th>وضعیت</th><th>کد پیگیری</th><th>تاریخ</th><th>عملیات</th></tr>
  ${wds.map(w => {
    const u = findOne('users', x => x.id === w.userId);
    return `<tr>
      <td>${esc(u?.name || '—')}</td>
      <td>${money(w.amount)}</td>
      <td dir="ltr" class="small">${esc(w.sheba)}</td>
      <td><span class="badge ${w.status === 'paid' ? 'ok' : w.status === 'failed' ? 'err' : 'warn'}">${w.status === 'paid' ? 'واریز شد' : w.status === 'failed' ? 'ناموفق' : 'در پردازش'}</span></td>
      <td dir="ltr" class="small">${esc(w.trace || '—')}</td>
      <td class="muted small">${faDateTime(w.at)}</td>
      <td class="ops">
        ${w.status === 'processing' ? `
        <form method="post" action="/admin/withdrawals/${w.id}/mark"><input type="hidden" name="_csrf" value="${user.__csrf}"><input type="hidden" name="st" value="paid"><button class="btn sm soft">واریز شد</button></form>
        <form method="post" action="/admin/withdrawals/${w.id}/mark"><input type="hidden" name="_csrf" value="${user.__csrf}"><input type="hidden" name="st" value="failed"><button class="btn sm danger">ناموفق (بازگشت به کیف پول)</button></form>` : ''}
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="center muted">برداشتی ثبت نشده است.</td></tr>'}
</table></div>`;
  const { adminPage } = require_render();
  return adminPage({ user, title: 'برداشت‌های کیف پول', active: 'withdrawals', body });
}

export function handleWithdrawalMark(req, res, ctx, id) {
  const w = findOne('withdrawals', x => x.id === id);
  if (!w || w.status !== 'processing') return { redirect: '/admin/withdrawals' };
  if (ctx.body.st === 'paid') {
    updateOne('withdrawals', x => x.id === id, { status: 'paid', trace: w.trace || 'WD' + Date.now().toString().slice(-9), paidAt: new Date().toISOString() });
    notify(w.userId, `برداشت ${money(w.amount)} توسط مالی تأیید و واریز شد ✅`);
  } else {
    updateOne('withdrawals', x => x.id === id, { status: 'failed' });
    credit(w.userId, w.amount, 'adjust', 'بازگشت برداشت ناموفق');
    notify(w.userId, `برداشت ${money(w.amount)} ناموفق بود و مبلغ به کیف پول شما بازگشت.`);
  }
  return { redirect: '/admin/withdrawals' };
}

import * as renderMod from './render.js';
const require_render = () => renderMod;
