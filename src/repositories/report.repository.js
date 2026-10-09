const db = require('../config/db');

class ReportRepository {
  async revenueByStatus({ from, to }) {
    const result = await db.query(
      `SELECT b.status, COUNT(*)::int AS booking_count,
              COALESCE(SUM(b.total_price), 0)::numeric AS revenue
       FROM bookings b
       WHERE b.created_at >= $1::timestamptz
         AND b.created_at < ($2::date + INTERVAL '1 day')
       GROUP BY b.status
       ORDER BY b.status ASC;`,
      [from, to]
    );
    return result.rows;
  }

  async bookingsByDay({ from, to }) {
    const result = await db.query(
      `SELECT b.created_at::date AS report_date, COUNT(*)::int AS booking_count,
              COALESCE(SUM(b.total_price), 0)::numeric AS revenue
       FROM bookings b
       WHERE b.created_at >= $1::timestamptz
         AND b.created_at < ($2::date + INTERVAL '1 day')
       GROUP BY b.created_at::date
       ORDER BY report_date ASC;`,
      [from, to]
    );
    return result.rows;
  }

  async occupancyByRoomType({ from, to }) {
    const result = await db.query(
      `SELECT rt.id, rt.name, COUNT(r.id)::int AS total_rooms,
              COUNT(DISTINCT b.room_id) FILTER (
                WHERE b.status IN ('confirmed', 'checked_in')
                  AND b.check_in_date <= $2::date
                  AND b.check_out_date > $1::date
              )::int AS occupied_rooms
       FROM room_types rt
       LEFT JOIN rooms r ON r.room_type_id = rt.id
       LEFT JOIN bookings b ON b.room_id = r.id
       GROUP BY rt.id, rt.name
       ORDER BY rt.id ASC;`,
      [from, to]
    );
    return result.rows;
  }
}

module.exports = new ReportRepository();
