// ─── داده‌های نمونه اولیه (نصب اولیه / دمو) ───
// نکته: کاربر ادمین با صفحه /setup ساخته می‌شود (امنیت: بدون پسورد پیش‌فرض)
import { hashPassword } from './security.js';

const now = Date.now();
const day = 86400000;
const iso = (offsetDay = 0, h = 12) => new Date(now - offsetDay * day + h * 3600000).toISOString();

export function seedDb() {
  const categories = [
    { id: 1, name: 'فروشگاهی',   slug: 'shop',       icon: '🛍️', description: 'قالب‌های فروشگاه اینترنتی و ووکامرس', createdAt: iso(60) },
    { id: 2, name: 'شرکتی',      slug: 'corporate',  icon: '🏢', description: 'قالب‌های معرفی شرکت و سازمان', createdAt: iso(60) },
    { id: 3, name: 'شخصی',       slug: 'personal',   icon: '👤', description: 'پورتفولیو، رزومه و وبلاگ شخصی', createdAt: iso(60) },
    { id: 4, name: 'استارتاپ',   slug: 'startup',    icon: '🚀', description: 'لندینگ محصول و خدمات استارتاپی', createdAt: iso(60) },
    { id: 5, name: 'رستوران',    slug: 'restaurant', icon: '🍽️', description: 'رستوران، کافه و کترینگ', createdAt: iso(60) },
    { id: 6, name: 'آژانس',      slug: 'agency',     icon: '💡', description: 'آژانس دیجیتال مارکتینگ و طراحی', createdAt: iso(60) },
  ];

  const products = [
    {
      id: 1, title: 'نوین‌شاپ — قالب فروشگاهی مدرن', slug: 'novin-shop',
      description: 'قالب فروشگاهی فوق‌سریع با طراحی مینیمال، سبد خرید، صفحه محصول حرفه‌ای و اسلایدر برند‌ها.',
      longDescription: 'نوین‌شاپ یک قالب فروشگاهی کامل و مدرن است که با تمرکز بر سرعت و نرخ تبدیل طراحی شده. صفحات اصلی، لیست محصولات با فیلترهای پیشرفته، صفحه محصول با گالری، صفحه پرداخت و پنل کاربری در این قالب گنجانده شده است. کدنویسی تمیز و مستندسازی کامل، شخصی‌سازی را برای شما بسیار آسان می‌کند.',
      price: 1190000, salePrice: 890000, categoryIds: [1], frameworks: ['tailwind', 'html'], layout: 2,
      pages: 12, features: ['ریسپانسیو کامل', 'حالت تاریک', 'بهینه سئو', 'سرعت ۹۸+ گوگل', 'سبد خرید و صفحه پرداخت', 'پنل کاربری', 'پشتیبانی ۶ ماهه'],
      tags: ['فروشگاه', 'woocommerce', 'مینیمال', 'آبی'], palette: ['#4f46e5', '#22d3ee'], accent: '#f59e0b',
      downloads: 1284, published: true, createdAt: iso(45),
    },
    {
      id: 2, title: 'آریا — قالب شرکتی راست‌چین', slug: 'aria-corporate',
      description: 'قالب شرکتی با ۱۴ صفحه آماده، فرم تماس، معرفی تیم و نمونه‌کار.',
      longDescription: 'آریا برای شرکت‌ها و سازمان‌هایی طراحی شده که به دنبال حضور حرفه‌ای در وب هستند. این قالب شامل صفحه اصلی با چندین واریانت، درباره ما، خدمات، نمونه‌کارها، تیم، وبلاگ و فرم تماس کاربردی است. ساختار سئوی استاندارد و سرعت بارگذاری بالا از ویژگی‌های کلیدی آریاست.',
      price: 1890000, salePrice: null, categoryIds: [2], frameworks: ['bootstrap', 'html'], layout: 4,
      pages: 14, features: ['۱۴ صفحه آماده', 'فرم تماس داینامیک', 'ریسپانسیو', 'اسلایدر حرفه‌ای', 'معرفی تیم و نمونه‌کار', 'وبلاگ داخلی', 'چندزبانه آماده', 'مستندسازی کامل', 'پشتیبانی ۶ ماهه', 'آپدیت رایگان ۱ ساله'],
      tags: ['شرکتی', 'سازمانی', 'راست‌چین'], palette: ['#0f766e', '#14b8a6'], accent: '#f59e0b',
      downloads: 862, published: true, createdAt: iso(40),
    },
    {
      id: 3, title: 'کریت — پورتفولیو خلاقانه', slug: 'kreat-portfolio',
      description: 'قالب پورتفولیو با انیمیشن‌های نرم، گرید شطرنجی و صفحه رزومه.',
      longDescription: 'کریت انتخاب اول طراحان، عکاسان و هنرمندان دیجیتال است. گرید پروژه‌های چشم‌نواز، ترنزیشن‌های نرم، حالت تاریک اختصاصی و صفحه رزومه‌ی حرفه‌ای تنها بخشی از امکانات این قالب است. با کریت کارهای خود را به شکلی خیره‌کننده به نمایش بگذارید.',
      price: 490000, salePrice: 350000, categoryIds: [3], frameworks: ['react', 'tailwind'], layout: 3,
      pages: 8, features: ['انیمیشن‌های نرم', 'حالت تاریک', 'فیلتر پروژه‌ها', 'React 18', 'سبک و سریع'],
      tags: ['پورتفولیو', 'شخصی', 'کریتیو', 'تاریک'], palette: ['#18181b', '#a855f7'], accent: '#22d3ee',
      downloads: 2043, published: true, createdAt: iso(35),
    },
    {
      id: 4, title: 'لانچ — لندینگ استارتاپ', slug: 'launch-startup',
      description: 'لندینگ تک‌صفحه‌ای محصول با تایمر عرضه، قیمت‌گذاری و FAQ.',
      longDescription: 'لانچ برای عرضه محصول یا سرویس استارتاپی شما ساخته شده. بخش قیمت‌گذاری قابل‌تغییر، سوالات متداول، تایمر شمارش معکوس عرضه، فرم عضویت در خبرنامه و بخش نظرات مشتریان از امکانات آن است. ساختار ساده و مستند، امکان راه‌اندازی در کمتر از یک ساعت را می‌دهد.',
      price: 590000, salePrice: 390000, categoryIds: [4], frameworks: ['html', 'tailwind'], layout: 1,
      pages: 3, features: ['تک‌صفحه‌ای', 'تایمر عرضه', 'قیمت‌گذاری', 'FAQ آکاردئونی', 'فرم خبرنامه', 'سبک (< ۵۰KB)'],
      tags: ['لندینگ', 'استارتاپ', 'SaaS'], palette: ['#7c3aed', '#ec4899'], accent: '#facc15',
      downloads: 1571, published: true, createdAt: iso(28),
    },
    {
      id: 5, title: 'مِنو — قالب رستوران و کافه', slug: 'menu-restaurant',
      description: 'قالب رستوران با منوی دیجیتال، رزرو آنلاین و گالری محیط.',
      longDescription: 'منو به رستوران‌ها و کافه‌ها کمک می‌کند مشتریان را از فضای آنلاین جذب کنند. منوی دیجیتال دسته‌بندی‌شده، فرم رزرو میز، گالری تصاویر محیط و غذاها، نقشه موقعیت و بخش نظرات مشتریان در این قالب پیاده‌سازی شده است.',
      price: 890000, salePrice: 690000, categoryIds: [5], frameworks: ['bootstrap'], layout: 0,
      pages: 6, features: ['منوی دیجیتال', 'رزرو آنلاین', 'گالری تصاویر', 'نقشه گوگل', 'ریسپانسیو', 'بهینه سئو'],
      tags: ['رستوران', 'کافه', 'منو', 'رزرو'], palette: ['#b45309', '#f59e0b'], accent: '#0f766e',
      downloads: 654, published: true, createdAt: iso(22),
    },
    {
      id: 6, title: 'پیکسل — آژانس دیجیتال', slug: 'pixel-agency',
      description: 'قالب آژانس دیجیتال با نمونه‌کار فیلتردار، خدمات و وبلاگ.',
      longDescription: 'پیکسل برای آژانس‌های دیجیتال مارکتینگ، طراحی و تبلیغات طراحی شده است. نمونه‌کارها با فیلتر دسته‌بندی، صفحات خدمات جزئی، وبلاگ با طراحی خوانا و بخش اعداد و ارقام متحرک، حس حرفه‌ای بودن را به مشتریان شما منتقل می‌کند.',
      price: 2000000, salePrice: 1690000, categoryIds: [6], frameworks: ['react', 'html'], layout: 5,
      pages: 10, features: ['فیلتر نمونه‌کار', 'آمار متحرک', 'وبلاگ', 'React 18', 'انیمیشن اسکرول', 'حالت تاریک', 'جستجوی زنده', 'پشتیبانی اولویت‌دار ۶ ماهه', 'آپدیت رایگان ۱ ساله'],
      tags: ['آژانس', 'دیجیتال مارکتینگ', 'نمونه‌کار'], palette: ['#1d4ed8', '#06b6d4'], accent: '#f472b6',
      downloads: 934, published: true, createdAt: iso(15),
    },
    {
      id: 7, title: 'مدیکال — کلینیک و دکتر', slug: 'medica-clinic',
      description: 'قالب کلینیک پزشکی با نوبت‌دهی، تخصص‌ها و پروفایل پزشکان.',
      longDescription: 'مدیکال با تمرکز بر اعتماد و آرامش بیماران طراحی شده؛ رنگ‌بندی آرامش‌بخش، بخش تخصص‌های پزشکی، پروفایل پزشکان، فرم درخواست نوبت و مقالات آموزشی بهداشت. برای کلینیک‌ها، مطب‌ها و بیمارستان‌های خصوصی ایده‌آل است.',
      price: 1450000, salePrice: null, categoryIds: [2], frameworks: ['bootstrap', 'tailwind'], layout: 3,
      pages: 9, features: ['درخواست نوبت', 'پروفایل پزشکان', 'مقالات سلامت', 'ریسپانسیو', 'سئو استاندارد', 'یادآور پیامکی (آماده اتصال)', 'پشتیبانی ۶ ماهه'],
      tags: ['پزشکی', 'کلینیک', 'سلامت'], palette: ['#0369a1', '#34d399'], accent: '#f59e0b',
      downloads: 512, published: true, createdAt: iso(9),
    },
    {
      id: 8, title: 'دیوان — قالب وبلاگ و مجله', slug: 'divan-magazine',
      description: 'قالب مجله خبری با لایه‌های چیدمان متنوع و خوانایی بالا.',
      longDescription: 'دیوان برای وبلاگ‌های حرفه‌ای و مجلات خبری ساخته شده. چیدمان‌های متنوع صفحه اصلی، صفحه مقاله با خوانایی بسیار بالا، نویسندگان، پربازدیدها و خبرنامه. سرعت لود فوق‌العاده و ساختار سئوی خبری از نقاط قوت این قالب است.',
      price: 390000, salePrice: 290000, categoryIds: [3], frameworks: ['html'], layout: 1,
      pages: 7, features: ['چیدمان‌های متنوع', 'خوانایی بالا', 'خبرنامه', 'سبک و سریع', 'پشتیبانی RTL'],
      tags: ['وبلاگ', 'مجله', 'خبری', 'ادبی'], palette: ['#334155', '#f59e0b'], accent: '#0ea5e9',
      downloads: 1189, published: true, createdAt: iso(4),
    },
  ];

  const users = [
    { id: 1, name: 'سارا محمدی', email: 'sara@demo.ir', mobile: '09121112233', passwordHash: hashPassword('demo12345'), role: 'customer', active: true, verified: true, createdAt: iso(30) },
    { id: 2, name: 'امیر رضایی', email: 'amir@demo.ir', mobile: '09124445566', passwordHash: hashPassword('demo12345'), role: 'customer', active: true, verified: true, createdAt: iso(18) },
    { id: 3, name: 'نگار کریمی', email: 'negar@demo.ir', mobile: '09127778899', passwordHash: hashPassword('demo12345'), role: 'customer', active: true, verified: true, wallet: 350000, sheba: '', createdAt: iso(6) },
  ];

  const orders = [
    { id: 1, code: 'AT-1001', userId: 1, items: [{ productId: 1, price: 890000 }], subtotal: 890000, discount: 0, total: 890000, couponCode: null, status: 'paid', gateway: 'zarinpal-demo', refId: '8800123', paidAt: iso(26, 10), createdAt: iso(26, 9) },
    { id: 2, code: 'AT-1002', userId: 2, items: [{ productId: 3, price: 490000 }, { productId: 4, price: 590000 }], subtotal: 1080000, discount: 108000, total: 972000, couponCode: 'WELCOME10', status: 'paid', gateway: 'zarinpal-demo', refId: '8800456', paidAt: iso(19, 15), createdAt: iso(19, 14) },
    { id: 3, code: 'AT-1003', userId: 1, items: [{ productId: 5, price: 590000 }], subtotal: 590000, discount: 0, total: 590000, couponCode: null, status: 'paid', gateway: 'zarinpal-demo', refId: '8800789', paidAt: iso(12, 18), createdAt: iso(12, 17) },
    { id: 4, code: 'AT-1004', userId: 3, items: [{ productId: 2, price: 990000 }], subtotal: 990000, discount: 0, total: 990000, couponCode: null, status: 'paid', gateway: 'zarinpal-demo', refId: '8801011', paidAt: iso(8, 11), createdAt: iso(8, 10) },
    { id: 5, code: 'AT-1005', userId: 2, items: [{ productId: 6, price: 850000 }], subtotal: 850000, discount: 0, total: 850000, couponCode: null, status: 'paid', gateway: 'zarinpal-demo', refId: '8801023', paidAt: iso(5, 13), createdAt: iso(5, 12) },
    { id: 6, code: 'AT-1006', userId: 3, items: [{ productId: 8, price: 390000 }], subtotal: 390000, discount: 0, total: 390000, couponCode: null, status: 'pending', gateway: null, refId: null, paidAt: null, createdAt: iso(2, 16) },
    { id: 7, code: 'AT-1007', userId: 1, items: [{ productId: 7, price: 1150000 }], subtotal: 1150000, discount: 115000, total: 1035000, couponCode: 'WELCOME10', status: 'paid', gateway: 'zarinpal-demo', refId: '8801045', paidAt: iso(1, 19), createdAt: iso(1, 18) },
    { id: 8, code: 'AT-1008', userId: 3, items: [{ productId: 1, price: 890000 }, { productId: 8, price: 390000 }], subtotal: 1280000, discount: 0, total: 1280000, couponCode: null, status: 'pending', gateway: null, refId: null, paidAt: null, createdAt: iso(0, 9) },
  ];

  const comments = [
    { id: 1, productId: 1, userId: 1, name: 'سارا محمدی', body: 'کیفیت کد واقعاً بالا بود، سریع نصب شد و مستندات کامل بود. ممنون از تیم اپ‌تم!', rating: 5, status: 'approved', createdAt: iso(24) },
    { id: 2, productId: 1, userId: 2, name: 'امیر رضایی', body: 'سرعت لود عالیه، فقط ای کاش رنگ‌بندی بیشتری داشت.', rating: 4, status: 'approved', createdAt: iso(10) },
    { id: 3, productId: 3, userId: 2, name: 'امیر رضایی', body: 'انیمیشن‌هاش خیلی شیکه، برای پورتفولیو بهترین انتخاب بود.', rating: 5, status: 'approved', createdAt: iso(17) },
    { id: 4, productId: 3, userId: 3, name: 'نگار کریمی', body: 'حالت تاریکش فوق‌العاده‌ست. پیشنهاد می‌کنم!', rating: 5, status: 'approved', createdAt: iso(3) },
    { id: 5, productId: 4, userId: 1, name: 'سارا محمدی', body: 'برای لندینگ محصولمون عالی بود، همان روز راه انداختیم.', rating: 4, status: 'approved', createdAt: iso(14) },
    { id: 6, productId: 2, userId: 3, name: 'نگار کریمی', body: 'قالب شرکتی دقیقاً همون چیزی بود که مدیرم می‌خواست.', rating: 5, status: 'approved', createdAt: iso(7) },
    { id: 7, productId: 6, userId: 1, name: 'سارا محمدی', body: 'فیلتر نمونه‌کارها خیلی خوب کار می‌کنه. منتظر آپدیت بعدی هستم.', rating: 4, status: 'pending', createdAt: iso(1) },
    { id: 8, productId: 5, userId: 2, name: 'امیر رضایی', body: 'فرم رزروش راحت پیاده شد، مرسی.', rating: 5, status: 'pending', createdAt: iso(0, 8) },
  ];

  const likes = [];
  let likeId = 1;
  const likeMap = [[1, 1], [1, 2], [1, 3], [2, 2], [3, 1], [3, 2], [3, 3], [4, 1], [4, 3], [5, 2], [6, 1], [6, 3], [7, 1], [8, 1], [8, 2]];
  for (const [p, u] of likeMap) likes.push({ id: likeId++, productId: p, userId: u, createdAt: iso(5) });

  const projects = [
    {
      id: 1, code: 'APP-101', userId: 1,
      prompt: 'یک اپ فروشگاهی می‌خواهم با پرداخت آنلاین، پنل مدیریت، چت با پشتیبانی و نقشه برای شعبه‌ها. مشتری امتیاز هم بتواند بدهد.',
      ios: false, web: false,
      estimate: { low: 17150000, high: 22000000, total: 18600000, features: ['فروشگاه و پرداخت آنلاین', 'چت و پیام‌رسان', 'پنل مدیریت', 'نقشه و موقعیت‌یابی'], weeks: 7, deposit: 5580000, second: 5580000, final: 7440000 },
      status: 'preview2',
      payments: [{ label: 'بیعانه ۳۰٪', amount: 5580000, at: iso(10), ref: '880456123' }],
      previews: [
        { note: 'صفحه اصلی و دسته‌بندی محصولات پیاده شد', url: 'https://apptheme.ir', at: iso(8) },
        { note: 'سبد خرید، پرداخت و پروفایل کاربری اضافه شد', url: 'https://apptheme.ir', at: iso(4) },
      ],
      createdAt: iso(12),
    },
  ];

  const messages = [
    { id: 1, threadKey: 'u:1', fromUserId: 1, fromRole: 'user', body: 'سلام، وضعیت پروژه APP-101 چطوره؟', readByAdmin: true, readByUser: true, createdAt: iso(5) },
    { id: 2, threadKey: 'u:1', fromUserId: null, fromRole: 'admin', body: 'سلام وقت بخیر 🌸 پروژه در مرحله پیش‌نمایش ۲ است (۴۵٪). فردا لینک پیش‌نمایش جدید را برایتان می‌فرستیم.', readByAdmin: true, readByUser: true, createdAt: iso(5) },
    { id: 3, threadKey: 'u:2', fromUserId: 2, fromRole: 'user', body: 'کد تخفیف WELCOME10 برای خرید دوم هم کار می‌کند؟', readByAdmin: false, readByUser: true, createdAt: iso(1) },
  ];

  const projectsExtra = [
    {
      id: 2, code: 'APP-115', userId: 2,
      prompt: 'اپ رزرو نوبت آرایشگاه با پرداخت آنلاین و اعلان پوش و پنل مدیریت. مشتری بتواند آرایشکار انتخاب کند و امتیاز بدهد.',
      spec: { t: 'service', n: 'زیباآرنگ', d: 'اپ رزرو نوبت آرایشگاه با پرداخت آنلاین و اعلان پوش و پنل مدیریت. مشتری بتواند آرایشکار انتخاب کند و امتیاز بدهد.', f: ['auth', 'pay', 'panel', 'notify'], pf: ['android'], be: 1, th: '#ec4899', dk: 1, lg: 0, dl: '1', bud: 0, ins: '', ct: '@zeitoon_dev' },
      ios: false, web: false,
      estimate: { low: 8910000, high: 11385000, total: 9900000, features: ['ثبت‌نام و پروفایل کاربری', 'فروشگاه و پرداخت آنلاین', 'پنل مدیریت'], weeks: 6 },
      status: 'submitted', payments: [], previews: [], finalPrice: null, createdAt: iso(0, 8),
    },
  ];

  const transactions = [
    { id: 1, userId: 3, amount: 350000, type: 'refund', note: 'بازگشت ۶۰٪ پروژه لغوشده (نمونه)', at: iso(3) },
  ];

  const coupons = [
    { id: 1, code: 'WELCOME10', type: 'percent', value: 10, maxUses: 100, uses: 2, expiresAt: iso(-90), active: true, createdAt: iso(30) },
    { id: 2, code: 'NOWRUZ', type: 'fixed', value: 200000, maxUses: 50, uses: 0, expiresAt: iso(-180), active: false, createdAt: iso(60) },
  ];

  return {
    meta: { version: 1, seededAt: new Date().toISOString() },
    settings: {
      siteUrl: '', shopName: 'اپ‌تم', tagline: 'بازار قالب‌های حرفه‌ای وب',
      description: 'خرید قالب‌های حرفه‌ای و راست‌چین وب سایت — فروشگاهی، شرکتی، شخصی و استارتاپی با دانلود آنی و پشتیبانی رسمی.',
      socials: { telegram: '#', instagram: '#', x: '#', github: '#' },
      payment: { provider: 'demo', merchantId: '', sandbox: true }, // demo | zarinpal
      ai: { provider: 'none', apiKey: '', model: '' }, // none | openai | gemini | claude
    },
    users, sessions: [], categories, products, orders, coupons, comments, likes,
    verifications: [], licenses: [], projects: [...projects, ...projectsExtra], messages, transactions, withdrawals: [],
    generatedTemplates: [],
  };
}
