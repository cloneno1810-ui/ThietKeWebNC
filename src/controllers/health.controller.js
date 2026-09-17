const db = require('../config/db');

exports.getHealth = async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'DISCONNECTED';
  let dbTime = null;

  try {
    const result = await db.query('SELECT NOW() as now, current_database() as db_name, version() as version');
    if (result && result.rows.length > 0) {
      dbStatus = 'CONNECTED';
      dbTime = result.rows[0].now;
    }
  } catch (err) {
    dbStatus = 'ERROR: ' + err.message;
  }

  const responseTimeMs = Date.now() - startTime;

  res.status(200).json({
    status: 'UP',
    topic: 'DT14 - Nền tảng Đặt vé Sự kiện và Quản lý Rạp chiếu phim',
    course: 'CSE702051 - Thiết kế web nâng cao | Đại học Phenikaa',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: 'Neon Cloud Serverless PostgreSQL',
      status: dbStatus,
      serverTime: dbTime
    },
    latencyMs: responseTimeMs
  });
};
