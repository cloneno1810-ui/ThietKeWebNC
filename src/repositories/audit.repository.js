const db = require('../config/db');

class AuditRepository {
  async log({ userId = null, action, targetEntity, entityId = null, details = null, ipAddress = null }) {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, target_entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [userId, action, targetEntity, entityId, details, ipAddress]
    );
  }
}

module.exports = new AuditRepository();
