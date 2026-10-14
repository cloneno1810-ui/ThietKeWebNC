const COOKIE_MAX_AGE_MS = require('../config/security').accessTtl * 1000;

function tokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS
  };
}

function clearTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };
}

module.exports = {
  tokenCookieOptions,
  clearTokenCookieOptions,
  COOKIE_MAX_AGE_MS
};
