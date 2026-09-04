// ═══ قالب‌ساز هوشمند: تحلیل پرامپت فارسی → مشخصات قالب → تولید سایت ═══
// بدون هوش مصنوعی خارجی، بدون eval — تحلیل واژگانی قطعی + قالب‌های متنی امن
import { esc } from './util.js';
import { makeZip } from './zip.js';
import { proCssExtra, cutByDepth } from './gencore.js';

// ─── پالت‌های رنگی (فارسی → هگز) ───
const PALETTES = {
  red:    ['#ef4444', '#7f1d1d', '#f59e0b'], blue:   ['#3b82f6', '#1e3a8a', '#22d3ee'],
  green:  ['#22c55e', '#14532d', '#f59e0b'], purple: ['#8b5cf6', '#4c1d95', '#f472b6'],
  pink:   ['#ec4899', '#831843', '#facc15'], orange: ['#f97316', '#7c2d12', '#0ea5e9'],
  teal:   ['#14b8a6', '#134e4a', '#f59e0b'], gold:   ['#f59e0b', '#78350f', '#ef4444'],
  brown:  ['#b45309', '#442811', '#f59e0b'], navy:   ['#2563eb', '#172554', '#38bdf8'],
  black:  ['#525252', '#111111', '#f59e0b'], cyan:   ['#06b6d4', '#164e63', '#f472b6'],
};
const COLOR_WORDS = [
  [['قرمز', 'لاکی', 'سرخ'], 'red'], [['آبی', 'ابی'], 'blue'], [['سبز'], 'green'],
  [['بنفش'], 'purple'], [['صورتی', 'صورتي'], 'pink'], [['نارنجی', 'نارنجي'], 'orange'],
  [['فیروزه', 'فیروزه‌ای', 'ترکواز'], 'teal'], [['طلایی', 'طلائي', 'طلا'], 'gold'],
  [['قهوه', 'قهوه‌ای'], 'brown'], [['سرمه', 'سرمه‌ای'], 'navy'], [['مشکی', 'سیاه'], 'black'],
  [['فیروزهای', 'سایان'], 'cyan'],
];

// ─── انواع سایت + محتوای اختصاصی ───
const TYPES = {
  restaurant: {
    keys: ['رستوران', 'کافه', 'کافه‌رستوران', 'غذا', 'منو', 'پیتزا', 'کیترینگ', 'کترینگ', 'فست فود', 'قهوه'],
    label: 'رستوران و کافه', defBrand: 'رستوران بهار',
    hero: b => [`طعمی که به ${b} برمی‌گردی`, 'غذاهای ایتالیایی و ایرانی با مواد تازه روزانه و فضایی دل‌نشان برای شما و عزیزانتان.'],
    services: [['🍽️', 'منوی متنوع', 'بیش از ۸۰ غذای ایرانی، ایتالیایی و دریایی'], ['🛵', 'ارسال سریع', 'ارسال داغ و سریع در محدوده شهر'], ['💺', 'رزرو میز', 'رزرو آنلاین میز برای مهمانی‌ها'], ['🎂', 'کیک و شیرینی', 'سفارش اختصاصی برای مناسبت‌ها'], ['☕', 'کافه', 'قهوه تازه و دسرهای خانگی'], ['🎁', 'باشگاه مشتریان', 'امتیاز و هدیه برای مشتریان وفادار']],
    items: [['پاستا آلفردو', 'خامه تازه، قارچ و مرغ گریل', '۲۸۵٬۰۰۰'], ['پیتزا مخصوص', 'پنیر موزارلا، پپرونی و سس مخصوص', '۳۲۰٬۰۰۰'], ['کباب سلطانی', 'گوسفندی تازه با برنج ایرانی', '۴۱۰٬۰۰۰'], ['سالاد سزار', 'مرغ گریل، نان کروتون و سس خانگی', '۱۹۵٬۰۰۰'], ['قمه‌پلو', 'خوش‌پخت با رب انار اصیل', '۳۶۰٬۰۰۰'], ['تیرامیسو', 'دسر ایتالیایی با قهوه اسپرسو', '۱۶۵٬۰۰۰']],
    itemsTitle: 'منوی ویژه', stats: [['+۸۰', 'غذای فعال'], ['+۱۲k', 'سفارش موفق'], ['۴.۸', 'امتیاز مشتریان']],
  },
  shop: {
    keys: ['فروشگاه', 'شاپ', 'محصول', 'خرید آنلاین', 'سایت فروش', 'می‌فروشم', 'فروش آنلاین', 'دیجی'],
    label: 'فروشگاهی', defBrand: 'شاپینو',
    hero: b => [`خرید آنلاین از ${b}`, 'هزاران محصول اصل با ضمانت بازگشت، ارسال سریع و پرداخت امن.'],
    services: [['🚚', 'ارسال سریع', 'ارسال به سراسر کشور ۲ تا ۴ روز کاری'], ['🛡️', 'ضمانت اصالت', 'تمام کالاها اورجینال با ضمانت'], ['💳', 'پرداخت امن', 'درگاه پرداخت مطمئن و چند روش پرداخت'], ['↩️', '۷ روز بازگشت', 'بازگشت بدون قید و شرط کالا'], ['🏷️', 'تخفیف‌های هفتگی', 'پیشنهادهای ویژه هر هفته'], ['☎️', 'پشتیبانی ۲۴/۷', 'پاسخگویی در تمام ساعات']],
    items: [['هدفون بی‌سیم', 'صدای فراگیر با نویزکنسلینگ', '۲٬۴۵۰٬۰۰۰'], ['ساعت هوشمند', 'مانیتور سلامت و باتری ۷ روزه', '۳٬۹۸۰٬۰۰۰'], ['کوله لپ‌تاپ', 'ضدآب با محفظه مستر', '۸۹۰٬۰۰۰'], ['ماوس گیمینگ', 'سنسور ۱۶۰۰۰ DPI', '۱٬۲۰۰٬۰۰۰'], ['پاوربانک', '۲۰٬۰۰۰ میلی‌آمپر شارژ سریع', '۱٬۵۶۰٬۰۰۰'], ['اسپیکر بلوتوثی', 'صدای ۳۶۰ درجه ضدآب', '۱٬۸۹۰٬۰۰۰']],
    itemsTitle: 'محصولات پرفروش', stats: [['+۱۰k', 'محصول فعال'], ['+۵۰k', 'مشتری راضی'], ['۹۸٪', 'رضایت از ارسال']],
  },
  corporate: {
    keys: ['شرکتی', 'شرکت', 'سازمان', 'اداری', 'صنعتی', 'هلدینگ', 'خدمات'],
    label: 'شرکتی', defBrand: 'گروه آریا',
    hero: b => [`${b} — همراه مطمئن کسب‌وکار شما`, 'ارائه خدمات تخصصی سازمانی با بیش از یک دهه تجربه و تیمی از متخصصان حوزه.'],
    services: [['💼', 'مشاوره کسب‌وکار', 'تحلیل و طراحی مسیر رشد سازمان شما'], ['📊', 'مدیریت پروژه', 'اجرای پروژه‌ها با استانداردهای روز'], ['🏭', 'خدمات صنعتی', 'تأمین و پشتیبانی خطوط تولید'], ['🤝', 'مناقصه و مناقصه‌گذاری', 'همکاری با سازمان‌های بزرگ'], ['📋', 'استانداردسازی', 'اخذ گواهینامه‌های بین‌المللی'], ['🔄', 'پشتیبانی قراردادی', 'قراردادهای سالانه پشتیبانی']],
    items: [['مشاوره سازمانی', 'بازنگری فرآیندها و بهینه‌سازی ساختار', 'از تماس'], ['اجرای پروژه', 'مدیریت یکپارچه از طراحی تا تحویل', 'استعلام'], ['آموزش تخصصی', 'کارگاه‌های ارتقای تیم سازمانی', 'از ۲.۵M'], ['خدمات فنی', 'نگهداری و تعمیرات تخصصی', 'قراردادی'], ['تأمین قطعات', 'تأمین مستقیم از برندهای معتبر', 'استعلام'], ['زیست‌بومی محیط کار', 'بهبود بهره‌وری فضاهای کاری', 'از ۱۵M']],
    itemsTitle: 'خدمات ما', stats: [['۱۲+', 'سال تجربه'], ['+۳۲۰', 'پروژه موفق'], ['+۹۰', 'مشتری سازمانی']],
  },
  portfolio: {
    keys: ['پورتفولیو', 'نمونه کار', 'نمونه‌کار', 'رزومه', 'شخصی', 'عکاس', 'طراح', 'فریلنسر', 'نمونه‌کارها'],
    label: 'شخصی و پورتفولیو', defBrand: 'استودیو نمونه',
    hero: b => [`سلام، ${b} هستم`, 'طراح و توسعه‌دهنده با عشق به خلق تجربه‌های دیجیتال مینیمال و ماندگار.'],
    services: [['🎨', 'طراحی رابط', 'UI/UX محصولات دیجیتال'], ['💻', 'توسعه وب', 'سایت‌های سریع و استاندارد'], ['📱', 'اپ موبایل', 'طراحی اپ‌های کراس‌پلتفرم'], ['✏️', 'هویت بصری', 'لوگو و برندینگ کامل'], ['📸', 'عکاسی', 'عکاسی محصول و پرتره'], ['🎬', 'موشن گرافیک', 'انیمیشن و تیزر تبلیغاتی']],
    items: [['اپ بانکی نکسو', 'طراحی کامل UX اپلیکیشن فینتک', '۱۴۰۳'], ['فروشگاه درفش', 'بازطراحی و بهینه‌سازی فروشگاه', '۱۴۰۳'], ['داشبورد تحلیلی', 'طراحی سیستم داشبورد SaaS', '۱۴۰۲'], ['هویت بصری کافه روما', 'لوگو، منو و فضای برند', '۱۴۰۲'], ['سایت شخصی نویسنده', 'پورتفولیو و وبلاگ شخصی', '۱۴۰۱'], ['موشن تیزر اپ سفر', 'انیمیشن معرفی محصول', '۱۴۰۱']],
    itemsTitle: 'نمونه‌کارهای منتخب', stats: [['+۸۰', 'پروژه موفق'], ['+۴۰', 'مشتری فعال'], ['۸', 'سال تجربه']],
  },
  landing: {
    keys: ['لندینگ', 'استارتاپ', 'اپلیکیشن', 'سرویس', 'محصول', 'saas', 'سرویس آنلاین'],
    label: 'لندینگ محصول', defBrand: 'لندینو',
    hero: b => [`${b} — آینده کار تو اینجاست`, 'ابزار هوشمندی که کارهای تکراری را خودکار می‌کند و به تیم شما سرعت می‌دهد. همین امروز رایگان شروع کنید.'],
    services: [['⚡', 'سرعت ۱۰ برابر', 'گردش کار خودکار و هوشمند'], ['🔐', 'امنیت سازمانی', 'رمزنگاری سرتاسری داده‌ها'], ['🔗', 'اتصال به همه‌جا', 'یکپارچگی با ابزارهای محبوب شما'], ['📈', 'گزارش لحظه‌ای', 'داشبورد تحلیلی بلادرنگ'], ['👥', 'همکاری تیمی', 'فضای کاری مشترک برای کل تیم'], ['🤖', 'هوش مصنوعی', 'پیشنهادهای هوشمند بر اساس رفتار']],
    items: [['پلن رایگان', 'برای شروع و تست — ۱ کاربر', '۰'], ['پلن حرفه‌ای', 'تیم‌های کوچک — تا ۱۰ کاربر', '۴۹۰k'], ['پلن سازمانی', 'امکانات کامل + پشتیبانی اختصاصی', 'تماس']],
    itemsTitle: 'تعرفه‌ها', stats: [['+۱۲k', 'کاربر فعال'], ['۹۹.۹٪', 'آپ‌تایم سرویس'], ['۴.۹', 'امتیاز کاربران']],
  },
  agency: {
    keys: ['آژانس', 'دیجیتال مارکتینگ', 'تبلیغ', 'تبلیغات', 'برندینگ', 'آگهی'],
    label: 'آژانس دیجیتال', defBrand: 'آژانس خلاق',
    hero: b => [`${b}؛ جایی که برندها بزرگ می‌شوند`, 'تیم خلاق ما با استراتژی دقیق و اجرای خلاقانه، رشد برند شما را رقم می‌زند.'],
    services: [['🎯', 'استراتژی برند', 'جایگاه‌یابی و مسیر رشد'], ['📣', 'کمپین تبلیغاتی', 'کمپین‌های چندکاناله هدفمند'], ['📱', 'شبکه‌های اجتماعی', 'تولید محتوا و مدیریت شبکه‌ها'], ['🎬', 'تولید ویدیو', 'تیزر، ریلز و موشن گرافیک'], ['✍️', 'کپی‌رایتینگ', 'متن‌های فروش‌محور و جذاب'], ['📊', 'آنالیز و گزارش', 'سنجش دقیق بازگشت سرمایه']],
    items: [['برندینگ کامل', 'هویت بصری + استراتژی + راهنما', 'از ۴۵M'], ['کمپین سه‌ماهه', 'اجرا و بهینه‌سازی چندکاناله', 'از ۹۰M'], ['مدیریت شبکه اجتماعی', 'تولید محتوای ماهانه + گزارش', 'از ۱۸M'], ['تولید تیزر', 'فیلم تبلیغاتی حرفه‌ای', 'از ۲۵M'], ['سایت شرکتی', 'طراحی و توسعه اختصاصی', 'از ۳۵M'], ['سئو و رشد', 'رشد ارگانیک و لینک‌سازی', 'از ۲۲M']],
    itemsTitle: 'پکیج‌های خدمات', stats: [['+۱۵۰', 'کمپین موفق'], ['+۶۰', 'برند در کنار ما'], ['۱۴', 'جایزه خلاقیت']],
  },
  clinic: {
    keys: ['پزشک', 'کلینیک', 'دکتر', 'درمان', 'مطب', 'دندان', 'زیبایی', 'سالن زیبایی'],
    label: 'کلینیک و درمان', defBrand: 'کلینیک سلامت',
    hero: b => [`${b} — سلامتی شما، اولویت ماست`, 'تیمی از بهترین پزشکان متخصص با تجهیزات روز دنیا در محیطی آرام و بهداشتی.'],
    services: [['👨‍⚕️', 'پزشکان متخصص', 'تیم مجرب در تمام تخصص‌ها'], ['📅', 'نوبت‌دهی آنلاین', 'رزرو سریع بدون معطلی'], ['🔬', 'آزمایشگاه', 'آزمایش‌های کامل با پاسخ سریع'], ['🦷', 'دندانپزشکی', 'درمان و زیبایی کامل دندان'], ['💎', 'خدمات زیبایی', 'لیزر، پوست و زیبایی با دستگاه‌های روز'], ['🚑', 'اورژانس', 'پاسخگویی شبانه‌روزی']],
    items: [['مشاوره عمومی', 'ویزیت و بررسی کامل سلامت', '۲۵۰k'], ['دندانپزشکی زیبایی', 'لمینت، بلیچینگ و ارتودنسی', 'از ۳.۵M'], ['پوست و مو', 'تخصصی با دستگاه‌های آخر نسل', 'از ۸۰۰k'], ['آزمایش کامل', 'چکاپ جامع با گزارش آنلاین', '۱٬۲۰۰k'], ['تغذیه و رژیم', 'برنامه غذایی اختصاصی', '۴۵۰k'], ['فیزیوتراپی', 'درمان و توان‌بخشی حرفه‌ای', '۶۰۰k']],
    itemsTitle: 'خدمات و تعرفه', stats: [['+۲۰', 'پزشک متخصص'], ['+۱۵k', 'بیمار راضی'], ['۲۴/۷', 'پشتیبانی']],
  },
  edu: {
    keys: ['آموزش', 'آموزشگاه', 'مدرسه', 'دوره', 'کلاس', 'مدرس', 'دانشگاه', 'مجتمع'],
    label: 'آموزشی', defBrand: 'آکادمی رشد',
    hero: b => [`${b} — مسیر یادگیری تو از اینجا شروع می‌شود`, 'دوره‌های تخصصی حضوری و آنلاین با بهترین مدرسان و گواهینامه معتبر.'],
    services: [['🎓', 'دوره تخصصی', 'پرگوکنده‌ترین دوره‌های بازار کار'], ['👨‍🏫', 'مدرسان مجرب', 'اساتید دانشگاه و صنعت'], ['🖥️', 'کلاس آنلاین', 'پلتفرم تعاملی یادگیری'], ['📜', 'گواهینامه', 'مدرک معتبر پس از پایان دوره'], ['💼', 'معرفی به بازار کار', 'همکاری با شرکت‌های استخدام‌کننده'], ['🤝', 'منتورینگ', 'راهنمایی فردی تا استخدام']],
    items: [['دوره برنامه‌نویسی وب', 'از صفر تا استخدام — ۶ ماه', '۱۲M'], ['دیجیتال مارکتینگ', 'استراتژی و اجرای عملی — ۳ ماه', '۷.۵M'], ['طراحی UI/UX', 'فیگما و پرتوتایپ — ۲.۵ ماه', '۸.۲M'], ['هوش مصنوعی', 'پایتون و یادگیری ماشین — ۵ ماه', '۱۵M'], ['زبان انگلیسی', 'مکالمه هدفمند — ترمی', '۳.۵M'], ['مالی و حسابداری', 'کاربردی برای کسب‌وکار — ۲ ماه', '۵.۸M']],
    itemsTitle: 'دوره‌های محبوب', stats: [['+۸۰', 'دوره فعال'], ['+۱۲k', 'دانش‌آموخته'], ['۹۲٪', 'اشتغال پس از دوره']],
  },
  travel: {
    keys: ['مسافرت', 'تور', 'آژانس مسافرتی', 'هتل', 'بلیط', 'سفر', 'ویزا'],
    label: 'مسافرت و تور', defBrand: 'سفرنامه',
    hero: b => [`با ${b} دنیا را ببین`, 'تورهای متنوع داخلی و خارجی با بهترین قیمت، راهنمای مجرب و برنامه‌ریزی دقیق.'],
    services: [['✈️', 'بلیط چارتری', 'ارزان‌ترین نرخ پرواز داخلی و خارجی'], ['🗺️', 'تور سازمان‌یافته', 'برنامه کامل با راهنمای فارسی'], ['🏨', 'رزرو هتل', 'بیش از نیم میلیون اقامتگاه'], ['🛂', 'ویزا و مدارک', 'انجام کامل امور ویزا'], ['🚌', 'تور یک‌روزه', 'گردش‌های کوتاه آخر هفته'], ['💳', 'اقساطی', 'سفر کن، بعداً پرداخت کن']],
    items: [['تور استانبول', '۵ شب / پرواز + هتل ۴ ستاره + گشت', '۳۲M'], ['تور دبی', '۴ شب / هتل لوکس + سافاری', '۴۱M'], ['کیش آرام', '۳ شب / هتل بوتیک ساحلی', '۱۴.۵M'], ['تور مشهد مقدس', '۴ شب / هتل کنار حرم', '۸٫۸M'], ['تفلیس ماجراجو', '۵ شب / طبیعت و فرهنگ', '۲۶M'], ['تور اروپا', '۸ شب / ۴ کشور اروپایی', '۹۸M']],
    itemsTitle: 'تورهای پیشنهادی', stats: [['+۳۵۰', 'تور فعال'], ['+۲۲k', 'مسافر خوشحال'], ['۱۵', 'سال تجربه']],
  },
  blog: {
    keys: ['وبلاگ', 'مجله', 'خبری', 'مقاله', 'بلاگ', 'نویسنده'],
    label: 'وبلاگ و مجله', defBrand: 'مجله دانستنی',
    hero: b => [`${b} — خواندنی‌های هر روز`, 'تحلیل، آموزش و داستان‌های تازه از دنیای تکنولوژی، فرهنگ و زندگی.'],
    services: [['✍️', 'قلم‌های منتخب', 'نویسندگان متخصص هر حوزه'], ['📚', 'آموزش‌های کامل', 'راهنماهای گام‌به‌گام کاربردی'], ['🎙️', 'پادکست', 'گفت‌وگو با آدم‌های تأثیرگذار'], ['📊', 'تحلیل و داده', 'نگاه دقیق به روند رویدادها'], ['🎨', 'مقاله دیداری', 'اینفوگرافیک‌های خوانا'], ['📩', 'خبرنامه', 'خلاصه هفتگی در ایمیل شما']],
    items: [['آینده هوش مصنوعی', 'تحلیل کامل تأثیر AI بر مشاغل در ۵ سال آینده', 'تکنولوژی'], ['راهنمای سرمایه‌گذاری', 'از کجا شروع کنم؟ راهنمای ساده و عملی', 'اقتصاد'], ['سفر به شرق ایران', 'راهنمای کامل سفر به سیستان و بلوچستان', 'سفر'], ['معماری ایرانی', 'از تخت جمشید تا امروز؛ روایت یک هنر', 'فرهنگ'], ['سلامت دیجیتال', 'چگونه با گوشی سالم بمانیم؟', 'سلامت'], ['مهارت نوشتن', 'چطور نوشتن را عادت روزانه کنیم؟', 'رشد فردی']],
    itemsTitle: 'آخرین مطالب', stats: [['+۸۵۰', 'مقاله منتشرشده'], ['+۴۰k', 'خواننده ماهانه'], ['۲۵', 'نویسنده فعال']],
  },
};
const DEFAULT_TYPE = 'landing';

// ─── تحلیل پرامپت ───
export function parsePrompt(raw) {
  const text = String(raw || '');
  const t = text.replace(/\u200c/g, ' ');

  // نوع
  let type = DEFAULT_TYPE, best = 0;
  for (const [k, cfg] of Object.entries(TYPES)) {
    const score = cfg.keys.reduce((s, kw) => s + (t.includes(kw) ? kw.length : 0), 0);
    if (score > best) { best = score; type = k; }
  }

  // برند
  let brand = '';
  const STOP = '\\s+(?:را|رو|با|که|می.?خوام|می.?خواهم|باشه|باشد|باشیم|داره|دارد|بخوام|بخواهم|رنگ|تم|دارک|تیره|روشن|برای|لازم|می)|$|[،,.:؛!؟]';
  const brandRes = [
    /[«"']([^«»"']{2,28})[»"']/,
    new RegExp('(?:به\\s+)?(?:اسم|نام|برند)\\s*(?:ش|اش)?\\s*(?:به\\s+)?([^،,.:؛!؟]{2,40}?)(?=' + STOP + ')'),
  ];
  for (const re of brandRes) {
    const m = t.match(re);
    if (m) {
      const cand = m[1].trim().split(/\s+/).slice(0, 3).join(' ');
      if (cand.length >= 2 && !/^(به|که|برای|هم)$/.test(cand)) { brand = cand; break; }
    }
  }
  if (!brand) brand = TYPES[type].defBrand;

  // رنگ
  let paletteKey = null;
  for (const [words, key] of COLOR_WORDS) {
    if (words.some(w => t.includes(w))) { paletteKey = key; break; }
  }
  if (!paletteKey) {
    const hex = t.match(/#([0-9a-fA-F]{6})/);
    if (hex) paletteKey = 'custom', PALETTES.custom = ['#' + hex[1], '#1e293b', '#f59e0b'];
  }
  if (!paletteKey) paletteKey = { restaurant: 'red', shop: 'blue', corporate: 'navy', portfolio: 'purple', landing: 'purple', agency: 'cyan', clinic: 'teal', edu: 'blue', travel: 'cyan', blog: 'brown' }[type] || 'purple';

  // دارک
  const dark = /(تیره|دارک|dark|شب|سیاه و|مشکی)/.test(t);

  // بخش‌ها
  const secTests = [
    ['menu', /(منو|غذا|دسر|پیتزا|قهوه)/], ['gallery', /(گالری|نمونه ?کار|پروژه)/], ['team', /(تیم|همکار)/],
    ['pricing', /(قیمت|تعرفه|پلن)/], ['testimonials', /(نظر|رضایت مشتری|دیدگاه)/], ['blog', /(وبلاگ|مقاله|خبر)/],
    ['hours', /(ساعت کاری|ساعات)/], ['map', /(نقشه|آدرس|موقعیت)/], ['faq', /(سوالات|سؤالات|سوال متداول|faq)/],
  ];
  const sections = secTests.filter(([, re]) => re.test(t)).map(([k]) => k);
  if ((type === 'restaurant' || type === 'shop') && !sections.includes('menu')) sections.push('menu');
  if (!sections.includes('testimonials')) sections.push('testimonials');

  // سبک طراحی (Design Language) — تشخیص از پرامپت، یا انتخاب هوشمند بر اساس هش
  const MODE_WORDS = [
    ['neon', /(نئون|نئونی|neon|شب باشگاه)/],
    ['glass', /(شیشه|گلاس|گلسمورف|glassmorphism|شفاف)/],
    ['minimal', /(مینیمال|ساده|خلوت|minimal)/],
    ['brutal', /(بروتال|بروتالیست|brutal|خشن|بولد)/],
    ['luxe', /(لوکس|لاکچری|شیک|luxury|طلایی|کلاسیک)/],
    ['cyber', /(سایبر|سایبرپانک|cyber|فناورانه|هوش مصنوعی)/],
    ['aurora', /(پاستل|اورورا|نرم|شاد|روشن|پروانه)/],
    ['editorial', /(ادیتوریال|مجله‌ای|روزنامه|editorial|مینیمال ژورنال)/],
    ['terminal', /(ترمینال|هکر|hacker|مونو)/],
  ];
  let mode = null;
  for (const [k, re] of MODE_WORDS) if (re.test(t)) { mode = k; break; }
  if (!mode) {
    const seeds = ['neon', 'glass', 'minimal', 'brutal', 'luxe', 'cyber', 'aurora', 'editorial', 'terminal'];
    mode = seeds[(brand + type + text).split('').reduce((a, c) => (a * 131 + c.charCodeAt(0)) >>> 0, 7) % seeds.length];
  }

  return { type, brand: brand.slice(0, 28), paletteKey, palette: PALETTES[paletteKey] || PALETTES.purple, dark, mode, sections, prompt: text.slice(0, 500) };
}

// ═══════════════════════════════════════════════════════════════
// موتور ۸ سبک طراحی (Design Languages) — هر تولید، یک دنیا متفاوت
// neon / glass / minimal / brutal / luxe / cyber / aurora / terminal
// ═══════════════════════════════════════════════════════════════
export function cssGen(spec, depth = 1) {
  const [c1, c2, ac] = spec.palette;
  const dark = spec.dark;
  const mode = spec.mode || 'neon';

  // ─── پایه‌های مشترک (فونت، رست، جهت) ───
  const base = `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Vazirmatn,Tahoma,sans-serif;line-height:1.9;direction:rtl}
a{color:inherit;text-decoration:none}
img,svg{vertical-align:middle}
.wrap{max-width:1120px;margin:auto;padding:0 20px}
section{padding:64px 0}
.sec-head{text-align:center;margin-bottom:38px}
.sec-head span{font-size:.85rem;font-weight:700;letter-spacing:1px;text-transform:uppercase}
.sec-head h2{font-size:1.65rem;margin-top:6px}
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
.btn{display:inline-block;padding:12px 26px;font-weight:600;border:0;cursor:pointer}
.btn.o{background:none}
.card{transition:.25s}
.card .ic{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-size:1.4rem;margin-bottom:14px}
.card h3{font-size:1.02rem;margin-bottom:7px}
.card p{font-size:.87rem}
.item{display:flex;justify-content:space-between;gap:14px;align-items:center}
.item .pr{font-weight:700;white-space:nowrap}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:14px;text-align:center}
.stats .card{padding:22px 12px}
.stats b{font-size:1.7rem}
.stats span{font-size:.84rem}
.quote{background:var(--card);padding:26px;border-radius:16px}
.quote p{font-size:.9rem}
.who{display:flex;gap:10px;align-items:center;margin-top:14px}
.who i{width:42px;height:42px;border-radius:50%;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700}
form.cnt{display:grid;gap:13px;max-width:540px;margin:auto}
.inp{padding:12px 15px;font-family:inherit;width:100%}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.gal .ph{aspect-ratio:4/3;border-radius:14px}
.hours{display:grid;gap:8px;max-width:420px;margin:auto;font-size:.92rem}
.hours div{display:flex;justify-content:space-between;padding:9px 14px;border-radius:11px}
.faq{max-width:640px;margin:auto;display:grid;gap:10px}
.faq details{background:var(--card);border:1px solid var(--bord);border-radius:13px;padding:15px 18px}
.faq summary{cursor:pointer;font-weight:600}
.faq p{font-size:.9rem;margin-top:9px}
.team{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px;text-align:center}
.team .av{width:74px;height:74px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:1.5rem;font-weight:700;margin:0 auto 10px}
header{position:sticky;top:0;z-index:99}
.nav{display:flex;align-items:center;gap:24px;height:66px;flex-wrap:wrap}
.brand{display:flex;gap:9px;align-items:center;font-weight:800}
.brand i{width:36px;height:36px;border-radius:11px;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700}
nav.links{display:flex;gap:2px;flex-wrap:wrap}
nav.links a{padding:7px 13px;font-size:.9rem}
.hero{position:relative;overflow:hidden;padding:88px 0 74px}
.hero h1{font-size:2.35rem;line-height:1.6;max-width:30rem;font-weight:800}
.hero p{max-width:32rem;margin:14px 0 26px}
.row{display:flex;gap:12px;flex-wrap:wrap}
footer{color:#aeb6d3;padding:44px 0 24px;margin-top:40px}
footer .cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:26px;padding-bottom:26px}
footer h4{color:#fff;margin-bottom:12px;font-size:.95rem}
footer li{margin-bottom:8px;font-size:.87rem}
.copy{border-top:1px solid #232b47;text-align:center;padding-top:16px;font-size:.78rem}
.cta-band{border-radius:20px;padding:44px 24px;text-align:center}
.bloob{position:absolute;width:420px;height:420px;border-radius:50%;top:-140px;left:-120px;filter:blur(12px);pointer-events:none}
.hero-g{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.hero-art{height:330px;border-radius:20px;position:relative;overflow:hidden}
@media(max-width:760px){nav.links{display:none}.hero h1{font-size:1.6rem}.hero-g{grid-template-columns:1fr}footer .cols{grid-template-columns:1fr}}`;

  // ═══ ۱) نئون — شب نئونی، درخشش، گرید سایبری ═══
  const NEON = `:root{--c1:${c1};--c2:${c2};--ac:${ac};--ink:${dark ? '#eaf0ff' : '#131a3d'};--mut:${dark ? '#9aa5d0' : '#5f6a94'};--bg:${dark ? '#0a0e22' : '#12163a'};--card:${dark ? '#151b3e' : '#1a2150'};--bord:${dark ? '#283163' : '#2c3568'}}
body{background:var(--bg);color:var(--ink)}
.hero{background:radial-gradient(700px 340px at 85% -10%,color-mix(in srgb,var(--c1) 26%,transparent),transparent),radial-gradient(600px 300px at 8% 110%,color-mix(in srgb,var(--c2) 20%,transparent),transparent)}
.hero::before{content:'';position:absolute;inset:-40%;background:repeating-linear-gradient(90deg,transparent 0 79px,color-mix(in srgb,var(--c1) 9%,transparent) 80px,transparent 81px),repeating-linear-gradient(0deg,transparent 0 79px,color-mix(in srgb,var(--c2) 7%,transparent) 80px,transparent 81px);animation:gridDrift 22s linear infinite;pointer-events:none}
@keyframes gridDrift{to{transform:translate3d(80px,80px,0)}}
.hero h1 b,.hero h1 span{background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
header{background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--bord)}
header::after{content:'';display:block;height:2px;background:linear-gradient(90deg,transparent,var(--c1),var(--c2),transparent)}
nav.links a{color:var(--mut);border-radius:10px}
nav.links a:hover,nav.links a.on{color:#fff;background:linear-gradient(135deg,var(--c1),var(--c2));box-shadow:0 6px 20px color-mix(in srgb,var(--c1) 45%,transparent)}
.btn{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;border-radius:13px;box-shadow:0 10px 26px color-mix(in srgb,var(--c1) 42%,transparent)}
.btn.o{color:var(--ink);border:1.5px solid var(--bord);box-shadow:none}
.sec-head span{color:var(--c1);text-shadow:0 0 16px color-mix(in srgb,var(--c1) 60%,transparent)}
.card{background:linear-gradient(165deg,color-mix(in srgb,var(--card) 96%,var(--c1) 4%),var(--card));border:1px solid var(--bord);border-radius:16px;padding:24px 20px}
.card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--c1) 45%,var(--bord));box-shadow:0 18px 44px rgba(0,0,0,.4),0 0 30px color-mix(in srgb,var(--c1) 16%,transparent)}
.card .ic{background:color-mix(in srgb,var(--c1) 16%,transparent);color:var(--c1);box-shadow:0 0 20px color-mix(in srgb,var(--c1) 30%,transparent) inset}
.card p{color:var(--mut)}
.item .pr{color:var(--c2)}
.stats b{background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.quote{border:1px solid var(--bord);background:var(--card)}
.who i{background:linear-gradient(135deg,var(--c1),var(--c2));box-shadow:0 0 18px color-mix(in srgb,var(--c1) 45%,transparent)}
.inp{border:1.5px solid var(--bord);background:var(--card);color:var(--ink);border-radius:12px}
.inp:focus{outline:none;border-color:var(--c1);box-shadow:0 0 0 4px color-mix(in srgb,var(--c1) 18%,transparent)}
footer{background:var(--card);border-top:1px solid var(--bord)}
.cta-band{background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 20%,var(--card)),color-mix(in srgb,var(--c2) 16%,var(--card)));border:1px solid var(--bord);box-shadow:0 0 44px color-mix(in srgb,var(--c1) 14%,transparent)}
.team .av{background:linear-gradient(135deg,var(--c1),var(--c2))}
.hero-art{background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 34%,transparent),color-mix(in srgb,var(--c2) 30%,transparent));border:1px solid var(--bord)}
.hero-art::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 39px,rgba(255,255,255,.05) 40px,transparent 41px)}
.bloob{background:radial-gradient(circle,color-mix(in srgb,var(--c1) 30%,transparent),transparent 70%)}`;

  // ═══ ۲) گلَس — شیشه‌ای مدرن، هاله‌های پاستلی ═══
  const GLASS = `:root{--c1:${c1};--c2:${c2};--ac:${ac};--ink:${dark ? '#eef1ff' : '#1a2044'};--mut:${dark ? '#a3adcf' : '#5f6a94'};--bg:${dark ? '#10132b' : '#eef0fb'};--card:rgba(255,255,255,${dark ? '.06' : '.62'});--bord:rgba(255,255,255,${dark ? '.12' : '.65'})}
body{background:${dark ? '#10132b' : '#eef0fb'};color:var(--ink);backdrop-filter:blur(0)}
body::before{content:'';position:fixed;inset:0;z-index:-1;background:radial-gradient(42rem 26rem at 85% -5%,color-mix(in srgb,var(--c1) ${dark ? '20' : '18'}%,transparent),transparent 60%),radial-gradient(38rem 24rem at -5% 40%,color-mix(in srgb,var(--c2) ${dark ? '16' : '16'}%,transparent),transparent 60%),radial-gradient(30rem 22rem at 70% 105%,color-mix(in srgb,${ac} 12%,transparent),transparent 60%)}
header{background:color-mix(in srgb,var(--bg) 55%,transparent);backdrop-filter:blur(20px) saturate(1.4);border-bottom:1px solid var(--bord)}
.hero{background:none}
.hero .bloob{background:radial-gradient(circle,color-mix(in srgb,var(--c1) 26%,transparent),transparent 70%);filter:blur(30px)}
.hero h1 b,.hero h1 span{background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.btn{background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;border-radius:999px;box-shadow:0 12px 30px color-mix(in srgb,var(--c1) 34%,transparent)}
.btn.o{background:var(--card);color:var(--ink);border:1.5px solid var(--bord);backdrop-filter:blur(10px);box-shadow:none}
nav.links a{color:var(--mut);border-radius:999px}
nav.links a:hover,nav.links a.on{color:#fff;background:linear-gradient(135deg,var(--c1),var(--c2))}
.sec-head span{color:var(--c1)}
.card{background:var(--card);border:1px solid var(--bord);border-radius:24px;padding:26px 22px;backdrop-filter:blur(18px);box-shadow:0 12px 40px rgba(20,25,70,.1)}
.card:hover{transform:translateY(-5px);box-shadow:0 24px 60px rgba(20,25,70,.16);border-color:color-mix(in srgb,var(--c1) 40%,transparent)}
.card .ic{background:color-mix(in srgb,var(--c1) 18%,transparent);color:var(--c1)}
.card p{color:var(--mut)}
.item .pr{color:var(--c1)}
.stats b{background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.quote{background:var(--card);border:1px solid var(--bord);backdrop-filter:blur(16px)}
.who i{background:linear-gradient(135deg,var(--c1),var(--c2))}
.inp{border:1.5px solid var(--bord);background:var(--card);color:var(--ink);border-radius:14px;backdrop-filter:blur(10px)}
.inp:focus{outline:none;border-color:var(--c1);box-shadow:0 0 0 4px color-mix(in srgb,var(--c1) 16%,transparent)}
footer{background:var(--card);border-top:1px solid var(--bord);backdrop-filter:blur(20px)}
.cta-band{background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 22%,var(--card)),color-mix(in srgb,var(--c2) 18%,var(--card)));border:1px solid var(--bord);backdrop-filter:blur(18px)}
.team .av{background:linear-gradient(135deg,var(--c1),var(--c2))}
.hero-art{background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 30%,transparent),color-mix(in srgb,var(--c2) 26%,transparent));border:1px solid var(--bord);backdrop-filter:blur(4px)}
.hours div,.faq details{background:var(--card);border:1px solid var(--bord);backdrop-filter:blur(10px)}`;

  // ═══ ۳) مینیمال — سفید، تایپوگرافی، فضای خالی ═══
  const MINIMAL = `:root{--c1:${c1};--c2:${c2};--ac:${ac};--ink:${dark ? '#e6e9f5' : '#16182a'};--mut:${dark ? '#8f97b5' : '#68708e'};--bg:${dark ? '#0d0f1a' : '#ffffff'};--card:${dark ? '#151724' : '#fafafc'};--bord:${dark ? '#252839' : '#ececf2'}}
body{background:var(--bg);color:var(--ink)}
header{background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--bord)}
nav.links a{color:var(--mut)}
nav.links a:hover{color:var(--ink);text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:1.5px}
nav.links a.on{color:var(--ink);font-weight:700}
.btn{background:var(--ink);color:var(--bg);border-radius:8px}
.btn:hover{opacity:.85}
.btn.o{background:none;border:1.5px solid var(--bord);color:var(--ink)}
.hero{background:none;padding:110px 0 90px}
.hero h1{font-size:2.9rem;letter-spacing:-.5px;font-weight:800}
.hero h1 b,.hero h1 span{color:var(--c1)}
.sec-head{text-align:start}
.sec-head span{color:var(--c1)}
.card{background:var(--card);border:1px solid var(--bord);border-radius:6px;padding:26px 22px}
.card:hover{border-color:var(--ink);transform:translateY(-3px);box-shadow:0 20px 44px rgba(10,12,30,.08)}
.card .ic{background:var(--ink);color:var(--bg);border-radius:50%}
.card p{color:var(--mut)}
.item .pr{color:var(--ink);border-bottom:2px solid var(--c1)}
.stats b{font-size:2rem;font-weight:800}
.stats span{color:var(--mut)}
.quote{border:1px solid var(--bord);background:var(--card);border-radius:6px}
.who i{background:var(--ink);color:var(--bg)}
.inp{border:1px solid var(--bord);background:var(--bg);color:var(--ink);border-radius:6px}
.inp:focus{outline:none;border-color:var(--ink)}
footer{background:var(--bg);border-top:1px solid var(--bord)}
footer h4{color:var(--ink)}
.cta-band{background:var(--ink);color:var(--bg);border-radius:6px}
.cta-band .btn{background:var(--bg);color:var(--ink)}
.team .av{background:var(--ink);color:var(--bg)}
.hours div{background:var(--card);border:1px solid var(--bord)}
.hero-art{border:1px solid var(--bord);background:repeating-linear-gradient(45deg,var(--card) 0 12px,var(--bg) 12px 24px)}`;

  // ═══ ۴) بروتال — جسور، لبه‌های تیز، کنتراست بالا ═══
  const BRUTAL = `:root{--c1:${c1};--c2:${c2};--ac:${ac};--ink:#ffffff;--mut:rgba(255,255,255,.72);--bg:${dark ? '#0b0b0e' : '#101014'};--card:${dark ? '#16161c' : '#181820'};--bord:rgba(255,255,255,.22)}
body{background:var(--bg);color:var(--ink)}
header{background:var(--bg);border-bottom:4px solid var(--c1)}
nav.links a{color:var(--mut);border:2px solid transparent;font-weight:700}
nav.links a:hover,nav.links a.on{border-color:var(--c1);color:#fff;box-shadow:4px 4px 0 var(--c1)}
.brand i{border-radius:0;box-shadow:4px 4px 0 var(--c2)}
.btn{border-radius:0;background:var(--c1);color:#fff;box-shadow:6px 6px 0 var(--c2);border:2px solid #000;font-weight:800;text-transform:uppercase;letter-spacing:.5px}
.btn:hover{transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--c2)}
.btn.o{background:none;border:2px solid var(--bord);color:#fff;box-shadow:none}
.hero{background:repeating-linear-gradient(0deg,transparent 0 39px,rgba(255,255,255,.04) 40px,transparent 41px);padding:100px 0 84px}
.hero h1{font-size:3rem;line-height:1.4;text-transform:uppercase;letter-spacing:-.5px;font-weight:900}
.hero h1 b,.hero h1 span{background:var(--c1);color:#fff;padding:2px 12px;box-shadow:5px 5px 0 var(--c2)}
.hero p{color:var(--mut);font-size:1.05rem}
.sec-head span{background:var(--ac);color:#000;padding:3px 12px;display:inline-block;font-size:.75rem}
.sec-head h2{font-size:2rem;font-weight:900;text-transform:uppercase}
.card{border-radius:0;border:2px solid var(--bord);background:var(--card);padding:26px 20px}
.card:hover{transform:translate(-3px,-3px);border-color:var(--c1);box-shadow:6px 6px 0 var(--c1)}
.card .ic{border-radius:0;background:var(--ac);color:#000}
.card p{color:var(--mut)}
.item .pr{background:var(--c1);color:#fff;padding:3px 10px;font-size:.85rem}
.stats b{font-size:2rem;font-weight:900}
.stats span{color:var(--mut)}
.quote{border:2px solid var(--bord);border-radius:0;background:var(--card)}
.who i{background:var(--ac);color:#000}
.inp{border:2px solid var(--bord);background:var(--card);color:#fff;border-radius:0}
.inp:focus{outline:none;border-color:var(--c1);box-shadow:5px 5px 0 var(--c1)}
footer{background:#000;border-top:4px solid var(--c2)}
.cta-band{background:var(--c1);color:#fff;border-radius:0;box-shadow:8px 8px 0 var(--c2)}
.cta-band .btn{background:#000;color:#fff;box-shadow:4px 4px 0 #fff}
.team .av{background:var(--ac);color:#000;border-radius:0}
.hours div{background:var(--card);border:2px solid var(--bord);border-radius:0}
.hero-art{border:2px solid var(--bord);border-radius:0;background:linear-gradient(135deg,var(--c1),#000 55%,var(--c2))}`;

  // ═══ ۵) لوکس — طلایی، تیره، سریف، ظرافت ═══
  const LUXE = `:root{--c1:#d4af37;--c2:#b8860b;--ac:#e8c96a;--ink:${dark ? '#f3ecda' : '#2a2318'};--mut:${dark ? '#b3a888' : '#7d7460'};--bg:${dark ? '#0f0d0a' : '#faf6ec'};--card:${dark ? '#191510' : '#fffdf6'};--bord:rgba(212,175,55,.35)}
body{background:var(--bg);color:var(--ink)}
header{background:color-mix(in srgb,var(--bg) 80%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--bord)}
.brand{font-family:'Vazirmatn',serif;letter-spacing:.5px}
nav.links a{color:var(--mut);letter-spacing:.3px}
nav.links a::after{content:'';display:block;height:1px;background:linear-gradient(90deg,var(--c1),transparent);transform:scaleX(0);transition:.3s}
nav.links a:hover::after,nav.links a.on::after{transform:scaleX(1)}
nav.links a.on{color:var(--c1)}
.btn{background:linear-gradient(135deg,#e8c96a,#b8860b);color:#221c10;border-radius:2px;letter-spacing:.5px;box-shadow:0 10px 26px rgba(184,134,11,.28)}
.btn.o{background:none;border:1px solid var(--bord);color:var(--c1)}
.hero{background:radial-gradient(740px 340px at 50% -20%,rgba(212,175,55,.14),transparent 65%)}
.hero h1{font-size:2.6rem;font-weight:800;letter-spacing:-.4px}
.hero h1 b,.hero h1 span{color:var(--c1)}
.sec-head span{color:var(--c1);letter-spacing:2px}
.sec-head h2{font-weight:800}
.card{background:var(--card);border:1px solid var(--bord);border-radius:4px;padding:28px 24px}
.card:hover{border-color:var(--c1);transform:translateY(-4px);box-shadow:0 24px 50px rgba(20,15,4,.25)}
.card .ic{background:linear-gradient(135deg,#e8c96a33,#b8860b22);color:var(--c1);border:1px solid var(--bord);border-radius:50%}
.card p{color:var(--mut)}
.item .pr{color:var(--c1);font-weight:800}
.stats b{color:var(--c1);font-size:1.9rem}
.quote{border:1px solid var(--bord);background:var(--card);border-radius:4px;position:relative}
.quote::before{content:'“';position:absolute;top:-14px;inset-inline-start:14px;font-size:3.4rem;color:var(--c1);opacity:.5}
.who i{background:linear-gradient(135deg,#e8c96a,#b8860b);color:#221c10}
.inp{border:1px solid var(--bord);background:var(--card);color:var(--ink);border-radius:3px}
.inp:focus{outline:none;border-color:var(--c1);box-shadow:0 0 0 3px rgba(212,175,55,.15)}
footer{background:var(--bg);border-top:1px solid var(--bord)}
footer h4{color:var(--c1)}
.cta-band{background:linear-gradient(135deg,#181208,#241c10);border:1px solid var(--bord);color:var(--ink)}
.cta-band .btn{background:linear-gradient(135deg,#e8c96a,#b8860b)}
.team .av{background:linear-gradient(135deg,#e8c96a,#b8860b);color:#221c10}
.hours div{background:var(--card);border:1px solid var(--bord)}
.hero-art{border:1px solid var(--bord);border-radius:4px;background:radial-gradient(circle at 60% 40%,rgba(212,175,55,.3),transparent 60%),linear-gradient(135deg,#181208,#221c10)}`;

  // ═══ ۶) سایبر — سایبرپانک، گلیچ، خطوط اسکن ═══
  const CYBER = `:root{--c1:#00e5ff;--c2:#ff2ec4;--ac:#a3ff12;--ink:#e8fbff;--mut:#7fb4c9;--bg:#050b14;--card:#0a1626;--bord:rgba(0,229,255,.3)}
body{background:var(--bg);color:var(--ink)}
body::before{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg,#050b14,#071222)}
header{background:rgba(5,11,20,.85);backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,229,255,.35)}
.brand{font-family:'Vazirmatn',monospace}
.brand i{background:#050b14;color:var(--c1);border:1px solid var(--c1);box-shadow:0 0 14px rgba(0,229,255,.5),inset 0 0 8px rgba(0,229,255,.25)}
nav.links a{color:var(--mut);font-family:monospace;letter-spacing:.5px}
nav.links a:hover,nav.links a.on{color:var(--c1);text-shadow:0 0 10px var(--c1)}
.btn{background:linear-gradient(90deg,var(--c1),var(--c2));color:#04070d;font-weight:800;border-radius:4px;box-shadow:0 0 22px rgba(0,229,255,.4);letter-spacing:.5px}
.btn:hover{box-shadow:0 0 34px rgba(0,229,255,.65)}
.btn.o{background:none;color:var(--c1);border:1px solid var(--c1)}
.hero{background:radial-gradient(600px 300px at 50% 0%,rgba(0,229,255,.14),transparent 60%),radial-gradient(500px 260px at 80% 100%,rgba(255,46,196,.12),transparent 60%)}
.hero::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 3px,rgba(0,229,255,.03) 4px);pointer-events:none}
.hero h1{font-weight:900;letter-spacing:-.5px}
.hero h1 b,.hero h1 span{color:var(--c1);text-shadow:0 0 24px rgba(0,229,255,.7)}
.hero p{color:var(--mut)}
.sec-head span{color:var(--c2);text-shadow:0 0 12px rgba(255,46,196,.7);letter-spacing:2px}
.card{background:linear-gradient(165deg,#0a1626,#0c1a30);border:1px solid rgba(0,229,255,.22);border-radius:6px;padding:26px 22px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;inset-inline:0;height:2px;background:linear-gradient(90deg,var(--c1),var(--c2))}
.card:hover{transform:translateY(-4px);border-color:var(--c1);box-shadow:0 0 30px rgba(0,229,255,.2),0 18px 40px rgba(0,0,0,.5)}
.card .ic{background:rgba(0,229,255,.08);color:var(--c1);border:1px solid rgba(0,229,255,.3);box-shadow:0 0 18px rgba(0,229,255,.15) inset}
.card p{color:var(--mut)}
.item .pr{color:var(--ac)}
.stats b{color:var(--c1);text-shadow:0 0 16px rgba(0,229,255,.5)}
.stats span{color:var(--mut)}
.quote{background:#0a1626;border:1px solid rgba(255,46,196,.3);color:var(--ink)}
.who i{background:linear-gradient(90deg,var(--c1),var(--c2));color:#04070d}
.inp{border:1px solid rgba(0,229,255,.3);background:#081120;color:var(--ink);border-radius:4px;font-family:monospace}
.inp:focus{outline:none;border-color:var(--c1);box-shadow:0 0 0 3px rgba(0,229,255,.15),0 0 18px rgba(0,229,255,.2)}
footer{background:#04070d;border-top:1px solid rgba(0,229,255,.3)}
.cta-band{background:linear-gradient(90deg,rgba(0,229,255,.1),rgba(255,46,196,.1));border:1px solid var(--c1);box-shadow:0 0 40px rgba(0,229,255,.15)}
.team .av{background:linear-gradient(90deg,var(--c1),var(--c2));color:#04070d}
.hours div{background:#0a1626;border:1px solid rgba(0,229,255,.25)}
.faq details{border-color:rgba(0,229,255,.25);background:#0a1626}
.hero-art{background:linear-gradient(135deg,rgba(0,229,255,.2),rgba(255,46,196,.18));border:1px solid var(--c1);box-shadow:0 0 30px rgba(0,229,255,.2)}`;

  // ═══ ۷) اورورا — پاستلی، گرد، دوستانه ═══
  const AURORA = `:root{--c1:${c1};--c2:${c2};--ac:${ac};--ink:${dark ? '#eef0fa' : '#31344f'};--mut:${dark ? '#a9aed0' : '#7278a0'};--bg:${dark ? '#141728' : '#fbf7ff'};--card:${dark ? '#1e2240' : '#ffffff'};--bord:${dark ? '#33395f' : '#efe6fb'}}
body{background:var(--bg);color:var(--ink)}
body::before{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(160deg,color-mix(in srgb,var(--c1) 10%,transparent),transparent 40%,color-mix(in srgb,var(--c2) 10%,transparent))}
header{background:color-mix(in srgb,var(--bg) 65%,transparent);backdrop-filter:blur(18px);border-bottom:1px solid var(--bord)}
.brand i{background:linear-gradient(135deg,var(--c1),var(--ac),var(--c2));background-size:200% 200%;animation:flow 5s ease infinite}
@keyframes flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
nav.links a{color:var(--mut);border-radius:999px}
nav.links a:hover{background:color-mix(in srgb,var(--c1) 12%,transparent);color:var(--ink)}
nav.links a.on{background:linear-gradient(135deg,var(--c1),var(--ac));color:#fff}
.btn{border-radius:999px;background:linear-gradient(135deg,var(--c1),var(--ac),var(--c2));background-size:200% 200%;animation:flow 4s ease infinite;color:#fff;box-shadow:0 12px 30px color-mix(in srgb,var(--c1) 30%,transparent)}
.btn.o{background:var(--card);color:var(--ink);border:1.5px solid var(--bord);animation:none;box-shadow:none}
.hero{background:radial-gradient(500px 300px at 20% 0%,color-mix(in srgb,var(--c1) 22%,transparent),transparent 60%),radial-gradient(500px 300px at 85% 100%,color-mix(in srgb,var(--c2) 20%,transparent),transparent 60%)}
.hero h1 b,.hero h1 span{background:linear-gradient(135deg,var(--c1),var(--ac));-webkit-background-clip:text;background-clip:text;color:transparent}
.sec-head span{color:var(--ac)}
.card{background:var(--card);border:1px solid var(--bord);border-radius:28px;padding:28px 22px}
.card:hover{transform:translateY(-6px) rotate(-.4deg);border-color:color-mix(in srgb,var(--c1) 40%,var(--bord));box-shadow:0 24px 56px color-mix(in srgb,var(--c1) 14%,transparent)}
.card .ic{background:color-mix(in srgb,var(--c1) 15%,transparent);color:var(--c1);border-radius:16px}
.card p{color:var(--mut)}
.item .pr{color:var(--c1)}
.stats b{background:linear-gradient(135deg,var(--c1),var(--ac),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.quote{background:var(--card);border:1px solid var(--bord);border-radius:28px}
.who i{background:linear-gradient(135deg,var(--c1),var(--ac))}
.inp{border:1.5px solid var(--bord);background:var(--card);color:var(--ink);border-radius:14px}
.inp:focus{outline:none;border-color:var(--c1);box-shadow:0 0 0 4px color-mix(in srgb,var(--c1) 16%,transparent)}
footer{background:var(--card);border-top:1px solid var(--bord)}
.cta-band{background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 20%,var(--card)),color-mix(in srgb,var(--c2) 16%,var(--card)));border:1px solid var(--bord);border-radius:28px}
.team .av{background:linear-gradient(135deg,var(--c1),var(--ac))}
.hours div{background:var(--card);border:1px solid var(--bord)}
.hero-art{border:1px solid var(--bord);border-radius:28px;background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 24%,transparent),color-mix(in srgb,var(--c2) 20%,transparent))}`;

  // ═══ ۸) ادیتوریال — مجله‌ای، سریف، ستون‌ها ═══
  const EDITORIAL = `:root{--c1:#16161f;--c2:${c1};--ac:${ac};--ink:#16161f;--mut:#5c5c6b;--bg:${dark ? '#0e0e13' : '#f6f3ec'};--card:${dark ? '#1a1a24' : '#fffdf6'};--bord:${dark ? '#2c2c3a' : '#ded7c6'}}
body{background:var(--bg);color:var(--ink)}
header{background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(12px);border-bottom:2px solid var(--ink)}
.brand{font-size:1.3rem;letter-spacing:1px}
.brand i{background:none;color:var(--c1);border:2px solid var(--ink);border-radius:50%;font-family:serif}
nav.links a{color:var(--mut);font-size:.88rem;letter-spacing:.3px}
nav.links a:hover{color:var(--ink)}
nav.links a.on{color:var(--ink);border-bottom:2px solid ${c1}}
.btn{background:var(--ink);color:var(--bg);border-radius:0;letter-spacing:.5px;font-weight:700}
.btn.o{background:none;color:var(--ink);border:1px solid var(--ink)}
.hero{background:none;padding:104px 0 80px;border-bottom:1px solid var(--bord)}
.hero h1{font-size:3rem;line-height:1.45;font-weight:900;letter-spacing:-1px}
.hero h1 b,.hero h1 span{border-bottom:4px solid ${c2}}
.hero p{color:var(--mut);font-size:1.02rem}
.sec-head{text-align:start;border-top:3px solid var(--ink);padding-top:18px}
.sec-head span{color:var(--mut);font-size:.72rem;letter-spacing:2px}
.sec-head h2{font-size:1.9rem;font-weight:900}
.card{background:var(--card);border:1px solid var(--bord);border-radius:0;padding:26px 22px}
.card:hover{box-shadow:8px 8px 0 rgba(22,22,31,.9);transform:translate(-4px,-4px);border-color:var(--ink)}
.card .ic{background:var(--ink);color:var(--bg);border-radius:0}
.card p{color:var(--mut)}
.item{border:1px solid var(--bord);padding:16px 18px;background:var(--card)}
.item .pr{background:var(--ink);color:var(--bg);padding:2px 10px;font-size:.8rem}
.stats{grid-template-columns:repeat(auto-fill,minmax(165px,1fr))}
.stats b{font-size:2.2rem;font-weight:900;color:var(--ink)}
.stats span{color:var(--mut)}
.quote{border-inline-start:4px solid ${c2};background:var(--card);border-radius:0}
.who i{background:var(--ink);color:var(--bg);border-radius:0}
.inp{border:1px solid var(--bord);background:var(--card);color:var(--ink);border-radius:0}
.inp:focus{outline:none;border-color:var(--ink);box-shadow:4px 4px 0 var(--ink)}
footer{background:var(--ink);color:var(--bg)}
footer h4{color:var(--bg)}
footer li a{color:rgba(255,255,255,.75)}
.cta-band{background:var(--card);border:2px solid var(--ink);color:var(--ink);border-radius:0;box-shadow:10px 10px 0 var(--ink)}
.cta-band .btn{background:${c1};color:#fff}
.team .av{background:var(--ink);color:var(--bg);border-radius:0}
.hours div{background:var(--card);border:1px solid var(--bord)}
.hero-art{border:1px solid var(--bord);border-radius:0;background:repeating-linear-gradient(0deg,var(--card) 0 26px,var(--bg) 26px 40px)}`;

  const MODES = { neon: NEON, glass: GLASS, minimal: MINIMAL, brutal: BRUTAL, luxe: LUXE, cyber: CYBER, aurora: AURORA, editorial: EDITORIAL };
  return base + (MODES[mode] || NEON) + proCssExtra(spec.palette, depth);
}

export const MODE_LABELS = { neon: 'نئون سایبری', glass: 'گلاس‌مورفیک', minimal: 'مینیمال', brutal: 'بروتالیست', luxe: 'لوکس طلایی', cyber: 'سایبرپانک', aurora: 'اورورا پاستلی', editorial: 'ادیتوریال' };

// ─── ساخت صفحات ───
function shell(spec, body, { inline, titleSuffix, depth = 1 } = {}) {
  const b = esc(spec.brand);
  const T = TYPES[spec.type];
  const css = cssGen(spec, depth);
  const h1 = spec.heroTitle || T.hero(spec.brand)[0];
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${b}${titleSuffix ? ' — ' + titleSuffix : ' — ' + esc(T.label)}</title>
<meta name="description" content="${esc(spec.prompt.slice(0, 150)) || h1}">
${inline ? `<style>\n${css}\n</style>` : '<link rel="stylesheet" href="css/style.css">'}
</head>
<body>
<header><div class="wrap nav">
  <a class="brand" href="index.html"><i>${b.trim().charAt(0)}</i>${b}</a>
  <nav class="links">
    <a href="index.html">خانه</a><a href="about.html">درباره ما</a><a href="index.html#items">${esc(T.itemsTitle)}</a><a href="contact.html">تماس</a>
  </nav>
  <a class="btn" style="margin-inline-start:auto" href="contact.html">شروع همکاری</a>
</div></header>
${body}
<footer><div class="wrap">
  <div class="cols">
    <div>
      <a class="brand" href="index.html" style="color:#fff"><i>${b.trim().charAt(0)}</i>${b}</a>
      <p style="font-size:.85rem;margin-top:11px;max-width:21rem">${h1} — ${esc(T.label)}</p>
    </div>
    <div><h4>دسترسی سریع</h4><ul><li><a href="index.html">خانه</a></li><li><a href="about.html">درباره ما</a></li><li><a href="contact.html">تماس با ما</a></li></ul></div>
    <div><h4>ارتباط</h4><ul><li>info@example.ir</li><li>۰۲۱-۹۱۰۰۰۰۰۰</li><li>تهران، ایران</li></ul></div>
  </div>
  <div class="copy">© ${new Date().toLocaleDateString('fa-IR', { year: 'numeric' })} ${b} — تمامی حقوق محفوظ است. | قالب تولیدشده توسط اپ‌تم</div>
</div></footer>
</body>
</html>`;
}

const svgPhumb = (spec, i) => {
  const [c1, c2] = spec.palette;
  return `<svg class="ph" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="نمونه ${i + 1}"><defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity=".85"/><stop offset="1" stop-color="${c2}" stop-opacity=".8"/></linearGradient></defs><rect width="400" height="300" rx="14" fill="url(#g${i})"/><circle cx="${320 - i * 30}" cy="${70 + i * 20}" r="34" fill="rgba(255,255,255,.25)"/><rect x="30" y="190" width="${240 - i * 20}" height="14" rx="7" fill="rgba(255,255,255,.55)"/><rect x="30" y="216" width="${170 - i * 15}" height="12" rx="6" fill="rgba(255,255,255,.35)"/><rect x="30" y="36" width="${130 + i * 10}" height="18" rx="9" fill="rgba(255,255,255,.6)"/></svg>`;
};

export function generateFromSpec(spec, { styleInline = true, depth = 1 } = {}) {
  const T = TYPES[spec.type];
  const og = T.hero(spec.brand);
  const h1 = spec.heroTitle || og[0];
  const h2 = spec.heroSub || og[1];
  const secs = new Set(spec.sections);
  const S = [];

  // هدر: بخشی از تیتر هایلایت می‌شود (هر سبک طراحی، هایلایت خودش را دارد)
  const words = String(h1).split(' ');
  const hl = words.slice(0, Math.max(1, Math.ceil(words.length / 3))).join(' ');
  const rest = words.slice(Math.max(1, Math.ceil(words.length / 3))).join(' ');
  const heroInner = `<div class="wrap"><div style="position:relative;z-index:2"><h1><b>${hl}</b> ${rest}</h1><p>${h2}</p>
  <div class="row"><a class="btn" href="contact.html">${spec.type === 'restaurant' ? 'رزرو میز' : spec.type === 'shop' ? 'شروع خرید' : 'درخواست مشاوره'}</a><a class="btn o" href="about.html">بیشتر بدانید</a></div></div></div>`;
  if (['glass', 'minimal', 'aurora', 'luxe', 'editorial'].includes(spec.mode)) {
    S.push(`<section class="hero"><div class="bloob"></div><div class="wrap hero-g"><div><h1><b>${hl}</b> ${rest}</h1><p>${h2}</p>
  <div class="row"><a class="btn" href="contact.html">${spec.type === 'restaurant' ? 'رزرو میز' : spec.type === 'shop' ? 'شروع خرید' : 'درخواست مشاوره'}</a><a class="btn o" href="about.html">بیشتر بدانید</a></div></div><div class="hero-art" aria-hidden="true"></div></div></section>`);
  } else {
    S.push(`<section class="hero">${heroInner}</section>`);
  }

  S.push(`<section><div class="wrap"><div class="sec-head"><span>چرا ما؟</span><h2>خدمات و مزیت‌ها</h2></div><div class="g3">
  ${cutByDepth(T.services, depth).map(([ic, t, d]) => `<div class="card"><div class="ic">${ic}</div><h3>${t}</h3><p>${d}</p></div>`).join('\n  ')}
</div></div></section>`);

  S.push(`<section id="items"><div class="wrap"><div class="sec-head"><span>${esc(T.label)}</span><h2>${esc(T.itemsTitle)}</h2></div><div class="g3">
  ${cutByDepth(T.items, depth).map(([n, d, p]) => `<div class="card item"><div><h3 style="font-size:.95rem">${n}</h3><p>${d}</p></div><span class="pr">${p}</span></div>`).join('\n  ')}
</div></div></section>`);

  if (secs.has('gallery')) S.push(`<section><div class="wrap"><div class="sec-head"><span>نگاهی به کارهای ما</span><h2>گالری</h2></div><div class="gal">${[0, 1, 2, 3, 4, 5].map(i => svgPhumb(spec, i)).join('')}</div></div></section>`);

  S.push(`<section style="padding-top:0"><div class="wrap"><div class="stats">
  ${T.stats.map(([n, l]) => `<div class="card"><b>${n}</b><br><span>${l}</span></div>`).join('\n  ')}
</div></div></section>`);

  if (secs.has('team')) S.push(`<section><div class="wrap"><div class="sec-head"><span>پشت صحنه</span><h2>تیم ما</h2></div><div class="team">
  ${[['م', 'مریم احمدی', 'مدیرعامل'], ['ر', 'رضا کریمی', 'مدیر فنی'], ['ز', 'زهرا موسوی', 'مدیر محصول'], ['ع', 'علی نادری', 'طراح ارشد']].map(([a, n, r]) => `<div class="card"><div class="av">${a}</div><b>${n}</b><p class="pr" style="font-size:.8rem;color:var(--mut)">${r}</p></div>`).join('\n  ')}
</div></div></section>`);

  if (secs.has('testimonials')) S.push(`<section><div class="wrap"><div class="sec-head"><span>اعتماد شما</span><h2>نظرات مشتریان</h2></div><div class="g3">
  <div class="quote"><p>«تجربه همکاری فوق‌العاده بود؛ دقیق، سریع و حرفه‌ای. قطعاً باز هم برمی‌گردیم.»</p><div class="who"><i>س</i><b>سارا محمدی</b></div></div>
  <div class="quote"><p>«کیفیت خدمات از انتظارمان هم بالاتر بود. پیشنهاد بی‌قید و شرط!»</p><div class="who"><i>ا</i><b>امیر رضایی</b></div></div>
  <div class="quote"><p>«از اولین تماس تا تحویل، همه‌چیز شفاف و قابل اعتماد پیش رفت.»</p><div class="who"><i>ن</i><b>نگار کریمی</b></div></div>
</div></div></section>`);

  if (secs.has('faq')) S.push(`<section><div class="wrap"><div class="sec-head"><span>پرسش‌های شما</span><h2>سوالات متداول</h2></div><div class="faq">
  <details open><summary>چطور شروع کنم؟</summary><p>کافیست از صفحه تماس درخواست دهید؛ کمتر از ۲۴ ساعت پاسخ می‌گیرید.</p></details>
  <details><summary>هزینه‌ها چطور محاسبه می‌شود؟</summary><p>بر اساس حجم دقیق نیاز شما؛ برآورد شفاف قبل از شروع ارائه می‌شود.</p></details>
  <details><summary>پشتیبانی دارید؟</summary><p>بله؛ پشتیبانی ما در تمام روزهای هفته پاسخگوی شماست.</p></details>
</div></div></section>`);

  S.push(`<section><div class="wrap"><div class="cta-band"><h2 style="margin-bottom:10px">آماده شروع هستید؟</h2><p style="color:var(--mut);margin-bottom:18px">همین حالا درخواست خود را ثبت کنید.</p><a class="btn" href="contact.html">ارتباط با ما</a></div></div></section>`);

  const home = shell(spec, S.join('\n'), { inline: styleInline, depth });

  const aboutBody = `<section><div class="wrap"><div class="sec-head"><span>درباره ما</span><h2>داستان ${esc(spec.brand)}</h2></div>
  <p style="max-width:42rem;margin:0 auto 18px;color:var(--mut)">${esc(spec.brand)} با هدف ارائه بهترین خدمات در حوزه «${esc(T.label)}» فعالیت خود را آغاز کرده و با تکیه بر تیمی متخصص و خلاق، همراه مطمئن شماست. اعتماد شما، سرمایه ماست.</p>
</div></section>
<section style="padding-top:0"><div class="wrap"><div class="stats">${T.stats.map(([n, l]) => `<div class="card"><b>${n}</b><br><span>${l}</span></div>`).join('')}</div></div></section>
${secs.has('testimonials') ? `<section><div class="wrap"><div class="sec-head"><span>اعتماد شما</span><h2>نظرات مشتریان</h2></div><div class="g3"><div class="quote"><p>«فوق‌العاده بود؛ دقیق و حرفه‌ای.»</p><div class="who"><i>س</i><b>سارا محمدی</b></div></div><div class="quote"><p>«از انتخابم هیچوقت پشیمان نشدم.»</p><div class="who"><i>ر</i><b>رضا کریمی</b></div></div><div class="quote"><p>«کیفیت و تعهد، امضای این مجموعه‌ست.»</p><div class="who"><i>ز</i><b>زهرا موسوی</b></div></div></div></div></section>` : ''}`;

  const hoursHtml = secs.has('hours') ? `<div class="hours" style="margin-top:34px">
  <div><span>شنبه تا چهارشنبه</span><b>۹ تا ۲۱</b></div><div><span>پنجشنبه</span><b>۹ تا ۲۲</b></div><div><span>جمعه</span><b>۱۲ تا ۲۱</b></div></div>` : '';

  const contactBody = `<section><div class="wrap"><div class="sec-head"><span>تماس</span><h2>پیام خود را ارسال کنید</h2></div>
  <form class="cnt" action="#">
    <input class="inp" required placeholder="نام و نام خانوادگی">
    <input class="inp" type="email" required placeholder="ایمیل">
    <input class="inp" placeholder="موضوع (اختیاری)">
    <textarea class="inp" rows="5" required placeholder="متن پیام…"></textarea>
    <button class="btn" type="submit">ارسال پیام</button>
  </form>
  ${hoursHtml}
</div></section>`;

  return { home, about: shell(spec, aboutBody, { inline: styleInline, titleSuffix: 'درباره ما', depth }), contact: shell(spec, contactBody, { inline: styleInline, titleSuffix: 'تماس با ما', depth }), style: cssGen(spec) };
}

// ─── بسته ZIP با واریانت فریمورک ───
export function generateSpecZip(spec, framework) {
  const g = generateFromSpec(spec, { styleInline: false });
  const b = esc(spec.brand);
  const [c1, c2] = spec.palette;
  const fwLabels = { html: 'HTML/CSS خالص', tailwind: 'Tailwind CSS', bootstrap: 'Bootstrap 5', react: 'React', vue: 'Vue 3' };

  const readme = `# ${b} — قالب ${TYPES[spec.type].label}

تولیدشده توسط قالب‌ساز هوشمند اپ‌تم (apptheme.ir)

## پرامپت کاربر
> ${spec.prompt}

## مشخصات تشخیص‌داده‌شده
- نوع سایت: ${TYPES[spec.type].label}
- سبک طراحی: ${MODE_LABELS[spec.mode] || spec.mode} (یکی از ۸ سبک: نئون/گلاس/مینیمال/بروتال/لوکس/سایبر/اورورا/ادیتوریال)
- فریمورک اصلی: ${fwLabels[framework] || framework}
- تم: ${spec.dark ? 'تیره' : 'روشن'} | پالت: ${spec.palette.join(' / ')}
- بخش‌ها: ${['منو/آیتم‌ها', ...spec.sections].join('، ')}

## محتوا
- index.html / about.html / contact.html — صفحات کامل (HTML خالص + css/style.css)
- starter/tailwind.html — نسخه شروع با Tailwind (بدون CDN — آفلاین)
- starter/bootstrap.html — نسخه شروع با Bootstrap 5 راست‌چین (بدون CDN — آفلاین)
- starter/react.html — نسخه شروع با React (بدون CDN — آفلاین)
- starter/vue.html — نسخه شروع با Vue 3 (بدون CDN — آفلاین)

## شخصی‌سازی
رنگ‌ها: سه متغیر --c1 و --c2 و --ac در ابتدای css/style.css
بدون هیچ تصویر رستری — همه عناصر بصری SVG/CSS (حجم کل زیر ۳۰KB)`;

  const tw = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — Tailwind</title><style>/* بدون CDN — کاملاً آفلاین */body{font-family:Vazirmatn,Tahoma,sans-serif;margin:0;background:#f8fafc;color:#1e293b;direction:rtl}.max-w-3xl{max-width:48rem;margin-inline:auto}.px-6{padding-inline:1.5rem;padding-block:0}.py-24{padding-block:6rem}.text-center{text-align:center}.text-4xl{font-size:2.2rem;line-height:1.4;padding-inline:0}.font-extrabold{font-weight:800}.mb-4{margin-bottom:1rem}.mb-8{margin-bottom:2rem}.text-slate-500{color:#64748b}.rounded-xl{border-radius:.75rem}.py-3{padding-block:.75rem}.text-white{color:#fff}.text-brand{color:${c1}}.bg-brand{background:${c1}}@media(max-width:640px){.py-24{padding-block:3.5rem}.text-4xl{font-size:1.7rem}}</style></head>
<body class="bg-slate-50 text-slate-800 font-sans">
<div class="max-w-3xl mx-auto px-6 py-24 text-center">
<h1 class="text-4xl font-extrabold mb-4">${b} <span class="text-brand">نسخه Tailwind</span></h1>
<p class="text-slate-500 mb-8">رنگ برند شما ثبت شده است؛ کلاس‌های brand و brand-light را استفاده کنید.</p>
<a class="rounded-xl bg-brand px-6 py-3 text-white" href="https://tailwindcss.com/docs">مستندات Tailwind</a></div></body></html>`;

  const bs = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — Bootstrap</title><style>/* بدون CDN — کاملاً آفلاین */:root{--bs-primary:${c1}}body{font-family:Vazirmatn,Tahoma,sans-serif;margin:0;color:#212529}.container{max-width:1140px;margin-inline:auto;padding-inline:12px}.py-5{padding-block:3rem}.text-center{text-align:center}.fw-bold{font-weight:700}.mb-3{margin-bottom:1rem}.text-muted{color:#6c757d}.btn{display:inline-block;padding:.75rem 1.5rem;border-radius:.5rem;border:0;font-size:1.25rem;color:#fff;background:${c1};text-decoration:none}.btn-primary{background:${c1}}@media(max-width:576px){.btn{display:block;text-align:center}.py-5{padding-block:2rem}}</style></head>
<body><div class="container py-5 text-center"><h1 class="fw-bold mb-3">${b} — نسخه Bootstrap 5</h1><p class="text-muted">راست‌چین از CDN + رنگ برند ثبت‌شده.</p><a class="btn btn-primary btn-lg" href="https://getbootstrap.com/docs/5.3/">مستندات Bootstrap</a></div></body></html>`;

  const rc = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — React</title><!-- بدون CDN: این استارتر کاملاً آفلاین اجرا میشود؛ برای React واقعی، فریم‌ورک را جدا نصب کن --><style>body{font-family:Vazirmatn,Tahoma;background:#f7f8fc}.hero{min-height:100vh;display:grid;place-content:center;text-align:center;background:linear-gradient(135deg,${c1}14,${c2}12)}.btn{padding:12px 28px;border-radius:12px;border:0;background:linear-gradient(135deg,${c1},${c2});color:#fff;font-size:1rem;cursor:pointer}</style></head>
<body><div id="root"></div>
<script>
let n = 0;
function render(){
  document.getElementById('root').innerHTML = '<div class="hero"><h1>${b} — نسخه React 18</h1><p>شروع‌کننده آماده با رنگ برند شما</p><button class="btn" onclick="n++;render()">کلیک شد: ' + n.toLocaleString('fa-IR') + '</button></div>';
}
render();
</script></body></html>`;

  const vu = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — Vue 3</title><!-- بدون CDN: این استارتر کاملاً آفلاین اجرا میشود؛ برای Vue واقعی، فریم‌ورک را جدا نصب کن --><style>body{font-family:Vazirmatn,Tahoma;background:#f7f8fc}.hero{min-height:100vh;display:grid;place-content:center;text-align:center;background:linear-gradient(135deg,${c1}14,${c2}12)}.btn{padding:12px 28px;border-radius:12px;border:0;background:linear-gradient(135deg,${c1},${c2});color:#fff;cursor:pointer}</style></head>
<body><div id="app" class="hero"><h1>${b} — نسخه Vue 3</h1><p>{{ msg }}</p><button class="btn" @click="n++">کلیک شد: {{ fa(n) }}</button></div>
<script>
let n = 0;
function render(){
  document.getElementById('app').innerHTML = '<h1>${b} — نسخه Vue 3</h1><p>شروع‌کننده آماده با رنگ برند شما</p><button class="btn" onclick="n++;render()">کلیک شد: ' + n.toLocaleString('fa-IR') + '</button>';
}
render();
</script>
</body></html>`;

  return [
    { name: 'README.md', data: readme },
    { name: 'css/style.css', data: g.style },
    { name: 'index.html', data: g.home },
    { name: 'about.html', data: g.about },
    { name: 'contact.html', data: g.contact },
    { name: 'starter/tailwind.html', data: tw },
    { name: 'starter/bootstrap.html', data: bs },
    { name: 'starter/react.html', data: rc },
    { name: 'starter/vue.html', data: vu },
  ];
}

export const SPEC_TYPE_LABELS = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, v.label]));
