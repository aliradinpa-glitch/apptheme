// ─── API و هندلرهای فرم: احراز هویت (ایمیل/موبایل)، لایک، کامنت ───
import { findOne, insert, findMany, removeOne, updateOne, getDb, persist } from '../db.js';
import { verifyPassword, hashPassword, rateLimit, validName, validPassword, cleanText, randomToken } from '../security.js';
import { isEmail, normalizeMobile } from '../util.js';
import { login, logout, csrfOk } from '../auth.js';
import { ensureVerification, sendMail, verificationMessage } from '../shop.js';

const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};

const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';

// ─── نصب اولیه: ساخت ادمین (فقط وقتی هیچ ادمینی نیست) ───
export function handleSetup(req, res, { body, isHttps, baseUrl }) {
  const adminExists = !!findOne('users', u => u.role === 'admin');
  if (adminExists) return { redirect: '/login' };
  if (!rateLimit(`setup:${clientIp(req)}`, 5, 10 * 60_000)) return { error: 'تلاش بیش از حد. کمی بعد دوباره امتحان کنید.' };

  const name = validName(body.name);
  const email = String(body.email || '').trim().toLowerCase();
  const password = validPassword(body.password);
  if (!name) return { error: 'نام معتبر وارد کنید (۲ تا ۶۰ کاراکتر).' };
  if (!isEmail(email)) return { error: 'ایمیل معتبر وارد کنید.' };
  if (!password) return { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' };

  const user = insert('users', { name, email, mobile: '', passwordHash: hashPassword(password), role: 'admin', active: true, verified: true });
  login(res, user.id, isHttps);
  return { redirect: '/admin' };
}

// ─── ورود با ایمیل یا شماره موبایل ───
export function handleLogin(req, res, { body, isHttps, csrf: token }) {
  const anonToken = token;
  if (!rateLimit(`login:${clientIp(req)}`, 8, 5 * 60_000)) return { error: 'تلاش بیش از حد. ۵ دقیقه بعد دوباره امتحان کنید.' };
  if (!csrfOk(req, anonToken, body)) return { error: 'نشست شما منقضی شده؛ دوباره تلاش کنید.' };

  const raw = String(body.identifier || body.email || '').trim();
  const password = String(body.password || '');
  const email = raw.toLowerCase();
  const mobile = normalizeMobile(raw) || '';

  const user = findOne('users', u => (email && u.email === email) || (mobile && u.mobile === mobile));
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { error: 'ایمیل/موبایل یا رمز عبور اشتباه است.' };
  }
  login(res, user.id, isHttps);
  return { redirect: user.role === 'admin' ? '/admin' : '/account' };
}

// ─── ثبت‌نام با ایمیل (وریفای) یا موبایل (بدون وریفای) ───
export function handleRegister(req, res, { body, isHttps, baseUrl, csrf: token }) {
  const anonToken = token;
  if (!rateLimit(`reg:${clientIp(req)}`, 5, 15 * 60_000)) return { error: 'تلاش بیش از حد. بعداً دوباره امتحان کنید.' };
  if (!csrfOk(req, anonToken, body)) return { error: 'نشست شما منقضی شده؛ دوباره تلاش کنید.' };

  const name = validName(body.name);
  const raw = String(body.identifier || body.email || '').trim();
  const password = validPassword(body.password);
  const email = isEmail(raw) ? raw.toLowerCase() : '';
  const mobile = !email ? (normalizeMobile(raw) || '') : '';

  if (!name) return { error: 'نام معتبر وارد کنید.' };
  if (!email && !mobile) return { error: 'ایمیل معتبر یا شماره موبایل ایرانی (۰۹xxxxxxxxx) وارد کنید.' };
  if (!password) return { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' };
  if (email && findOne('users', u => u.email === email)) return { error: 'این ایمیل قبلاً ثبت شده؛ وارد شوید.' };
  if (mobile && findOne('users', u => u.mobile === mobile)) return { error: 'این شماره موبایل قبلاً ثبت شده؛ وارد شوید.' };

  const viaMobile = !!mobile && !email;
  const user = insert('users', {
    name, email: email || (mobile + '@sms.local'), mobile,
    passwordHash: hashPassword(password), role: 'customer', active: true,
    verified: viaMobile, // موبایل = فوری فعال؛ ایمیل = نیازمند تأیید
  });

  login(res, user.id, isHttps);
  if (!viaMobile) {
    const v = ensureVerification(user);
    sendMail(user.email, 'تأیید ایمیل — اپ‌تم', verificationMessage(user, `${baseUrl}/verify-email?token=${v.token}`));
    return { redirect: '/account?welcome=1' };
  }
  return { redirect: '/account?welcome=1' };
}

// ─── خروج ───
export function handleLogout(req, res, { body, session }) {
  if (csrfOk(req, session, body)) logout(req, res);
  return { redirect: '/' };
}

// ─── ثبت نظر ───
export function handleComment(req, res, { body, user, session, product }) {
  if (!user) return { redirect: '/login' };
  if (!rateLimit(`comment:${user.id}`, 5, 10 * 60_000)) return { redirect: `/templates/${product.slug}?err=rate` };
  if (!csrfOk(req, session, body)) return { redirect: `/templates/${product.slug}?err=csrf` };

  const text = cleanText(body.body, 700);
  const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
  if (text.length < 5) return { redirect: `/templates/${product.slug}?err=short` };

  insert('comments', { productId: product.id, userId: user.id, name: user.name, body: text, rating, status: 'pending' });
  return { redirect: `/templates/${product.slug}?ok=comment` };
}

// ─── لایک / آنلایک ───
export function handleLike(req, res, { user, session, productId }) {
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  if (!user) return json(res, 200, { ok: false, error: 'auth' });
  if (!rateLimit(`like:${user.id}`, 40, 60_000)) return json(res, 429, { ok: false, error: 'rate' });
  if (!csrfOk(req, session)) return json(res, 403, { ok: false, error: 'csrf' });

  const product = findOne('products', p => p.id === productId && p.published);
  if (!product) return json(res, 404, { ok: false, error: 'notfound' });

  const existing = findOne('likes', l => l.productId === productId && l.userId === user.id);
  let liked;
  if (existing) {
    removeOne('likes', l => l.productId === productId && l.userId === user.id);
    liked = false;
  } else {
    insert('likes', { productId, userId: user.id });
    liked = true;
  }
  const count = findMany('likes', l => l.productId === productId).length;
  return json(res, 200, { ok: true, liked, count });
}

// ─── حذف خودکار حساب‌های تأییدنشده (هر ساعت) ───

export function purgeUnverified() {
  const db = getDb();
  const deadline = Date.now() - 7 * 86400000;
  const victims = db.users.filter(u => u.role === 'customer' && !u.verified && new Date(u.createdAt) < deadline);
  for (const v of victims) {
    db.users = db.users.filter(u => u.id !== v.id);
    db.sessions = db.sessions.filter(s => s.userId !== v.id);
  }
  if (victims.length) persist();
  return victims.length;
}

export function health(req, res) {
  return json(res, 200, { ok: true, name: 'apptheme', time: new Date().toISOString() });
}

// ═══ فراموشی رمز — ۵ کانال (ایمیل واقعی + بقیه: تیکت به پشتیبانی) ═══
export function handleForgot(req, res, { body, session, csrf, baseUrl }) {
  if (!csrfOk(req, session || csrf, body)) return { redirect: '/forgot' };
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60_000)) return { error: 'تلاش بیش از حد. بعداً دوباره امتحان کنید.' };
  const ch = String(body.ch || 'email');
  const identifier = String(body.identifier || '').trim();
  if (!identifier) return { error: 'شناسه را وارد کنید.' };
  const db = getDb();

  if (ch === 'email') {
    const email = identifier.toLowerCase();
    const user = findOne('users', u => u.email === email);
    // همیشه پیام یکسان (افشای وجود حساب ممنوع)
    if (user) {
      removeOne('passwordResets', r => r.userId === user.id);
      const token = randomToken(24);
      insert('passwordResets', { userId: user.id, token, expiresAt: new Date(Date.now() + 3600_000).toISOString() });
      sendMail(email, 'بازیابی رمز عبور — اپ‌تم',
        `سلام ${user.name}!\n\nبرای تعیین رمز جدید روی لینک زیر بزنید (۱ ساعت اعتبار):\n${baseUrl}/reset-password?token=${token}\n\nاگر شما درخواست نداده‌اید این پیام را نادیده بگیرید.`);
    }
    return { redirect: '/forgot?ch=email&sent=1' };
  }

  // موبایل/تلگرام/بله/روبیکا → تیکت مستقیم برای ادمین
  const labels = { mobile: '📱 موبایل', telegram: '✈️ تلگرام', bale: '💬 بله', rubika: '🟣 روبیکا' };
  insert('messages', { threadKey: 'u:support', fromUserId: null, fromRole: 'system',
    body: `🔑 درخواست بازیابی رمز از طریق ${labels[ch] || ch}\nشناسه تماس: ${identifier}\n(از پنل ادمین → کاربران، بعد از احراز هویت، رمز جدید تعیین کنید)`,
    readByAdmin: false, readByUser: true, createdAt: new Date().toISOString() });
  db.meta = db.meta || {};
  persist();
  return { redirect: `/forgot?ch=${ch}&sent=1` };
}

export function handleResetPassword(req, res, { body, session, csrf }) {
  if (!csrfOk(req, session || csrf, body)) return { redirect: '/login' };
  const token = String(body.token || '');
  const r = findOne('passwordResets', x => x.token === token);
  if (!r || new Date(r.expiresAt) < new Date()) return { redirect: '/reset-password?token=x&invalid=1' };
  const password = validPassword(body.password);
  if (!password) return { error: 'رمز باید حداقل ۸ کاراکتر باشد.' };
  updateOne('users', u => u.id === r.userId, { passwordHash: hashPassword(password) });
  removeOne('passwordResets', x => x.id === r.id);
  const user = findOne('users', u => u.id === r.userId);
  login(res, user.id, true);
  return { redirect: user.role === 'admin' ? '/admin' : '/account?welcome=1' };
}
