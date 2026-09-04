// ═══════════════════════════════════════════════════════════════
// «سازندهٔ افزونه هوشمند» — پرامپت میگیرد، افزونهٔ کامل وردپرس/ووکامرس
// میسازد + فایل راهنمای Word با تصاویر مراحل نصب
// ═══════════════════════════════════════════════════════════════
import { makeDocx, diagram } from './docx.js';
import { tierOf, smartGuide } from './gencore.js';

function slugifyFa(s) { return String(s).trim().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').toLowerCase() || 'smart-plugin'; }

// ─── تحلیل پرامپت افزونه ───
export function parsePluginPrompt(text, tierKey = 'gold') {
  const t = String(text || '');
  const brandM = /(?:افزونه|پلاگین|برنامه)[^«"]*[«"]([^»"]{2,40})[»"]|برای\s+([^\s،,]{2,30})|(?:افزونه|پلاگین|برنامه)\s+[«"]?([^\s«"»،,]{2,30})/.exec(t);
  const name = (brandM && (brandM[1] || brandM[2] || brandM[3])) || 'افزونه هوشمند';
  const isWoocommerce = /(ووکامرس|woo|فروشگاه|محصول|سبد پرداخت|سبد خرید|درگاه)/i.test(t);
  const features = [];
  const map = [
    ['فرم تماس', /(فرم تماس|contact form)/],
    ['سبد خرید و پرداخت', /(سبد|پرداخت|خرید|پرداخت.*آنلاین)/],
    ['اعلان سفارش', /(اعلان|نوتیفیکیشن|اطلاع.*سفارش)/],
    ['کد تخفیف', /(تخفیف|کوپن|کد.*تخفیف)/],
    ['آمار و نمودار', /(آمار|نمودار|گزارش|داشبورد)/],
    ['بهینهسازی سئو', /(سئو|seo|گوگل)/],
    ['کش و سرعت', /(سرعت|کش|cache|بهینه)/],
    ['ورود اجتماعی', /(ورود.*(گوگل|گیتهاب|تلگرام)|oauth)/],
    ['بکاپ', /(بکاپ|پشتیبان|backup)/],
    ['چندزبانه', /(چندزبانه|ترجمه|زبان)/],
  ];
  for (const [label, re] of map) if (re.test(t)) features.push(label);
  if (features.length === 0) features.push('فرم تماس', 'آمار و نمودار');
  const tier = tierOf(tierKey || detectTierFromFeatures(features.length));
  return { name: name.slice(0, 40), slug: slugifyFa(name), isWoocommerce, features: features.slice(0, 8), tier, prompt: t.slice(0, 400) };
}
function detectTierFromFeatures(n) { return n >= 7 ? 'legendary' : n >= 4 ? 'vip' : n >= 2 ? 'gold' : 'silver'; }

// ─── PHP ساز افزونه ───
export function pluginPhp(spec) {
  const isW = spec.isWoocommerce;
  const feats = spec.features;
  const adminMenu = feats.filter(f => /(آمار|داشبورد|تنظیم|گزارش)/.test(f)).length ? `dashboard` : 'general';
  const hasHooks = feats.map(f => {
    switch (f) {
      case 'فرم تماس': return `add_shortcode('${spec.slug}_contact', function(){ ob_start(); ?> <form method="post" class="tl-contact-form"><input name="tl_name" placeholder="نام"><input name="tl_email" type="email" placeholder="ایمیل"><textarea name="tl_msg" placeholder="پیام"></textarea><button type="submit">ارسال</button></form> <?php if(isset($_POST['tl_name'])){ wp_mail(get_option('admin_email'), 'پیام جدید', sanitize_text_field($_POST['tl_msg'])); echo '<p class="tl-ok">✓ پیام ارسال شد</p>';} return ob_get_clean(); });`;
      case 'اعلان سفارش': return `add_action('woocommerce_thankyou', function($order_id){ if(get_option('${spec.slug}_notify')==='1'){ wp_mail(get_option('admin_email'), 'سفارش جدید #'.$order_id, 'یک سفارش جدید ثبت شد.'); } });`;
      case 'کد تخفیف': return `add_action('woocommerce_cart_coupon_updated', function(){ WC()->cart->calculate_totals(); });`;
      default: return '';
    }
  }).filter(Boolean).join('\n');
  return `<?php
/**
 * Plugin Name: ${spec.name}
 * Description: ${spec.prompt || 'افزونه هوشمند تولیدشده با قالبساز اپتم'}
 * Version: 1.0.0
 * Author: ${spec.name}
 * License: GPLv2
 * Requires at least: 5.8
 * Text Domain: ${spec.slug}
 */
if (!defined('ABSPATH')) exit;

class ${spec.name.replace(/[^A-Za-z0-9]/g, '')}_Plugin {
  public function __construct() {
    register_activation_hook(__FILE__, [$this, 'activate']);
    add_action('admin_menu', [$this, 'menu']);
    add_action('admin_enqueue_scripts', [$this, 'assets']);
    add_action('wp_enqueue_scripts', [$this, 'assetsFront']);
    add_filter('plugin_action_links_' . plugin_basename(__FILE__), [$this, 'links']);
    ${isW ? "add_action('woocommerce_loaded', [$this, 'woo']);" : "add_action('init', [$this, 'init']);"}
  }
  public function activate() { add_option('${spec.slug}_version', '1.0.0'); }
  public function init() {
    ${spec.features.includes('فرم تماس') ? `add_shortcode('${spec.slug}_contact', [$this, 'contactForm']);` : ''}
  }
  public function woo() {
    ${spec.features.includes('سبد خرید و پرداخت') ? `add_filter('woocommerce_currency_symbol', function(){ return 'تومان'; });` : ''}
    ${spec.features.includes('آمار و نمودار') ? `add_action('woocommerce_after_order_table', function($order){ echo '<p>📦 شماره سفارش: '.$order->get_id().'</p>'; });` : ''}
    ${hasHooks.split('\n').filter(l => l.includes('woocommerce_')).join('\n    ')}
  }
  public function contactForm() {
    ob_start(); ?>
    <form method="post" class="${spec.slug}-contact">
      <input name="tl_name" placeholder="نام" required>
      <input name="tl_email" type="email" placeholder="ایمیل" required>
      <textarea name="tl_msg" placeholder="پیام شما…" required></textarea>
      <button type="submit">ارسال پیام ✉️</button>
    </form>
    <style>.${spec.slug}-contact{display:grid;gap:10px;max-width:420px}.${spec.slug}-contact input,.${spec.slug}-contact textarea{padding:11px 13px;border:1.5px solid #ddd6f5;border-radius:10px;font:inherit}.${spec.slug}-contact button{background:linear-gradient(135deg,#7c5cff,#22d3ee);color:#fff;border:0;border-radius:10px;padding:11px;font-weight:700;cursor:pointer}</style>
    <?php if (isset($_POST['tl_name'])) { wp_mail(get_option('admin_email'), 'پیام جدید از سایت', sanitize_text_field($_POST['tl_name'])."\n".sanitize_text_field($_POST['tl_msg'])); echo '<p style="color:#16a34a">✓ پیام شما ارسال شد</p>'; }
    return ob_get_clean();
  }
  public function menu() { add_menu_page('${spec.name}', '${spec.name}', 'manage_options', '${spec.slug}', [$this, 'page'], 'dashicons-admin-generic', 58); }
  public function page() { ?>
    <div class="wrap">
      <h1>⚡ ${spec.name}</h1>
      <form method="post">
        <table class="form-table">
          <tr><th>حالت نوتیفیکیشن سفارش</th><td><label><input type="checkbox" name="${spec.slug}_notify" <?php checked(get_option('${spec.slug}_notify'),'1'); ?>> فعال باشد</label></td></tr>
          <tr><th>پیام سفارشی</th><td><input type="text" name="${spec.slug}_msg" value="<?php echo esc_attr(get_option('${spec.slug}_msg','خوش آمدید')); ?>" style="width:320px"></td></tr>
        </table>
        <?php submit_button(); ?>
      </form>
    </div>
  <?php }
  public function assets() { wp_enqueue_style('${spec.slug}-admin', plugin_dir_url(__FILE__).'admin.css'); }
  public function assetsFront() { wp_enqueue_style('${spec.slug}-front', plugin_dir_url(__FILE__).'front.css'); }
  public function links($links) { array_unshift($links, '<a href="'.admin_url('admin.php?page=${spec.slug}').'">تنظیمات</a>'); return $links; }
}
new ${spec.name.replace(/[^A-Za-z0-9]/g, '')}_Plugin();`;
}

// ─── CSS افزونه ───
function pluginCss(spec, admin) {
  return admin ? `
.wrap h1 { color: #5a3ef7; }
.form-table th { width: 200px; color: #1e2244; }
.form-table input[type=text] { border-radius: 8px; border: 1.5px solid #ddd6f5; padding: 8px 12px; }
` : `
.${spec.slug}-contact { display: grid; gap: 10px; max-width: 460px; }
.${spec.slug}-contact input, .${spec.slug}-contact textarea { padding: 11px 13px; border: 1.5px solid #ddd6f5; border-radius: 10px; font: inherit; }
.${spec.slug}-contact button { background: linear-gradient(135deg, #7c5cff, #22d3ee); color: #fff; border: 0; border-radius: 10px; padding: 11px; font-weight: 700; cursor: pointer; }
.${spec.slug}-contact button:hover { box-shadow: 0 8px 20px rgba(124,92,255,.35); }
`;
}

// ─── README ───
function readme(spec) {
  const steps = spec.features.map((f, i) => `${i + 1}. **${f}** — فعالسازی از منوی ${spec.slug}`).join('\n');
  return `# ${spec.name}

افزونه وردپرس تولیدشده با **قالبساز هوشمند اپتم** — ${spec.features.join('، ')}.

## نصب
1. از پیشخوان وردپرس → افزونهها → بارگذاری، فایل ZIP را بدهید
2. «فعالسازی» را بزنید
3. منوی «${spec.name}» از پیشخوان باز کنید و تنظیمات را ذخیره کنید

## امکانات
${steps}

## فایل راهنما
فایل «راهنما با عکس (Word).docx» داخل همین پوشه — مراحل نصب را با تصویر نشان میدهد.`;
}

export function generatePlugin(spec) {
  const files = [
    { name: `${spec.slug}/${spec.slug}.php`, data: pluginPhp(spec) },
    { name: `${spec.slug}/admin.css`, data: pluginCss(spec, true) },
    { name: `${spec.slug}/front.css`, data: pluginCss(spec, false) },
    { name: `${spec.slug}/README.md`, data: readme(spec) },
    { name: `${spec.slug}/راهنما با عکس (Word).docx`, data: smartGuide({
      kind: 'plugin', title: `راهنمای نصب افزونه ${spec.name}`,
      steps: ['فایل ZIP را از بخش دانلود دریافت کنید', 'در وردپرس به «افزونهها → بارگذاری» بروید', 'فایل را انتخاب و نصب کنید', 'دکمه فعالسازی را بزنید'],
      images: [{ kind: 'php-upload', cap: 'مرحله ۱: بارگذاری فایل افزونه در پیشخوان وردپرس', step: 1 }, { kind: 'wp-activate', cap: 'مرحله ۲: فعالسازی افزونه از فهرست', step: 2 }, { kind: 'wp-shortcode', cap: 'مرحله ۳: استفاده از شورتکدها در برگهها', step: 3 }],
    }) },
  ];
  return { files, spec, zipName: `${spec.slug}.zip` };
}
