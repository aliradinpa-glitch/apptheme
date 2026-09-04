// ═══ سبد خرید سروری بر پایه کوکی — بدون نیاز به جاوااسکریپت مرورگر ═══
// حتی اگر JS مرورگر کاربر قدیمی/خراب باشد، سبد کار می‌کند (فرم‌های HTML)
import { findOne, findMany } from './db.js';

const COOKIE = 'tlcart';
const MAX_QTY = 10, MAX_ITEMS = 20;

export function readCart(req) {
  const m = /(?:^|;\s*)tlcart=([^;]*)/.exec(req.headers.cookie || '');
  if (!m) return [];
  try {
    const raw = JSON.parse(decodeURIComponent(m[1]));
    if (!Array.isArray(raw)) return [];
    const seen = new Set(), out = [];
    for (const it of raw.slice(0, MAX_ITEMS)) {
      const id = parseInt(it.id, 10), qty = Math.max(1, Math.min(MAX_QTY, parseInt(it.qty, 10) || 1));
      const p = Number.isInteger(id) && findOne('products', x => x.id === id && x.published);
      if (p && !seen.has(id)) { seen.add(id); out.push({ id, qty }); }
    }
    return out;
  } catch { return []; }
}

export function writeCart(res, items) {
  const val = items.length ? encodeURIComponent(JSON.stringify(items)) : '';
  // اگر خالی است، کوکی را حذف کن (Max-Age=0)
  res.setHeader('Set-Cookie', `${COOKIE}=${val}; Path=/; Max-Age=${val ? 2592000 : 0}; SameSite=Lax`);
}

export function cartAdd(items, productId, qty = 1) {
  const id = parseInt(productId, 10);
  const p = Number.isInteger(id) && findOne('products', x => x.id === id && x.published);
  if (!p) return items;
  const found = items.find(x => x.id === id);
  if (found) found.qty = Math.min(MAX_QTY, found.qty + (parseInt(qty, 10) || 1));
  else if (items.length < MAX_ITEMS) items.push({ id, qty: Math.min(MAX_QTY, parseInt(qty, 10) || 1) });
  return items;
}

export function cartSummary(items) {
  const rows = items.map(({ id, qty }) => {
    const p = findOne('products', x => x.id === id && x.published);
    if (!p) return null;
    const price = p.salePrice || p.price;
    return { id, qty, title: p.title, slug: p.slug, price, line: price * qty, palette: p.palette, accent: p.accent };
  }).filter(Boolean);
  return { rows, count: rows.reduce((s, r) => s + r.qty, 0), subtotal: rows.reduce((s, r) => s + r.line, 0) };
}

// کوچک‌سازی برای پاسخ‌های JSON (badge/drawer) — مافوق‌حرفه‌ای: پس‌انداز + ارسال رایگان + پیش‌نمایش رنگ
export const FREE_SHIP_THRESHOLD = 500000;
export function cartJson(items) {
  const s = cartSummary(items);
  const rows = s.rows.map(r => {
    const p = findOne('products', x => x.id === r.id && x.published);
    return {
      id: r.id, title: r.title, slug: r.slug, price: r.price, qty: r.qty, line: r.line,
      oldPrice: p && p.price && p.salePrice ? p.price : null,
      savings: p && p.price && p.salePrice ? (p.price - p.salePrice) * r.qty : 0,
      palette: p?.palette || ['#7c5cff', '#22d3ee'], accent: p?.accent || '#f59e0b',
    };
  });
  const savings = rows.reduce((x, r) => x + (r.savings || 0), 0);
  const freeShipLeft = Math.max(0, FREE_SHIP_THRESHOLD - s.subtotal);
  return { ok: true, count: s.count, subtotal: s.subtotal, savings, freeShipLeft, freeShip: freeShipLeft === 0, items: rows };
}
