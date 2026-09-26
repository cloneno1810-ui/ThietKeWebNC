const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
