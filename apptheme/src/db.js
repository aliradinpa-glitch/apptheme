// ─── دیتابیس JSON با نوشتن اتمیک (بدون وابستگی خارجی) ───
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.js';
import { seedDb } from './seed.js';
import { randomToken } from './security.js';

const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db = null;

export function loadDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      const backup = DB_FILE + '.corrupted-' + Date.now();
      fs.renameSync(DB_FILE, backup);
      console.error('[db] فایل خراب بود؛ به «' + backup + '» منتقل شد:', e.message);
      db = null;
    }
  }
  if (!db || !db.meta) {
    db = seedDb();
    console.log('[db] دیتابیس جدید با داده‌های نمونه ساخته شد.');
  }
  migrate(db);
  persist();
  return db;
}

// افزودن فیلدها/کالکشن‌های نسخه‌های جدید به دیتابیس‌های قدیمی
export function migrate(d) {
  d.meta = d.meta || {};
  if (!d.meta.secret) d.meta.secret = randomToken(24);
  d.messages = d.messages || [];
  d.projects = d.projects || [];
  d.verifications = d.verifications || [];
  d.licenses = d.licenses || [];
  d.transactions = d.transactions || [];
  d.withdrawals = d.withdrawals || [];
  for (const u of d.users || []) {
    if (u.wallet === undefined) u.wallet = 0;
    if (u.sheba === undefined) u.sheba = '';
  }
  d.settings = d.settings || {};
  d.settings.occasions = d.settings.occasions || {};
  d.settings.smtp = d.settings.smtp || { host: '', port: 587, user: '', pass: '', from: '' };
  for (const u of d.users || []) {
    if (u.mobile === undefined) u.mobile = '';
    if (u.verified === undefined) u.verified = true; // کاربران قبلی معتبر فرض می‌شوند
  }
}

export function persist() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 1), 'utf8');
  fs.renameSync(tmp, DB_FILE); // اتمیک
}

export const getDb = () => db;

// جایگزینی کامل دیتابیس (بازیابی پشتیبان) — نشست‌ها ریست می‌شوند
export function replaceDb(nd) {
  nd.sessions = [];
  migrate(nd);
  db = nd;
  persist();
  return db;
}

export function nextId(col) {
  return db[col].reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
}

export function insert(col, doc) {
  doc.id = nextId(col);
  doc.createdAt = doc.createdAt || new Date().toISOString();
  db[col].push(doc);
  persist();
  return doc;
}

export function findOne(col, pred) {
  return db[col].find(pred) || null;
}

export function findMany(col, pred = () => true) {
  return db[col].filter(pred);
}

export function updateOne(col, pred, patch) {
  const doc = findOne(col, pred);
  if (!doc) return null;
  Object.assign(doc, patch, { updatedAt: new Date().toISOString() });
  persist();
  return doc;
}

export function removeOne(col, pred) {
  const i = db[col].findIndex(pred);
  if (i === -1) return false;
  db[col].splice(i, 1);
  persist();
  return true;
}

// میانگین امتیاز یک محصول از کامنت‌های تأییدشده
export function productRating(productId) {
  const cs = findMany('comments', c => c.productId === productId && c.status === 'approved');
  if (!cs.length) return { rating: 0, count: 0 };
  const rating = cs.reduce((s, c) => s + (c.rating || 0), 0) / cs.length;
  return { rating: Math.round(rating * 10) / 10, count: cs.length };
}

export function productLikes(productId) {
  return findMany('likes', l => l.productId === productId).length;
}
