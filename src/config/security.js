const crypto = require('crypto');

const production = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32 || /thay-bang|hotel_super_secret|change-me/i.test(jwtSecret)) {
  throw new Error('JWT_SECRET phải là khóa ngẫu nhiên riêng, dài tối thiểu 32 byte.');
}
function positiveInteger(name, fallback, max) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`${name} không hợp lệ.`);
  return value;
}
const accessTtl = positiveInteger('JWT_ACCESS_TTL', 900, 86400);
// Render supplies this value through the server environment, never request headers.
const renderOrigin = process.env.RENDER === 'true' ? process.env.RENDER_EXTERNAL_URL : undefined;
const appOrigin = process.env.APP_ORIGIN || renderOrigin || (!production ? `http://localhost:${process.env.PORT || '8080'}` : undefined);
if (!appOrigin) throw new Error('Production cần APP_ORIGIN hoặc RENDER_EXTERNAL_URL.');
const configuredOrigins = [appOrigin, renderOrigin, ...(process.env.ALLOWED_ORIGINS || '').split(',')].filter(Boolean);
const origins = new Set(configuredOrigins.map((value) => {
  const url = new URL(value.trim());
  if (url.origin !== value.trim() || !['http:', 'https:'].includes(url.protocol) || (production && url.protocol !== 'https:')) throw new Error('Origin phải đúng dạng scheme://host[:port].');
  return url.origin;
}));
if (!production) {
  const port = process.env.PORT || '8080';
  origins.add(`http://localhost:${port}`);
  origins.add(`http://127.0.0.1:${port}`);
}
function csrfForToken(token) {
  return crypto.createHmac('sha256', jwtSecret).update('csrf:').update(token).digest('hex');
}
function matchesCsrf(token, provided) {
  return typeof provided === 'string' && /^[a-f0-9]{64}$/.test(provided) &&
    crypto.timingSafeEqual(Buffer.from(csrfForToken(token)), Buffer.from(provided));
}
module.exports = { production, jwtSecret, accessTtl, appOrigin: appOrigin.trim(), origins, csrfForToken, matchesCsrf,
  jwtOptions: { algorithm: 'HS256', issuer: 'dt07-hotel', audience: 'dt07-api' },
  loginMax: positiveInteger('RATE_LIMIT_LOGIN_MAX', 5, 100),
  loginWindow: positiveInteger('RATE_LIMIT_LOGIN_WINDOW', 900000, 86400000) };
