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
  const expected = err instanceof AppError && err.statusCode >= 400 && err.statusCode < 500;
  const statusCode = expected ? err.statusCode : 500;
  const errorCode = expected ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = expected ? err.message : 'Đã xảy ra lỗi nội bộ máy chủ. Vui lòng cung cấp mã yêu cầu để hỗ trợ.';
  const details = expected ? err.details : [];
  if (!expected) {
    const redact = (value) => {
      let text = String(value || '');
      for (const key of ['JWT_SECRET', 'SESSION_SECRET', 'DATABASE_URL']) {
        if (process.env[key]) text = text.split(process.env[key]).join('[REDACTED]');
      }
      return text.replace(/(?:postgres(?:ql)?|mysql):\/\/[^\s]+/gi, '[REDACTED_DATABASE_URL]');
    };
    console.error(JSON.stringify({ event: 'INTERNAL_ERROR', requestId: res.locals?.requestId,
      type: err.name || 'Error', message: redact(err.message), stack: redact(err.stack) }));
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      requestId: res.locals?.requestId,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  AppError,
  sendSuccess,
  sendError
};
