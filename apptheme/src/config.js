import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const PORT = Number(process.env.PORT || 3000);
export const HOST = process.env.HOST || '0.0.0.0';
export const APP_NAME = 'اپ‌تم';

// Sessions
export const SESSION_COOKIE = 'tl_session';
export const CSRF_COOKIE = 'tl_csrf';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 روز

// Limits
export const BODY_LIMIT = 1024 * 1024; // 1MB
export const DOWNLOAD_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 روز

export const SITE_URL = process.env.SITE_URL || ''; // در پروداکشن: SITE_URL=https://apptheme.ir

export const FRAMEWORKS = {
  html:      { label: 'HTML/CSS خالص', short: 'HTML',      color: '#e34f26' },
  tailwind:  { label: 'Tailwind CSS',  short: 'Tailwind',  color: '#06b6d4' },
  bootstrap: { label: 'Bootstrap 5',   short: 'Bootstrap', color: '#7952b3' },
  react:     { label: 'React + Vite',  short: 'React',     color: '#61dafb' },
  vue:       { label: 'Vue 3',         short: 'Vue',       color: '#42b883' },
  next:      { label: 'Next.js',       short: 'Next.js',   color: '#ffffff' },
};
