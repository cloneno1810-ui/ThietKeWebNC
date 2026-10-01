const db = require('./src/config/db');
db.query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = 'admin@hotel.com'")
  .then(() => console.log('Unlocked admin'))
  .catch(console.error);
