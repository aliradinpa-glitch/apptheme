// ═══ ورود اجتماعی: گیت‌هاب، گوگل، تلگرام — فقط اگر در تنظیمات فعال شده باشد ═══
import crypto from 'node:crypto';
import { getDb, findOne, insert } from './db.js';
import { login } from './auth.js';
import { hashPassword, randomToken } from './security.js';
import { SITE_URL } from './config.js';

export function oauthConfig() {
  const o = getDb().settings.oauth || {};
  return {
    github: o.githubId && o.githubSecret ? { id: o.githubId, secret: o.githubSecret } : null,
    google: o.googleId && o.googleSecret ? { id: o.googleId, secret: o.googleSecret } : null,
    telegram: o.telegramBot && o.telegramToken ? { bot: o.telegramBot, token: o.telegramToken } : null,
  };
}

function findOrCreateUser({ name, email, source }) {
  let u = findOne('users', x => x.email === email);
  if (!u) {
    u = insert('users', {
      name: name || 'کاربر', email, mobile: '',
      passwordHash: hashPassword(randomToken(16)), // رمز تصادفی — با «فراموشی رمز» قابل تعیین است
      role: 'customer', active: true, verified: true,
      oauthSource: source, createdAt: new Date().toISOString(),
    });
  }
  return u;
}

// ─── گیت‌هاب ───
export function githubStart(req, res) {
  const c = oauthConfig().github;
  if (!c) return '/login?err=oauth';
  const state = randomToken(16);
  res.setHeader('Set-Cookie', `tl_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax`);
  const u = new URL('https://github.com/login/oauth/authorize');
  u.searchParams.set('client_id', c.id);
  u.searchParams.set('redirect_uri', `${SITE_URL}/auth/github/callback`);
  u.searchParams.set('scope', 'read:user user:email');
  u.searchParams.set('state', state);
  return u.href;
}

export async function githubCallback(req, res, query, cookieState) {
  const c = oauthConfig().github;
  if (!c || !query.code || !cookieState || cookieState !== query.state) return '/login?err=oauth';
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: c.id, client_secret: c.secret, code: query.code }),
  }).then(r => r.json()).catch(() => null);
  if (!tokenRes || !tokenRes.access_token) return '/login?err=oauth';
  const headers = { Authorization: 'Bearer ' + tokenRes.access_token, Accept: 'application/vnd.github+json' };
  const profile = await fetch('https://api.github.com/user', { headers }).then(r => r.json()).catch(() => ({}));
  let email = profile.email;
  if (!email) {
    const emails = await fetch('https://api.github.com/user/emails', { headers }).then(r => r.json()).catch(() => []);
    email = (Array.isArray(emails) && emails.find(e => e.primary && e.verified) || {}).email;
  }
  if (!email) return '/login?err=oauth';
  const u = findOrCreateUser({ name: profile.name || profile.login, email: email.toLowerCase(), source: 'github' });
  login(res, u.id, true);
  return u.role === 'admin' ? '/admin' : '/account';
}

// ─── گوگل ───
export function googleStart(req, res) {
  const c = oauthConfig().google;
  if (!c) return '/login?err=oauth';
  const state = randomToken(16);
  res.setHeader('Set-Cookie', `tl_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax`);
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', c.id);
  u.searchParams.set('redirect_uri', `${SITE_URL}/auth/google/callback`);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('state', state);
  return u.href;
}

export async function googleCallback(req, res, query, cookieState) {
  const c = oauthConfig().google;
  if (!c || !query.code || !cookieState || cookieState !== query.state) return '/login?err=oauth';
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: query.code, client_id: c.id, client_secret: c.secret, redirect_uri: `${SITE_URL}/auth/google/callback`, grant_type: 'authorization_code' }),
  }).then(r => r.json()).catch(() => null);
  if (!tokenRes || !tokenRes.id_token) return '/login?err=oauth';
  const payload = JSON.parse(Buffer.from(tokenRes.id_token.split('.')[1], 'base64url').toString('utf8'));
  if (!payload.email || !payload.email_verified) return '/login?err=oauth';
  const u = findOrCreateUser({ name: payload.name || payload.email.split('@')[0], email: payload.email.toLowerCase(), source: 'google' });
  login(res, u.id, true);
  return u.role === 'admin' ? '/admin' : '/account';
}

// ─── تلگرام (Login Widget) ───
export function telegramVerify(body) {
  const c = oauthConfig().telegram;
  if (!c || !body || !body.id || !body.hash) return null;
  const { hash, ...rest } = body;
  const dataCheck = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('\n');
  const secret = crypto.createHash('sha256').update(c.token).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  if (hmac !== hash) return null;
  if (Date.now() / 1000 - Number(body.auth_date || 0) > 86400) return null;
  return { id: body.id, name: body.first_name || body.username || 'کاربر تلگرام', username: body.username };
}

export function telegramLogin(res, tg, isHttps) {
  const email = `tg${tg.id}@telegram.local`;
  const u = findOrCreateUser({ name: tg.name, email, source: 'telegram' });
  login(res, u.id, isHttps);
  return u.role === 'admin' ? '/admin' : '/account';
}
