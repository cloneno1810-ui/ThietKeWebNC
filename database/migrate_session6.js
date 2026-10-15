/*
 * Migration Buổi 06 không xóa dữ liệu hiện có.
 * Chạy: node database/migrate_session6.js
 */
const db = require('../src/config/db');

async function constraintExists(name) {
  const result = await db.query(
    `SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1;`,
    [name]
  );
  return result.rows.length > 0;
}

async function main() {
  await db.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');

  // Đơn cũ chưa có hạn giữ chỗ được đưa về cơ chế mới trước khi bật CHECK.
  await db.query(
    `UPDATE bookings
     SET hold_expires_at = created_at + INTERVAL '30 minutes'
     WHERE status = 'pending_payment' AND hold_expires_at IS NULL;`
  );
  await db.query(
    `UPDATE bookings
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'pending_payment' AND hold_expires_at <= CURRENT_TIMESTAMP;`
  );

  if (!await constraintExists('chk_pending_booking_has_expiry')) {
    await db.query(
      `ALTER TABLE bookings ADD CONSTRAINT chk_pending_booking_has_expiry
       CHECK (status <> 'pending_payment' OR hold_expires_at IS NOT NULL);`
    );
  }

  if (!await constraintExists('exclude_overlapping_active_bookings')) {
    await db.query(
      `ALTER TABLE bookings ADD CONSTRAINT exclude_overlapping_active_bookings
       EXCLUDE USING gist (
         room_id WITH =,
         daterange(check_in_date, check_out_date, '[)') WITH &&
       ) WHERE (room_id IS NOT NULL AND status IN ('pending_payment', 'confirmed', 'checked_in'));`
    );
  }

  console.log('Buổi 06: đã áp dụng ràng buộc giữ chỗ và chống đặt trùng.');
}

main().catch((error) => {
  console.error('Migration Buổi 06 thất bại:', error.message);
  process.exitCode = 1;
});
