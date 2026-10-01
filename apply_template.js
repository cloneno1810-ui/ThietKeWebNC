const fs = require('fs');
const path = require('path');

const baseDir = path.join('d:/ThietKeWEB/src/public');

// 1. Tạo CSS Template chuẩn theo hình ảnh
fs.writeFileSync(path.join(baseDir, 'shared', 'layout.css'), `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: 'Inter', sans-serif; 
  background-color: #f8fafc; 
  color: #1e293b; 
  display: flex; 
  height: 100vh; 
  overflow: hidden; 
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 40px;
  padding: 0 8px;
}
.sidebar-logo .icon {
  background: #3b82f6;
  color: white;
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s;
}
.menu-item:hover { background: #f8fafc; color: #3b82f6; }
.menu-item.active { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); }

/* Main Wrapper */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.header {
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}
.page-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; }
.header-right { display: flex; align-items: center; gap: 24px; }
.search-bar {
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 300px;
}
.search-bar input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.9rem; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: #cbd5e1; overflow: hidden; }

/* Main Content Area */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem;
}
.stat-info p { color: #94a3b8; font-size: 0.85rem; font-weight: 500; margin-bottom: 4px; }
.stat-info h3 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.stat-trend { font-size: 0.8rem; font-weight: 600; margin-left: auto; }
.trend-up { color: #10b981; }

/* Grid Layout (Left List / Right Details) */
.dashboard-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
}

/* Section Titles */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; }

/* Booking Card (Left) */
.booking-list { display: flex; flex-direction: column; gap: 16px; }
.booking-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}
.booking-card:hover { border-color: #cbd5e1; }
.booking-card.active { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-id { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.badge.yellow { background: #fef3c7; color: #d97706; }
.badge.green { background: #dcfce7; color: #166534; }
.badge.red { background: #fee2e2; color: #991b1b; }

.card-customer { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.card-time { font-size: 0.8rem; color: #94a3b8; margin-bottom: 16px; }

.card-item { background: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; color: #475569; display: flex; justify-content: space-between; margin-bottom: 16px;}
.card-address { display: flex; gap: 8px; color: #64748b; font-size: 0.85rem; align-items: center; }
.btn-icon { background: #eff6ff; color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; margin-left: auto; cursor: pointer; }

/* Detail Panel (Right) */
.detail-panel { background: transparent; }
.detail-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
.detail-content { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

/* Timeline & Bill */
.timeline-card, .bill-card, .info-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
.timeline { display: flex; flex-direction: column; gap: 20px; position: relative; }
.timeline::before { content:''; position: absolute; left: 15px; top: 10px; bottom: 10px; width: 2px; background: #e2e8f0; z-index: 1; }
.tl-item { display: flex; gap: 16px; position: relative; z-index: 2; }
.tl-icon { width: 32px; height: 32px; background: #eff6ff; color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
.tl-info h4 { font-size: 0.9rem; color: #1e293b; margin-bottom: 4px; }
.tl-info p { font-size: 0.75rem; color: #94a3b8; }

.bill-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; margin-bottom: 12px; }
.bill-total { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 16px; margin-top: 4px; }

.action-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; margin-top: 16px; }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }

/* Utilities */
.hidden { display: none !important; }
`);

// 2. JS Wrapper để nhúng Sidebar & Header
const jsWrapperContent = `
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem('role') || 'guest';
  const currentPath = window.location.pathname;
  
  // Define menu by role
  const menus = {
    guest: [
      { name: 'Dashboard', icon: 'fa-home', path: '/guest/dashboard.html' },
      { name: 'Đặt phòng', icon: 'fa-bed', path: '/guest/rooms.html' },
      { name: 'Đơn của tôi', icon: 'fa-file-invoice', path: '/guest/my-bookings.html' }
    ],
    receptionist: [
      { name: 'Dashboard', icon: 'fa-home', path: '/receptionist/dashboard.html' },
      { name: 'Khách hàng', icon: 'fa-users', path: '/receptionist/customers.html' },
      { name: 'QL Đặt phòng', icon: 'fa-calendar-check', path: '/receptionist/bookings.html' }
    ],
    manager: [
      { name: 'Dashboard', icon: 'fa-home', path: '/manager/dashboard.html' },
      { name: 'QL Phòng', icon: 'fa-door-open', path: '/manager/rooms.html' },
      { name: 'Hạng phòng', icon: 'fa-star', path: '/manager/room-types.html' }
    ],
    admin: [
      { name: 'Dashboard', icon: 'fa-home', path: '/admin/dashboard.html' },
      { name: 'Nhật ký HT', icon: 'fa-shield-alt', path: '/admin/audit-logs.html' }
    ]
  };

  const myMenu = menus[role] || menus.guest;
  
  let menuHtml = '';
  myMenu.forEach(m => {
     menuHtml += '<a href="' + m.path + '" class="menu-item ' + (currentPath.includes(m.path) ? 'active' : '') + '">';
     menuHtml += '<i class="fa-solid ' + m.icon + '" style="width:20px; text-align:center;"></i>' + m.name + '</a>';
  });

  const sidebarHTML = \`
    <div class="sidebar">
      <div class="sidebar-logo">
        <div class="icon"><i class="fa-solid fa-hotel"></i></div>
        DT07 Hotel
      </div>
      <div class="sidebar-menu">
        \${menuHtml}
      </div>
      
      <a href="#" onclick="logout()" class="menu-item" style="margin-top: auto; color:#ef4444;">
        <i class="fa-solid fa-sign-out-alt" style="width:20px; text-align:center;"></i> Đăng xuất
      </a>
    </div>
  \`;

  const headerHTML = \`
    <div class="header">
      <div class="page-title">\${document.title}</div>
      <div class="header-right">
        <div class="search-bar">
          <i class="fa-solid fa-search" style="color:#94a3b8"></i>
          <input type="text" placeholder="Tìm kiếm...">
        </div>
        <i class="fa-regular fa-bell" style="font-size:1.2rem; color:#64748b; cursor:pointer;"></i>
        <div class="avatar"><img src="https://ui-avatars.com/api/?name=\${role}&background=3b82f6&color=fff" style="width:100%"></div>
      </div>
    </div>
  \`;

  // Wrap body content
  const originalBody = document.body.innerHTML;
  document.body.innerHTML = \`
    \${sidebarHTML}
    <div class="main-wrapper">
      \${headerHTML}
      <div class="main-content">
        \${originalBody}
      </div>
    </div>
  \`;
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login.html';
}
`;
fs.writeFileSync(path.join(baseDir, 'shared', 'ui-wrapper.js'), jsWrapperContent);

// 3. Viết lại trang Lễ tân (Receptionist Bookings) giống hệt template thiết kế
const bookingsHtmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Tất cả Đơn đặt phòng</title>
  <link rel="stylesheet" href="/shared/layout.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="/shared/auth-guard.js"></script>
  <script src="/shared/api.js"></script>
  <script src="/shared/ui-wrapper.js"></script>
</head>
<body>

  <!-- Stats Row -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon" style="background:#e0f2fe; color:#0284c7;"><i class="fa-solid fa-box"></i></div>
      <div class="stat-info"><p>Tổng Đơn Đặt</p><h3 id="st-total">0</h3></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fef3c7; color:#d97706;"><i class="fa-solid fa-key"></i></div>
      <div class="stat-info"><p>Đã Check-in</p><h3 id="st-checkedin">0</h3></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#dcfce7; color:#166534;"><i class="fa-solid fa-money-bill-wave"></i></div>
      <div class="stat-info"><p>Doanh Thu (Dự kiến)</p><h3 id="st-revenue">0đ</h3></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fee2e2; color:#991b1b;"><i class="fa-solid fa-ban"></i></div>
      <div class="stat-info"><p>Đơn Đã Hủy</p><h3 id="st-cancelled">0</h3></div>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- Left Column: Order List -->
    <div class="left-col">
      <div class="section-header">
        <div class="section-title">Danh sách Đặt phòng</div>
        <button style="background:white; border:1px solid #e2e8f0; padding:6px 12px; border-radius:6px; cursor:pointer; color:#64748b"><i class="fa-solid fa-filter"></i> Bộ lọc</button>
      </div>
      <div class="booking-list" id="booking-list">
        <!-- JS Render Here -->
      </div>
    </div>

    <!-- Right Column: Detail Panel -->
    <div class="right-col" id="detail-panel" style="display:none;">
      <div class="section-header">
        <div class="section-title">Chi tiết Đơn <span id="dt-id"></span></div>
        <button style="background:white; border:1px solid #e2e8f0; padding:6px 12px; border-radius:6px; cursor:pointer; color:#64748b"><i class="fa-solid fa-print"></i> Hóa đơn</button>
      </div>
      
      <div class="detail-header">
        <div>
          <h2 id="dt-name" style="font-size:1.5rem; margin-bottom:4px;">-</h2>
          <p id="dt-time" style="color:#64748b; font-size:0.9rem;">-</p>
        </div>
        <div id="dt-badge" class="badge"></div>
      </div>

      <div class="detail-content">
        <!-- Timeline -->
        <div>
          <h3 style="font-size:1rem; margin-bottom:16px;">Tiến trình Đặt phòng</h3>
          <div class="timeline-card">
            <div class="card-item" style="margin-bottom:20px; background:#f8fafc; font-weight:600;"><span id="dt-roomtype"></span></div>
            <div class="timeline" id="dt-timeline">
              <!-- JS Render Timeline -->
            </div>
            
            <div id="action-container"></div>
          </div>
        </div>

        <!-- Info & Bill -->
        <div>
          <h3 style="font-size:1rem; margin-bottom:16px;">Thông tin Khách & Phòng</h3>
          <div class="info-card">
             <div style="display:flex; gap:12px; margin-bottom:16px;">
               <div style="width:40px; height:40px; background:#eff6ff; color:#3b82f6; border-radius:8px; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-door-open"></i></div>
               <div>
                 <p style="font-size:0.8rem; color:#64748b;">Số phòng</p>
                 <h4 id="dt-room" style="font-size:1rem; color:#1e293b;">Chưa xếp phòng</h4>
               </div>
             </div>
             <div style="display:flex; gap:12px;">
               <div style="width:40px; height:40px; background:#eff6ff; color:#3b82f6; border-radius:8px; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-user-check"></i></div>
               <div>
                 <p style="font-size:0.8rem; color:#64748b;">Khách hàng</p>
                 <h4 id="dt-phone" style="font-size:1rem; color:#1e293b;">-</h4>
               </div>
             </div>
          </div>

          <h3 style="font-size:1rem; margin-bottom:16px;">Chi tiết Thanh toán</h3>
          <div class="bill-card">
            <div class="bill-row"><span>Tiền phòng</span><span id="bl-room">0</span></div>
            <div class="bill-row"><span>Phụ phí</span><span>0</span></div>
            <div class="bill-row"><span>VAT (8%)</span><span id="bl-vat">0</span></div>
            <div class="bill-total"><span>Tổng cộng</span><span id="bl-total">0</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let allBookings = [];
    
    function formatMoney(num) { return Number(num).toLocaleString('vi-VN') + ' đ'; }
    
    function getBadge(status) {
      if (status === 'pending_payment') return '<span class="badge yellow">Chờ thanh toán</span>';
      if (status === 'confirmed') return '<span class="badge yellow">Đã xác nhận</span>';
      if (status === 'checked_in') return '<span class="badge green">Đang ở</span>';
      if (status === 'checked_out') return '<span class="badge green">Đã Check-out</span>';
      if (status === 'cancelled') return '<span class="badge red">Đã Hủy</span>';
      return '<span class="badge">' + status + '</span>';
    }

    async function loadData() {
      const res = await API.request('/api/v1/bookings');
      if(res.status === 200) {
        allBookings = res.data.data.bookings;
        renderStats();
        renderList();
      }
    }

    function renderStats() {
      document.getElementById('st-total').innerText = allBookings.length;
      document.getElementById('st-checkedin').innerText = allBookings.filter(b => b.status === 'checked_in').length;
      document.getElementById('st-cancelled').innerText = allBookings.filter(b => b.status === 'cancelled').length;
      let rev = 0;
      allBookings.forEach(b => { if(b.status !== 'cancelled') rev += Number(b.total_price); });
      document.getElementById('st-revenue').innerText = formatMoney(rev);
    }

    function renderList() {
      const html = allBookings.map(b => {
        return '<div class="booking-card" onclick="showDetail(' + b.id + ')" id="card-' + b.id + '">' +
          '<div class="card-top">' +
            '<div class="card-id">#' + b.booking_code + '</div>' +
            getBadge(b.status) +
          '</div>' +
          '<div class="card-customer">' + b.guest_name + '</div>' +
          '<div class="card-time">' + b.check_in_date.substring(0,10) + ' &nbsp;&rarr;&nbsp; ' + b.check_out_date.substring(0,10) + '</div>' +
          
          '<div class="card-item">' +
            '<span>1 x ' + b.room_type_name + '</span>' +
            '<i class="fa-solid fa-chevron-down" style="color:#94a3b8"></i>' +
          '</div>' +
          
          '<div class="card-address">' +
            '<i class="fa-solid fa-envelope" style="color:#3b82f6"></i> ' + (b.guest_email || 'No email') +
            '<button class="btn-icon"><i class="fa-solid fa-phone"></i></button>' +
          '</div>' +
        '</div>';
      }).join('');
      document.getElementById('booking-list').innerHTML = html;
    }

    function showDetail(id) {
      document.querySelectorAll('.booking-card').forEach(el => el.classList.remove('active'));
      document.getElementById('card-'+id).classList.add('active');
      document.getElementById('detail-panel').style.display = 'block';
      
      const b = allBookings.find(x => x.id === id);
      
      document.getElementById('dt-id').innerText = '#' + b.booking_code;
      document.getElementById('dt-name').innerText = b.guest_name;
      document.getElementById('dt-time').innerText = b.created_at.substring(0,10) + ' | ' + b.created_at.substring(11,16);
      document.getElementById('dt-badge').innerHTML = getBadge(b.status);
      document.getElementById('dt-roomtype').innerText = '1 x ' + b.room_type_name;
      
      document.getElementById('dt-room').innerText = b.room_number || 'Chưa xếp phòng';
      document.getElementById('dt-phone').innerText = b.guest_phone || 'Không có SĐT';
      
      const price = Number(b.total_price);
      document.getElementById('bl-room').innerText = formatMoney(price);
      document.getElementById('bl-vat').innerText = formatMoney(price * 0.08);
      document.getElementById('bl-total').innerText = formatMoney(price * 1.08);

      // Render timeline & actions
      let timeline = '';
      let actionBtn = '';
      
      const tlItem = (icon, title, time, active) => {
        return '<div class="tl-item">' +
          '<div class="tl-icon" style="background:' + (active ? '#eff6ff' : '#f1f5f9') + '; color:' + (active ? '#3b82f6' : '#94a3b8') + '">' +
            '<i class="fa-solid ' + icon + '"></i>' +
          '</div>' +
          '<div class="tl-info">' +
            '<h4 style="color:' + (active ? '#1e293b' : '#94a3b8') + '">' + title + '</h4>' +
            '<p>' + time + '</p>' +
          '</div>' +
        '</div>';
      };

      timeline += tlItem('fa-receipt', 'Đã đặt phòng', b.created_at.substring(0,10), true);
      
      if (b.status === 'cancelled') {
        timeline += tlItem('fa-ban', 'Đã hủy', '-', true);
      } else {
        const isConfirmed = b.status !== 'pending_payment';
        const isCheckIn = b.status === 'checked_in' || b.status === 'checked_out';
        const isCheckOut = b.status === 'checked_out';
        
        timeline += tlItem('fa-thumbs-up', 'Đã xác nhận', isConfirmed ? 'Hoàn tất' : 'Chờ xử lý', isConfirmed);
        timeline += tlItem('fa-door-open', 'Check-in', isCheckIn ? 'Đã nhận phòng' : '-', isCheckIn);
        timeline += tlItem('fa-door-closed', 'Check-out', isCheckOut ? 'Đã trả phòng' : '-', isCheckOut);

        if (b.status === 'confirmed' || b.status === 'pending_payment') {
          actionBtn = '<button class="action-btn btn-primary" onclick="doAction(' + b.id + ', \\'check-in\\')">Thực hiện Check-in</button>';
        } else if (b.status === 'checked_in') {
          actionBtn = '<button class="action-btn btn-primary" style="background:#10b981" onclick="doAction(' + b.id + ', \\'check-out\\')">Thực hiện Check-out</button>';
        }
      }
      
      document.getElementById('dt-timeline').innerHTML = timeline;
      document.getElementById('action-container').innerHTML = actionBtn;
    }
    
    async function doAction(id, action) {
      const res = await API.request('/api/v1/bookings/'+id+'/'+action, 'POST');
      if(res.status===200) {
        alert('Thành công!');
        await loadData();
        showDetail(id);
      } else alert('Lỗi: ' + res.data.error.message);
    }

    // Auto load on init
    setTimeout(loadData, 100);
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(baseDir, 'receptionist', 'bookings.html'), bookingsHtmlContent);

console.log('Template Applied Successfully!');
