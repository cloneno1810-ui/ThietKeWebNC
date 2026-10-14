const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
async function main() {
  const statements = fs.readFileSync(path.join(__dirname, 'session8.sql'), 'utf8')
    .replace(/^--.*$/gm, '').split(';').map((sql) => sql.trim()).filter(Boolean);
  for (const sql of statements) await db.query(sql);
  console.log('Buổi 08: đã tạo bảng phiên và chỉ mục, giữ nguyên dữ liệu hiện có.');
}
main().catch(() => { console.error('Migration Buổi 08 thất bại; kiểm tra kết nối/quyền DDL.'); process.exitCode = 1; });
