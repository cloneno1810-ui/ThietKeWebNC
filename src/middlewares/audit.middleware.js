const auditRepository = require('../repositories/audit.repository');

function audit({ action, targetEntity, getEntityId, getDetails }) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      auditRepository.log({
        userId: req.user?.id || null,
        action,
        targetEntity,
        entityId: getEntityId ? getEntityId(req, res) : null,
        details: getDetails ? getDetails(req, res) : null,
        ipAddress: req.ip
      }).catch((error) => console.error('[AUDIT] Không ghi được nhật ký:', error.message));
    });
    next();
  };
}

module.exports = { audit };
