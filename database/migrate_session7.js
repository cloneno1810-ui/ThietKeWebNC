/* Migration Buổi 07: chỉ bổ sung chỉ mục phục vụ tìm kiếm và báo cáo. */
const db = require('../src/config/db');

async function main() {
  await db.query('CREATE INDEX IF NOT EXISTS idx_rooms_status_type_number ON rooms(status, room_type_id, room_number, id);');
  await db.query('CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at, id);');
  await db.query('CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at ON bookings(status, created_at);');
  console.log('Buổi 07: đã bổ sung chỉ mục tìm kiếm và báo cáo.');
}

main().catch((error) => { console.error('Migration Buổi 07 thất bại:', error.message); process.exitCode = 1; });
