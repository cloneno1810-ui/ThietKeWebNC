window.Hotel = {
  escape(value) { return Security.escapeHtml(value); },
  icon(name) {
    const paths = {
      search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
      arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
      user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/>',
      bed: '<path d="M3 18V8m18 10V8M3 17h18M5 13V7h14v6M4 13h16v4M8 7v6m8-6v6"/>',
      wifi: '<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-10 4a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r=".7"/>',
      shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.check) + '</svg>';
  },
  datePlus(days) {
    const date = new Date(); date.setDate(date.getDate() + days);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  },
  preferences() {
    try { return JSON.parse(sessionStorage.getItem('hotel-booking-preferences')) || {}; } catch (_) { return {}; }
  },
  roomImage(type) {
    const name = String(type.name || '').toLowerCase();
    if (name.includes('suite') || name.includes('executive')) return '/assets/hotel/room-superior.webp';
    if (name.includes('deluxe')) return '/assets/hotel/room-deluxe.webp';
    if (name.includes('superior') || name.includes('double')) return '/assets/hotel/room-superior.webp';
    return '/assets/hotel/room-standard.webp';
  },
  money(value) { return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' đ'; },
  savePreferences(value) { sessionStorage.setItem('hotel-booking-preferences', JSON.stringify(value)); },
  mount(user = null) {
    const home = document.body.dataset.hotelPage === 'home';
    const path = location.pathname;
    let header = document.getElementById('hotel-navigation');
    if (!header) { header = document.createElement('header'); header.id = 'hotel-navigation'; document.body.prepend(header); }
    header.className = 'hotel-header';
    const current = (link) => path === link ? ' aria-current="page"' : '';
    const account = user
      ? '<div class="hotel-account"><button class="hotel-account-toggle" id="hotel-account-toggle" aria-expanded="false" aria-controls="hotel-account-panel"><span class="hotel-account-initial">' + this.escape(Array.from(user.fullName || 'K')[0]) + '</span><span class="hotel-account-name">Tài khoản</span></button><div class="hotel-account-panel" id="hotel-account-panel"><strong>' + this.escape(user.fullName) + '</strong><small>' + this.escape(user.email) + '</small><a href="/guest/my-bookings.html">Đơn đặt phòng của tôi</a><button id="hotel-logout" type="button">Đăng xuất</button></div></div>'
      : '<a href="/login.html">Đăng nhập</a>';
    header.innerHTML = '<div class="hotel-container hotel-header-inner"><a class="hotel-brand" href="/"><span class="hotel-mark">DT<small>07</small></span><span><span class="hotel-brand-name">DT07 Hotel</span><span class="hotel-brand-note">PHENIKAA STAY</span></span></a><nav class="hotel-nav" id="hotel-menu" aria-label="Điều hướng chính"><a href="/#about">Khách sạn</a><a href="' + (home ? '#rooms' : '/guest/rooms.html') + '"' + current('/guest/rooms.html') + '>Hạng phòng</a><a href="/#amenities">Tiện nghi</a><a href="/#gallery">Hình ảnh</a>' + (user ? '<a href="/guest/my-bookings.html"' + current('/guest/my-bookings.html') + '>Đơn của tôi</a>' : '') + '</nav><div class="hotel-header-actions"><span class="hotel-language">VI</span>' + account + '<a class="hotel-button yellow" href="' + (home ? '#booking' : '/guest/rooms.html') + '">' + this.icon('calendar') + 'Đặt phòng</a></div><button id="hotel-menu-toggle" class="hotel-menu-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="hotel-menu">' + this.icon('menu') + '</button></div>';
    document.getElementById('hotel-menu-toggle').addEventListener('click', (event) => {
      const open = document.getElementById('hotel-menu').classList.toggle('open');
      event.currentTarget.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('#hotel-menu a').forEach(link => link.addEventListener('click', () => {
      document.getElementById('hotel-menu').classList.remove('open');
      document.getElementById('hotel-menu-toggle').setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        document.getElementById('hotel-menu').classList.remove('open');
        document.getElementById('hotel-menu-toggle').setAttribute('aria-expanded', 'false');
      }
    });
    if (user) {
      const toggle = document.getElementById('hotel-account-toggle');
      const closeAccount = () => { document.getElementById('hotel-account-panel').classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
      toggle.addEventListener('click', () => { const open = document.getElementById('hotel-account-panel').classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
      document.addEventListener('click', event => { if (!event.target.closest('.hotel-account')) closeAccount(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAccount(); });
      document.getElementById('hotel-logout').addEventListener('click', async () => {
        if (typeof window.logout === 'function') return window.logout();
        try { const result = await API.request('/api/v1/auth/logout', 'POST', {}); if (result.status === 200) API.clearSession(); }
        catch (_) { document.getElementById('hotel-logout').textContent = 'Chưa đăng xuất được — thử lại'; }
      });
    }
    if (!document.getElementById('hotel-footer')) {
      const footer = document.createElement('footer'); footer.id = 'hotel-footer'; footer.className = 'hotel-footer';
      footer.innerHTML = '<div class="hotel-container"><div class="hotel-footer-top"><a class="hotel-brand" href="/"><span class="hotel-mark">DT<small>07</small></span><span><span class="hotel-brand-name">DT07 Hotel</span><span class="hotel-brand-note">PHENIKAA STAY</span></span></a><p>Một nơi để chọn phòng, lên lịch cho chuyến đi<br>và lưu giữ những kỳ nghỉ của bạn.</p><nav class="hotel-footer-links" aria-label="Điều hướng chân trang"><a href="/guest/rooms.html">Đặt phòng</a><a href="/guest/my-bookings.html">Đơn của tôi</a><a href="/#help">Hỗ trợ</a></nav></div><div class="hotel-footer-bottom"><span>© ' + new Date().getFullYear() + ' DT07 Hotel · Dự án thực hành CSE702051</span><span>Hình ảnh minh họa từ <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a></span></div></div>';
      document.body.appendChild(footer);
    }
    this.bindGallery();
  },
  bindGallery() {
    document.querySelectorAll('[data-hero-photo]').forEach(button => button.addEventListener('click', () => {
      const photo = document.getElementById('hero-photo'); photo.src = button.dataset.heroPhoto; photo.srcset = button.dataset.heroPhoto.replace(".webp", "-640.webp") + " 640w, " + button.dataset.heroPhoto + " 1600w"; photo.alt = button.dataset.photoLabel;
      document.querySelectorAll('[data-hero-photo]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    }));
    const gallery = document.querySelectorAll('[data-gallery-photo]');
    if (!gallery.length) return;
    const dialog = document.createElement('dialog'); dialog.className = 'hotel-photo-dialog'; dialog.setAttribute('aria-label', 'Hình ảnh không gian khách sạn');
    dialog.innerHTML = '<button type="button" aria-label="Đóng hình ảnh">×</button><img alt="">'; document.body.appendChild(dialog);
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    gallery.forEach(button => button.addEventListener('click', () => { const photo = dialog.querySelector('img'); photo.src = button.dataset.galleryPhoto; photo.alt = button.getAttribute('aria-label'); dialog.showModal(); }));
  }
};
