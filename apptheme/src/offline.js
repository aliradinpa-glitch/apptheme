// متن صفحه آفلاین — در سرور رندر می‌شود
export const OFFLINE_HTML = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>آفلاین — اپ‌تم</title><link rel="stylesheet" href="/assets/css/app.css"></head><body>
<div class="auth-wrap"><div class="card auth-card center"><div style="font-size:3.4rem">📡</div><h1 style="justify-content:center">اتصال قطع است</h1><p class="sub">اینترنت وصل نیست؛ صفحه‌های بازدیدشده‌ی اخیر آفلاین در دسترس‌اند.</p><a class="btn" href="/">تلاش دوباره</a></div></div>
<script>navigator.onLine&&location.replace('/')</script></body></html>`;
