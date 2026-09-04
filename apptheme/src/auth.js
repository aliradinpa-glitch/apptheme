// ─── احراز هویت: نشست‌ها، CSRF، محافظت مسیرها ───
import { SESSION_COOKIE, CSRF_COOKIE, SESSION_TTL_MS } from './config.js';
import { parseCookies, cookieStr, randomToken } from './security.js';
import { findOne, insert, removeOne, persist } from './db.js';

// کاربر جاری از روی کوکی نشست
export function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return { user: null, session: null };
  const session = findOne('sessions', s => s.token === token);
  if (!session) return { user: null, session: null };
  if (new Date(session.expiresAt) < new Date()) {
    removeOne('sessions', s => s.token === token);
    return { user: null, session: null };
  }
  const user = findOne('users', u => u.id === session.userId && u.active !== false);
  if (!user) return { user: null, session: null };
  return { user, session };
}

export function createSession(userId) {
  const session = {
    token: randomToken(32),
    userId,
    csrf: randomToken(16),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  insert('sessions', session);
  return session;
}

export function destroySession(token) {
  if (token) removeOne('sessions', s => s.token === token);
}

export function sessionCookie(token, isHttps) {
  return cookieStr(SESSION_COOKIE, token, { maxAge: SESSION_TTL_MS, secure: isHttps });
}

export function clearSessionCookie() {
  return cookieStr(SESSION_COOKIE, '', { maxAge: 0 });
}

// CSRF: توکن دابل‌سابمیت برای فرم‌های بی‌نشست (لاگین/ثبت‌نام/ستاپ)
export function anonCsrf(req, res, isHttps) {
  const cookies = parseCookies(req);
  let t = cookies[CSRF_COOKIE];
  if (!t || !/^[a-f0-9]{32}$/.test(t)) {
    t = randomToken(16);
    res.setHeader('Set-Cookie', cookieStr(CSRF_COOKIE, t, { maxAge: SESSION_TTL_MS, httpOnly: false, secure: isHttps }));
  }
  return t;
}

export function csrfOk(req, sessionOrToken, body = {}) {
  const sent = req.headers['x-csrf'] || body._csrf || '';
  const expected = typeof sessionOrToken === 'string' ? sessionOrToken : sessionOrToken?.csrf;
  return !!(expected && sent && sent === expected);
}

export function login(res, userId, isHttps) {
  const s = createSession(userId);
  res.setHeader('Set-Cookie', sessionCookie(s.token, isHttps));
  return s;
}

export function logout(req, res) {
  const cookies = parseCookies(req);
  destroySession(cookies[SESSION_COOKIE]);
  res.setHeader('Set-Cookie', clearSessionCookie());
}

// پاک‌سازی نشست‌های منقضی (هر ۱۰ دقیقه)
import { getDb } from './db.js';
setInterval(() => {
  const db = getDb();
  const now = Date.now();
  const before = db.sessions.length;
  db.sessions = db.sessions.filter(s => new Date(s.expiresAt) > now);
  if (db.sessions.length !== before) persist();
}, 600_000).unref();
