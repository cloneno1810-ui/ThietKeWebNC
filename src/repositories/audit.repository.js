const db = require('../config/db');

class AuditRepository {
  async log({ userId = null, action, targetEntity, entityId = null, details = null, ipAddress = null }) {
    const sql = `
      INSERT INTO audit_logs (user_id, action, target_entity, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await db.query(sql, [userId, action, targetEntity, entityId, details, ipAddress]);
    return result.rows[0];
  }
}

module.exports = new AuditRepository();
