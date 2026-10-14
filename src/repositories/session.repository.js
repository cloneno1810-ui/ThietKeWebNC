const db = require('../config/db');
module.exports = {
  async create(id, userId, expiresAt) {
    await db.query('INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [id, userId, expiresAt]);
  },
  async isActive(id, userId) {
    const result = await db.query('SELECT id FROM auth_sessions WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP', [id, userId]);
    return result.rows.length > 0;
  },
  async revoke(id, userId) {
    await db.query('UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL', [id, userId]);
  }
};
