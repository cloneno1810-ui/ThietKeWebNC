const db = require('../config/db');

class BookingRepository {
  isExclusionViolation(error) {
    return db.isExclusionViolation(error);
  }

  /**
   * Tìm đơn đặt phòng theo ID
   */
  async findById(id) {
    const sql = `
      SELECT b.*, rt.name as room_type_name, r.room_number
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1
      LIMIT 1;
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Lấy danh sách đặt phòng của một người dùng cụ thể
   */
  async findByUserId(userId) {
    const sql = `
      SELECT b.*, rt.name as room_type_name, r.room_number
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC;
    `;
    const result = await db.query(sql, [userId]);
    return result.rows;
  }

  /**
   * Lấy tất cả đặt phòng (dành cho Lễ tân, Quản lý, Admin)
   */
  async findAll() {
    const sql = `
      SELECT b.*, rt.name as room_type_name, r.room_number, u.email as user_email
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC;
    `;
    const result = await db.query(sql);
    return result.rows;
  }

  /**
   * Cập nhật trạng thái đơn (hủy phòng — tầng Repository)
   */
  async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE bookings
       SET status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [id, status]
    );
    return result.rows[0] || null;
  }

  /** Check state and ownership again in the write to avoid cancelling after a concurrent check-in. */
  async cancelActiveBooking(id, userId, isStaff) {
    const result = await db.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('pending_payment', 'confirmed')
         AND ($3::boolean OR user_id = $2)
       RETURNING *;`,
      [id, userId, isStaff]
    );
    return result.rows[0] || null;
  }

  /**
   * Đưa các lượt giữ chỗ quá hạn về cancelled. Hàm được gọi trước mọi thao tác
   * đọc/tạo đơn và có thể được gọi từ bộ hẹn giờ của server.
   */
  async expireHolds() {
    const result = await db.query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'pending_payment'
         AND hold_expires_at <= CURRENT_TIMESTAMP
       RETURNING id, booking_code;`
    );
    return result.rows;
  }

  /**
   * T1 + T2: chọn một phòng trống và tạo giữ chỗ bằng một lệnh INSERT nguyên tử.
   * EXCLUDE constraint ở schema là tuyến phòng vệ cuối cùng nếu có request đua.
   */
  async createHold(data, holdMinutes) {
    const {
      booking_code, user_id, room_type_id, guest_name, guest_phone,
      guest_email, check_in_date, check_out_date, num_guests, total_price
    } = data;

    const result = await db.query(
      `WITH candidate_room AS (
         SELECT r.id
         FROM rooms r
         WHERE r.room_type_id = $1
           AND r.status NOT IN ('maintenance', 'cleaning')
           AND NOT EXISTS (
             SELECT 1
             FROM bookings b
             WHERE b.room_id = r.id
               AND b.status IN ('pending_payment', 'confirmed', 'checked_in')
               AND b.check_in_date < $3::date
               AND b.check_out_date > $2::date
           )
         ORDER BY r.id
         LIMIT 1
       )
       INSERT INTO bookings (
         booking_code, user_id, room_type_id, room_id, guest_name, guest_phone,
         guest_email, check_in_date, check_out_date, num_guests, total_price,
         status, hold_expires_at
       )
       SELECT $4, $5, $1, candidate_room.id, $6, $7, $8, $2::date, $3::date,
              $9, $10, 'pending_payment', CURRENT_TIMESTAMP + ($11 * INTERVAL '1 minute')
       FROM candidate_room
       RETURNING *;`,
      [
        room_type_id, check_in_date, check_out_date, booking_code, user_id || null,
        guest_name, guest_phone, guest_email, num_guests, total_price, holdMinutes
      ]
    );
    return result.rows[0] || null;
  }

  async confirmHold(id) {
    const result = await db.query(
      `UPDATE bookings
       SET status = 'confirmed', hold_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const {
      booking_code, user_id, room_type_id, room_id, guest_name, guest_phone,
      guest_email, check_in_date, check_out_date, num_guests, total_price, status
    } = data;
    
    const sql = `
      INSERT INTO bookings (
        booking_code, user_id, room_type_id, room_id, guest_name, guest_phone,
        guest_email, check_in_date, check_out_date, num_guests, total_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      booking_code,
      user_id || null,
      room_type_id,
      room_id || null,
      guest_name || null,
      guest_phone || null,
      guest_email || null,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      status || 'pending_payment'
    ];
    
    const result = await db.query(sql, params);
    return result.rows[0];
  }
}

module.exports = new BookingRepository();
