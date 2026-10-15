require('dotenv').config();
const app = require('./app');
const bookingRepository = require('./repositories/booking.repository');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log('  CSE702051 - THIET KE WEB NANG CAO | DH PHENIKAA');
  console.log('  DE TAI 07: HE THONG QUAN LY KHACH SAN VA DAT PHONG');
  console.log(`  May chu dang lang nghe tai cong: ${PORT}`);
  console.log(`  Dia chi cuc bo: http://localhost:${PORT}`);
  console.log(`  Diem cuoi kiem tra: http://localhost:${PORT}/api/v1/health`);
  console.log('====================================================');
});

// Giải phóng lượt giữ chỗ định kỳ. Cùng logic này cũng chạy trước các request
// đặt/xem đơn nên không phụ thuộc hoàn toàn vào timer khi Render ngủ dịch vụ.
const holdSweepIntervalMs = 60 * 1000;
setInterval(() => {
  bookingRepository.expireHolds().catch((error) => {
    console.error('[HOLD_EXPIRY] Không thể giải phóng giữ chỗ:', error.message);
  });
}, holdSweepIntervalMs).unref();
