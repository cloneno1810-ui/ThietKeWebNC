-- Additive indexes; preserve existing rows and constraints.
CREATE INDEX IF NOT EXISTS idx_bookings_created_id ON bookings(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_created ON bookings(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_pending_expiry ON bookings(hold_expires_at) WHERE status = 'pending_payment';
CREATE INDEX IF NOT EXISTS idx_bookings_occupied_dates ON bookings(room_id, check_in_date, check_out_date) WHERE status IN ('confirmed', 'checked_in');
ANALYZE bookings;
