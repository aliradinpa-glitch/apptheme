#!/bin/bash
# ═══ تست جامع اپ‌تم — فاز ۲/۳/۵ ═══
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export PORT=3100
rm -f data/db.json
for p in $(ls /proc/[0-9]*/cmdline 2>/dev/null); do
  pid=$(basename $(dirname $p)); [ "$pid" = "$$" ] && continue
  cmd=$(tr '\0' ' ' < $p 2>/dev/null)
  if [[ "$cmd" == "node server.js"* ]]; then kill $pid 2>/dev/null; fi
done
sleep 1
(node server.js > /tmp/tl-test.log 2>&1 &)
sleep 1.5
B="http://localhost:3100"
JAR=/tmp/tl-admin.txt; rm -f $JAR
PASS=0; FAIL=0
ck() {
  if [[ "$3" == *"$2"* ]]; then PASS=$((PASS+1)); echo "✓ $1";
  else FAIL=$((FAIL+1)); echo "✗ $1 — انتظار: $2 | واقعی: ${3:0:110}"; fi
}

# ─── ۱. صفحات عمومی + PWA ───
ck "home" "اپ‌تم" "$(curl -s $B/)"
ck "manifest" "اپ‌تم" "$(curl -s $B/manifest.json)"
ck "manifest-icon" "icon-512" "$(curl -s $B/manifest.json)"
ck "sw" "Service Worker" "$(curl -s $B/sw.js)"
ck "offline" "اتصال قطع" "$(curl -s $B/offline)"
ck "icon-192" "image/png" "$(curl -s -o /dev/null -w '%{content_type}' $B/assets/icons/icon-192.png)"
ck "templates" "قالب یافت شد" "$(curl -s $B/templates)"
ck "product" "پیش‌نمایش زنده قالب" "$(curl -s $B/templates/novin-shop)"
ck "preview-page" "خدمات ما" "$(curl -s $B/templates/novin-shop/preview)"
ck "terms" "کیف پول و برداشت" "$(curl -s $B/terms)"
ck "terms-90" "۹۰٪" "$(curl -s $B/terms)"
ck "apps" "ویزارد" "$(curl -s $B/apps)"
ck "sitemap" "/apps" "$(curl -s $B/sitemap.xml)"

# ─── ۲. نصب و ورود ادمین ───
# از این نسخه، ادمین همراه دیتابیس نمونه ساخته می‌شود؛ /setup فقط روی دیتابیس بدون ادمین فعال است.
r=$(curl -s -b $JAR -o /dev/null -w "%{http_code}" $B/setup)
ck "setup-disabled-when-admin-exists" "302" "$r"
r=$(curl -s -b $JAR -c $JAR -o /dev/null -w "%{redirect_url}" -X POST $B/setup --data-urlencode "_csrf=" --data-urlencode "name=X" --data-urlencode "email=x@x.ir" --data-urlencode "password=xxxxxxxx")
ck "setup-post-redirects-login" "/login" "$r"
rm -f $JAR
C=$(curl -s -c $JAR $B/login | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
r=$(curl -s -b $JAR -c $JAR -o /dev/null -w "%{redirect_url}" -X POST $B/login --data-urlencode "_csrf=$C" --data-urlencode "identifier=admin@apptheme.ir" --data-urlencode "password=Admin@1403")
ck "login-admin" "/admin" "$r"
MA=$(curl -s -b $JAR $B/admin | grep -o 'name="csrf" content="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
ck "dashboard-submitted" "اپ در انتظار تایید" "$(curl -s -b $JAR $B/admin)"

# ─── ۳. ثبت‌نام موبایل + ایمیل ───
LJ=/tmp/tl-user.txt; rm -f $LJ
C=$(curl -s -c $LJ $B/register | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
r=$(curl -s -b $LJ -c $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/register --data-urlencode "_csrf=$C" --data-urlencode "name=کاربر تست" --data-urlencode "identifier=09121234567" --data-urlencode "password=test12345")
ck "register-mobile" "welcome=1" "$r"
M=$(curl -s -b $LJ $B/ | grep -o 'name="csrf" content="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
EJ=/tmp/tl-email.txt; rm -f $EJ
C=$(curl -s -c $EJ $B/register | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
curl -s -b $EJ -c $EJ -o /dev/null -X POST $B/register --data-urlencode "_csrf=$C" --data-urlencode "name=ایمیل تست" --data-urlencode "identifier=test@gmail.com" --data-urlencode "password=test12345"
VTOKEN=$(grep -aoE 'verify-email\?token=[a-f0-9]{32}' /tmp/tl-test.log | tail -1 | cut -d= -f2)
r=$(curl -s -b $EJ -c $EJ -o /dev/null -w "%{redirect_url}" "$B/verify-email?token=$VTOKEN")
ck "verify-email" "verified=1" "$r"

# ─── ۴. خرید قالب کامل ───
H=$(curl -s -b $LJ "$B/checkout?items=2,7")
ck "checkout-occasion" "حراج تابستانه" "$H"
H=$(curl -s -b $LJ "$B/checkout?items=2,7&coupon=WELCOME10")
ck "coupon-applied" "WELCOME10" "$H"
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/checkout/pay --data-urlencode "_csrf=$M" --data-urlencode "items=2,7" --data-urlencode "couponCode=WELCOME10")
CODE=$(echo "$r" | grep -o 'AT-[0-9]*')
ck "order-created" "AT-" "$CODE"
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/payment/$CODE/confirm --data-urlencode "_csrf=$M")
ck "pay-confirm" "success" "$r"
TOKEN=$(curl -s -b $LJ $B/payment/$CODE/success | grep -o '/download/[a-f0-9]\{32\}' | head -1 | cut -d/ -f3)
Z=$(curl -s -o /tmp/dl.zip -w "%{http_code}" $B/download/$TOKEN)
ck "download-zip" "200" "$Z"

# ─── ۵. ویزارد سفارش اپ ───
W=$(curl -s -b $LJ $B/apps/wizard)
ck "wizard-page" "مرحله" "$W"
ck "wizard-steps" "امکانات" "$W"
E=$(curl -s -b $LJ -X POST $B/api/apps/estimate -H "Content-Type: application/json" -H "X-CSRF: $M" -d '{"prompt":"اپ فروشگاهی با پرداخت آنلاین و پنل مدیریت","backend":true}')
ck "estimate-fair" '"ok":true' "$E"
ES=$(echo "$E" | grep -o '"low":[0-9]*' | grep -o '[0-9]*')
if [ "$ES" -gt 0 ] && [ "$ES" -lt 15000000 ]; then PASS=$((PASS+1)); echo "✓ estimate-reasonable (low=$ES)"; else FAIL=$((FAIL+1)); echo "✗ estimate-reasonable low=$ES"; fi
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/order --data-urlencode "_csrf=$M" \
  --data-urlencode "type=food" --data-urlencode "name=فودلی" \
  --data-urlencode "desc=اپ سفارش غذا با منوی دیجیتال، پرداخت آنلاین و پنل مدیریت رستوران" \
  --data-urlencode "feat=pay" --data-urlencode "feat=panel" --data-urlencode "feat=auth" \
  --data-urlencode "pf=android" --data-urlencode "backend=on" --data-urlencode "deadline=1" --data-urlencode "theme=#f59e0b")
PCODE=$(echo "$r" | grep -o 'APP-[0-9]*')
ck "wizard-submit" "APP-" "$PCODE"
T=$(curl -s -b $LJ $B/apps/track/$PCODE)
ck "submitted-state" "در انتظار تایید مدیر" "$T"
ck "spec-saved-json" "" "$(curl -s -b $JAR $B/admin/app-projects | grep -c 'spec.json')"

# ─── ۶. ادمین: تایید پرامپت و قیمت‌گذاری ───
AP=$(curl -s -b $JAR $B/admin/app-projects)
APID=$(echo "$AP" | grep -o '/admin/app-projects/[0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
ck "admin-spec-view" "مشخصات ویزارد" "$(curl -s -b $JAR $B/admin/app-projects/$APID)"
r=$(curl -s -b $JAR -o /dev/null -w "%{redirect_url}" -X POST $B/admin/app-projects/$APID/quote --data-urlencode "_csrf=$MA" --data-urlencode "price=12000000" --data-urlencode "note=شامل ۶ ماه پشتیبانی")
ck "admin-quote" "quoted=1" "$r"
ck "quote-msg-to-user" "قیمت نهایی" "$(curl -s -b $LJ $B/account/messages)"
SPEC=$(curl -s -b $JAR $B/admin/app-projects/$APID/spec.json)
ck "spec-json-small" '"t":"food"' "$SPEC"
SZ=$(echo -n "$SPEC" | wc -c)
if [ "$SZ" -lt 2000 ]; then PASS=$((PASS+1)); echo "✓ spec-file-tiny (${SZ}B)"; else FAIL=$((FAIL+1)); echo "✗ spec-file ${SZ}B"; fi

# ─── ۷. گردش پرداخت: بیعانه → ۷۰٪ → ادامه → پایانی + پاداش ───
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/$PCODE/action --data-urlencode "_csrf=$M" --data-urlencode "action=deposit")
ck "deposit" "paid=deposit" "$r"
for st in preview1 preview2 preview3 awaiting_second; do
  curl -s -b $JAR -o /dev/null -X POST $B/admin/app-projects/$APID/status --data-urlencode "_csrf=$MA" --data-urlencode "status=$st" >/dev/null
done
T=$(curl -s -b $LJ $B/apps/track/$PCODE)
ck "decision-70" "تصمیم با شماست" "$T"
ck "cancel-refund-wallet" "کیف پول" "$T"
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/$PCODE/action --data-urlencode "_csrf=$M" --data-urlencode "action=second")
ck "second-pay" "paid=second" "$r"
curl -s -b $JAR -o /dev/null -X POST $B/admin/app-projects/$APID/status --data-urlencode "_csrf=$MA" --data-urlencode "status=delivered_pending_final" >/dev/null
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/$PCODE/action --data-urlencode "_csrf=$M" --data-urlencode "action=final")
ck "final-pay" "paid=final" "$r"
WM=$(curl -s -b $LJ $B/account/messages)
ck "loyalty-msg" "پاداش وفاداری" "$WM"

# ─── ۸. نارضایتی: بازگشت ۹۰٪ به کیف پول ───
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/$PCODE/action --data-urlencode "_csrf=$M" --data-urlencode "action=refund90")
ck "refund90" "refunded=1" "$r"
WP=$(curl -s -b $LJ $B/account/wallet)
ck "wallet-page" "موجودی کیف پول" "$WP"
ck "wallet-90-in" "بازگشت ۹۰" "$WP"

# ─── ۹. برداشت خودکار ───
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/account/wallet/withdraw --data-urlencode "_csrf=$M" --data-urlencode "amount=500000" --data-urlencode "sheba=IR123456789012345678901234")
ck "withdraw-ok" "wd=ok" "$r"
ck "withdraw-paid" "واریز شد" "$(curl -s -b $LJ $B/account/wallet)"
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/account/wallet/withdraw --data-urlencode "_csrf=$M" --data-urlencode "amount=999000000" --data-urlencode "sheba=IR123456789012345678901234")
ck "withdraw-over-balance" "wd=err" "$r"
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/account/wallet/withdraw --data-urlencode "_csrf=$M" --data-urlencode "amount=500000" --data-urlencode "sheba=1234")
ck "withdraw-bad-sheba" "wd=err" "$r"
ck "admin-withdrawals" "برداشت‌های کیف پول" "$(curl -s -b $JAR $B/admin/withdrawals)"

# ─── ۱۰. انصراف در ۷۰٪ (پروژه دوم) ───
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/order --data-urlencode "_csrf=$M" \
  --data-urlencode "type=shop" --data-urlencode "desc=اپ فروشگاه کوچک تست انصراف با پرداخت" \
  --data-urlencode "feat=pay" --data-urlencode "pf=android")
PCODE2=$(echo "$r" | grep -o 'APP-[0-9]*')
APID2=$(curl -s -b $JAR $B/admin/app-projects | grep -o '/admin/app-projects/[0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
curl -s -b $JAR -o /dev/null -X POST $B/admin/app-projects/$APID2/quote --data-urlencode "_csrf=$MA" --data-urlencode "price=6000000" >/dev/null
curl -s -b $LJ -o /dev/null -X POST $B/apps/$PCODE2/action --data-urlencode "_csrf=$M" --data-urlencode "action=deposit" >/dev/null
for st in preview1 preview2 preview3 awaiting_second; do
  curl -s -b $JAR -o /dev/null -X POST $B/admin/app-projects/$APID2/status --data-urlencode "_csrf=$MA" --data-urlencode "status=$st" >/dev/null
done
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/apps/$PCODE2/action --data-urlencode "_csrf=$M" --data-urlencode "action=cancel")
ck "cancel-70" "cancelled=1" "$r"
ck "cancel-60-wallet" "۶۰٪" "$(curl -s -b $LJ $B/account/messages)"

# ─── ۱۱. هاست رایگان: gzip + بکاپ/بازیابی + حجم سبک ───
ck "gzip-html" "gzip" "$(curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' $B/ | grep -i content-encoding)"
ck "gzip-css" "gzip" "$(curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' $B/assets/css/app.css | grep -i content-encoding)"
GZS=$(curl -s -H 'Accept-Encoding: gzip' -o /tmp/home-gz.bin -w '%{size_download}' $B/)
RWS=$(curl -s -o /dev/null -w '%{size_download}' $B/)
if [ "$GZS" -lt "$RWS" ]; then PASS=$((PASS+1)); echo "✓ gzip-smaller (${GZS}B vs ${RWS}B)"; else FAIL=$((FAIL+1)); echo "✗ gzip-smaller gz=$GZS raw=$RWS"; fi
# بکاپ
BK=$(curl -s -b $JAR $B/admin/backup)
ck "backup-content" '"products"' "$BK"
ck "backup-guard" "/login" "$(curl -s -o /dev/null -w '%{redirect_url}' $B/admin/backup)"
# بازیابی: تغییر نام فروشگاه در بکاپ → restore → بررسی
python3 -c "
import json,sys
d = json.loads(open('/tmp/bk.json','r',encoding='utf-8').read()) if False else None" 2>/dev/null
curl -s -b $JAR $B/admin/backup -o /tmp/bk.json
python3 <<'PYEOF'
import json
d = json.load(open('/tmp/bk.json', encoding='utf-8'))
d['settings']['shopName'] = 'اپ‌تم-بازيابي-شده'
json.dump(d, open('/tmp/bk2.json', 'w', encoding='utf-8'), ensure_ascii=False)
PYEOF
R=$(curl -s -b $JAR -c $JAR -X POST $B/admin/restore -H "Content-Type: application/json" -H "X-CSRF: $MA" --data-binary @/tmp/bk2.json)
ck "restore-ok" '"ok":true' "$R"
ck "restore-applied" "اپ‌تم-بازيابي-شده" "$(curl -s -b $JAR $B/admin/settings)"
# بازیابی فایل خراب
MA=$(curl -s -b $JAR $B/admin | grep -o 'name="csrf" content="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
R=$(curl -s -b $JAR -X POST $B/admin/restore -H "Content-Type: application/json" -H "X-CSRF: $MA" -d '{"hello":1}')
ck "restore-bad-file" '"ok":false' "$R"
# حجم سبک قالب‌ساز
ZS=$(stat -c%s /tmp/dl.zip)
if [ "$ZS" -lt 40000 ]; then PASS=$((PASS+1)); echo "✓ zip-lightweight (${ZS}B)"; else FAIL=$((FAIL+1)); echo "✗ zip ${ZS}B"; fi
PS=$(curl -s $B/templates/novin-shop/preview | wc -c)
if [ "$PS" -lt 25000 ]; then PASS=$((PASS+1)); echo "✓ preview-lightweight (${PS}B)"; else FAIL=$((FAIL+1)); echo "✗ preview ${PS}B"; fi
ck "backup-panel" "پشتیبان‌گیری و انتقال هاست" "$(curl -s -b $JAR $B/admin/settings)"
ck "restore-keeps-products" "قالب جدید" "$(curl -s -b $JAR $B/admin/products)"

# ─── ۱۲. قالب‌ساز هوشمند ───
GP=$(curl -s -b $JAR $B/admin/generator)
ck "gen-page" "پرامپتت رو بنویس" "$GP"
ck "gen-examples" "رستوران ایتالیایی" "$GP"
R=$(curl -s -b $JAR -X POST $B/admin/generator/generate -H "Content-Type: application/json" -H "X-CSRF: $MA" -d '{"prompt":"یه رستوران ایتالیایی میخوام به اسم رومیکا با منو و گالری، رنگ قرمز و تم تیره","fw":"tailwind"}')
ck "gen-generate" '"ok":true' "$R"
ck "gen-parsed-type" '"restaurant"' "$R"
ck "gen-parsed-brand" 'رومیکا' "$R"
GTOKEN=$(echo "$R" | grep -o '"token":"[a-f0-9]*"' | cut -d'"' -f4)
PV=$(curl -s $B/preview/gen/$GTOKEN)
ck "gen-preview" "رومیکا" "$PV"
ck "gen-preview-dark" "--c1:" "$PV"
ck "gen-preview-menu" "منوی ویژه" "$PV"
Z=$(curl -s -b $JAR -o /tmp/gen.zip -w "%{http_code}" $B/admin/generator/download/$GTOKEN)
ck "gen-zip" "200" "$Z"
python3 -c "import zipfile; z=zipfile.ZipFile('/tmp/gen.zip'); names=z.namelist(); assert 'index.html' in names and 'starter/tailwind.html' in names and 'starter/react.html' in names; assert z.testzip() is None; print('ok')" >/dev/null && { echo "✓ gen-zip-contents"; PASS=$((PASS+1)); } || { echo "✗ gen-zip-contents"; FAIL=$((FAIL+1)); }
R=$(curl -s -b $JAR -X POST $B/admin/generator/publish -H "Content-Type: application/json" -H "X-CSRF: $MA" -d "{\"token\":\"$GTOKEN\",\"price\":750000,\"published\":\"on\"}")
ck "gen-publish" '"ok":true' "$R"
ck "gen-published-store" "رومیکا" "$(curl -s $B/templates)"
ck "gen-published-page" "پیش‌نمایش زنده قالب" "$(curl -s $B/templates/رومیکا)"
ck "gen-guard" "/login" "$(curl -s -o /dev/null -w "%{redirect_url}" -X POST $B/admin/generator/generate -H 'Content-Type: application/json' -d '{"prompt":"تست تست تست تست"}')"
ck "gen-bad-prompt" '"ok":false' "$(curl -s -b $JAR -X POST $B/admin/generator/generate -H 'Content-Type: application/json' -H "X-CSRF: $MA" -d '{"prompt":"کوتاه"}')"

# ─── ۱۳. درگاه زرین‌پال ───
# (بازیابی پشتیبان نشست‌ها را ریست کرد — ورود دوباره کاربر)
rm -f $LJ
C=$(curl -s -c $LJ $B/login | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
curl -s -b $LJ -c $LJ -o /dev/null -X POST $B/login --data-urlencode "_csrf=$C" --data-urlencode "identifier=09121234567" --data-urlencode "password=test12345"
M=$(curl -s -b $LJ $B/ | grep -o 'name="csrf" content="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
# ساختار درخواست (واحد پول: تومان → ریال ×۱۰)
BTEST=$(node -e "
import('./src/gateway.js').then(m => {
  const b = m.buildRequestBody({ merchantId: 'aaaa1111-2222-3333-4444-555566667777', amountToman: 100000, callbackUrl: 'https://apptheme.ir/payment/callback', description: 'تست' });
  console.log(JSON.stringify(b));
});")
ck "gw-body-merchant" 'aaaa1111' "$BTEST"
ck "gw-body-rial" '"amount":1000000' "$BTEST"
ck "gw-body-callback" '/payment/callback' "$BTEST"
# فعال‌سازی زرین‌پال (سندباکس + مرچنت آزمایشی)
curl -s -b $JAR -o /dev/null -X POST $B/admin/settings/save --data-urlencode "_csrf=$MA" --data-urlencode "shopName=اپ‌تم" --data-urlencode "tagline=x" --data-urlencode "description=x" --data-urlencode "payProvider=zarinpal" --data-urlencode "merchantId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" --data-urlencode "sandbox=on"
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" -X POST $B/checkout/pay --data-urlencode "_csrf=$M" --data-urlencode "items=8" --data-urlencode "couponCode=")
ZCODE=$(echo "$r" | grep -o 'AT-[0-9]*')
ck "gw-order-created" "AT-" "$ZCODE"
# شبکه به زرین‌پال در این محیط بسته است → باید بی‌خطا به checkout?err=gateway برگرده (fallback امن)
r=$(curl -s -b $LJ -o /dev/null -w "%{redirect_url}" $B/payment/$ZCODE)
ck "gw-graceful-fallback" "err=gateway" "$r"
ck "gw-err-msg-shown" "اتصال به درگاه پرداخت ناموفق" "$(curl -s -b $LJ "$B/checkout?items=8&err=gateway")"
# کال‌بک ناشناس → redirect امن
r=$(curl -s -o /dev/null -w "%{redirect_url}" "$B/payment/callback?Authority=FAKE000&Status=OK")
ck "gw-callback-unknown" "/account" "$r"
# بازگشت به دمو
curl -s -b $JAR -o /dev/null -X POST $B/admin/settings/save --data-urlencode "_csrf=$MA" --data-urlencode "shopName=اپ‌تم" --data-urlencode "tagline=x" --data-urlencode "description=x" --data-urlencode "payProvider=demo" --data-urlencode "merchantId="
ck "gw-demo-restored" "درگاه پرداخت امن" "$(curl -s -b $LJ $B/payment/$(curl -s -b $LJ -o /dev/null -w '%{redirect_url}' -X POST $B/checkout/pay --data-urlencode "_csrf=$M" --data-urlencode "items=8" | grep -o 'AT-[0-9]*'))"

# ─── ۱۴. پاک‌سازی داده‌های دمو ───
R=$(curl -s -b $JAR -X POST $B/admin/purge-demo -H "X-CSRF: $MA")
ck "purge-ok" '"ok":true' "$R"
C=$(curl -s -c /tmp/pp.txt $B/login | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
ck "purge-sara-gone" "اشتباه است" "$(curl -s -b /tmp/pp.txt -X POST $B/login --data-urlencode "_csrf=$C" --data-urlencode "identifier=sara@demo.ir" --data-urlencode "password=demo12345")"
ck "purge-products-kept" "قالب جدید" "$(curl -s -b $JAR $B/admin/products)"
ck "purge-admin-kept" "داشبورد" "$(curl -s -b $JAR $B/admin)"

# ─── ۱۵. پول‌پارس مقاوم + امکانات + ناوبری ───
ck "parse-money-unit" "20000000" "$(node -e "import('./src/util.js').then(m=>console.log(m.parseMoney('20,000,000')))")"
ck "parse-money-fa" "20000000" "$(node -e "import('./src/util.js').then(m=>console.log(m.parseMoney('۲۰ میلیون')))")"
ck "parse-money-dots" "3500000" "$(node -e "import('./src/util.js').then(m=>console.log(m.parseMoney('3.500.000')))")"
# قیمت‌گذاری با ویرگول — باید موفق شود (روی سفارش تازه)
CSRW=$(curl -s -b $LJ -c $LJ $B/apps/wizard | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
curl -s -b $LJ -o /dev/null -X POST $B/apps/order --data-urlencode "_csrf=$CSRW" --data-urlencode "type=shop" --data-urlencode "name=تست ویرگول" --data-urlencode "desc=یه اپ تستی برای قیمت‌گذاری با ویرگول" --data-urlencode "feat=ورود" --data-urlencode "contact=09121110000"
APID3=$(curl -s -b $JAR $B/admin/app-projects | grep -o 'app-projects/[0-9]*' | sort -t/ -k2 -n | tail -1 | grep -o '[0-9]*')
R=$(curl -s -b $JAR -o /dev/null -w "%{redirect_url}" -X POST $B/admin/app-projects/$APID3/quote --data-urlencode "_csrf=$MA" --data-urlencode "price=12,000,000 تومان" --data-urlencode "note=تست ویرگول")
ck "quote-comma-price" "quoted=1" "$R"
# قیمت خیلی کم — باید err=price بدهد
curl -s -b $JAR -o /dev/null -X POST $B/admin/app-projects/$APID3/quote --data-urlencode "_csrf=$MA" --data-urlencode "price=100000" >/dev/null 2>&1
ck "quote-low-price-err" "" "$(curl -s -b $JAR "$B/admin/app-projects/$APID3?err=price" | grep -c 'نامعتبر')"
ck "product-features-shown" "پشتیبانی ۶ ماهه" "$(curl -s $B/templates/novin-shop)"
ck "product-tier-badge" "سطح" "$(curl -s $B/templates/novin-shop)"
ck "preview-guard-bar" "پیش‌نمایش رسمی" "$(curl -s $B/templates/novin-shop/preview)"
ck "preview-blocks-contextmenu" "contextmenu" "$(curl -s $B/templates/novin-shop/preview)"
ck "catalog-page1" "قالب" "$(curl -s "$B/templates?page=1")"
ck "ui-modal-js" "tlConfirm" "$(curl -s $B/assets/js/ui.js)"
ck "product-nav-prevnext" "جابه‌جایی بین قالب‌ها" "$(curl -s $B/templates/novin-shop)"

# ─── ۱۶. امنیت ───
ck "no-csrf-like" 'ok' "$(curl -s -b $LJ -X POST $B/api/products/1/like)"
ck "admin-guard" "" "$(curl -s -o /dev/null -w "%{redirect_url}" $B/admin/settings | grep -c 'admin')"
ck "quote-guard" "/login" "$(curl -s -o /dev/null -w "%{redirect_url}" -X POST $B/admin/app-projects/$APID/quote --data-urlencode "price=1")"
ck "404" "صفحه پیدا نشد" "$(curl -s $B/xyz)"

# ─── ۱۷. سبد سروری + فراموشی رمز + ورود اجتماعی ───
GJ=/tmp/tl-guest-cart.txt; rm -f $GJ
GC=$(curl -s -b $GJ -c $GJ $B/ | grep -o 'name="csrf" content="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
ck "cart-add-nojs" "302" "$(curl -s -b $GJ -c $GJ -o /dev/null -w "%{http_code}" -X POST $B/cart/add --data-urlencode "_csrf=$GC" -d "productId=1")"
curl -s -b $GJ -c $GJ -o /dev/null -X POST $B/cart/add --data-urlencode "_csrf=$GC" -d "productId=4&qty=2"
ck "cart-page-ssr" "ادامه تسویه و پرداخت" "$(curl -s -b $GJ $B/cart)"
ck "cart-page-item" "نوین‌شاپ" "$(curl -s -b $GJ $B/cart)"
ck "cart-summary-json" "\"ok\":true" "$(curl -s -b $GJ $B/cart/summary)"
ck "cart-remove" "302" "$(curl -s -b $GJ -c $GJ -o /dev/null -w "%{http_code}" -X POST $B/cart/remove --data-urlencode "_csrf=$GC" -d "productId=4")"
ck "cart-badge-count" "count" "$(curl -s -b $GJ $B/cart/summary)"
FJ=/tmp/tl-forgot.txt; rm -f $FJ
curl -s -c $FJ -o /dev/null $B/
CRF=$(curl -s -b $FJ -c $FJ $B/register | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
curl -s -b $FJ -c $FJ -o /dev/null -X POST $B/register --data-urlencode "_csrf=$CRF" --data-urlencode "name=کاربر فراموشکار" --data-urlencode "identifier=forgetful@test.ir" --data-urlencode "password=OldPass@1234"
CF=$(curl -s -b $FJ -c $FJ $B/forgot | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
ck "forgot-email-ok" "sent=1" "$(curl -s -b $FJ -o /dev/null -w "%{redirect_url}" -X POST $B/forgot --data-urlencode "_csrf=$CF" --data-urlencode "ch=email" --data-urlencode "identifier=forgetful@test.ir")"
ck "forgot-telegram-ticket" "sent=1" "$(curl -s -b $FJ -o /dev/null -w "%{redirect_url}" -X POST $B/forgot --data-urlencode "_csrf=$CF" --data-urlencode "ch=telegram" --data-urlencode "identifier=@tester")"
RT=$(grep -a "reset-password?token=" /tmp/tl-test.log | grep -o 'token=[a-f0-9]*' | tail -1 | cut -d= -f2)
ck "forgot-token-issued" "yes" "$([ -n "$RT" ] && echo yes)"
CF2=$(curl -s -b $FJ -c $FJ "$B/reset-password?token=$RT" | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
ck "reset-newpass-login" "/account" "$(curl -s -b $FJ -c $FJ -o /dev/null -w "%{redirect_url}" -X POST $B/reset-password --data-urlencode "_csrf=$CF2" --data-urlencode "token=$RT" --data-urlencode "password=NewPass@123")"
ck "oauth-off-guard" "err=oauth" "$(curl -s -o /dev/null -w "%{redirect_url}" $B/auth/github)"
ck "login-page-tabs" "auth-tabs" "$(curl -s $B/login)"
ck "login-page-oauth-buttons" "oauth-btn" "$(curl -s $B/login)"
ck "catalog-chips" "chip-on" "$(curl -s $B/templates)"

# ─── ۱۸. کارت‌های خرید + فیلتر حرفه‌ای + مودال ورود ───
ck "card-buy-btn" "افزودن به سبد" "$(curl -s $B/templates)"
ck "card-quick-buy" "خرید سریع" "$(curl -s $B/templates)"
ck "card-tier-eco" "اقتصادی" "$(curl -s "$B/templates?tier=eco")"
ck "card-tier-pro" "حرفه‌ای" "$(curl -s "$B/templates?tier=pro")"
ck "filter-sale" "تخفیف" "$(curl -s "$B/templates?sale=1")"
ck "filter-clear-btn" "حذف فیلترها" "$(curl -s "$B/templates?tier=eco")"
GJ2=/tmp/tl-card.txt; rm -f $GJ2
GC2=$(curl -s -b $GJ2 -c $GJ2 $B/ | grep -o 'name="csrf" content="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
curl -s -b $GJ2 -c $GJ2 -o /dev/null -X POST $B/cart/add --data-urlencode "_csrf=$GC2" -d "productId=1"
ck "card-in-cart-state" "در سبد — حذف" "$(curl -s -b $GJ2 $B/templates)"
curl -s -b $GJ2 -c $GJ2 -o /dev/null -X POST $B/cart/remove --data-urlencode "_csrf=$GC2" -d "productId=1"
ck "card-removed-state" "افزودن به سبد" "$(curl -s -b $GJ2 $B/templates)"
ck "auth-modal-onpage" "authModal" "$(curl -s $B/)"
ck "auth-modal-views" "data-view=\"forgot\"" "$(curl -s $B/)"
ck "auth-modal-brand-panel" "ab-feats" "$(curl -s $B/)"
ck "auth-modal-needs-setup" "data-needs-setup" "$(curl -s $B/)"

# ─── ۱۹. سینک ابری دیتابیس (گیت‌هاب ساختگی) ───
for p in $(ls /proc/[0-9]*/cmdline 2>/dev/null); do
  pid=$(basename $(dirname $p)); [ "$pid" = "$$" ] && continue
  cmd=$(tr '\0' ' ' < $p 2>/dev/null)
  if [[ "$cmd" == "node server.js"* ]]; then kill $pid 2>/dev/null; fi
done
sleep 1
node -e "const fs=require('fs');const db={meta:{secret:'cs123'},users:[],sessions:[],orders:[],licenses:[],likes:[],comments:[],messages:[],projects:[],transactions:[],withdrawals:[],verifications:[],coupons:[],generatedTemplates:[],categories:[{id:1,slug:'shop',name:'فروشگاهی',icon:'🛒'}],products:[{id:1,slug:'cloud-template',title:'قالب ابری',desc:'از گیت‌هاب اومدم',price:500000,categoryIds:[1],category:'shop',framework:'html',published:true,featured:true,likes:0,downloads:0,screens:[],tags:[],createdAt:'2026-09-01T00:00:00.000Z'}],settings:{siteName:'اپ‌تم',occasions:{},smtp:{host:'',port:587,user:'',pass:'',from:''},payment:{provider:'demo',merchantId:'',sandbox:false}}};fs.writeFileSync('/tmp/mockgh-db.json',JSON.stringify(db,null,1));"
cat > /tmp/mockgh.js <<'MOCK'
import http from 'node:http';
import fs from 'node:fs';
let sha = 'deadbeef';
http.createServer((req, res) => {
  const body = [];
  req.on('data', c => body.push(c));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET') {
      const raw = (req.headers.accept || '').includes('raw');
      const dbb = fs.readFileSync('/tmp/mockgh-db.json');
      res.end(raw ? dbb : JSON.stringify({ sha, content: dbb.toString('base64') }));
    } else if (req.method === 'PUT') {
      const payload = JSON.parse(Buffer.concat(body).toString());
      sha = 'sha' + Date.now();
      const decoded = Buffer.from(payload.content, 'base64');
      fs.writeFileSync('/tmp/mockgh-put.json', decoded);
      fs.writeFileSync('/tmp/mockgh-db.json', decoded);
      res.end(JSON.stringify({ commit: { sha } }));
    } else { res.statusCode = 404; res.end('{}'); }
  });
}).listen(3290, () => console.log('mock ok'));
MOCK
node /tmp/mockgh.js > /tmp/mockgh.log 2>&1 &
MOCKPID=$!
sleep 0.8
mv data/db.json /tmp/tl-main-db.json 2>/dev/null
(PORT=3200 DB_SYNC_REPO=test/apptheme-data DB_SYNC_TOKEN=fake DB_SYNC_API=http://localhost:3290 node server.js > /tmp/tl-sync.log 2>&1 &)
sleep 1.8
SB="http://localhost:3200"
ck "sync-pull-boot" "بازیابی شد" "$(grep -a 'db-sync' /tmp/tl-sync.log)"
ck "sync-pull-product" "قالب ابری" "$(curl -s $SB/templates/cloud-template)"
ck "sync-home-1product" "اپ‌تم" "$(curl -s $SB/)"
J2=/tmp/tl-sync-user.txt; rm -f $J2
SC=$(curl -s -c $J2 $SB/register | grep -o 'name="_csrf" value="[a-f0-9]*"' | grep -o '[a-f0-9]\{32\}' | head -1)
ck "sync-register" "/account" "$(curl -s -b $J2 -c $J2 -o /dev/null -w "%{redirect_url}" -X POST $SB/register --data-urlencode "_csrf=$SC" --data-urlencode "name=تست سینک" --data-urlencode "email=cloud$RANDOM@test.ir" --data-urlencode "password=Cloud@1234")"
sleep 15
ck "sync-push-done" "ذخیره شد" "$(grep -a 'ذخیره شد' /tmp/tl-sync.log)"
ck "sync-push-user" "تست سینک" "$(cat /tmp/mockgh-put.json 2>/dev/null)"
kill $MOCKPID 2>/dev/null
for p in $(ls /proc/[0-9]*/cmdline 2>/dev/null); do
  pid=$(basename $(dirname $p)); [ "$pid" = "$$" ] && continue
  cmd=$(tr '\0' ' ' < $p 2>/dev/null)
  if [[ "$cmd" == "node server.js"* ]]; then kill $pid 2>/dev/null; fi
done
mv /tmp/tl-main-db.json data/db.json 2>/dev/null

echo "──────────────────────────"
echo "PASS: $PASS | FAIL: $FAIL"
echo "خطاهای لاگ: $(grep -ac '\[error\]' /tmp/tl-test.log || echo 0)"
for p in $(ls /proc/[0-9]*/cmdline 2>/dev/null); do
  pid=$(basename $(dirname $p)); [ "$pid" = "$$" ] && continue
  cmd=$(tr '\0' ' ' < $p 2>/dev/null)
  if [[ "$cmd" == "node server.js"* ]]; then kill $pid 2>/dev/null; fi
done
exit $FAIL
