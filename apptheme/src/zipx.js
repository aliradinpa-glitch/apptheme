// ═══ خواننده ZIP بدون وابستگی — برای آپلود/تبدیل قالبها ═══
// پشتیبانی: method 0 (STORE) و 8 (DEFLATE) با zlib داخلی Node
import zlib from 'node:zlib';

function parseEOCD(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      return {
        count: buf.readUInt16LE(i + 10),
        cdOffset: buf.readUInt32LE(i + 16),
        cdSize: buf.readUInt32LE(i + 12),
      };
    }
  }
  return null;
}

/** استخراج همه فایلها از بافر ZIP → [{ name, data(Buffer), dir }] */
export function unzip(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (buf.length > 60 * 1024 * 1024) throw new Error('حجم فایل بیش از ۶۰ مگابایت است');
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'Rar!') {
    throw new Error('فایل RAR است؛ لطفاً با WinRAR آن را به ZIP تبدیل کنید و دوباره آپلود کنید.');
  }
  if (buf.length < 22 || buf.readUInt32LE(0) !== 0x04034b50) {
    // احتمالاً ZIP نیست (شاید RAR جدید یا فایل دیگر)
    throw new Error('فایل ZIP معتبر نیست (فرمت RAR پشتیبانی نمیشود؛ لطفاً ZIP کنید).');
  }
  const eocd = parseEOCD(buf);
  if (!eocd) throw new Error('ساختار ZIP خراب است');
  const out = [];
  let p = eocd.cdOffset;
  for (let i = 0; i < eocd.count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    let name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    // نامهای غیر UTF-8 را با latin1 بخوان
    if (/[\uFFFD]/.test(name)) name = buf.toString('latin1', p + 46, p + 46 + nameLen);
    const isDir = name.endsWith('/');
    if (isDir) { out.push({ name: name.replace(/\/+$/, ''), data: Buffer.alloc(0), dir: true }); p += 46 + nameLen + extraLen + commentLen; continue; }

    // هدر لوکال
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    let raw = buf.subarray(dataStart, dataStart + compSize);
    let data;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) { try { data = zlib.inflateRawSync(raw); } catch { data = Buffer.alloc(0); } }
    else data = Buffer.alloc(0);
    // امنیت: حذف مسیرهای فرار
    name = name.split('\\').join('/');
    while (name.startsWith('./')) name = name.slice(2);
    name = name.split('/').filter(s => s && s !== '..' && !s.includes(':')).join('/');
    if (name) out.push({ name, data, dir: false });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** تشخیص نوع پلتفرم قالب از فایلهای استخراجشده */
export function detectPlatform(files) {
  const names = files.map(f => f.name.toLowerCase());
  const has = re => names.some(n => re.test(n));
  const read = re => { const f = files.find(x => re.test(x.name.toLowerCase())); return f ? f.data.toString('utf8', 0, 4000) : ''; };
  if (has(/^.*style\.css$/i)) {
    const sc = read(/style\.css$/i);
    if (/theme name/i.test(sc)) {
      if (/woocommerce/i.test(read(/functions\.php$/i)) || has(/woocommerce\.php$/i)) return 'woocommerce';
      return 'wordpress';
    }
  }
  if (has(/manage\.py$/) || has(/^.*settings\.py$/)) return 'django';
  if (has(/package\.json$/) && /"express"/i.test(read(/package\.json$/))) return 'node';
  if (has(/index\.html?$/i)) return 'html';
  return 'unknown';
}

/** تحلیل هوشمند قالب آپلودشده: برند، پالت رنگ، صفحات، توضیح */
export function analyzeTemplate(files) {
  const htmls = files.filter(f => !f.dir && /\.html?$/i.test(f.name) && f.data.length < 800000);
  const main = htmls.sort((a, b) => b.data.length - a.data.length)[0];
  const titleMatch = main && /<title[^>]*>([^<]{2,120})<\/title>/i.exec(main.data.toString('utf8', 0, 60000));
  let brand = titleMatch ? titleMatch[1].trim().split(/[-–|]|—/)[0].trim() : '';
  if (!brand || brand.length > 40) brand = 'قالب من';

  // پالت رنگ: از استایلهای inline + تگهای style + فایلهای css
  const colorRe = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
  const counts = new Map();
  const eat = (s) => { const m = String(s).match(colorRe); if (m) for (const c of m) { const k = c.length === 4 ? '#' + [...c.slice(1)].map(x => x + x).join('') : c; counts.set(k.toLowerCase(), (counts.get(k.toLowerCase()) || 0) + 1); } };
  for (const f of files.filter(x => /\.css$/i.test(x.name) && x.data.length < 400000)) eat(f.data.toString('utf8', 0, 400000));
  if (main) { eat(main.data.toString('utf8', 0, 120000)); const m2 = main.data.toString('utf8', 0, 120000).match(/<style[^>]*>([\s\S]{0,60000}?)<\/style>/gi); if (m2) eat(m2.join('')); }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const palette = top.length >= 2 ? [top[0], top[1], top[2] || '#f59e0b'] : (top[0] ? [top[0], '#1e293b', '#f59e0b'] : ['#6d5ef2', '#22d3ee', '#f472b6']);
  const pageCount = htmls.length;
  const platform = detectPlatform(files);
  const pages = htmls.slice(0, 12).map(h => h.name.replace(/\\/g, '/'));
  return { brand, palette, pageCount, platform, pages, files: files.length, sizeKB: Math.round(files.reduce((s, f) => s + f.data.length, 0) / 1024) };
}
