const fs = require('fs');
const path = require('path');

const logsDirectory = path.resolve(__dirname, '../../storage');
const logFilePath = path.join(logsDirectory, 'security-events.log');

fs.mkdirSync(logsDirectory, { recursive: true });

function logSecurityEvent(eventName, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event: eventName,
    ...details
  };

  try {
    fs.appendFileSync(logFilePath, `${JSON.stringify(entry)}\n`);
  } catch (error) {
    console.error('[SECURITY_LOG] Không ghi được nhật ký an ninh:', error.message);
  }

  console.warn(`[SECURITY] ${eventName}:`, JSON.stringify(entry));
}

module.exports = { logSecurityEvent };
