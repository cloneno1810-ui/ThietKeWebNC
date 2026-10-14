const db = require('../config/db');

class BookingRepository {
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
