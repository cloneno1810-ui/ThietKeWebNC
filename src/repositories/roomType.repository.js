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
  async findById(id) {
    const result = await db.query(
      `SELECT * FROM room_types WHERE id = $1 LIMIT 1;`,
      [id]
    );
    return result.rows[0] || null;
  }

  async update(id, { name, description, basePricePerNight, maxOccupancy, amenities }) {
    const result = await db.query(
      `UPDATE room_types 
       SET name = $1, description = $2, base_price_per_night = $3, 
           max_occupancy = $4, amenities = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *;`,
      [name, description || null, basePricePerNight, maxOccupancy, amenities || null, id]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await db.query(
      `DELETE FROM room_types WHERE id = $1 RETURNING id;`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new RoomTypeRepository();
