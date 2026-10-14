-- =====================================================================
-- KỊCH BẢN KHỞI TẠO LƯỢC ĐỒ (schema.sql)
-- HỌC PHẦN: CSE702051 - THIẾT KẾ WEB NÂNG CAO | ĐẠI HỌC PHENIKAA
-- ĐỀ TÀI 07: HỆ THỐNG QUẢN LÝ KHÁCH SẠN VÀ ĐẶT PHÒNG
-- =====================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. TABLE: users (Quản lý tài khoản & người dùng)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    identity_card VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'guest' 
        CHECK (role IN ('guest', 'receptionist', 'manager', 'admin')),
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. TABLE: room_types (Quản lý hạng phòng)
CREATE TABLE room_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_price_per_night NUMERIC(12, 2) NOT NULL CHECK (base_price_per_night >= 0),
    max_occupancy INT NOT NULL CHECK (max_occupancy > 0),
    amenities TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLE: rooms (Phòng vật lý)
CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type_id BIGINT NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    floor INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'booked', 'occupied', 'cleaning', 'maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- 4. TABLE: bookings (Hồ sơ đặt phòng & giữ chỗ T1/T2)
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    room_type_id BIGINT NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    room_id BIGINT REFERENCES rooms(id) ON DELETE SET NULL,
    guest_name VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INT NOT NULL CHECK (num_guests > 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN ('pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
    hold_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_type_id ON bookings(room_type_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 5. TABLE: invoices (Hóa đơn thanh toán)
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_code VARCHAR(20) NOT NULL UNIQUE,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    room_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (room_subtotal >= 0),
    surcharge_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (surcharge_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- 6. TABLE: payments (Lịch sử giao dịch thanh toán)
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('vnpay', 'stripe', 'cash', 'credit_card', 'bank_transfer')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed')),
    transaction_response TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 7. TABLE: promotions (Mã giảm giá & Khuyến mãi)
CREATE TABLE promotions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_percent NUMERIC(5, 2) CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
    discount_amount NUMERIC(12, 2) CHECK (discount_amount IS NULL OR discount_amount >= 0),
    min_booking_amount NUMERIC(12, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(12, 2) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_promo_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_promotions_code ON promotions(code);

-- 8. TABLE: audit_logs (Nhật ký ghi vết bảo mật)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
