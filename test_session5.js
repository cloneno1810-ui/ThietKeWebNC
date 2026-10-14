const http = require('http');

const request = (method, path, token, body = null) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function testSession5() {
  console.log('=== TEST SESSION 5 ===\n');

  // 1. Đăng nhập để lấy token của Admin và Guest
  const adminRes = await request('POST', '/api/v1/auth/login', null, { email: 'admin@hotel.com', password: 'Password123!' });
  const guestRes = await request('POST', '/api/v1/auth/login', null, { email: 'guest1@gmail.com', password: 'Password123!' });
  
  const tokenAdmin = adminRes.body.data?.token;
  const tokenGuest = guestRes.body.data?.token;
  console.log(`[AUTH] Lấy token thành công.`);

  // 2. Test Validation với Dữ liệu sai
  const valRes = await request('POST', '/api/v1/auth/register', null, { email: 'not-an-email', password: '123' });
  console.log(`[TEST VALIDATION] Expected 400. Got: ${valRes.status}`);
  if(valRes.body && valRes.body.error) console.log(' -> Errors:', valRes.body.error.details.map(d => d.message).join(' | '));

  // 3. Test Room CRUD (Admin)
  const createRoom = await request('POST', '/api/v1/rooms', tokenAdmin, { room_number: '999', floor: 9, room_type_id: 1, status: 'available' });
  console.log(`\n[TEST ROOM CREATE] Expected 201. Got: ${createRoom.status}`);
  
  const listRoom = await request('GET', '/api/v1/rooms?status=available&limit=2', tokenAdmin);
  console.log(`[TEST ROOM LIST PAGINATION] Expected 200. Got: ${listRoom.status}. Items: ${listRoom.body.data?.rooms?.length || 0}`);

  // 4. Test Booking (Guest)
  const createBooking = await request('POST', '/api/v1/bookings', tokenGuest, {
    room_type_id: 1,
    check_in_date: '2026-12-01',
    check_out_date: '2026-12-05',
    num_guests: 2
  });
  console.log(`\n[TEST BOOKING CREATE] Expected 201. Got: ${createBooking.status}`);
  const bookingId = createBooking.body.data?.booking?.id;

  if (bookingId) {
    // 5. Check-In Booking (Admin)
    const checkIn = await request('POST', `/api/v1/bookings/${bookingId}/check-in`, tokenAdmin);
    console.log(`[TEST BOOKING CHECK-IN] Expected 200. Got: ${checkIn.status}`);
  }

  // 6. Test Rate Limit (Gửi nhiều request cùng lúc)
  console.log(`\n[TEST RATE LIMIT] Gửi 15 request login liên tục...`);
  let rlStatus = 200;
  for(let i = 0; i < 15; i++) {
    const r = await request('POST', '/api/v1/auth/login', null, { email: 'admin@hotel.com', password: 'bad' });
    if(r.status === 429) rlStatus = 429;
  }
  console.log(`[TEST RATE LIMIT] Expected 429 at end. Got: ${rlStatus}`);
}

testSession5();
