function ensureFontAwesome() {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
  document.head.appendChild(link);
}

function showToast(title, detail, ok) {
  const existing = document.getElementById('_dev_toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = '_dev_toast';
  toast.innerHTML = '<span style="font-size:1.2rem">' + (ok ? '✓' : 'i') + '</span>' +
    '<div><strong style="display:block;margin-bottom:2px">' + title + '</strong>' +
    (detail ? '<small style="color:#94a3b8">' + detail + '</small>' : '') + '</div>';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:#1e293b;color:#f8fafc;padding:14px 18px;border-radius:12px;display:flex;align-items:center;gap:14px;font-size:.875rem;box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:320px;';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  ensureFontAwesome();
  const role = localStorage.getItem('role') || 'guest';
  const currentPath = window.location.pathname;
  const fullName = localStorage.getItem('fullName') || role;
  const email = localStorage.getItem('email') || '';
  const menus = {
    guest: [{ name: 'Đặt phòng', icon: 'fa-bed', path: '/guest/rooms.html' }, { name: 'Đơn của tôi', icon: 'fa-file-invoice', path: '/guest/my-bookings.html' }],
    receptionist: [{ name: 'Dashboard', icon: 'fa-house', path: '/receptionist/bookings.html' }, { name: 'Khách hàng', icon: 'fa-user', path: '/receptionist/customers.html' }],
    manager: [{ name: 'Dashboard', icon: 'fa-house', path: '/receptionist/bookings.html' }, { name: 'Phòng', icon: 'fa-door-open', path: '/manager/rooms.html' }, { name: 'Hạng phòng', icon: 'fa-star', path: '/manager/room-types.html' }, { name: 'Báo cáo', icon: 'fa-chart-column', path: '/manager/reports.html' }],
    admin: [{ name: 'Dashboard', icon: 'fa-house', path: '/receptionist/bookings.html' }, { name: 'Nhật ký', icon: 'fa-shield-halved', path: '/admin/audit-logs.html' }, { name: 'Báo cáo', icon: 'fa-chart-column', path: '/manager/reports.html' }]
  };
  const menuHtml = (menus[role] || []).map((m) => {
    const active = currentPath === m.path || currentPath.endsWith(m.path);
    return '<a href="' + m.path + '" class="menu-item' + (active ? ' active' : '') + '"><i class="fa-solid ' + m.icon + '" style="width:18px;text-align:center"></i><span>' + m.name + '</span></a>';
  }).join('');
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = '<div class="sidebar-logo"><div class="icon"><i class="fa-solid fa-hotel"></i></div><div class="brand-text"><strong>DT07 Hotel</strong><small>Phenikaa Stay</small></div></div><div class="menu-label">Menu</div><div class="sidebar-menu">' + menuHtml + '</div><a href="#" id="btn-logout" class="menu-item logout"><i class="fa-solid fa-right-from-bracket" style="width:18px;text-align:center"></i><span>Đăng xuất</span></a>';
  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = '<div class="page-title">' + (document.title || 'Dashboard') + '</div><div class="header-right"><div class="search-bar"><i class="fa-solid fa-magnifying-glass" style="color:#94a3b8"></i><input type="search" placeholder="Tìm mã đơn..." id="header-search"></div><div style="position:relative"><button type="button" class="icon-btn" id="btn-mail" title="Hộp thư"><i class="fa-regular fa-envelope"></i></button><div class="dropdown-panel" id="mail-panel"><div class="dropdown-item"><strong>Hộp thư</strong></div><div class="dropdown-item">' + (email || 'Chưa có email tài khoản') + '</div><div class="dropdown-item">Liên hệ GV: tanh.nguyenvan@phenikaa-uni.edu.vn</div></div></div><div style="position:relative"><button type="button" class="icon-btn" id="btn-bell" title="Thông báo"><i class="fa-regular fa-bell"></i><span class="dot" id="bell-dot" style="display:none"></span></button><div class="dropdown-panel" id="bell-panel"><div class="dropdown-item"><strong>Thông báo</strong></div><div class="dropdown-item" id="bell-list">Đang tải...</div></div></div><div style="position:relative"><div class="avatar" id="btn-avatar" title="' + fullName + '"><img alt="" src="https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=3b82f6&color=fff"></div><div class="dropdown-panel" id="avatar-panel"><div class="dropdown-item"><strong>' + fullName + '</strong><br><small>' + email + ' · ' + role + '</small></div><div class="dropdown-item action" id="avatar-logout">Đăng xuất</div></div></div></div>';
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = '';
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'main-wrapper';
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  mainContent.innerHTML = originalContent;
  mainWrapper.appendChild(header);
  mainWrapper.appendChild(mainContent);
  document.body.appendChild(sidebar);
  document.body.appendChild(mainWrapper);
  const doLogout = (e) => { e.preventDefault(); logout(); };
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  document.getElementById('avatar-logout').addEventListener('click', doLogout);
  const search = document.getElementById('header-search');
  search.addEventListener('input', () => window.dispatchEvent(new CustomEvent('app:search', { detail: search.value.trim() })));
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
  const toggle = (id) => { const panel = document.getElementById(id); const open = !panel.classList.contains('open'); document.querySelectorAll('.dropdown-panel').forEach((p) => p.classList.remove('open')); if (open) panel.classList.add('open'); };
  document.getElementById('btn-mail').addEventListener('click', (e) => { e.stopPropagation(); toggle('mail-panel'); });
  document.getElementById('btn-bell').addEventListener('click', (e) => { e.stopPropagation(); toggle('bell-panel'); });
  document.getElementById('btn-avatar').addEventListener('click', (e) => { e.stopPropagation(); toggle('avatar-panel'); });
  document.addEventListener('click', () => document.querySelectorAll('.dropdown-panel').forEach((p) => p.classList.remove('open')));
  API.request('/api/v1/bookings').then((res) => {
    const list = (res.data && res.data.data && res.data.data.bookings) || [];
    const pending = list.filter((b) => b.status === 'pending_payment' || b.status === 'confirmed');
    const bellList = document.getElementById('bell-list');
    if (pending.length) { document.getElementById('bell-dot').style.display = 'block'; bellList.innerHTML = pending.slice(0, 5).map((b) => '<div>' + b.booking_code + ' · ' + b.guest_name + '</div>').join(''); } else bellList.textContent = 'Không có thông báo mới.';
  }).catch(() => { document.getElementById('bell-list').textContent = 'Không tải được thông báo.'; });
  window.dispatchEvent(new Event('app:ready'));
});
