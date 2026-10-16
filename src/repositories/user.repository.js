const db = require('../config/db');

class UserRepository {
  async findStaff() {
    const result = await db.query(`SELECT id, email, full_name, role, created_at FROM users
      WHERE role IN ('receptionist', 'manager', 'admin') ORDER BY created_at DESC, id DESC LIMIT 100`);
    return result.rows;
  }
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
    let result;
    try { result = await db.query(sql, [
      email,
      passwordHash,
      fullName,
      phone || null,
      identityCard || null,
      role
    ]); } catch (error) {
      if (error.code === '23505') throw new (require('../utils/response').AppError)('INVALID_INPUT', 'Email này đã được sử dụng.', 400);
      throw error;
    }
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

  async recordFailedLogin(id) {
    const result = await db.query(`UPDATE users SET
      failed_attempts = CASE WHEN locked_until <= CURRENT_TIMESTAMP THEN 1 ELSE failed_attempts + 1 END,
      locked_until = CASE WHEN locked_until > CURRENT_TIMESTAMP THEN locked_until
        WHEN (CASE WHEN locked_until <= CURRENT_TIMESTAMP THEN 1 ELSE failed_attempts + 1 END) >= 5
        THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes' ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING failed_attempts, locked_until`, [id]);
    return result.rows[0];
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

  async updateRole(id, role) {
    const result = await db.query(
      `UPDATE users SET role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1
       RETURNING id, email, full_name, role;`,
      [id, role]
    );
    return result.rows[0] || null;
  }
}

module.exports = new UserRepository();
