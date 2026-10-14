const audit = require('../repositories/audit.repository');
module.exports = async function securityLog(req, action, userId = null) {
  const entry = { userId, action, targetEntity: 'security', details: `requestId=${req.id}`, ipAddress: req.ip };
  try { await audit.log(entry); }
  catch (_) { console.error(JSON.stringify({ event: 'SECURITY_AUDIT_WRITE_FAILED', action, requestId: req.id })); }
};
