const db = require('../src/config/db');

// One transaction: never leave a partially expanded inventory.
const statements = [
  `LOCK TABLE room_types, rooms IN ACCESS EXCLUSIVE MODE`,
  `DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM rooms GROUP BY room_type_id HAVING count(*) > 10) THEN
      RAISE EXCEPTION 'A room type already has more than 10 rooms; review manually without deleting bookings';
    END IF;
  END $$`,
  `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS inventory_slot INTEGER`,
  `WITH ranked AS (SELECT id, row_number() OVER (PARTITION BY room_type_id ORDER BY id) AS slot FROM rooms)
    UPDATE rooms r SET inventory_slot = ranked.slot FROM ranked
    WHERE r.id = ranked.id AND r.inventory_slot IS NULL`,
  `ALTER TABLE rooms ALTER COLUMN inventory_slot SET NOT NULL`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'rooms'::regclass AND conname = 'rooms_inventory_slot_check') THEN
      ALTER TABLE rooms ADD CONSTRAINT rooms_inventory_slot_check CHECK (inventory_slot BETWEEN 1 AND 10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'rooms'::regclass AND conname = 'rooms_type_slot_unique') THEN
      ALTER TABLE rooms ADD CONSTRAINT rooms_type_slot_unique UNIQUE (room_type_id, inventory_slot);
    END IF;
  END $$`,
  `CREATE OR REPLACE FUNCTION assign_room_inventory_slot() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    IF NEW.inventory_slot IS NULL THEN
      SELECT s INTO NEW.inventory_slot FROM generate_series(1,10) AS s
      WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_type_id = NEW.room_type_id AND inventory_slot = s)
      ORDER BY s LIMIT 1;
      IF NEW.inventory_slot IS NULL THEN
        RAISE EXCEPTION 'Room type is limited to 10 rooms' USING ERRCODE = 'P0010';
      END IF;
    END IF;
    RETURN NEW;
  END $$`,
  `DROP TRIGGER IF EXISTS room_inventory_slot ON rooms`,
  `CREATE TRIGGER room_inventory_slot BEFORE INSERT ON rooms FOR EACH ROW EXECUTE FUNCTION assign_room_inventory_slot()`,
  `INSERT INTO rooms (room_number, room_type_id, floor, status, inventory_slot)
    SELECT 'H' || to_hex(rt.id) || '-' || lpad(s::text,2,'0'), rt.id,
      COALESCE((SELECT min(floor) FROM rooms WHERE room_type_id = rt.id),1), 'available', s
    FROM room_types rt CROSS JOIN generate_series(1,10) AS s
    WHERE NOT EXISTS (SELECT 1 FROM rooms r WHERE r.room_type_id = rt.id AND r.inventory_slot = s)`,
  `CREATE OR REPLACE FUNCTION populate_room_type_inventory() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    INSERT INTO rooms (room_number, room_type_id, floor, status, inventory_slot)
      SELECT 'H' || to_hex(NEW.id) || '-' || lpad(s::text,2,'0'), NEW.id, 1, 'available', s
      FROM generate_series(1,10) AS s;
    RETURN NEW;
  END $$`,
  `DROP TRIGGER IF EXISTS room_type_inventory ON room_types`,
  `CREATE TRIGGER room_type_inventory AFTER INSERT ON room_types FOR EACH ROW EXECUTE FUNCTION populate_room_type_inventory()`
];

(async () => {
  await db.sql.transaction(statements.map(statement => db.sql.query(statement)));
  console.log('Đã bổ sung đủ 10 phòng mỗi hạng, giữ nguyên phòng và đơn hiện có. Hạng mới tự tạo 10 phòng.');
})().catch(error => {
  console.error('Migration phòng thất bại và đã rollback:', error.code || 'DATABASE_ERROR');
  process.exitCode = 1;
});
