// ─── فایل اجرای حرفه‌ای PM2 روی سرور (VPS) ───
// استفاده:  pm2 start ecosystem.config.js && pm2 save && pm2 startup
module.exports = {
  apps: [{
    name: 'apptheme',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '300M',
    time: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SITE_URL: 'https://YOUR-DOMAIN.com', // ← دامنهٔ واقعی خودت را بگذار
    },
  }],
};
