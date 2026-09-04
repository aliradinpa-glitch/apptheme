// ─── مناسبت‌های تقویم شمسی + تخفیف خودکار ───
// الگوریتم تبدیل میلادی→جلالی (بر اساس jalaali-js، مجوز MIT)

const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy) {
  const bl = breaks.length, gy = jy + 621;
  let leapJ = -14, jp = breaks[0], jm, jump = 0, leap, n, i;
  for (i = 1; i < bl; i += 1) {
    jm = breaks[i]; jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function toJalaali(date) {
  const gy = date.getFullYear(), gm = date.getMonth() + 1, gd = date.getDate();
  const jdn = g2d(gy, gm, gd);
  const gy2 = d2g(jdn).gy;
  let jy = gy2 - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy2, 3, r.march);
  let k = jdn - jdn1f, jm, jd;
  if (k >= 0) {
    if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy, jm, jd }; }
    else { k -= 186; }
  } else {
    jy -= 1; k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

// ─── مناسبت‌ها (بازه شمسی) ───
export const OCCASIONS = [
  { key: 'nowruz', label: 'نوروز', icon: '🌱', percent: 20, from: { m: 1, d: 1 }, to: { m: 1, d: 5 }, note: 'جشن سال نو' },
  { key: 'summer', label: 'حراج تابستانه', icon: '☀️', percent: 15, from: { m: 4, d: 1 }, to: { m: 6, d: 31 }, note: 'حراج بزرگ تابستان' },
  { key: 'autumn', label: 'هفته حراج پاییز', icon: '🍂', percent: 25, from: { m: 8, d: 24 }, to: { m: 8, d: 30 }, note: 'حراج بزرگ پاییزی' },
  { key: 'yalda', label: 'جشنواره یلدا', icon: '🍉', percent: 20, from: { m: 9, d: 28 }, to: { m: 9, d: 30 }, note: 'بلندترین شب سال' },
  { key: 'fajr', label: 'دهه فجر', icon: '🎇', percent: 15, from: { m: 11, d: 1 }, to: { m: 11, d: 12 }, note: 'دهه مبارک' },
];

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
export function occasionRangeLabel(o) {
  return `${MONTHS[o.from.m - 1]} ${o.from.d} تا ${MONTHS[o.to.m - 1]} ${o.to.d}`;
}

function inRange(today, o) {
  const v = today.jm * 100 + today.jd;
  const a = o.from.m * 100 + o.from.d, b = o.to.m * 100 + o.to.d;
  return a <= b ? (v >= a && v <= b) : (v >= a || v <= b);
}

// مناسبت فعال (خودکار + Override ادمین)
export function effectiveOccasion(settings = {}) {
  const today = toJalaali(new Date());
  const overrides = settings.occasions || {};
  const actives = [];
  for (const o of OCCASIONS) {
    const ov = overrides[o.key] || {};
    const percent = Math.min(60, Math.max(0, Number(ov.percent ?? o.percent)));
    const forced = ov.forced; // 'on' | 'off' | undefined
    const active = forced === 'on' || (forced !== 'off' && inRange(today, o));
    if (active && percent > 0) actives.push({ ...o, percent });
  }
  actives.sort((a, b) => b.percent - a.percent);
  const occ = actives[0] || null;
  return occ ? { key: occ.key, label: occ.label, icon: occ.icon, percent: occ.percent } : null;
}
