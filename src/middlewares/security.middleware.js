const crypto = require('crypto');
const { AppError, sendError } = require('../utils/response');
const { logSecurityEvent } = require('../utils/security-log');

const isSafeMethod = (method) => ['GET', 'HEAD', 'OPTIONS'].includes(method);
const defaultAllowedOrigins = ['http://localhost:8080', 'http://127.0.0.1:8080'];

function parseAllowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured.length ? configured : defaultAllowedOrigins;
}

function requestId(req, res, next) {
  req.id = req.id || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

function httpsOnly(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();

  const forwardedProto = req.headers['x-forwarded-proto'];
  const isSecure = req.secure || forwardedProto === 'https';
  const isLocal = ['localhost', '127.0.0.1'].includes(req.hostname);

  if (isSecure || isLocal) return next();

  logSecurityEvent('HTTPS_REQUIRED', {
    path: req.originalUrl,
    ip: req.ip,
    message: 'Production environment requires HTTPS.'
  });

  return sendError(res, new AppError('HTTPS_REQUIRED', 'HTTPS là bắt buộc trong môi trường production.', 403));
}

function originGuard(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowedOrigins = parseAllowedOrigins();
  const isAllowed = allowedOrigins.includes(origin) || origin === `${req.protocol}://${req.get('host')}`;

  if (!isAllowed) {
    logSecurityEvent('INVALID_ORIGIN', {
      path: req.originalUrl,
      ip: req.ip,
      origin,
      message: 'Origin không được phép.'
    });
    return sendError(res, new AppError('INVALID_ORIGIN', 'Origin không được phép truy cập.', 403));
  }

  return next();
}

function issueCsrfToken(req, res, next) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 1000
  });
  req.csrfToken = token;
  return next();
}

function csrfProtection(req, res, next) {
  if (isSafeMethod(req.method)) return next();
  if (!req.cookies || !req.cookies.token) return next();

  const token = req.headers['x-csrf-token'] || req.body?.csrfToken;
  const cookieToken = req.cookies?.csrfToken;

  if (!token || !cookieToken || token !== cookieToken) {
    logSecurityEvent('CSRF_REJECTED', {
      path: req.originalUrl,
      ip: req.ip,
      method: req.method,
      message: 'Token CSRF không hợp lệ hoặc thiếu.'
    });
    return sendError(res, new AppError('CSRF_INVALID', 'Yêu cầu CSRF không hợp lệ.', 403));
  }

  return next();
}

function contentTypeGuard(req, res, next) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();

  const contentType = req.headers['content-type'];
  if (!contentType) return next();

  const allowed = /^(application\/json|multipart\/form-data|application\/x-www-form-urlencoded)/i.test(contentType);
  if (!allowed) {
    logSecurityEvent('INVALID_CONTENT_TYPE', {
      path: req.originalUrl,
      ip: req.ip,
      method: req.method,
      contentType,
      message: 'Content-Type không hợp lệ.'
    });
    return sendError(res, new AppError('INVALID_CONTENT_TYPE', 'Content-Type không hợp lệ cho request này.', 415));
  }

  return next();
}

module.exports = {
  requestId,
  httpsOnly,
  originGuard,
  issueCsrfToken,
  csrfProtection,
  contentTypeGuard
};
