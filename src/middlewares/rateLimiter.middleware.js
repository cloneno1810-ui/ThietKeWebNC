const rateLimit = require('express-rate-limit');
const { AppError, sendError } = require('../utils/response');

// Handler chung khi vượt quá giới hạn (429 Too Many Requests)
const limitReachedHandler = async (req, res, next, options) => {
  await require('../utils/security-log')(req, req.path.includes('login') || req.path.includes('register') ? 'LOGIN_RATE_LIMITED' : 'API_RATE_LIMITED');
  return sendError(res, new AppError('TOO_MANY_REQUESTS', options.message, 429));
};

// Lớp 1: Giới hạn API - 100 requests / phút / IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX || 100),
  message: 'Bạn đã gửi quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 1 phút.',
  handler: limitReachedHandler,
  standardHeaders: true, // Trả về RateLimit-* headers
  legacyHeaders: false, // Vô hiệu hóa X-RateLimit-* headers
});

// Lớp 2: Auth theo IP; mặc định 5 lần thất bại / 15 phút.
const authIpLimiter = rateLimit({
  windowMs: require('../config/security').loginWindow,
  max: require('../config/security').loginMax,
  skipSuccessfulRequests: true,
  message: 'Bạn đã thử đăng nhập/đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút để bảo đảm an toàn.',
  handler: limitReachedHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Same threshold for existing and unknown emails; key contains no cleartext identity.
const authAccountLimiter = rateLimit({
  windowMs: require('../config/security').loginWindow,
  max: 5,
  keyGenerator: (req) => require('crypto').createHmac('sha256', require('../config/security').jwtSecret)
    .update(`${req.path}:${String(req.body?.email || '').toLowerCase().trim()}`).digest('hex'),
  skipSuccessfulRequests: true,
  message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  handler: limitReachedHandler,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = [authIpLimiter, authAccountLimiter];

module.exports = {
  globalLimiter,
  authLimiter
};
