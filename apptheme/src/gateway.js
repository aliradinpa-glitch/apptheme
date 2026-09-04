// ═══ درگاه پرداخت زرین‌پال (API v4) + حالت دمو ═══
// امنیت: مبلغ همیشه از سفارش سمت سرور خوانده می‌شود (به کال‌بک اعتماد نمی‌شود)
import { getDb, updateOne } from './db.js';

export function gatewayConfig() {
  const p = getDb().settings.payment || {};
  return { provider: p.provider || 'demo', merchantId: String(p.merchantId || '').trim(), sandbox: !!p.sandbox };
}

export function zarinpalUrls(sandbox) {
  const host = sandbox ? 'sandbox.zarinpal.com' : 'payment.zarinpal.com';
  return {
    request: `https://${host}/pg/v4/payment/request.json`,
    verify: `https://${host}/pg/v4/payment/verify.json`,
    startPay: `https://${sandbox ? 'sandbox.' : ''}zarinpal.com/pg/StartPay/`,
  };
}

// بدنه درخواست (تابع خالص — قابل تست)
export function buildRequestBody({ merchantId, amountToman, callbackUrl, description }) {
  return {
    merchant_id: merchantId,
    amount: Math.round(amountToman) * 10, // تومان → ریال
    callback_url: callbackUrl,
    description: String(description || '').slice(0, 90),
  };
}

// درخواست پرداخت → لینک StartPay
export async function zarinpalRequest(order, baseUrl, description) {
  const cfg = gatewayConfig();
  const urls = zarinpalUrls(cfg.sandbox);
  const res = await fetch(urls.request, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody({
      merchantId: cfg.merchantId,
      amountToman: order.total, // فقط از سفارش سمت سرور
      callbackUrl: `${baseUrl}/payment/callback`,
      description: description || `سفارش ${order.code} — اپ‌تم`,
    })),
    signal: AbortSignal.timeout(15_000),
  });
  const j = await res.json().catch(() => null);
  const data = j && j.data;
  if (data && data.code === 100 && data.authority) {
    updateOne('orders', o => o.id === order.id, { authority: data.authority });
    return { ok: true, redirect: urls.startPay + data.authority };
  }
  console.error('[zarinpal] خطای درخواست:', JSON.stringify(j && (j.data || j.errors)).slice(0, 300));
  return { ok: false };
}

// تأیید پرداخت در کال‌بک
export async function zarinpalVerify(amountToman, authority) {
  const cfg = gatewayConfig();
  const urls = zarinpalUrls(cfg.sandbox);
  const res = await fetch(urls.verify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: cfg.merchantId,
      amount: Math.round(amountToman) * 10, // باید دقیقاً برابر مبلغ درخواست باشد
      authority: String(authority || ''),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const j = await res.json().catch(() => null);
  const data = j && j.data;
  // 100 = تأیید شد، 101 = قبلاً تأیید شده (ضد تکرار)
  if (data && (data.code === 100 || data.code === 101)) {
    return { ok: true, refId: data.ref_id || String(data.code) };
  }
  console.error('[zarinpal] خطای تأیید:', JSON.stringify(j && (j.data || j.errors)).slice(0, 300));
  return { ok: false };
}
