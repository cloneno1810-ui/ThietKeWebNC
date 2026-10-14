(function checkAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || !role) {
    window.location.href = '/login.html';
    return;
  }

  const path = window.location.pathname;
  if (path.includes('/guest/') && role !== 'guest') window.location.href = '/login.html';
  if (path.includes('/receptionist/') && !['receptionist', 'manager', 'admin'].includes(role)) {
    window.location.href = '/login.html';
  }
  if (path.includes('/manager/') && !['manager', 'admin'].includes(role)) {
    window.location.href = '/login.html';
  }
  if (path.includes('/admin/') && role !== 'admin') window.location.href = '/login.html';
})();

async function logout() {
  try {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      credentials: 'include'
    });
  } catch (_) { /* ignore */ }
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  localStorage.removeItem('email');
  window.location.href = '/login.html';
}
