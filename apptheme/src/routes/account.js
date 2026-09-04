// ─── پیام‌رسانی کاربر ↔ پشتیبانی ───
import { esc, faDateTime, timeAgo } from '../util.js';
import { page } from '../render.js';
import { findMany, insert, updateOne } from '../db.js';
import { APP_NAME } from '../config.js';
import { cleanText, rateLimit } from '../security.js';
import { csrfOk } from '../auth.js';

const fa = n => Number(n).toLocaleString('fa-IR');

export function messagesPage(req, res, ctx) {
  const { user, csrf, query } = ctx;
  const thread = findMany('messages', m => m.threadKey === 'u:' + user.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  // علامت‌گذاری خوانده‌شده برای کاربر
  for (const m of thread) if (!m.readByUser) updateOne('messages', x => x.id === m.id, { readByUser: true });

  const bubbles = thread.map(m => `
  <div class="msg ${m.fromRole === 'user' ? 'me' : 'support'}">
    <div class="msg-bubble">
      <div class="msg-head">
        <b>${m.fromRole === 'user' ? esc(user.name) : '💬 پشتیبانی اپ‌تم'}</b>
        <span class="muted small">${timeAgo(m.createdAt)}</span>
      </div>
      <div class="msg-body">${esc(m.body)}</div>
    </div>
  </div>`).join('') || '<div class="empty-state"><div class="ic">💬</div><p>هنوز پیامی ندارید؛ اولین پیام را بفرستید!</p></div>';

  const body = `
<div class="container section">
  <nav class="breadcrumb"><a href="/">خانه</a> <span>/</span> <a href="/account">حساب من</a> <span>/</span> <span>پیام‌ها</span></nav>
  <div class="section-head"><h2>پیام با پشتیبانی</h2><span class="sub">پاسخ‌گویی: شنبه تا پنجشنبه، ۹ تا ۱۸</span></div>
  <div class="chat-wrap card">
    <div class="chat-scroll">${bubbles}</div>
    <form method="post" action="/account/messages" class="chat-form">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <textarea class="textarea grow" name="body" required minlength="2" maxlength="1000" placeholder="پیامت را بنویس…"></textarea>
      <button class="btn" type="submit">ارسال ➤</button>
    </form>
  </div>
</div>`;

  return page({ user, csrf, title: `پیام‌ها | ${APP_NAME}`, desc: 'پیام با پشتیبانی', body, noindex: true });
}

export function handleMessageSend(req, res, ctx) {
  const { user, session, body } = ctx;
  if (!user) return { redirect: '/login' };
  if (!csrfOk(req, session, body)) return { redirect: '/account/messages' };
  if (!rateLimit(`msg:${user.id}`, 10, 10 * 60_000)) return { redirect: '/account/messages?err=rate' };
  const text = cleanText(body.body, 1000);
  if (text.length < 2) return { redirect: '/account/messages' };
  insert('messages', { threadKey: 'u:' + user.id, fromUserId: user.id, fromRole: 'user', body: text, readByAdmin: false, readByUser: true });
  return { redirect: '/account/messages#end' };
}
