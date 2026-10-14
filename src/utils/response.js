/**
 * Unified API Response Formatter & Error Handler Helpers
 * Format chuẩn JSON theo tài liệu Buổi 03:
 * Success: { success: true, data: ... }
 * Error:   { success: false, error: { code, message, details, timestamp } }
 */

class AppError extends Error {
  constructor(code, message, statusCode = 400, details = []) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

const sendError = (res, err) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Đã xảy ra lỗi nội bộ máy chủ';
  const details = err.details || [];

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  AppError,
  sendSuccess,
  sendError
};
