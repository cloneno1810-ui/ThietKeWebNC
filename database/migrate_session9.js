const fs = require('node:fs');
const path = require('node:path');
const db = require('../src/config/db');
(async () => {
  const statements = fs.readFileSync(path.join(__dirname, 'session9.sql'), 'utf8')
    .replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) await db.query(statement);
  console.log('Buổi 09: đã tạo chỉ mục và cập nhật thống kê, giữ nguyên dữ liệu.');
})().catch(() => { console.error('Migration Buổi 09 thất bại; kiểm tra kết nối và quyền tạo chỉ mục.'); process.exitCode = 1; });
