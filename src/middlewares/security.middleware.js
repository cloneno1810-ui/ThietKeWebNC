const crypto = require('crypto');
const { production, appOrigin, origins, matchesCsrf } = require('../config/security');
const { AppError } = require('../utils/response');

function requestContext(req, res, next) {
  req.id = crypto.randomUUID();
  res.locals.requestId = req.id;
  res.locals.nonce = crypto.randomBytes(18).toString('base64');
  res.setHeader('X-Request-Id', req.id);
  next();
}
function requireHttps(req, res, next) {
  if (production && !req.secure) {
    // Canonical origin comes from deployment configuration, never the Host header.
    return res.redirect(308, appOrigin + req.originalUrl);
  }
  next();
}
function protectOrigin(req, res, next) {
  const origin = req.get('Origin');
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  // req.is() returns null for a bodyless request, even with a valid Content-Type.
  // Cancellation/logout may have no payload; validate the declared media type instead.
  const contentType = (req.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  if ((origin && !origins.has(origin)) || (unsafe && req.get('Sec-Fetch-Site') === 'cross-site')) {
    return next(new AppError('FORBIDDEN', 'Nguồn gửi yêu cầu không được phép.', 403));
  }
  if (unsafe && req.path.startsWith('/api/') && !['application/json', 'multipart/form-data'].includes(contentType)) {
    return next(new AppError('INVALID_INPUT', 'API chỉ nhận JSON hoặc multipart/form-data.', 415));
  }
  // Bearer credentials are explicit API credentials. Cookies are ambient browser credentials.
  const publicAuth = ['/api/v1/auth/login', '/api/v1/auth/register'].includes(req.path);
  const explicitBearer = /^Bearer [^\s]+$/.test(req.get('Authorization') || '');
  if (unsafe && !publicAuth && req.path.startsWith('/api/') && req.cookies.token && !explicitBearer &&
      !matchesCsrf(req.cookies.token, req.get('X-CSRF-Token'))) {
    return next(new AppError('FORBIDDEN', 'Thiếu hoặc sai mã CSRF của phiên.', 403));
  }
  next();
}
module.exports = { requestContext, requireHttps, protectOrigin };
