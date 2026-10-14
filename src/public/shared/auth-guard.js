window.authReady = (async function checkAuth() {
  localStorage.removeItem('token');
  const response = await fetch('/api/v1/auth/me', { credentials: 'same-origin' });
  if (!response.ok) {
    window.location.href = '/login.html';
    return;
  }
  const { data } = await response.json();
  const role = data.user.role;
  localStorage.setItem('role', role);
  localStorage.setItem('fullName', data.user.fullName || data.user.email);
  localStorage.setItem('email', data.user.email);

  const path = window.location.pathname;
  if (path.includes('/guest/') && role !== 'guest') window.location.href = '/login.html';
  if (path.includes('/receptionist/') && !['receptionist', 'manager', 'admin'].includes(role)) {
    window.location.href = '/login.html';
  }
  if (path.includes('/manager/') && !['manager', 'admin'].includes(role)) {
    window.location.href = '/login.html';
  }
  if (path.includes('/admin/') && role !== 'admin') window.location.href = '/login.html';
})().catch(() => { window.location.href = '/login.html'; });

async function logout() {
  try {
    const response = await API.request('/api/v1/auth/logout', 'POST');
    if (response.status !== 200) throw new Error('Đăng xuất chưa hoàn tất.');
  } catch (_) { showToast('Không đăng xuất được', 'Vui lòng thử lại khi có kết nối.'); return; }
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  localStorage.removeItem('email');
  window.location.href = '/login.html';
}
