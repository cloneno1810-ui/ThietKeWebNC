const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const { email, password, fullName, phone, identityCard } = req.body;
      const result = await authService.register({
        email,
        password,
        fullName,
        phone,
        identityCard
      });

      // Gửi cookie HTTP-Only (BM7)
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, result, 201);
    } catch (err) {
      return sendError(res, err);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      res.clearCookie('token');
      return sendSuccess(res, { message: 'Đăng xuất thành công.' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id);
      return sendSuccess(res, { user }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }
}

module.exports = new AuthController();
