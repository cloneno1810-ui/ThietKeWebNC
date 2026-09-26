/**
 * Kịch bản kiểm thử tự động Chặng 4 (đúng 5 ca nộp ảnh):
 *  Ảnh 08 — GET /api/v1/auth/me chưa token → 401 UNAUTHORIZED
 *  Ảnh 09 — guest1 POST /api/v1/room-types → 403 FORBIDDEN (RBAC)
 *  Ảnh 10 — guest1 PATCH /api/v1/bookings/2/cancel (đơn guest2) → 403 FORBIDDEN (ABAC)
 *  Ảnh 12 — cột users.password_hash là bcrypt ($2a$ / $2b$)
 *  Ảnh 19 — Set-Cookie: HttpOnly, SameSite=Lax, Path=/
 */

require('dotenv').config();
const http = require('http');
const db = require('./src/config/db');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch (e) {
          body = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function jsonOpts(path, method, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return {
    hostname: 'localhost',
    port: process.env.PORT || 8080,
    path,
    method,
    headers
  };
}

async function login(email, password) {
  const res = await makeRequest(jsonOpts('/api/v1/auth/login', 'POST'), { email, password });
  return { res, token: res.body?.data?.token };
}

async function runTests() {
  const results = [];
  console.log('======================================================================');
  console.log('  NHẬT KÝ KIỂM THỬ TẠI CHỖ — CHẶNG 4 (XÁC THỰC & PHÂN QUYỀN)');
  console.log('======================================================================\n');

  // Ảnh 08
  console.log('[CA 1 / Ảnh 08] GET /api/v1/auth/me khi chưa gửi token...');
  const resMe = await makeRequest(jsonOpts('/api/v1/auth/me', 'GET'));
  const pass08 = resMe.status === 401 && resMe.body?.error?.code === 'UNAUTHORIZED';
  console.log(`  HTTP ${resMe.status} | ${resMe.body?.error?.code}`);
  console.log(pass08 ? '  [ĐẠT] 401 Unauthorized.\n' : '  [KHÔNG ĐẠT]\n');
  results.push({ id: '08', name: '401 Unauthorized /auth/me', pass: pass08, status: resMe.status });

  console.log('[Đăng nhập] guest1@gmail.com ...');
  const { res: loginGuest, token: tokenGuest1 } = await login('guest1@gmail.com', 'Password123!');
  if (!tokenGuest1) {
    console.log('  [LỖI] Không đăng nhập được guest1:', loginGuest.body);
    process.exit(1);
  }
  console.log(`  HTTP ${loginGuest.status} | token nhận được.\n`);

  // Ảnh 19
  const setCookie = loginGuest.headers['set-cookie'] || [];
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
  const pass19 =
    /token=/i.test(cookieStr) &&
    /HttpOnly/i.test(cookieStr) &&
    /SameSite=Lax/i.test(cookieStr) &&
    /Path=\//i.test(cookieStr);
  console.log('[CA 5 / Ảnh 19] Set-Cookie sau đăng nhập:');
  console.log(`  ${cookieStr || '(không có header Set-Cookie)'}`);
  console.log(pass19 ? '  [ĐẠT] HttpOnly + SameSite=Lax + Path=/\n' : '  [KHÔNG ĐẠT]\n');
  results.push({ id: '19', name: 'Cookie HttpOnly SameSite=Lax Path=/', pass: pass19, status: cookieStr });

  // Ảnh 09
  console.log('[CA 2 / Ảnh 09] guest1 POST /api/v1/room-types (thiếu quyền chức năng)...');
  const resRoom = await makeRequest(jsonOpts('/api/v1/room-types', 'POST', tokenGuest1), {
    name: 'Unauthorized Suite',
    basePricePerNight: 999000,
    maxOccupancy: 2
  });
  const pass09 = resRoom.status === 403 && resRoom.body?.error?.code === 'FORBIDDEN';
  console.log(`  HTTP ${resRoom.status} | ${resRoom.body?.error?.code}`);
  console.log(pass09 ? '  [ĐẠT] 403 Forbidden (RBAC).\n' : '  [KHÔNG ĐẠT]\n');
  results.push({ id: '09', name: '403 RBAC POST /room-types', pass: pass09, status: resRoom.status });

  // Ảnh 10
  console.log('[CA 3 / Ảnh 10] guest1 PATCH /api/v1/bookings/2/cancel (đơn của guest2)...');
  const resCancel = await makeRequest(jsonOpts('/api/v1/bookings/2/cancel', 'PATCH', tokenGuest1), {});
  const pass10 =
    (resCancel.status === 403 || resCancel.status === 404) &&
    (resCancel.body?.error?.code === 'FORBIDDEN' || resCancel.body?.error?.code === 'RESOURCE_NOT_FOUND');
  console.log(`  HTTP ${resCancel.status} | ${resCancel.body?.error?.code}`);
  console.log(pass10 ? '  [ĐẠT] Chống truy cập chéo (ABAC).\n' : '  [KHÔNG ĐẠT]\n');
  results.push({ id: '10', name: '403/404 ABAC cancel booking #2', pass: pass10, status: resCancel.status });

  // Ảnh 12
  console.log('[CA 4 / Ảnh 12] Kiểm tra users.password_hash là bcrypt, không phải plaintext...');
  const hashRows = await db.query(
    `SELECT email, password_hash FROM users WHERE email IN ('guest1@gmail.com', 'admin@hotel.com') ORDER BY email;`
  );
  const bcryptRe = /^\$2[aby]\$\d{2}\$.{53}$/;
  const allHashed = hashRows.rows.length > 0 && hashRows.rows.every((row) => {
    const hash = row.password_hash || '';
    const looksHashed = bcryptRe.test(hash) || hash.startsWith('$2a$') || hash.startsWith('$2b$');
    const notPlain = hash !== 'Password123!' && !hash.toLowerCase().includes('password123');
    console.log(`  ${row.email}: ${hash.substring(0, 29)}...`);
    return looksHashed && notPlain;
  });
  console.log(allHashed ? '  [ĐẠT] Cột mật khẩu là mã băm bcrypt.\n' : '  [KHÔNG ĐẠT]\n');
  results.push({ id: '12', name: 'password_hash bcrypt', pass: allHashed, status: hashRows.rows[0]?.password_hash?.substring(0, 29) });

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log('======================================================================');
  console.log(`  KẾT QUẢ: ${passed}/${total} ca ĐẠT — ${passed === total ? 'ĐẠT 100%' : 'CHƯA ĐẠT'}`);
  console.log('======================================================================');

  return { passed, total, results };
}

module.exports = { runTests };

if (require.main === module) {
  runTests()
    .then(({ passed, total }) => process.exit(passed === total ? 0 : 1))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
