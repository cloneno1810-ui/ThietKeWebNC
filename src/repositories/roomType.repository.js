const db = require('../config/db');

class RoomTypeRepository {
  async findAll() {
    const result = await db.query(
      `SELECT id, name, description, base_price_per_night, max_occupancy, amenities, created_at, updated_at
       FROM room_types
       ORDER BY id ASC;`
    );
    return result.rows;
  }

  async findByName(name) {
    const result = await db.query(
      `SELECT id FROM room_types WHERE LOWER(name) = LOWER($1) LIMIT 1;`,
      [name]
    );
    return result.rows[0] || null;
  }

  async create({ name, description, basePricePerNight, maxOccupancy, amenities }) {
    const result = await db.query(
      `INSERT INTO room_types (name, description, base_price_per_night, max_occupancy, amenities)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, base_price_per_night, max_occupancy, amenities, created_at;`,
      [name, description || null, basePricePerNight, maxOccupancy, amenities || null]
    );
    return result.rows[0];
  }
}

module.exports = new RoomTypeRepository();
