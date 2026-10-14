const resolveAllowedOrigins = () => {
  const configured = (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured.length > 0 ? configured : ['http://localhost:8080', 'http://127.0.0.1:8080'];
};

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'hotel_super_secret_jwt_key_2026',
    expiresIn: '1d'
  },
  cookie: {
    tokenName: 'token',
    csrfName: 'csrfToken',
    maxAgeMs: 24 * 60 * 60 * 1000,
    csrfMaxAgeMs: 60 * 60 * 1000
  },
  csrf: {
    headerName: 'X-CSRF-Token',
    cookieName: 'csrfToken',
    ttlMs: 60 * 60 * 1000
  },
  allowedOrigins: resolveAllowedOrigins(),
  production: process.env.NODE_ENV === 'production'
};
