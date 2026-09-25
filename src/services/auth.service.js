const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '1d';

class AuthService {
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

    if (password.length < 6) {
      throw new AppError('INVALID_INPUT', 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.', 400);
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
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        createdAt: newUser.created_at
      },
      token
    };
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
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác.', 401);
    }

    // Kiểm tra tài khoản có đang bị khóa (NFR-06 / BM10)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000));
      throw new AppError(
        'ACCOUNT_LOCKED',
        `Tài khoản đang tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        423
      );
    }

    // So sánh mật khẩu bằng bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const failedAttempts = (user.failed_attempts || 0) + 1;
      let lockedUntil = null;

      // Khóa tài khoản 15 phút nếu sai liên tiếp 5 lần
      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await userRepository.updateFailedAttempts(user.id, failedAttempts, lockedUntil);
        throw new AppError(
          'ACCOUNT_LOCKED',
          'Bạn đã nhập sai mật khẩu 5 lần. Tài khoản bị tạm khóa 15 phút.',
          423
        );
      } else {
        await userRepository.updateFailedAttempts(user.id, failedAttempts, null);
        throw new AppError(
          'UNAUTHORIZED',
          `Email hoặc mật khẩu không chính xác. Số lần còn lại: ${5 - failedAttempts}.`,
          401
        );
      }
    }

    // Đăng nhập thành công -> Reset failed_attempts
    if (user.failed_attempts > 0 || user.locked_until) {
      await userRepository.resetFailedAttempts(user.id);
    }

    // Tạo token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      token
    };
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
