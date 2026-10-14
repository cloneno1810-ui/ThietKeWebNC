const rateLimit = require('express-rate-limit');
const { AppError, sendError } = require('../utils/response');

// Handler chung khi vượt quá giới hạn (429 Too Many Requests)
const limitReachedHandler = (req, res, next, options) => {
  return sendError(res, new AppError('TOO_MANY_REQUESTS', options.message, 429));
};

// Lớp 1: Giới hạn toàn cầu (Toàn bộ API) - 100 requests / 15 phút
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 request cho mỗi IP trong 15 phút
  message: 'Bạn đã gửi quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
  handler: limitReachedHandler,
  standardHeaders: true, // Trả về RateLimit-* headers
  legacyHeaders: false, // Vô hiệu hóa X-RateLimit-* headers
});

// Lớp 2: Giới hạn Auth (Đăng ký, Đăng nhập, Quên mật khẩu) - 10 requests / 15 phút
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Bạn đã thử đăng nhập/đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút để bảo đảm an toàn.',
  handler: limitReachedHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter
};
