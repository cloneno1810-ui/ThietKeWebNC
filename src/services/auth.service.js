const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../utils/response');

const crypto = require('crypto');
const sessions = require('../repositories/session.repository');
const security = require('../config/security');
const dummyHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);

class AuthService {
  async issueSession(user) {
    const id = crypto.randomUUID();
    const token = jwt.sign({ id: user.id }, security.jwtSecret, {
      ...security.jwtOptions, expiresIn: security.accessTtl, jwtid: id
    });
    await sessions.create(id, user.id, new Date(jwt.decode(token).exp * 1000));
    return { user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
      token, expiresIn: security.accessTtl };
  }
  /**
   * Đăng ký tài khoản khách hàng mới
   */
  async register({ email, password, fullName, phone, identityCard }) {
    if (!email || !password || !fullName) {
      throw new AppError('INVALID_INPUT', 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên.', 400);
    }

    // Kiểm tra định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('INVALID_INPUT', 'Định dạng email không hợp lệ.', 400);
    }

    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new AppError('INVALID_INPUT', 'Mật khẩu phải từ 8 ký tự đến 72 byte UTF-8.', 400);
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      throw new AppError('INVALID_INPUT', 'Email này đã được sử dụng.', 400, [
        { field: 'email', issue: 'Email đã tồn tại trong hệ thống' }
      ]);
    }

    // Băm mật khẩu bằng bcryptjs (BM6)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : null,
      identityCard: identityCard ? identityCard.trim() : null,
      role: 'guest'
    });

    // Tạo token JWT tự động đăng nhập
    return this.issueSession(newUser);
  }

  /**
   * Đăng nhập hệ thống & kiểm tra khóa tài khoản (BM10)
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError('INVALID_INPUT', 'Vui lòng nhập email và mật khẩu.', 400);
    }

    const user = await userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      await bcrypt.compare(password, dummyHash);
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác.', 401);
    }

    // Kiểm tra tài khoản có đang bị khóa (NFR-06 / BM10)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError(
        'TOO_MANY_REQUESTS',
        'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.',
        429
      );
    }

    // So sánh mật khẩu bằng bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const attempt = await userRepository.recordFailedLogin(user.id);
      if (attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
        // Return the same first-five response as an unknown account. The next attempt is 429.
        throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác.', 401);
      } else {
        throw new AppError(
          'UNAUTHORIZED',
          'Email hoặc mật khẩu không chính xác.',
          401
        );
      }
    }

    // Đăng nhập thành công -> Reset failed_attempts
    if (user.failed_attempts > 0 || user.locked_until) {
      await userRepository.resetFailedAttempts(user.id);
    }

    // Tạo token JWT
    return this.issueSession(user);
  }

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy thông tin tài khoản.', 404);
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      identityCard: user.identity_card,
      role: user.role,
      createdAt: user.created_at
    };
  }
}

module.exports = new AuthService();
