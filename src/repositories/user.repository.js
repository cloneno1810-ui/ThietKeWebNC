const db = require('../config/db');

class UserRepository {
  /**
   * Tìm người dùng theo Email
   * Parameterized Query $1 chống SQL Injection
   */
  async findByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, full_name, phone, identity_card, 
             role, failed_attempts, locked_until, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1;
    `;
    const result = await db.query(sql, [email]);
    return result.rows[0] || null;
  }

  /**
   * Tìm người dùng theo ID
   */
  async findById(id) {
    const sql = `
      SELECT id, email, full_name, phone, identity_card, 
             role, failed_attempts, locked_until, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Tạo người dùng mới
   */
  async create({ email, passwordHash, fullName, phone, identityCard, role = 'guest' }) {
    const sql = `
      INSERT INTO users (email, password_hash, full_name, phone, identity_card, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, phone, identity_card, role, created_at;
    `;
    const result = await db.query(sql, [
      email,
      passwordHash,
      fullName,
      phone || null,
      identityCard || null,
      role
    ]);
    return result.rows[0];
  }

  /**
   * Cập nhật số lần đăng nhập sai & thời gian khóa tài khoản
   */
  async updateFailedAttempts(id, failedAttempts, lockedUntil = null) {
    const sql = `
      UPDATE users 
      SET failed_attempts = $1, locked_until = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3;
    `;
    await db.query(sql, [failedAttempts, lockedUntil, id]);
  }

  /**
   * Đặt lại số lần đăng nhập sai về 0
   */
  async resetFailedAttempts(id) {
    const sql = `
      UPDATE users 
      SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await db.query(sql, [id]);
  }
}

module.exports = new UserRepository();
