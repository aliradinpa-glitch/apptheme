// ═══════════════════════════════════════════════════════════════
// «فروشگاهساز هوشمند» — با پرامپت، فروشگاه کامل میسازد
// خروجیها: ووکامرس (وردپرس) / وردپرس / جنگو / نود اکسپرس / HTML خالص
// + فایل راهنمای Word با تصویر برای هرکدام
// ═══════════════════════════════════════════════════════════════
import { makeDocx } from './docx.js';
import { tierOf, tierExtras, estimatePrice } from './gencore.js';
import { parsePrompt } from './promptgen.js';

const FRAMEWORKS = { woocommerce: 'ووکامرس وردپرس', wordpress: 'وردپرس', django: 'جنگو (Python)', node: 'نود جیاس (Express)', html: 'HTML خالص' };

export function parseStorePrompt(text, tierKey = 'gold') {
  const spec = parsePrompt(text); // نوع، برند، پالت، تم
  const t = String(text || '');
  let framework = 'html';
  if (/(ووکامرس|woo)/i.test(t)) framework = 'woocommerce';
  else if (/(وردپرس|wordpress|wp)/i.test(t)) framework = 'wordpress';
  else if (/(جنگو|django|پایتون|python)/i.test(t)) framework = 'django';
  else if (/(نود|node|اکسپرس|express)/i.test(t)) framework = 'node';
  const needsPayment = /(پرداخت|درگاه|زرین|کارت|خرید آنلاین|سبد)/.test(t);
  const needsAuth = /(ورود|ثبت ?نام|حساب کاربری|عضویت)/.test(t);
  const tier = tierOf(tierKey);
  return { ...spec, framework, needsPayment, needsAuth, tier, prompt: text.slice(0, 400) };
}

// ─── هسته مشترک HTML فروشگاه ───
export function storeHtml(spec, { withCart = true, withAuth = true } = {}) {
  const [c1, c2, ac] = spec.palette;
  const items = Array(8).fill(0).map((_, i) => `<div class="pd"><div class="pimg" style="background:linear-gradient(135deg,${c1}${(40 + i * 6) > 99 ? 99 : 40 + i * 6}cc,${c2}cc)"><span>${['🛍️','📱','💻','⌚','🎧','📷','👟','🧸'][i]}</span>${i % 2 ? `<i class="dis">٪${8 + i * 3}</i>` : ''}</div><div class="pb"><h4>${['محصول پرفروش ۱','گجت هوشمند ۲','لپتاپ اقتصادی','ساعت مچی X','هدفون بیسیم','دوربین رزولوشن','کتانی ورزشی','عروسک فانتزی'][i]}</h4><small>⭐ 4.${(8 + i) % 10} · ${14 + i} نظر</small><div class="pr"><b>${(890000 + i * 240000).toLocaleString('fa-IR')}</b><span>تومان</span></div>${withCart ? '<button class="buy">افزودن به سبد</button>' : '<button class="buy">مشاهده</button>'}</div></div>`).join('');
  return `
<div class="store-hero"><div class="wrap"><span class="tag">✨ فروشگاه آنلاین ${spec.brand}</span><h1>خرید آسان، ارسال سریع، ضمانت اصالت</h1><p>تنوع هزاران کالا با بهترین قیمت و پشتیبانی واقعی</p><div class="row"><button class="btn">🛒 شروع خرید</button><button class="btn o">🏷️ تخفیفهای امروز</button></div></div></div>
<div class="wrap store-feats"><div><b>🚚</b><span>ارسال ۲۴ ساعته</span></div><div><b>🛡️</b><span>ضمانت اصالت</span></div><div><b>↩️</b><span>۷ روز بازگشت</span></div><div><b>💳</b><span>پرداخت امن</span></div></div>
<section class="wrap"><div class="sec-head"><span>پیشنهاد ویژه</span><h2>پرفروشترین محصولات</h2></div><div class="prod-grid">${items}</div></section>
<section class="wrap" style="padding-top:0"><div class="banner-row"><div class="bn" style="background:linear-gradient(120deg,${c1},${c2})"><h3>🔥 حراج پاییزه</h3><p>تا ۵۰٪ تخفیف</p><b>همین حالا</b></div><div class="bn" style="background:linear-gradient(120deg,${c2},${ac})"><h3>🎁 هدیه عضویت</h3><p>کد WELCOME10</p><b>ثبتنام رایگان</b></div></div></section>
<section class="wrap" style="padding-top:0"><div class="sec-head"><span>نظرات</span><h2>مشتریان درباره ما</h2></div><div class="tm-row"><div class="tm">«خریدم سریع رسید؛ کیفیت عالی.»<b>— سارا</b></div><div class="tm">«پشتیبانی واقعاً پاسخگوست.»<b>— امیر</b></div><div class="tm">«از همهچی راضیام، دوباره میخرم.»<b>— نگار</b></div></div></section>`;
}

// ─── ووکامرس ───
function woocommerceZip(spec) {
  const theme = `/*
Theme Name: ${spec.brand} — فروشگاه ووکامرس
Description: قالب فروشگاهی تولیدشده با هوش مصنوعی اپتم — پالت ${spec.palette.join('/')}
Version: 1.0.0
Text Domain: ${spec.brand.replace(/\s+/g, '-')}
Requires at least: 6.0
Requires PHP: 7.4
*/
:root{--c1:${spec.palette[0]};--c2:${spec.palette[1]};--ac:${spec.palette[2]}}
body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;background:#f5f6fa;color:#1e2244}
.site-head{background:#fff;border-bottom:3px solid var(--c1);position:sticky;top:0;z-index:9}
.site-head .wr{max-width:1200px;margin:auto;display:flex;gap:18px;align-items:center;padding:0 16px;height:64px}
.logo{font-weight:900;font-size:1.1rem;color:var(--c1)}
nav.menu{display:flex;gap:6px;margin-inline-start:auto}
nav.menu a{padding:8px 13px;border-radius:10px;font-size:.9rem;color:#5c6382;text-decoration:none}
nav.menu a:hover{background:#f0effa;color:var(--c1)}
.btn{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;border:0;border-radius:11px;padding:11px 22px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
.woo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-top:26px}
ul.products li.product{background:#fff;border-radius:14px;overflow:hidden;text-align:center;padding-bottom:16px;list-style:none;border:1px solid #eceef5}
ul.products li.product h2{font-size:.92rem;padding:10px 12px 4px;color:#1e2244}
ul.products .price{color:var(--c1);font-weight:800;display:block;margin:6px 0}
ul.products .button{background:var(--c1);color:#fff;padding:9px 18px;border-radius:999px;font-size:.83rem;text-decoration:none}
`;
  const funcs = `<?php
add_action('after_setup_theme', function(){ add_theme_support('woocommerce'); add_theme_support('title-tag'); add_theme_support('post-thumbnails'); });
add_action('wp_enqueue_scripts', function(){ wp_enqueue_style('${spec.brand.replace(/\s+/g, '-')}-font', 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css'); });
// رنگهای برند را به خودِ ووکامرس هم بده
add_filter('woocommerce_style_smallscreen_breakpoint','__return_false');
function tl_brand_btn(){ return 'linear-gradient(135deg,' . (get_theme_mod('tl_c1', '${spec.palette[0]}')) . ',' . (get_theme_mod('tl_c2', '${spec.palette[1]}')) . ')'; }
add_action('wp_head', function(){ echo '<style>.woocommerce a.button,.woocommerce button.button{background:'.tl_brand_btn().';color:#fff;border-radius:999px}</style>'; });
`;
  const index = `<?php get_header(); ?>
<main class="wr"><h1 style="color:${spec.palette[0]};margin:22px 0 4px">🛍️ فروشگاه ${spec.brand}</h1>
<p style="color:#5c6382;margin-bottom:10px">به فروشگاه آنلاین ما خوش آمدید — جدیدترین محصولات با بهترین قیمت.</p>
<?php if (class_exists('WooCommerce') && is_shop()) { woocommerce_content(); } else { echo do_shortcode('[products limit="8" columns="4" orderby="popularity"]'); } ?></main>
<?php get_footer();`;
  const header = `<!DOCTYPE html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><?php wp_head(); ?></head><body <?php body_class(); ?>>
<header class="site-head"><div class="wr"><a class="logo" href="<?php echo home_url(); ?>">🛍️ <?php bloginfo('name'); ?></a>
<nav class="menu"><?php wp_nav_menu(['theme_location'=>'primary','container'=>false,'fallback_cb'=>function(){ echo '<a href=\"'.home_url().'\">خانه</a>'; }]); ?></nav>
<a class="btn" href="<?php echo wc_get_cart_url(); ?>">🛒 سبد (<?php echo WC()->cart->get_cart_contents_count(); ?>)</a></div></header>`;
  const footer = `<?php wp_footer(); ?>
<footer style="background:#23264a;color:#c8cbe6;padding:26px 16px;margin-top:40px;text-align:center;font-size:.85rem">© <?php echo date('Y'); ?> <?php bloginfo('name'); ?> — تمامی حقوق محفوظ است.</footer></body></html>`;
  return {
    files: [
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/functions.php`, data: funcs },
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/style.css`, data: theme },
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/index.php`, data: index },
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/header.php`, data: header },
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/footer.php`, data: footer },
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/woocommerce.php`, data: `<?php get_header(); woocommerce_content(); get_footer();` },
      { name: `${spec.brand.replace(/\s+/g, '-')}-theme/README.md`, data: `# قالب ووکامرس ${spec.brand}\n\nنصب: پیشخوان → نمایش → پوستهها → افزودن → بارگذاری → فعالسازی.\nسپس ووکامرس را نصب و محصولات را اضافه کنید.\n\nراهنمای کامل با تصویر: «راهنمای نصب فروشگاه.docx»` },
    ],
    name: `${spec.brand.replace(/\s+/g, '-')}-woocommerce`,
  };
}

// ─── جنگو ───
function djangoZip(spec) {
  const settings = `from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = '${spec.brand.replace(/\s+/g, '')}-django-key-change-me'
DEBUG = True
ALLOWED_HOSTS = ['*']
INSTALLED_APPS = ['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','shop']
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {'default':{'ENGINE':'django.db.backends.sqlite3','NAME': BASE_DIR / 'db.sqlite3'}}
LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
`;
  const models = `from django.db import models
class Product(models.Model):
    title = models.CharField(max_length=120)
    price = models.BigIntegerField()
    old_price = models.BigIntegerField(null=True, blank=True)
    emoji = models.CharField(max_length=8, default='🛍️')
    created = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title
class Order(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    qty = models.PositiveIntegerField(default=1)
    created = models.DateTimeField(auto_now_add=True)
    def total(self): return self.product.price * self.qty
`;
  const views = `from django.shortcuts import render, redirect
from .models import Product, Order
def home(request):
    return render(request, 'home.html', {'products': Product.objects.all(), 'brand': '${spec.brand}'})
def buy(request, pk):
    if request.method == 'POST':
        Order.objects.create(name=request.POST.get('name'), phone=request.POST.get('phone'), product_id=pk, qty=request.POST.get('qty', 1))
        return redirect('/?ok=1')
    return redirect('/')
`;
  const urls = `from django.urls import path
from . import views
urlpatterns = [path('', views.home), path('buy/<int:pk>/', views.buy)]
`;
  const homeTpl = `{% load static %}<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>{{ brand }}</title>
<style>body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;background:#f5f6fa;color:#1e2244;margin:0}
.h{background:linear-gradient(90deg,${spec.palette[0]},${spec.palette[1]});color:#fff;padding:16px 5vw;font-weight:900;font-size:1.15rem}
.w{max-width:1150px;margin:auto;padding:0 16px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-top:24px}
.p{background:#fff;border-radius:14px;padding:16px;text-align:center;border:1px solid #eceef5}
.p .e{font-size:2.4rem}.p .pr{color:${spec.palette[0]};font-weight:800}
button{background:${spec.palette[0]};color:#fff;border:0;border-radius:999px;padding:9px 20px;font:inherit;cursor:pointer}</style></head><body>
<div class="h">🛍️ {{ brand }}</div><div class="w"><h1 style="color:${spec.palette[0]}">فروشگاه آنلاین</h1>
{% if request.GET.ok %}<p style="color:#16a34a">✓ سفارش ثبت شد</p>{% endif %}
<div class="g">{% for p in products %}<div class="p"><div class="e">{{ p.emoji }}</div><h3>{{ p.title }}</h3><div class="pr">{{ p.price }} تومان</div>
<form method="post" action="/buy/{{ p.id }}/">{% csrf_token %}<input name="name" placeholder="نام" required><input name="phone" placeholder="شماره" required><button>خرید</button></form></div>{% endfor %}</div></div></body></html>`;
  const managePy = `#!/usr/bin/env python
"""${spec.brand} — فروشگاه جنگو (تولیدشده با اپتم)"""
import os, sys
if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)`;
  return {
    files: [
      { name: 'config/settings.py', data: settings },
      { name: 'config/urls.py', data: `from django.contrib import admin\nfrom django.urls import path, include\nurlpatterns = [path('admin/', admin.site.urls), path('', include('shop.urls'))]` },
      { name: 'config/wsgi.py', data: `import os\nfrom django.core.wsgi import get_wsgi_application\nos.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')\napplication = get_wsgi_application()` },
      { name: 'manage.py', data: managePy },
      { name: 'shop/__init__.py', data: '' },
      { name: 'shop/models.py', data: models },
      { name: 'shop/views.py', data: views },
      { name: 'shop/urls.py', data: urls },
      { name: 'shop/templates/home.html', data: homeTpl },
      { name: 'shop/migrations/__init__.py', data: '' },
      { name: 'README.md', data: `# فروشگاه جنگو ${spec.brand}\n\n## اجرا\n\`\`\`bash\npip install django\npython manage.py migrate\npython manage.py createsuperuser   # ادمین\npython manage.py runserver         # http://127.0.0.1:8000\n\`\`\`\n## افزودن محصول\nورود به /admin → Products → Add` },
    ],
    name: 'django-store',
  };
}

// ─── نود اکسپرس ───
function nodeZip(spec) {
  const pkg = `{ "name": "${spec.brand.replace(/\s+/g, '-').toLowerCase()}-store", "version": "1.0.0", "type": "module", "scripts": { "start": "node server.js" }, "dependencies": { "express": "^4.19.0" } }`;
  const server = `import express from 'express';
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const products = [
${Array(8).fill(0).map((_, i) => `  { id: ${i + 1}, title: ${JSON.stringify(['هدفون پرو','ساعت هوشمند','ماوس گیمینگ','پاوربانک','اسپیکر','کولهپشتی','کیف چرم','دوربین'][i])}, price: ${890000 + i * 220000}, emoji: ${JSON.stringify(['🎧','⌚','🖱️','🔋','🔊','🎒','💼','📷'][i])} }`).join(',\n')}
];
const cart = new Map();
app.get('/', (req, res) => {
  const total = [...cart.values()].reduce((s, q, i) => s + q.qty * products[i]?.price, 0);
  res.send(\`<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${spec.brand}</title>
<style>body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;background:#f5f6fa;color:#1e2244;margin:0}.h{background:linear-gradient(90deg,${spec.palette[0]},${spec.palette[1]});color:#fff;padding:15px 5vw;font-weight:900}.w{max-width:1150px;margin:auto;padding:0 16px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin-top:22px}.p{background:#fff;border-radius:14px;padding:14px;text-align:center;border:1px solid #eceef5}.e{font-size:2.3rem}.pr{color:${spec.palette[0]};font-weight:800}form{margin-top:10px}input{width:70%;padding:8px;border:1.5px solid #ddd6f5;border-radius:8px;font:inherit}button{background:${spec.palette[1]};color:#fff;border:0;border-radius:999px;padding:9px 14px;font:inherit;cursor:pointer}</style></head><body>
<div class="h">🛍️ ${spec.brand} — خرید آنلاین</div><div class="w"><h2 style="color:${spec.palette[0]}">محصولات ما</h2><div class="g">
\${products.map((p, i) => \`<div class="p"><div class="e">\${p.emoji}</div><h3>\${p.title}</h3><div class="pr">\${p.price.toLocaleString('fa-IR')} تومان</div><form method="post" action="/buy/\${p.id}"><input name="name" placeholder="نام شما" required><button>خرید</button></form></div>\`).join('')}
</div><p style="color:#5c6382;font-size:.85rem">🛒 سبد: \${total ? total.toLocaleString('fa-IR') + ' تومان' : 'خالی'}</p></div></body></html>\`);
});
app.post('/buy/:id', (req, res) => {
  const p = products.find(x => x.id == req.params.id);
  if (!p) return res.redirect('/');
  cart.set(req.body.name || 'مهمان', (cart.get(req.body.name) || 0) + 1);
  res.redirect('/?ok=' + encodeURIComponent(req.body.name));
});
app.listen(process.env.PORT || 3001, () => console.log('🚀 فروشگاه روی پورت 3001 — برای ادمین: /admin'));
`;
  const admin = `import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('<h1 dir="rtl">پنل مدیریت ${spec.brand}</h1><p>این فایلِ شروع برای توسعه بیشتر است.</p>'));
app.listen(3002);`;
  return {
    files: [
      { name: 'server.js', data: server },
      { name: 'admin.js', data: admin },
      { name: 'package.json', data: pkg },
      { name: 'README.md', data: `# فروشگاه نود ${spec.brand}\n\n\`\`\`bash\nnpm install\nnpm start   # http://localhost:3001\n\`\`\`\nفایل server.js کاملاً خوانا است؛ محصولات، رنگها و قیمتها را در آن ویرایش کنید.` },
    ],
    name: 'node-store',
  };
}

// ─── HTML خالص ───
function htmlZip(spec) {
  const body = storeHtml(spec);
  const page = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${spec.brand} — فروشگاه آنلاین</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;background:#f5f6fa;color:#1e2244;line-height:1.9}
:root{--c1:${spec.palette[0]};--c2:${spec.palette[1]};--ac:${spec.palette[2]};--bg:#f5f6fa;--card:#fff;--ink:#1e2244;--mut:#5c6382;--bord:#eceef5}
a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}
.hdr{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--bord)}
.hrow{max-width:1200px;margin:auto;display:flex;align-items:center;gap:18px;height:66px;padding:0 16px}
.logo{font-weight:900;font-size:1.1rem;color:var(--c1);display:flex;gap:8px;align-items:center}
.logo i{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;display:grid;place-items:center;font-style:normal}
nav.lk{display:flex;gap:4px;margin-inline-start:auto}
nav.lk a{padding:8px 13px;border-radius:10px;font-size:.9rem;color:var(--mut)}
nav.lk a.on{background:var(--c1);color:#fff;box-shadow:0 6px 18px color-mix(in srgb,var(--c1) 40%,transparent)}
.wrap{max-width:1200px;margin:auto;padding:0 16px}
.store-hero{background:radial-gradient(700px 320px at 85% -10%,color-mix(in srgb,var(--c1) 18%,transparent),transparent),radial-gradient(600px 300px at 10% 110%,color-mix(in srgb,var(--c2) 14%,transparent),transparent);padding:64px 0 50px;text-align:center}
.tag{color:var(--c1);font-weight:700;font-size:.85rem}
.store-hero h1{font-size:2rem;margin:8px 0}
.store-hero p{color:var(--mut);margin-bottom:20px}
.btn{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;border:0;border-radius:13px;padding:12px 26px;font-weight:700;box-shadow:0 10px 26px color-mix(in srgb,var(--c1) 35%,transparent)}
.btn.o{background:#fff;color:var(--c1);border:1.5px solid var(--bord);box-shadow:none}
.store-feats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:-26px;position:relative}
.store-feats>div{background:var(--card);border:1px solid var(--bord);border-radius:14px;padding:14px;display:flex;gap:10px;align-items:center;font-size:.86rem}
.store-feats b{font-size:1.3rem}
section{padding:34px 0}
.sec-head{text-align:center;margin-bottom:20px}
.sec-head span{color:var(--c1);font-size:.8rem;font-weight:700}
.sec-head h2{font-size:1.35rem}
.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:14px}
.pd{background:var(--card);border:1px solid var(--bord);border-radius:14px;overflow:hidden;transition:.25s}
.pd:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(30,34,68,.12)}
.pimg{aspect-ratio:1.1;display:grid;place-items:center;position:relative;font-size:3rem}
.pimg .dis{position:absolute;top:10px;inset-inline-start:10px;background:var(--ac);color:#fff;font-size:.7rem;font-style:normal;font-weight:800;padding:3px 9px;border-radius:999px}
.pb{padding:12px 14px 16px}.pb h4{font-size:.9rem}.pb small{color:var(--mut);display:block;margin:4px 0}.pb .pr{display:flex;gap:5px;align-items:baseline;color:var(--ink)}.pb .pr b{font-size:1.02rem}.pb .pr span{font-size:.72rem;color:var(--mut)}
.buy{width:100%;margin-top:8px;border:1.6px solid var(--c1);color:var(--c1);background:#fff;border-radius:10px;padding:8px;font-weight:700}
.buy:hover{background:var(--c1);color:#fff}
.banner-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.bn{border-radius:16px;padding:24px;color:#fff}.bn h3{font-size:1.05rem}.bn p{opacity:.9;font-size:.85rem}.bn b{display:inline-block;margin-top:10px;background:#fff;color:#1e2244;border-radius:999px;padding:6px 16px;font-size:.78rem}
.tm-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.tm{background:var(--card);border:1px solid var(--bord);border-radius:14px;padding:18px;font-size:.9rem}
.tm b{display:block;color:var(--c1);margin-top:10px;font-size:.8rem}
footer{background:#23264a;color:#c8cbe6;margin-top:30px;padding:26px 16px;text-align:center;font-size:.84rem}
@media(max-width:760px){.banner-row{grid-template-columns:1fr}nav.lk{display:none}}
</style></head><body>
<header class="hdr"><div class="hrow"><a class="logo" href="#"><i>${spec.brand.trim().charAt(0)}</i>${spec.brand}</a><nav class="lk"><a class="on" href="#">خانه</a><a href="#">فروشگاه</a><a href="#">درباره</a><a href="#">تماس</a></nav></div></header>
${body}
<footer>© ۱۴۰۳ ${spec.brand} — ساختهشده با فروشگاهساز هوشمند اپتم 🛍️</footer>
</body></html>`;
  return { files: [{ name: 'index.html', data: page }, { name: 'README.md', data: `# فروشگاه HTML ${spec.brand}\nفایل index.html را در مرورگر باز کنید. رنگها از متغیرهای :root در بالای فایل عوض میشوند.` }], name: `${spec.brand.replace(/\s+/g, '-')}-store` };
}

// ═══ جمعآوری نهایی بسته فروشگاهساز ═══
export function generateStore(spec) {
  const t = tierOf(spec.tier?.key || 'gold');
  let out;
  if (spec.framework === 'woocommerce') out = woocommerceZip(spec);
  else if (spec.framework === 'django') out = djangoZip(spec);
  else if (spec.framework === 'node') out = nodeZip(spec);
  else if (spec.framework === 'wordpress') { const w = woocommerceZip(spec); out = { files: w.files, name: w.name }; }
  else out = htmlZip(spec);
  const guide = makeDocx({
    title: `راهنمای نصب فروشگاهساز ${spec.brand} (${FRAMEWORKS[spec.framework]})`,
    blocks: [
      { h1: `نصب فروشگاه ${spec.brand}` },
      { p: `پلتفرم خروجی: ${FRAMEWORKS[spec.framework]} · سطح: ${t.icon} ${t.label} · برآورد قیمت این پروژه: ${Math.round(t.base / 10000) * 10000} تومان (پایه — طبق پرامپت شما قابل تعدیل است)` },
      { h2: 'مرحله ۱ — فایلها' },
      { img: { kind: 'code-folders', cap: 'ساختار پوشههای فروشگاه', step: 1 } },
      { h2: 'مرحله ۲ — نصب' },
      ...(spec.framework === 'django' ? [{ code: 'pip install django\npython manage.py migrate\npython manage.py createsuperuser\npython manage.py runserver' }] : spec.framework === 'node' ? [{ code: 'npm install\nnpm start   # پورت 3001' }] : [{ img: { kind: 'theme-install', cap: 'نصب از پیشخوان — نمایش → پوستهها → افزودن', step: 2 } }]),
      { h2: 'مرحله ۳ — افزودن محصولات' },
      { p: spec.framework === 'woocommerce' || spec.framework === 'wordpress' ? 'محصولات از پیشخوان وردپرس → محصولات → افزودن ساخته میشوند؛ رنگ دکمهها و برند از سفارشیساز (Customizer) یا متغیرهای style.css قابل تغییر است.' : 'محصولات در فایل کد (server.js / models.py / index.html) تعریف شدهاند؛ بهسادگی مقادیر را ویرایش کنید.' },
      { img: { kind: 'store-wizard', cap: 'چرخه نهایی: محصولات → سبد → پرداخت', step: 3 } },
      { h2: 'مرحله ۴ — راهاندازی روی سرور' },
      { note: 'راهنمای استقرار VPS را در GUIDE.md پروژه ببینید؛ برای خروجی جنگو به gunicorn و برای نود به PM2 نیاز دارید.' },
    ],
  });
  out.files.push({ name: 'راهنمای نصب فروشگاه (Word).docx', data: guide });
  return { files: out.files, zipName: out.name + '.zip', spec, tier: t };
}
