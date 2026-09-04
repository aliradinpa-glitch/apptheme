// ─── امنیت: هش رمز (scrypt)، محدودسازی نرخ، کوکی، هدرهای امنیتی ───
import crypto from 'node:crypto';

// ── رمزنگاری رمز عبور با scrypt (داخل خود Node، بدون وابستگی) ──
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const test = crypto.scryptSync(String(password), salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), test);
  } catch { return false; }
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ── توکن امضاشده HMAC (برای لینک دانلود بدون دیتابیس) ──
export function signPayload(secret, payload) {
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return Buffer.from(payload).toString('base64url') + '.' + mac;
}

export function verifySigned(secret, token, maxAgeMs) {
  try {
    const [b64, mac] = String(token).split('.');
    if (!b64 || !mac) return null;
    const payload = Buffer.from(b64, 'base64url').toString('utf8');
    const expect = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
    const exp = Number(payload.split('|')[2] || 0);
    if (maxAgeMs && Date.now() > exp) return null;
    return payload;
  } catch { return null; }
}

// ── محدودسازی نرخ درخواست (حافظه‌ای، پنجره‌ای) ──
const buckets = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
}, 60_000).unref();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  return b.count <= limit;
}

// ── کوکی ──
export function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookieStr(name, value, { maxAge = null, httpOnly = true, path = '/', secure = false, sameSite = 'Lax' } = {}) {
  let s = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) s += '; HttpOnly';
  if (secure) s += '; Secure';
  if (maxAge !== null) s += `; Max-Age=${Math.floor(maxAge / 1000)}`;
  return s;
}

// ── هدرهای امنیتی ──
export function securityHeaders(res, isHttps) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (isHttps) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // CSP: بدون اسکریپت inline؛ استایل اینلاین مجاز (برای صفحات پیش‌نمایش و ریزاستایل‌ها)
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self' https://*.e2b.app",
  ].join('; '));
}

// ── اعتبارسنجی ورودی ──
export function validName(v) {
  const s = String(v || '').trim();
  return s.length >= 2 && s.length <= 60 ? s : null;
}
export function validPassword(v) {
  const s = String(v || '');
  return s.length >= 8 && s.length <= 72 ? s : null;
}
export function cleanText(v, max = 2000) {
  return String(v || '').trim().slice(0, max);
}
