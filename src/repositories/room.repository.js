const db = require('../config/db');

class RoomRepository {
  /**
   * Lấy danh sách phòng với phân trang và lọc (Tích hợp luôn Hạng mục 6)
   */
  async findAll({ status, q, roomTypeId, sortBy, sortOrder, limit, offset }) {
    let sql = `
      SELECT r.id, r.room_number, r.floor, r.status, r.created_at,
             rt.name as room_type_name, rt.base_price_per_night, rt.max_occupancy
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
    `;
    const params = [];
    
    const conditions = [];
    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (roomTypeId) {
      params.push(roomTypeId);
      conditions.push(`r.room_type_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(r.room_number ILIKE $${params.length} OR rt.name ILIKE $${params.length})`);
    }
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')} `;

    const sortable = { room_number: 'r.room_number', floor: 'r.floor', created_at: 'r.created_at' };
    sql += ` ORDER BY ${sortable[sortBy]} ${sortOrder}, r.id ${sortOrder} `;

    if (limit) {
      params.push(limit);
      sql += ` LIMIT $${params.length} `;
    }
    if (offset) {
      params.push(offset);
      sql += ` OFFSET $${params.length} `;
    }

    const result = await db.query(sql, params);
    
    // Count total for pagination
    const countSql = `SELECT COUNT(*) FROM rooms r LEFT JOIN room_types rt ON rt.id = r.room_type_id${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''}`;
    const countResult = await db.query(countSql, params.slice(0, conditions.length));

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  async findById(id) {
    const result = await db.query(`
      SELECT r.*, rt.name as room_type_name, rt.base_price_per_night, rt.max_occupancy
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async findByRoomNumber(roomNumber) {
    const result = await db.query(`SELECT * FROM rooms WHERE room_number = $1`, [roomNumber]);
    return result.rows[0] || null;
  }

  async create({ room_number, room_type_id, floor, status }) {
    const result = await db.query(
      `INSERT INTO rooms (room_number, room_type_id, floor, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [room_number, room_type_id, floor, status || 'available']
    );
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE rooms SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await db.query(`DELETE FROM rooms WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new RoomRepository();
