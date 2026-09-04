// ═══ قالب‌ساز هوشمند: تحلیل پرامپت فارسی → مشخصات قالب → تولید سایت ═══
// بدون هوش مصنوعی خارجی، بدون eval — تحلیل واژگانی قطعی + قالب‌های متنی امن
import { esc } from './util.js';
import { makeZip } from './zip.js';

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

  return { type, brand: brand.slice(0, 28), paletteKey, palette: PALETTES[paletteKey] || PALETTES.purple, dark, sections, prompt: text.slice(0, 500) };
}

// ─── CSS بر اساس پالت و تم ───
function cssGen(spec) {
  const [c1, c2, ac] = spec.palette;
  const dark = spec.dark;
  const bg = dark ? '#0e1118' : '#f7f8fc', card = dark ? '#161b27' : '#ffffff';
  const ink = dark ? '#e9ecf5' : '#1c2333', mut = dark ? '#98a2bd' : '#66708c';
  const bord = dark ? '#252b3c' : '#e7eaf4', nav = dark ? 'rgba(14,17,24,.86)' : 'rgba(255,255,255,.86)';
  const hv = [...(spec.brand + spec.type)].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5) % 4;
  const RAD = [10, 18, 26, 14][hv];
  const H1 = [2.3, 2.7, 2.0, 3.0][hv];
  const variantCss = `:root{--rad:${RAD}px}
.hero h1{font-size:${H1}rem}
.btn{border-radius:${[10, 999, 6, 16][hv]}px}
${hv === 1 ? '.sec-head{text-align:start}' : ''}
${hv === 2 ? '.g3 .card{border-top:4px solid var(--c1)}' : ''}
${hv === 3 ? 'body{background-image:radial-gradient(color-mix(in srgb,var(--c1) 7%,transparent) 1.4px,transparent 1.4px);background-size:24px 24px}' : ''}`;
  const baseCss = `:root{--c1:${c1};--c2:${c2};--ac:${ac};--ink:${ink};--mut:${mut};--bg:${bg};--card:${card};--bord:${bord};--nav:${nav}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Vazirmatn,Tahoma,sans-serif;background:var(--bg);color:var(--ink);line-height:1.9;direction:rtl}
a{color:inherit;text-decoration:none}
.wrap{max-width:1100px;margin:auto;padding:0 20px}
header{position:sticky;top:0;z-index:9;background:var(--nav);backdrop-filter:blur(10px);border-bottom:1px solid var(--bord)}
.nav{display:flex;align-items:center;gap:24px;height:64px;flex-wrap:wrap}
.brand{display:flex;gap:9px;align-items:center;font-weight:700}
.brand i{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;display:grid;place-items:center;font-style:normal}
nav.links{display:flex;gap:2px;flex-wrap:wrap}
nav.links a{padding:7px 12px;border-radius:9px;color:var(--mut);font-size:.9rem}
nav.links a:hover{color:var(--ink);background:color-mix(in srgb,var(--c1) 10%,transparent)}
.btn{display:inline-block;padding:11px 24px;border-radius:12px;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;font-weight:500;border:0;cursor:pointer}
.btn.o{background:none;border:1.5px solid var(--bord);color:var(--ink)}
.hero{position:relative;overflow:hidden;padding:84px 0 70px;background:radial-gradient(700px 320px at 85% -10%,color-mix(in srgb,var(--c1) 16%,transparent),transparent),radial-gradient(600px 300px at 10% 110%,color-mix(in srgb,var(--c2) 14%,transparent),transparent)}
.hero h1{font-size:2.2rem;line-height:1.6;max-width:30rem}
.hero p{color:var(--mut);max-width:32rem;margin:14px 0 26px}
.row{display:flex;gap:12px;flex-wrap:wrap}
section{padding:60px 0}
.sec-head{text-align:center;margin-bottom:36px}
.sec-head span{color:var(--c1);font-size:.85rem;font-weight:700}
.sec-head h2{font-size:1.55rem;margin-top:4px}
.g3{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--bord);border-radius:16px;padding:24px 20px;transition:.25s}
.card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,${dark ? '.4' : '.08'})}
.card .ic{width:50px;height:50px;border-radius:13px;background:color-mix(in srgb,var(--c1) 13%,transparent);display:grid;place-items:center;font-size:1.35rem;margin-bottom:13px}
.card h3{font-size:1rem;margin-bottom:7px}
.card p{color:var(--mut);font-size:.87rem}
.item{display:flex;justify-content:space-between;gap:14px;align-items:center}
.item .pr{font-weight:700;color:var(--c1);white-space:nowrap}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;text-align:center}
.stats .card{padding:20px 12px}
.stats b{font-size:1.7rem;background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;background-clip:text;color:transparent}
.stats span{color:var(--mut);font-size:.85rem}
.quote{background:var(--card);border:1px solid var(--bord);border-radius:16px;padding:24px}
.quote p{color:var(--mut);font-size:.9rem}
.who{display:flex;gap:10px;align-items:center;margin-top:14px}
.who i{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700}
form.cnt{display:grid;gap:13px;max-width:540px;margin:auto}
.inp{padding:12px 15px;border:1.5px solid var(--bord);border-radius:12px;background:var(--card);color:var(--ink);font-family:inherit}
.inp:focus{outline:none;border-color:var(--c1)}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.gal .ph{aspect-ratio:4/3;border-radius:14px;border:1px solid var(--bord)}
.hours{display:grid;gap:8px;max-width:420px;margin:auto;font-size:.92rem}
.hours div{display:flex;justify-content:space-between;padding:9px 14px;background:var(--card);border:1px solid var(--bord);border-radius:11px}
.faq{max-width:640px;margin:auto;display:grid;gap:10px}
.faq details{background:var(--card);border:1px solid var(--bord);border-radius:13px;padding:15px 18px}
.faq summary{cursor:pointer;font-weight:500}
.faq p{color:var(--mut);font-size:.9rem;margin-top:9px}
.team{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px;text-align:center}
.team .av{width:74px;height:74px;border-radius:50%;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;display:grid;place-items:center;font-size:1.5rem;font-weight:700;margin:0 auto 10px}
footer{background:${dark ? '#0a0d14' : '#141a2e'};color:#aeb6d3;padding:40px 0 24px;margin-top:40px}
footer .cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:24px;padding-bottom:22px}
footer h4{color:#fff;margin-bottom:11px;font-size:.95rem}
footer li{margin-bottom:8px;font-size:.87rem}
.copy{border-top:1px solid #232b47;text-align:center;padding-top:16px;font-size:.78rem}
.cta-band{background:linear-gradient(135deg,color-mix(in srgb,var(--c1) 14%,var(--card)),color-mix(in srgb,var(--c2) 12%,var(--card)));border:1px solid var(--bord);border-radius:18px;padding:40px 22px;text-align:center}
@media(max-width:760px){nav.links{display:none}.hero h1{font-size:1.55rem}footer .cols{grid-template-columns:1fr}}`;
  return baseCss + variantCss;
}

// ─── ساخت صفحات ───
function shell(spec, body, { inline, titleSuffix } = {}) {
  const b = esc(spec.brand);
  const T = TYPES[spec.type];
  const css = cssGen(spec);
  const [h1] = T.hero(spec.brand);
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

export function generateFromSpec(spec, { styleInline = true } = {}) {
  const T = TYPES[spec.type];
  const [h1, h2] = T.hero(spec.brand);
  const secs = new Set(spec.sections);
  const S = [];

  S.push(`<section class="hero"><div class="wrap"><h1>${h1}</h1><p>${h2}</p>
  <div class="row"><a class="btn" href="contact.html">${spec.type === 'restaurant' ? 'رزرو میز' : spec.type === 'shop' ? 'شروع خرید' : 'درخواست مشاوره'}</a><a class="btn o" href="about.html">بیشتر بدانید</a></div>
</div></section>`);

  S.push(`<section><div class="wrap"><div class="sec-head"><span>چرا ما؟</span><h2>خدمات و مزیت‌ها</h2></div><div class="g3">
  ${T.services.map(([ic, t, d]) => `<div class="card"><div class="ic">${ic}</div><h3>${t}</h3><p>${d}</p></div>`).join('\n  ')}
</div></div></section>`);

  S.push(`<section id="items"><div class="wrap"><div class="sec-head"><span>${esc(T.label)}</span><h2>${esc(T.itemsTitle)}</h2></div><div class="g3">
  ${T.items.map(([n, d, p]) => `<div class="card item"><div><h3 style="font-size:.95rem">${n}</h3><p>${d}</p></div><span class="pr">${p}</span></div>`).join('\n  ')}
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

  const home = shell(spec, S.join('\n'), { inline: styleInline });

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

  return { home, about: shell(spec, aboutBody, { inline: styleInline, titleSuffix: 'درباره ما' }), contact: shell(spec, contactBody, { inline: styleInline, titleSuffix: 'تماس با ما' }), style: cssGen(spec) };
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
- فریمورک اصلی: ${fwLabels[framework] || framework}
- تم: ${spec.dark ? 'تیره' : 'روشن'} | پالت: ${spec.palette.join(' / ')}
- بخش‌ها: ${['منو/آیتم‌ها', ...spec.sections].join('، ')}

## محتوا
- index.html / about.html / contact.html — صفحات کامل (HTML خالص + css/style.css)
- starter/tailwind.html — نسخه شروع با Tailwind (CDN + رنگ برند ثبت‌شده)
- starter/bootstrap.html — نسخه شروع با Bootstrap 5 راست‌چین
- starter/react.html — نسخه شروع با React (CDN)
- starter/vue.html — نسخه شروع با Vue 3 (CDN)

## شخصی‌سازی
رنگ‌ها: سه متغیر --c1 و --c2 و --ac در ابتدای css/style.css
بدون هیچ تصویر رستری — همه عناصر بصری SVG/CSS (حجم کل زیر ۳۰KB)`;

  const tw = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — Tailwind</title><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={theme:{extend:{colors:{brand:{DEFAULT:'${c1}',light:'${c2}'}},fontFamily:{sans:['Vazirmatn','Tahoma','sans-serif']}}}}</script></head>
<body class="bg-slate-50 text-slate-800 font-sans">
<div class="max-w-3xl mx-auto px-6 py-24 text-center">
<h1 class="text-4xl font-extrabold mb-4">${b} <span class="text-brand">نسخه Tailwind</span></h1>
<p class="text-slate-500 mb-8">رنگ برند شما ثبت شده است؛ کلاس‌های brand و brand-light را استفاده کنید.</p>
<a class="rounded-xl bg-brand px-6 py-3 text-white" href="https://tailwindcss.com/docs">مستندات Tailwind</a></div></body></html>`;

  const bs = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — Bootstrap</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet"><style>:root{--bs-primary:${c1}}.btn-primary{--bs-btn-bg:${c1};--bs-btn-border-color:${c1};--bs-btn-hover-bg:${c2}}</style></head>
<body><div class="container py-5 text-center"><h1 class="fw-bold mb-3">${b} — نسخه Bootstrap 5</h1><p class="text-muted">راست‌چین از CDN + رنگ برند ثبت‌شده.</p><a class="btn btn-primary btn-lg" href="https://getbootstrap.com/docs/5.3/">مستندات Bootstrap</a></div></body></html>`;

  const rc = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — React</title><script src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><style>body{font-family:Vazirmatn,Tahoma;background:#f7f8fc}.hero{min-height:100vh;display:grid;place-content:center;text-align:center;background:linear-gradient(135deg,${c1}14,${c2}12)}.btn{padding:12px 28px;border-radius:12px;border:0;background:linear-gradient(135deg,${c1},${c2});color:#fff;font-size:1rem;cursor:pointer}</style></head>
<body><div id="root"></div>
<script type="text/babel">
function App(){const[n,setN]=React.useState(0);return(<div className="hero"><h1>${b} — نسخه React 18</h1><p>شروع‌کننده آماده با رنگ برند شما</p><button className="btn" onClick={()=>setN(n+1)}>کلیک شد: {n.toLocaleString('fa-IR')}</button></div>}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
</script></body></html>`;

  const vu = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${b} — Vue 3</title><script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script><style>body{font-family:Vazirmatn,Tahoma;background:#f7f8fc}.hero{min-height:100vh;display:grid;place-content:center;text-align:center;background:linear-gradient(135deg,${c1}14,${c2}12)}.btn{padding:12px 28px;border-radius:12px;border:0;background:linear-gradient(135deg,${c1},${c2});color:#fff;cursor:pointer}</style></head>
<body><div id="app" class="hero"><h1>${b} — نسخه Vue 3</h1><p>{{ msg }}</p><button class="btn" @click="n++">کلیک شد: {{ fa(n) }}</button></div>
<script>const{createApp,ref}=Vue;createApp({setup(){const msg=ref('شروع‌کننده آماده با رنگ برند شما');const n=ref(0);const fa=x=>x.toLocaleString('fa-IR');return{msg,n,fa}}}).mount('#app')</script>
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
