const jwt = require('jsonwebtoken');
const { AppError, sendError } = require('../utils/response');

const security = require('../config/security');
const sessions = require('../repositories/session.repository');

/**
 * Middleware 1: Xác thực Token JWT (Authentication)
 * Đọc token từ header Authorization (Bearer token) hoặc cookie
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && !/^Bearer [^\s]+$/.test(req.headers.authorization)) {
      return sendError(res, new AppError('UNAUTHORIZED', 'Tiêu đề xác thực không hợp lệ.', 401));
    }
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, new AppError('UNAUTHORIZED', 'Chưa xác thực hoặc không tìm thấy token đăng nhập.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, security.jwtSecret, {
        algorithms: ['HS256'], issuer: security.jwtOptions.issuer, audience: security.jwtOptions.audience
      });
    } catch (err) {
      return sendError(res, new AppError('UNAUTHORIZED', 'Token không hợp lệ hoặc đã hết hạn.', 401));
    }

    if (!decoded.id || !/^[0-9a-f-]{36}$/i.test(decoded.jti || '')) {
      return sendError(res, new AppError('UNAUTHORIZED', 'Phiên đã kết thúc hoặc không hợp lệ. Vui lòng đăng nhập lại.', 401));
    }
    req.session = { id: decoded.jti, token };
    res.setHeader('Cache-Control', 'no-store');
    const currentUser = await sessions.findActiveUser(decoded.jti, decoded.id);
    if (!currentUser) {
      return sendError(res, new AppError('UNAUTHORIZED', 'Người dùng thuộc token này không còn tồn tại.', 401));
    }

    // Gắn thông tin người dùng vào request
    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.full_name,
      role: currentUser.role
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware 2: Phân quyền theo chức năng (Role-Based Access Control - RBAC)
 * @param  {...string} allowedRoles - Danh sách các vai trò được phép (VD: 'admin', 'manager')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        new AppError(
          'FORBIDDEN',
          `Bạn không có quyền hạn thực hiện hành động này. Yêu cầu vai trò: [${allowedRoles.join(', ')}].`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};