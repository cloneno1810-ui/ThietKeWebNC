const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');
const { tokenCookieOptions, clearTokenCookieOptions } = require('../utils/cookie');
const sessions = require('../repositories/session.repository');
const securityLog = require('../utils/security-log');

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

      // Gửi cookie HTTP-Only (BM7) — Path=/, SameSite=Lax
      res.cookie('token', result.token, tokenCookieOptions());

      await securityLog(req, 'USER_REGISTERED', result.user.id);

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

      res.cookie('token', result.token, tokenCookieOptions());
      await securityLog(req, 'USER_LOGIN', result.user.id);

      return sendSuccess(res, result, 200);
    } catch (err) {
      if (err.statusCode === 429) res.setHeader('Retry-After', '900');
      await securityLog(req, err.statusCode === 429 ? 'LOGIN_RATE_LIMITED' : 'LOGIN_FAILED');
      return sendError(res, err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      await sessions.revoke(req.session.id, req.user.id);
      res.clearCookie('token', clearTokenCookieOptions());
      await securityLog(req, 'USER_LOGOUT', req.user.id);
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
