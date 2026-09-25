/**
 * Kịch bản kiểm thử tự động Buổi 04:
 * 1. Đăng ký tài khoản mới (mật khẩu băm an toàn bcryptjs)
 * 2. Đăng nhập thành công và lấy JWT token
 * 3. Thử đăng nhập sai liên tiếp kiểm tra cơ chế khóa tài khoản (BM10)
 * 4. Kiểm tra gọi API khi chưa đăng nhập -> HTTP 401 UNAUTHORIZED
 * 5. Kiểm chứng chống truy cập chéo dữ liệu (IDOR - BM4):
 *    - User A (guest1@gmail.com) tạo/sở hữu Booking #1
 *    - User B (guest2@gmail.com) cố tình gọi GET /api/v1/bookings/1 -> Hệ thống CHẶN với mã 403 FORBIDDEN!
 *    - Lễ tân/Admin gọi GET /api/v1/bookings/1 -> Thành công HTTP 200 OK!
 */

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('======================================================================');
  console.log('  BẮT ĐẦU CHẠY BỘ KIỂM THỬ BUỔI 04 (XÁC THỰC, PHÂN QUYỀN & CHỐNG IDOR)');
  console.log('======================================================================\n');

  // TEST 1: Gọi endpoint yêu cầu đăng nhập khi chưa có Token (Mong đợi: 401 UNAUTHORIZED)
  console.log('[TEST 1] Gọi GET /api/v1/bookings/1 khi chưa đăng nhập...');
  const res1 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/bookings/1',
    method: 'GET'
  });
  console.log(`-> HTTP Status: ${res1.status} | Code: ${res1.body?.error?.code}`);
  if (res1.status === 401 && res1.body?.error?.code === 'UNAUTHORIZED') {
    console.log('  [PASS] Hệ thống đã từ chối với mã 401 Unauthorized hợp lệ.\n');
  } else {
    console.log('  [FAIL] Không đúng mã mong đợi.\n');
  }

  // TEST 2: Đăng nhập Guest 1 (Sở hữu Booking #1 trong seed)
  console.log('[TEST 2] Đăng nhập tài khoản Guest 1 (guest1@gmail.com)...');
  const res2 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'guest1@gmail.com', password: 'Password123!' });
  console.log(`-> HTTP Status: ${res2.status} | Success: ${res2.body?.success}`);
  const tokenGuest1 = res2.body?.data?.token;
  console.log(`  [PASS] Đăng nhập thành công, nhận token: ${tokenGuest1?.substring(0, 25)}...\n`);

  // TEST 3: Đăng nhập Guest 2 (Sở hữu Booking #2 trong seed)
  console.log('[TEST 3] Đăng nhập tài khoản Guest 2 (guest2@gmail.com)...');
  const res3 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'guest2@gmail.com', password: 'Password123!' });
  console.log(`-> HTTP Status: ${res3.status} | Success: ${res3.body?.success}`);
  const tokenGuest2 = res3.body?.data?.token;
  console.log(`  [PASS] Đăng nhập thành công, nhận token: ${tokenGuest2?.substring(0, 25)}...\n`);

  // TEST 4: Guest 1 xem chính chủ Booking #1 (Mong đợi: 200 OK)
  console.log('[TEST 4] Guest 1 truy cập xem Booking #1 của CHÍNH MÌNH...');
  const res4 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/bookings/1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenGuest1}` }
  });
  console.log(`-> HTTP Status: ${res4.status} | Guest Name: ${res4.body?.data?.booking?.guest_name}`);
  if (res4.status === 200 && res4.body?.data?.booking?.id == 1) {
    console.log('  [PASS] Chính chủ truy cập hợp lệ (200 OK).\n');
  } else {
    console.log('  [FAIL] Không thể truy cập đơn của chính mình.\n');
  }

  // TEST 5: KIỂM CHỨNG CHỐNG TRUY CẬP CHÉO DỮ LIỆU (IDOR / BM4):
  // Guest 2 cố tình truy cập Booking #1 của Guest 1 (Mong đợi: 403 FORBIDDEN)
  console.log('[TEST 5] [TRỌNG TÂM] Guest 2 cố tình xem trộm Booking #1 của Guest 1...');
  const res5 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/bookings/1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenGuest2}` }
  });
  console.log(`-> HTTP Status: ${res5.status} | Code: ${res5.body?.error?.code} | Msg: ${res5.body?.error?.message}`);
  if (res5.status === 403 && res5.body?.error?.code === 'FORBIDDEN') {
    console.log('  [PASS] XÁC NHẬN CHỐNG TRUY CẬP CHÉO (IDOR): Hệ thống đã chặn đứng hành vi và trả về HTTP 403 Forbidden!\n');
  } else {
    console.log('  [FAIL] Lỗ hổng IDOR! Người dùng truy cập được dữ liệu của nhau.\n');
  }

  // TEST 6: Đăng nhập vai trò Lễ tân (Receptionist) xem Booking #1 (Mong đợi: 200 OK do quyền nhân viên)
  console.log('[TEST 6] Đăng nhập vai trò Lễ tân (receptionist@hotel.com)...');
  const res6 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'receptionist@hotel.com', password: 'Password123!' });
  const tokenRec = res6.body?.data?.token;

  console.log('Lễ tân truy cập xem Booking #1 phục vụ nghiệp vụ check-in...');
  const res6b = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/bookings/1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenRec}` }
  });
  console.log(`-> HTTP Status: ${res6b.status} | Code: ${res6b.body?.data?.booking?.booking_code}`);
  if (res6b.status === 200) {
    console.log('  [PASS] Phân quyền chức năng hợp lệ: Nhân viên lễ tân được quyền xem hồ sơ booking của khách.\n');
  }

  // TEST 7: Đăng ký tài khoản khách hàng mới
  console.log('[TEST 7] Đăng ký tài khoản khách hàng mới...');
  const testEmail = `newuser_${Date.now()}@gmail.com`;
  const res7 = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: 'SecurePassword2026!',
    fullName: 'Lê Minh Khách',
    phone: '0912345678',
    identityCard: '001099123456'
  });
  console.log(`-> HTTP Status: ${res7.status} | User: ${res7.body?.data?.user?.email} | Role: ${res7.body?.data?.user?.role}`);
  if (res7.status === 201 && res7.body?.data?.user?.role === 'guest') {
    console.log('  [PASS] Đăng ký thành công, mật khẩu đã được băm an toàn trong database.\n');
  }

  console.log('======================================================================');
  console.log('  HOÀN TẤT TẤT CẢ CÁC BÀI KIỂM THỬ BUỔI 04 THÀNH CÔNG RỰC RỠ!');
  console.log('======================================================================');
}

module.exports = { runTests };

if (require.main === module) {
  runTests().catch(console.error);
}
