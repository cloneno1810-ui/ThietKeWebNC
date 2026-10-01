const fs = require('fs');
const path = require('path');

const baseDir = path.join('d:/ThietKeWEB/src/public');
const dirs = ['shared', 'guest', 'receptionist', 'manager', 'admin'];

dirs.forEach(d => {
  const dirPath = path.join(baseDir, d);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// 1. SHARED FILES
fs.writeFileSync(path.join(baseDir, 'shared', 'api.js'), `
const API = {
  getToken() { return localStorage.getItem('token'); },
  
  async request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const options = { method, headers, credentials: 'omit' };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login.html';
    }
    const data = await res.json();
    return { status: res.status, data };
  }
};
`);

fs.writeFileSync(path.join(baseDir, 'shared', 'auth-guard.js'), `
(function checkAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || !role) {
    window.location.href = '/login.html';
    return;
  }
  
  // Basic path role checking
  const path = window.location.pathname;
  if (path.includes('/guest/') && role !== 'guest') window.location.href = '/login.html';
  if (path.includes('/receptionist/') && role !== 'receptionist' && role !== 'manager' && role !== 'admin') window.location.href = '/login.html';
  if (path.includes('/manager/') && role !== 'manager' && role !== 'admin') window.location.href = '/login.html';
  if (path.includes('/admin/') && role !== 'admin') window.location.href = '/login.html';
})();

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login.html';
}
`);

fs.writeFileSync(path.join(baseDir, 'shared', 'layout.css'), `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Roboto', sans-serif; }
  body { background: #f1f5f9; color: #1e293b; padding: 20px; }
  .navbar { background: #1e3a6a; color: white; padding: 15px 20px; border-radius: 8px; display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
  .navbar a { color: #e2e8f0; text-decoration: none; font-weight: 500; }
  .navbar a:hover { color: #fff; text-decoration: underline; }
  .navbar button { margin-left: auto; background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
  .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  h2 { margin-bottom: 20px; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-weight: 600; }
  button { background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
  button:hover { background: #2563eb; }
  .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; background: #e2e8f0; }
`);

const navScript = `
<script>
  document.write(\`
    <div class="navbar">
      \${localStorage.getItem('role') === 'guest' ? '<a href="/guest/rooms.html">Đặt phòng</a> <a href="/guest/my-bookings.html">Đơn của tôi</a>' : ''}
      \${localStorage.getItem('role') === 'receptionist' ? '<a href="/receptionist/bookings.html">QL Đặt phòng</a>' : ''}
      \${localStorage.getItem('role') === 'manager' ? '<a href="/manager/rooms.html">QL Phòng</a> <a href="/manager/room-types.html">Hạng phòng</a>' : ''}
      \${localStorage.getItem('role') === 'admin' ? '<a href="/admin/audit-logs.html">Nhật ký Hệ thống</a>' : ''}
      <button onclick="logout()">Đăng xuất</button>
    </div>
  \`);
</script>
`;

const getHtmlTemplate = (title, scripts, bodyContent) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="/shared/layout.css">
  <script src="/shared/auth-guard.js"></script>
  <script src="/shared/api.js"></script>
</head>
<body>
  ${navScript}
  <div class="container">
    <h2>${title}</h2>
    ${bodyContent}
  </div>
  <script>
    ${scripts}
  </script>
</body>
</html>
`;

// 2. GUEST PAGES
fs.writeFileSync(path.join(baseDir, 'guest', 'rooms.html'), getHtmlTemplate('Danh sách Hạng phòng (Đặt phòng)', 
`
  async function loadRoomTypes() {
    const res = await API.request('/api/v1/room-types');
    if (res.status === 200) {
      const tbody = document.getElementById('rt-body');
      tbody.innerHTML = res.data.data.roomTypes.map(rt => \`
        <tr>
          <td>\${rt.name}</td>
          <td>\${rt.base_price_per_night} VND</td>
          <td>\${rt.max_occupancy} người</td>
          <td><button onclick="bookRoom(\${rt.id})">Đặt ngay</button></td>
        </tr>
      \`).join('');
    }
  }
  
  async function bookRoom(rtId) {
    const ci = prompt("Nhập ngày Check-in (YYYY-MM-DD):", "2026-10-01");
    const co = prompt("Nhập ngày Check-out (YYYY-MM-DD):", "2026-10-03");
    if(!ci || !co) return;
    
    const res = await API.request('/api/v1/bookings', 'POST', {
      room_type_id: rtId, check_in_date: ci, check_out_date: co, num_guests: 1
    });
    
    if(res.status === 201) {
      alert("Đặt phòng thành công!");
      window.location.href = '/guest/my-bookings.html';
    } else {
      alert("Lỗi: " + JSON.stringify(res.data.error.message));
    }
  }
  
  loadRoomTypes();
`,
`<table id="rt-table">
  <thead><tr><th>Loại phòng</th><th>Giá/Đêm</th><th>Sức chứa</th><th>Hành động</th></tr></thead>
  <tbody id="rt-body"></tbody>
</table>`
));

fs.writeFileSync(path.join(baseDir, 'guest', 'my-bookings.html'), getHtmlTemplate('Đơn đặt phòng của tôi',
`
  async function loadBookings() {
    const res = await API.request('/api/v1/bookings');
    if (res.status === 200) {
      const tbody = document.getElementById('bk-body');
      tbody.innerHTML = res.data.data.bookings.map(b => \`
        <tr>
          <td>\${b.booking_code}</td>
          <td>\${b.room_type_name}</td>
          <td>\${b.check_in_date.substring(0,10)} -> \${b.check_out_date.substring(0,10)}</td>
          <td><span class="badge">\${b.status}</span></td>
          <td>\${b.status === 'pending_payment' || b.status === 'confirmed' ? 
            \`<button style="background:#ef4444" onclick="cancelBooking(\${b.id})">Hủy</button>\` : ''}
          </td>
        </tr>
      \`).join('');
    }
  }
  
  async function cancelBooking(id) {
    if(!confirm("Bạn chắc chắn muốn hủy?")) return;
    const res = await API.request('/api/v1/bookings/'+id+'/cancel', 'PATCH');
    if(res.status === 200) {
      alert("Đã hủy đơn.");
      loadBookings();
    } else alert("Lỗi: " + JSON.stringify(res.data.error.message));
  }
  
  loadBookings();
`,
`<table>
  <thead><tr><th>Mã đơn</th><th>Hạng phòng</th><th>Thời gian</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
  <tbody id="bk-body"></tbody>
</table>`
));

// 3. RECEPTIONIST PAGES
fs.writeFileSync(path.join(baseDir, 'receptionist', 'bookings.html'), getHtmlTemplate('Quản lý Đặt phòng (Lễ tân)',
`
  async function loadBookings() {
    const res = await API.request('/api/v1/bookings');
    if (res.status === 200) {
      const tbody = document.getElementById('bk-body');
      tbody.innerHTML = res.data.data.bookings.map(b => \`
        <tr>
          <td>\${b.booking_code}</td>
          <td>\${b.guest_name} (\${b.user_email || b.guest_email})</td>
          <td><span class="badge">\${b.status}</span></td>
          <td>
            \${b.status === 'confirmed' || b.status === 'pending_payment' ? \`<button onclick="checkIn(\${b.id})">Check-in</button>\` : ''}
            \${b.status === 'checked_in' ? \`<button onclick="checkOut(\${b.id})">Check-out</button>\` : ''}
          </td>
        </tr>
      \`).join('');
    }
  }
  
  async function checkIn(id) {
    const res = await API.request('/api/v1/bookings/'+id+'/check-in', 'POST');
    if(res.status===200) { alert('Check-in thành công'); loadBookings(); }
    else alert('Lỗi: ' + res.data.error.message);
  }
  
  async function checkOut(id) {
    const res = await API.request('/api/v1/bookings/'+id+'/check-out', 'POST');
    if(res.status===200) { alert('Check-out thành công'); loadBookings(); }
    else alert('Lỗi: ' + res.data.error.message);
  }
  
  loadBookings();
`,
`<table>
  <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
  <tbody id="bk-body"></tbody>
</table>`
));

// 4. MANAGER PAGES
fs.writeFileSync(path.join(baseDir, 'manager', 'rooms.html'), getHtmlTemplate('Quản lý Phòng',
`
  async function loadRooms() {
    const res = await API.request('/api/v1/rooms?limit=100');
    if (res.status === 200) {
      const tbody = document.getElementById('rm-body');
      tbody.innerHTML = res.data.data.rooms.map(r => \`
        <tr>
          <td>\${r.room_number}</td>
          <td>\${r.room_type_name}</td>
          <td><span class="badge">\${r.status}</span></td>
          <td>
            <button onclick="updateStatus(\${r.id}, 'maintenance')">Bảo trì</button>
            <button onclick="updateStatus(\${r.id}, 'available')">Sẵn sàng</button>
          </td>
        </tr>
      \`).join('');
    }
  }
  
  async function updateStatus(id, st) {
    const res = await API.request('/api/v1/rooms/'+id+'/status', 'PATCH', {status: st});
    if(res.status===200) loadRooms();
    else alert('Lỗi: ' + res.data.error.message);
  }
  
  loadRooms();
`,
`<table>
  <thead><tr><th>Số phòng</th><th>Hạng</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
  <tbody id="rm-body"></tbody>
</table>`
));

fs.writeFileSync(path.join(baseDir, 'manager', 'room-types.html'), getHtmlTemplate('Quản lý Hạng phòng',
`
  async function loadRoomTypes() {
    const res = await API.request('/api/v1/room-types');
    if (res.status === 200) {
      const tbody = document.getElementById('rt-body');
      tbody.innerHTML = res.data.data.roomTypes.map(rt => \`
        <tr>
          <td>\${rt.name}</td>
          <td>\${rt.base_price_per_night}</td>
          <td>\${rt.max_occupancy}</td>
        </tr>
      \`).join('');
    }
  }
  
  loadRoomTypes();
`,
`<table>
  <thead><tr><th>Tên hạng</th><th>Giá cơ bản</th><th>Sức chứa</th></tr></thead>
  <tbody id="rt-body"></tbody>
</table>`
));

// 5. ADMIN PAGES
fs.writeFileSync(path.join(baseDir, 'admin', 'audit-logs.html'), getHtmlTemplate('Nhật ký Hệ thống (Admin)',
`
  async function loadLogs() {
    const res = await API.request('/api/v1/audit-logs');
    if (res.status === 200) {
      const tbody = document.getElementById('al-body');
      tbody.innerHTML = res.data.data.logs.map(l => \`
        <tr>
          <td>\${l.created_at.replace('T', ' ').substring(0,19)}</td>
          <td>User \${l.user_id || 'System'}</td>
          <td><span class="badge">\${l.action}</span></td>
          <td>\${l.details}</td>
        </tr>
      \`).join('');
    }
  }
  
  loadLogs();
`,
`<table>
  <thead><tr><th>Thời gian</th><th>User ID</th><th>Hành động</th><th>Chi tiết</th></tr></thead>
  <tbody id="al-body"></tbody>
</table>`
));

console.log('Created MVP UI files successfully!');
