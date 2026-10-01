
const API = {
  getToken() { return localStorage.getItem('token'); },

  async request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const options = { method, headers, credentials: 'include' };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      window.location.href = '/login.html';
      return { status: 401, data: {} };
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }
};
