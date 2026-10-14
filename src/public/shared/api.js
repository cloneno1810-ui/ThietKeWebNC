
window.Security = {
  escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
};
const API = {
  async csrfHeaders() {
    const response = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) this.clearSession();
    if (!response.ok) throw new Error(result.error?.message || 'Không lấy được mã bảo vệ phiên. Vui lòng thử lại.');
    return { 'X-CSRF-Token': result.data.csrfToken };
  },

  clearSession() {
    ['token', 'role', 'fullName', 'email'].forEach(key => localStorage.removeItem(key));
    window.location.href = '/login.html';
  },

  async request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (window.authReady) await window.authReady;
    if (!['GET', 'HEAD'].includes(method)) Object.assign(headers, await this.csrfHeaders());

    const options = { method, headers, credentials: 'include' };
    if (!['GET', 'HEAD'].includes(method)) options.body = JSON.stringify(body ?? {});

    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      this.clearSession();
      return { status: 401, data: {} };
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }
};
