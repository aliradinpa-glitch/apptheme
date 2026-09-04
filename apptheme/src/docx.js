// ═══ سازندهٔ سند Word (.docx) بدون وابستگی + رسم تصاویر راهنما (PNG) ═══
// برای فایلهای راهنمای «آموزش با عکس» که داخل خروجیهای هوش مصنوعی قرار میگیرند.
import zlib from 'node:zlib';
import { makeZip } from './zip.js';

/* ─────────── PNG ساده (RGBA) ─────────── */
function crc32(buf) {
  let c, table = crc32.table || (crc32.table = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
export function png(w, h, draw) {
  const px = new Uint8ClampedArray(w * h * 4);
  const set = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= w || y >= h || a <= 0) return;
    const i = (y * w + x) * 4, na = a / 255;
    px[i] = r * na + px[i] * (1 - na); px[i + 1] = g * na + px[i + 1] * (1 - na); px[i + 2] = b * na + px[i + 2] * (1 - na);
    px[i + 3] = Math.min(255, px[i + 3] + a);
  };
  const c = { w, h, rect: (x, y, rw, rh, col, a = 255, rad = 0) => {
    for (let yy = Math.max(0, y | 0); yy < Math.min(h, y + rh); yy++) for (let xx = Math.max(0, x | 0); xx < Math.min(w, x + rw); xx++) {
      if (rad > 0) { const cx = Math.max(x + rad, Math.min(xx + .5, x + rw - rad)), cy = Math.max(y + rad, Math.min(yy + .5, y + rh - rad)); if ((xx + .5 - cx) ** 2 + (yy + .5 - cy) ** 2 > rad * rad) continue; }
      set(xx, yy, col[0], col[1], col[2], a);
    }
  }, circle: (cx, cy, r, col, a = 255) => {
    for (let yy = Math.max(0, cy - r | 0); yy < Math.min(h, cy + r + 1); yy++) for (let xx = Math.max(0, cx - r | 0); xx < Math.min(w, cx + r + 1); xx++) {
      const d = (xx + .5 - cx) ** 2 + (yy + .5 - cy) ** 2; if (d <= r * r) set(xx, yy, col[0], col[1], col[2], a);
    }
  }, ring: (cx, cy, r, wd, col, a = 255) => {
    for (let yy = Math.max(0, cy - r - wd | 0); yy < Math.min(h, cy + r + wd + 1); yy++) for (let xx = Math.max(0, cx - r - wd | 0); xx < Math.min(w, cx + r + wd + 1); xx++) {
      const d = Math.sqrt((xx + .5 - cx) ** 2 + (yy + .5 - cy) ** 2); if (d >= r && d <= r + wd) set(xx, yy, col[0], col[1], col[2], a);
    }
  }, line: (x0, y0, x1, y1, wd, col, a = 255) => {
    for (let t = 0; t <= 1; t += 1 / Math.max(1, Math.hypot(x1 - x0, y1 - y0))) c.circle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, wd / 2, col, a);
  }, vgrad: (x, y, rw, rh, stops) => {
    for (let xx = x | 0; xx < Math.min(w, x + rw); xx++) {
      const t = Math.min(1, Math.max(0, (xx - x) / rw));
      let col = stops[0][1], a = 255;
      for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { const k = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]); col = stops[i][1].map((v, j) => v + (stops[i + 1][1][j] - v) * k); a = 255; break; }
      for (let yy = y | 0; yy < Math.min(h, y + rh); yy++) set(xx, yy, col[0], col[1], col[2], a);
    }
  }, arrow: (x0, y0, x1, y1, col) => { c.line(x0, y0, x1, y1, 7, col); const ang = Math.atan2(y1 - y0, x1 - x0); c.circle(x1 - Math.cos(ang - .5) * 12, y1 - Math.sin(ang - .5) * 12, 6, col); c.circle(x1 - Math.cos(ang + .5) * 12, y1 - Math.sin(ang + .5) * 12, 6, col); },
    num: (x, y, n, s = 6, col = [255, 255, 255]) => {
      const D = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '001', '001'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };
      const str = String(n); let ox = 0;
      for (const ch of str) { const g = D[ch] || D[0]; for (let ry = 0; ry < 5; ry++) for (let rx = 0; rx < 3; rx++) if (g[ry][rx] === '1') c.rect(x + ox + rx * s, y + ry * s, s, s, col, 235); ox += 4 * s; }
    } };
  draw(c);
  // کانال آلفا را روی پسزمینهٔ سفید ترکیب کن (سازگاری بهتر در Word)
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, o = y * (w * 4 + 1) + 1 + x * 4, a = px[i + 3] / 255;
      raw[o] = px[i] * a + 255 * (1 - a); raw[o + 1] = px[i + 1] * a + 255 * (1 - a); raw[o + 2] = px[i + 2] * a + 255 * (1 - a); raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ─────────── رسم تصاویر راهنما (مراحل نصب) ─────────── */
const INK = [30, 34, 60], MUT = [110, 118, 148], BG = [246, 247, 252], CARD = [255, 255, 255], LINE = [224, 226, 240];
const P = [124, 92, 255], P2 = [34, 211, 238], OK = [52, 211, 153], RED = [239, 68, 68], GOLD = [245, 158, 11];

function windowFrame(c, title, { step = null } = {}) {
  c.rect(40, 40, 720, 370, BG, 255, 18);
  c.rect(40, 40, 720, 64, [232, 234, 246], 255, 18);
  c.rect(40, 78, 720, 26, [232, 234, 246], 255);
  c.circle(70, 72, 8, [255, 95, 95]); c.circle(94, 72, 8, [255, 189, 58]); c.circle(118, 72, 8, [76, 201, 120]);
  c.rect(660, 62, 76, 20, [255, 255, 255], 255, 10);
  // نوار کناری ادمین
  c.rect(40, 104, 170, 306, [31, 36, 68], 255);
  c.rect(58, 126, 120, 14, [124, 92, 255], 255, 7);
  for (let i = 0; i < 7; i++) c.rect(58, 158 + i * 30, 90 + (i % 3) * 18, 10, [120, 130, 165], 200, 5);
  if (step !== null) { c.circle(742, 42, 20, [214, 35, 35], 255); c.circle(742, 42, 27, [214, 35, 35], 90); c.num(736, 31, step, 5, [255, 255, 255]); }
}

export function diagram(kind, step = 1) {
  return png(800, 450, (c) => {
    // پسزمینه
    c.vgrad(0, 0, 800, 450, [[0, [237, 234, 255]], [1, [226, 240, 252]]]);
    windowFrame(c, '', { step });
    const MX = 230, MY = 108;
    if (kind === 'php-upload') { // بارگذاری افزونه
      c.rect(MX, MY, 510, 300, [255, 255, 255], 255, 12);
      c.rect(MX + 20, MY + 18, 200, 16, [30, 34, 60], 255, 8); c.rect(MX + 20, MY + 44, 130, 9, [110, 118, 148], 255, 4);
      c.rect(MX + 20, MY + 80, 470, 190, [246, 247, 252], 255, 12);
      c.rect(MX + 40, MY + 100, 430, 150, [255, 255, 255], 255, 10);
      c.rect(MX + 40, MY + 100, 430, 150, [124, 92, 255], 40, 10);
      c.rect(MX + 40, MY + 100, 430, 46, [124, 92, 255], 22, 10);
      for (let i = 0; i < 5; i++) c.rect(MX + 60, MY + 164 + i * 16, 380 - i * 40, 8, [213, 216, 235], 255, 4);
      c.rect(MX + 120, MY + 196, 200, 34, [124, 92, 255], 255, 17); c.rect(MX + 160, MY + 208, 120, 11, [255, 255, 255], 255, 5);
      c.ring(MX + 340, MY + 213, 22, 6, RED);
      c.arrow(MX + 380, MY + 240, MX + 240, MY + 250, RED);
    } else if (kind === 'wp-activate') { // فهرست افزونهها + فعالسازی
      c.rect(MX, MY, 510, 300, [255, 255, 255], 255, 12);
      c.rect(MX + 20, MY + 16, 210, 15, [30, 34, 60], 255, 7);
      for (let i = 0; i < 4; i++) {
        const y = MY + 56 + i * 60;
        c.rect(MX + 20, y, 470, 48, [246, 247, 252], 255, 10);
        c.rect(MX + 34, y + 12, 30, 24, [124, 92, 255], 255, 6);
        c.rect(MX + 76, y + 14, 150 + (i % 2) * 60, 10, [30, 34, 60], 255, 5); c.rect(MX + 76, y + 30, 90, 8, [110, 118, 148], 255, 4);
        const on = i === 0;
        c.rect(MX + 380, y + 10, 96, 28, on ? OK : [226, 228, 242], 255, 14); c.rect(MX + 398, y + 19, 60, 10, on ? [255, 255, 255] : [110, 118, 148], on ? 255 : 200, 5);
        if (on) { c.ring(MX + 382, y + 24, 20, 5, RED); c.arrow(MX + 360, y + 54, MX + 300, y + 30, RED); }
      }
    } else if (kind === 'wp-shortcode') { // درج شورتکد
      c.rect(MX, MY, 510, 300, [255, 255, 255], 255, 12);
      c.rect(MX + 20, MY + 16, 170, 15, [30, 34, 60], 255, 7);
      c.rect(MX + 20, MY + 50, 470, 210, [246, 247, 252], 255, 10);
      c.rect(MX + 40, MY + 70, 430, 46, [255, 255, 255], 255, 8);
      c.rect(MX + 56, MY + 84, 250, 15, [124, 92, 255], 255, 5); c.rect(MX + 340, MY + 84, 90, 16, [52, 211, 153], 255, 8);
      for (let i = 0; i < 4; i++) c.rect(MX + 40, MY + 132 + i * 28, 430 - (i % 3) * 60, 10, [213, 216, 235], 255, 5);
      c.rect(MX + 40, MY + 250, 120, 34, [124, 92, 255], 255, 17);
      c.ring(MX + 100, MY + 267, 26, 5, RED); c.arrow(MX + 140, MY + 230, MX + 110, MY + 240, RED);
    } else if (kind === 'theme-install') {
      c.rect(MX, MY, 510, 300, [255, 255, 255], 255, 12);
      c.rect(MX + 20, MY + 16, 180, 15, [30, 34, 60], 255, 7);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const x = MX + 20 + i * 160, y = MY + 50 + j * 120, on = i === 0 && j === 0;
        c.rect(x, y, 150, 110, on ? OK : [246, 247, 252], on ? 60 : 255, 10);
        c.vgrad(x + 8, y + 8, 134, 62, [[0, [124, 92, 255]], [1, [34, 211, 238]]]);
        c.rect(x + 8, y + 78, 90, 10, [30, 34, 60], 255, 5); c.rect(x + 8, y + 94, 60, 8, [110, 118, 148], 255, 4);
      }
      c.rect(MX + 400, MY + 20, 96, 28, [124, 92, 255], 255, 14);
      c.ring(MX + 420, MY + 34, 20, 5, RED); c.arrow(MX + 380, MY + 80, MX + 400, MY + 50, RED);
    } else if (kind === 'code-folders') {
      c.rect(MX, MY, 510, 300, [255, 255, 255], 255, 12);
      c.rect(MX + 20, MY + 14, 140, 14, [30, 34, 60], 255, 7);
      const rows = [['📁', 'wordpress/', true], ['📁', 'pages/', true], ['📃', 'style.css', false], ['📃', 'functions.php', false], ['📃', 'راهنما.docx', false]];
      rows.forEach((r, i) => { c.rect(MX + 20, MY + 48 + i * 46, 470, 38, i % 2 ? [246, 247, 252] : [255, 255, 255], 255, 8); c.rect(MX + 36, MY + 58 + i * 46, 120 + (i % 3) * 40, 12, [30, 34, 60], 255, 6); c.rect(MX + 180, MY + 60 + i * 46, 60, 8, [110, 118, 148], 255, 4); });
      c.arrow(MX + 200, MY + 300, MX + 300, MY + 250, P2);
    } else if (kind === 'phone-app') {
      c.rect(MX + 120, MY + 10, 280, 330, [255, 255, 255], 255, 26);
      c.vgrad(MX + 132, MY + 22, 256, 78, [[0, [124, 92, 255]], [1, [34, 211, 238]]]);
      c.rect(MX + 146, MY + 40, 110, 12, [255, 255, 255], 255, 6); c.rect(MX + 146, MY + 60, 70, 8, [255, 255, 255], 200, 4);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) c.rect(MX + 144 + j * 82, MY + 116 + i * 100, 72, 88, [246, 247, 252], 255, 12);
      c.rect(MX + 226, MY + 322, 130, 16, [30, 34, 60], 255, 8);
      c.circle(MX + 640, MY + 120, 44, [255, 255, 255], 255); c.ring(MX + 640, MY + 120, 44, 6, RED); c.arrow(MX + 620, MY + 220, MX + 635, MY + 175, RED);
    } else if (kind === 'store-wizard') {
      const steps = [['🐞', 1], ['⚙️', 2], ['🎨', 3], ['💾', 4], ['✅', 5]];
      steps.forEach((s, i) => { const x = MX + 24 + i * 96; c.circle(x + 24, MY + 30, 20, i === 2 ? P : [226, 228, 242], 255); c.num(x + 16, MY + 20, i + 1, 4, i === 2 ? [255, 255, 255] : [110, 118, 148]); if (i < 4) c.line(x + 48, MY + 30, x + 96, MY + 30, 3, [213, 216, 235]); });
      c.rect(MX + 20, MY + 70, 470, 210, [246, 247, 252], 255, 12);
      for (let i = 0; i < 5; i++) { c.rect(MX + 40, MY + 88 + i * 36, 120, 9, [30, 34, 60], 255, 4); c.rect(MX + 180, MY + 86 + i * 36, 290, 12, [255, 255, 255], 255, 6); }
      c.rect(MX + 320, MY + 292, 140, 34, [124, 92, 255], 255, 17);
    } else { // پیشفرض: کاغذ گزارش
      c.rect(MX, MY, 510, 300, [255, 255, 255], 255, 12);
      c.rect(MX + 24, MY + 20, 220, 16, [30, 34, 60], 255, 8);
      for (let i = 0; i < 8; i++) c.rect(MX + 24, MY + 56 + i * 28, 460 - (i % 3) * 80, 10, [213, 216, 235], 255, 5);
      c.rect(MX + 24, MY + 284, 130, 12, [52, 211, 153], 255, 6);
    }
  });
}

/* ─────────── سازنده docx ─────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hasFa = (s) => /[\u0600-\u06FF]/.test(s);

function run(text, { sz = 22, bold = false, color = '1E2244', mono = false, fa = null } = {}) {
  const isFa = fa !== null ? fa : hasFa(text);
  return `<w:r><w:rPr><w:rFonts w:ascii="${mono ? 'Consolas' : 'Tahoma'}" w:hAnsi="${mono ? 'Consolas' : 'Tahoma'}" w:cs="${mono ? 'Consolas' : 'Tahoma'}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>${bold ? '<w:b/><w:bCs/>' : ''}${isFa ? '<w:rtl/>' : ''}<w:color w:val="${color}"/></w:rPr>${esc(text)}</w:r>`;
}
function para(content, { jc = 'right', bidi = true, spacing = 120, shade = null, keepNext = false } = {}) {
  return `<w:p>${keepNext ? '<w:pPr><w:keepNext/></w:pPr>' : ''}<w:pPr><w:spacing w:after="${spacing}" w:line="300" w:lineRule="auto"/><w:jc w:val="${jc}"/>${bidi ? '<w:bidi/>' : ''}${shade ? `<w:shd w:val="clear" w:fill="${shade}"/>` : ''}</w:pPr>${content}</w:p>`;
}
function heading(text, level, color = '5A3EF7') {
  const map = { 1: { sz: 34, before: 260, after: 140 }, 2: { sz: 27, before: 200, after: 100 } };
  const s = map[level] || map[2];
  return `<w:p><w:pPr><w:spacing w:before="${s.before}" w:after="${s.after}" w:line="300" w:lineRule="auto"/><w:jc w:val="right"/><w:outlineLvl w:val="${level - 1}"/><w:bidi/></w:pPr>${run(text, { sz: s.sz, bold: true, color: level === 1 ? color : '1E2244' })}</w:p>`;
}
function codeBlock(text) {
  return para(text.split('\n').map(l => run(l || ' ', { mono: true, sz: 18, fa: false })).join('<w:br/>'), { jc: 'left', bidi: false, shade: 'F3F0FF' });
}
function imageBlock(imgBuf, cap, pid) {
  const cx = 620 * 9525, cy = Math.round((450 / 800) * 620) * 9525;
  const relId = `rIdImg${pid}`;
  const drawing = `<w:p><w:pPr><w:spacing w:before="120" w:after="40"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${pid}" name="Image${pid}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${pid}" name="pic${pid}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  const capP = para(run(cap, { sz: 17, color: '66708C', bold: true }), { jc: 'center' });
  return { drawing, capP, relId };
}

/**
 * ساخت docx
 * blocks: {h1|h2, p, code, img:{kind,cap}, list:[], note, table:{head,rows}, br}
 */
export function makeDocx({ title, author = 'اپتم — هوش مصنوعی', blocks = [] }) {
  const images = [], paras = [];
  let pid = 1;
  for (const b of blocks) {
    if (b.h1) paras.push(heading(b.h1, 1));
    else if (b.h2) paras.push(heading(b.h2, 2));
    else if (b.p) paras.push(para(run(b.p)));
    else if (b.code) paras.push(codeBlock(b.code));
    else if (b.list) paras.push(...b.list.map((li, i) => para(run((['۱','۲','۳','۴','۵','۶','۷','۸','۹','۱۰'][i] || (i + 1) + '.') + ' ' + li))));
    else if (b.note) paras.push(para(run('💡 ' + b.note, { bold: true, color: '7C5CFF' }), { shade: 'F3F0FF' }));
    else if (b.img) {
      const buf = diagram(b.img.kind, b.img.step || pid);
      const { drawing, capP, relId } = imageBlock(buf, b.img.cap || `تصویر ${pid}`, pid);
      images.push({ relId, buf }); paras.push(drawing, capP); pid++;
    } else if (b.table) {
      const head = b.table.head.map(h => `<w:tc><w:tcPr><w:shd w:val="clear" w:fill="EFECFF"/><w:tcMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:start w:w="120" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:bidi/></w:pPr>${run(h, { bold: true, color: '5A3EF7' })}</w:p></w:tc>`).join('');
      const rows = b.table.rows.map(r => `<w:tr>${r.map(c => `<w:tc><w:tcMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:start w:w="120" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:bidi/></w:pPr>${run(c)}</w:p></w:tc>`).join('')}</w:tr>`).join('');
      paras.push(`<w:p></w:p><w:tbl><w:tblPr><w:tblW w:w="8600" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="D9D5F0"/><w:left w:val="single" w:sz="6" w:color="D9D5F0"/><w:bottom w:val="single" w:sz="6" w:color="D9D5F0"/><w:right w:val="single" w:sz="6" w:color="D9D5F0"/><w:insideH w:val="single" w:sz="4" w:color="E8E6F6"/><w:insideV w:val="single" w:sz="4" w:color="E8E6F6"/></w:tblBorders></w:tblPr>${head && `<w:tr>${head}</w:tr>`}${rows}</w:tbl>`);
    } else if (b.br) paras.push(`<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${paras.join('')}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1200" w:right="1300" w:bottom="1200" w:left="1300" w:header="700" w:footer="700" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>${images.map(im => `<Relationship Id="${im.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${im.relId}.png"/>`).join('')}</Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images.map(im => `<Relationship Id="${im.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${im.relId}.png"/>`).join('')}</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>${esc(author)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`;
  const files = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rels },
    { name: 'docProps/core.xml', data: core },
    { name: 'word/document.xml', data: xml },
    { name: 'word/_rels/document.xml.rels', data: docRels },
    ...images.map(im => ({ name: `word/media/${im.relId}.png`, data: im.buf })),
  ];
  return makeZip(files);
}
