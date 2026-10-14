const db = require('../config/db');

class ReportRepository {
  async revenueByStatus(range) {
    const sql = `
      SELECT
        b.status,
        COUNT(*)::int AS booking_count,
        COALESCE(SUM(b.total_price), 0)::numeric(12,2) AS revenue
      FROM bookings b
      WHERE b.created_at::date >= $1 AND b.created_at::date <= $2
      GROUP BY b.status
      ORDER BY revenue DESC, b.status ASC
    `;

    const result = await db.query(sql, [range.from, range.to]);
    return result.rows;
  }

  async bookingsByDay(range) {
    const sql = `
      SELECT
        b.created_at::date AS report_date,
        COUNT(*)::int AS booking_count,
        COALESCE(SUM(b.total_price), 0)::numeric(12,2) AS revenue
      FROM bookings b
      WHERE b.created_at::date >= $1 AND b.created_at::date <= $2
      GROUP BY b.created_at::date
      ORDER BY b.created_at::date ASC
    `;

    const result = await db.query(sql, [range.from, range.to]);
    return result.rows;
  }

  async occupancyByRoomType() {
    const sql = `
      SELECT
        rt.name,
        COUNT(r.id)::int AS total_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END), 0)::int AS occupied_rooms
      FROM room_types rt
      LEFT JOIN rooms r ON r.room_type_id = rt.id
      GROUP BY rt.id, rt.name
      ORDER BY rt.name ASC
    `;

    const result = await db.query(sql);
    return result.rows;
  }
}

module.exports = new ReportRepository();
