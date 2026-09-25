-- =====================================================================
-- KỊCH BẢN NẠP DỮ LIỆU MẪU (seed.sql)
-- HỌC PHẦN: CSE702051 - THIẾT KẾ WEB NÂNG CAO | ĐẠI HỌC PHENIKAA
-- ĐỀ TÀI 07: HỆ THỐNG QUẢN LÝ KHÁCH SẠN VÀ ĐẶT PHÒNG
-- =====================================================================

TRUNCATE TABLE audit_logs, payments, invoices, bookings, rooms, room_types, promotions, users RESTART IDENTITY CASCADE;

-- 1. SEED DATA: users (Mật khẩu bcrypt chuẩn cho 'Password123!': $2a$10$7Z84.mX71F1/Xl48/H/Yy.J4j.v35XfKzGz8VbH6zZ6zZ6zZ6zZ6z)
-- Hash chuẩn tạo từ bcryptjs: $2a$10$wN31nS9gOqO./l1aG/Wn3.9f12qYVvBvL/QnZ42A1Z.mK1o9A1oZa
INSERT INTO users (email, password_hash, full_name, phone, identity_card, role, failed_attempts, locked_until) VALUES
('admin@hotel.com', '$2b$10$BmCITIoQ7N6UsdhUngvT9O3YaGCA.HwE5OXQ9VGzN0vpvZA73O2YW', 'Nguyễn Văn Admin', '0901111111', '001090000001', 'admin', 0, NULL),
('manager@hotel.com', '$2b$10$BmCITIoQ7N6UsdhUngvT9O3YaGCA.HwE5OXQ9VGzN0vpvZA73O2YW', 'Đào Hữu Quản Lý', '0902222222', '001090000002', 'manager', 0, NULL),
('receptionist@hotel.com', '$2b$10$BmCITIoQ7N6UsdhUngvT9O3YaGCA.HwE5OXQ9VGzN0vpvZA73O2YW', 'Phạm Văn Lễ Tân', '0903333333', '001090000003', 'receptionist', 0, NULL),
('guest1@gmail.com', '$2b$10$BmCITIoQ7N6UsdhUngvT9O3YaGCA.HwE5OXQ9VGzN0vpvZA73O2YW', 'Trần Quang Khách', '0904444444', '001090000004', 'guest', 0, NULL),
('guest2@gmail.com', '$2b$10$BmCITIoQ7N6UsdhUngvT9O3YaGCA.HwE5OXQ9VGzN0vpvZA73O2YW', 'Trịnh Đắc Khách', '0905555555', '001090000005', 'guest', 0, NULL);

-- 2. SEED DATA: room_types
INSERT INTO room_types (name, description, base_price_per_night, max_occupancy, amenities) VALUES
('Standard Single', 'Phòng đơn tiêu chuẩn, tiện nghi đầy đủ cho 1-2 người.', 500000.00, 2, 'Wifi, TV, Điều hòa, Vòi hoa sen'),
('Superior Double', 'Phòng đôi cao cấp, giường King size, ban công thoáng mát.', 850000.00, 2, 'Wifi, Smart TV, Điều hòa, Tủ lạnh mini, Ban công'),
('Deluxe Ocean View', 'Phòng Deluxe hướng biển, nội thất sang trọng.', 1400000.00, 3, 'Wifi, Smart TV 55 inch, Bồn tắm, Tủ lạnh mini, Ban công hướng biển'),
('Executive Suite', 'Căn hộ Suite hoàng gia với phòng khách riêng biệt.', 2500000.00, 4, 'Wifi, 2 Smart TV, Bồn tắm massage, Phòng khách riêng, Miễn phí ăn sáng');

-- 3. SEED DATA: rooms
INSERT INTO rooms (room_number, room_type_id, floor, status) VALUES
('101', 1, 1, 'available'),
('102', 1, 1, 'available'),
('103', 1, 1, 'cleaning'),
('201', 2, 2, 'occupied'),
('202', 2, 2, 'booked'),
('203', 2, 2, 'available'),
('301', 3, 3, 'occupied'),
('302', 3, 3, 'available'),
('401', 4, 4, 'available'),
('402', 4, 4, 'maintenance');

-- 4. SEED DATA: promotions
INSERT INTO promotions (code, description, discount_percent, discount_amount, min_booking_amount, max_discount_amount, start_date, end_date, is_active) VALUES
('WELCOME10', 'Giảm 10% cho khách hàng mới', 10.00, NULL, 500000.00, 200000.00, '2026-01-01', '2026-12-31', TRUE),
('SUMMER2026', 'Giảm trực tiếp 200,000 VNĐ cho đơn từ 1,500,000 VNĐ', NULL, 200000.00, 1500000.00, 200000.00, '2026-06-01', '2026-08-31', TRUE);

-- 5. SEED DATA: bookings
INSERT INTO bookings (booking_code, user_id, room_type_id, room_id, guest_name, guest_phone, guest_email, check_in_date, check_out_date, num_guests, total_price, status, hold_expires_at) VALUES
('BK20260901', 4, 2, 4, 'Trần Quang Khách', '0904444444', 'guest1@gmail.com', '2026-09-20', '2026-09-23', 2, 2550000.00, 'checked_in', NULL),
('BK20260902', 5, 3, 7, 'Trịnh Đắc Khách', '0905555555', 'guest2@gmail.com', '2026-09-21', '2026-09-24', 2, 4200000.00, 'checked_in', NULL),
('BK20260903', 4, 1, 2, 'Trần Quang Khách', '0904444444', 'guest1@gmail.com', '2026-09-25', '2026-09-27', 1, 1000000.00, 'confirmed', NULL),
('BK20260904', NULL, 4, NULL, 'Lê Văn Vãng Lai', '0988777666', 'vanglai@gmail.com', '2026-10-01', '2026-10-03', 3, 5000000.00, 'pending_payment', CURRENT_TIMESTAMP + INTERVAL '30 minutes'),
('BK20260905', 5, 1, NULL, 'Trịnh Đắc Khách', '0905555555', 'guest2@gmail.com', '2026-09-10', '2026-09-12', 1, 1000000.00, 'checked_out', NULL);

-- 6. SEED DATA: invoices
INSERT INTO invoices (invoice_code, booking_id, created_by_user_id, room_subtotal, surcharge_amount, discount_amount, total_amount, paid_amount, status) VALUES
('INV20260901', 1, 3, 2550000.00, 0.00, 200000.00, 2350000.00, 2350000.00, 'paid'),
('INV20260902', 2, 3, 4200000.00, 150000.00, 0.00, 4350000.00, 2000000.00, 'partially_paid'),
('INV20260905', 5, 3, 1000000.00, 0.00, 100000.00, 900000.00, 900000.00, 'paid');

-- 7. SEED DATA: payments
INSERT INTO payments (payment_code, invoice_id, amount, payment_method, status, transaction_response) VALUES
('PAY_VNPAY_1001', 1, 2350000.00, 'vnpay', 'success', '{"vnp_ResponseCode": "00", "vnp_TransactionNo": "14112233"}'),
('PAY_CASH_1002', 2, 2000000.00, 'cash', 'success', '{"note": "Đặt cọc tiền mặt tại quầy lễ tân"}'),
('PAY_STRIPE_1003', 3, 900000.00, 'stripe', 'success', '{"stripe_payment_intent": "pi_3MtwB2LkdIwYmR0B1n5"}');

-- 8. SEED DATA: audit_logs
INSERT INTO audit_logs (user_id, action, target_entity, entity_id, details, ip_address) VALUES
(1, 'SYSTEM_INIT', 'database', NULL, 'Khởi tạo hệ thống và cơ sở dữ liệu ban đầu', '127.0.0.1'),
(1, 'USER_ROLE_ASSIGN', 'users', 2, 'Gán quyền Manager cho Đào Hữu Quản Lý', '127.0.0.1'),
(4, 'USER_LOGIN', 'users', 4, 'Đăng nhập thành công từ thiết bị Chrome/Windows', '192.168.1.15'),
(3, 'CHECK_IN_PERFORMED', 'bookings', 1, 'Check-in thành công cho mã đặt phòng BK20260901, gán phòng 201', '192.168.1.50'),
(3, 'INVOICE_CREATED', 'invoices', 1, 'Tạo hóa đơn INV20260901 cho Booking BK20260901', '192.168.1.50');
