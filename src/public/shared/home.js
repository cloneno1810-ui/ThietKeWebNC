document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('role') === 'guest' ? { fullName: localStorage.getItem('fullName') || 'Khách', email: localStorage.getItem('email') || '' } : null;
  Hotel.mount(user);
  document.querySelectorAll('[data-icon]').forEach(node => node.innerHTML = Hotel.icon(node.dataset.icon));
  document.querySelectorAll('[data-room-icon]').forEach(node => node.insertAdjacentHTML('afterbegin', Hotel.icon(node.dataset.roomIcon)));
  const checkIn = document.getElementById('home-check-in');
  const checkOut = document.getElementById('home-check-out');
  const guests = document.getElementById('home-guests');
  const preferences = Hotel.preferences();
  checkIn.min = Hotel.datePlus(0);
  checkIn.value = preferences.checkIn >= checkIn.min ? preferences.checkIn : Hotel.datePlus(1);
  checkOut.min = Hotel.datePlus(1);
  checkOut.value = preferences.checkOut > checkIn.value ? preferences.checkOut : Hotel.datePlus(3);
  guests.value = String([1,2,3,4].includes(Number(preferences.guests)) ? preferences.guests : 2);
  checkIn.addEventListener('change', () => {
    if (!checkIn.value) return;
    const date = new Date(checkIn.value + 'T12:00:00'); date.setDate(date.getDate() + 1);
    const next = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
    checkOut.min = next; if (checkOut.value <= checkIn.value) checkOut.value = next;
    checkOut.setCustomValidity('');
  });
  const proceed = (roomTypeId = null) => {
    if (!document.getElementById('home-booking-form').reportValidity()) return;
    if (checkOut.value <= checkIn.value) { checkOut.setCustomValidity('Ngày trả phòng phải sau ngày nhận phòng.'); checkOut.reportValidity(); return; }
    Hotel.savePreferences({ checkIn: checkIn.value, checkOut: checkOut.value, guests: Number(guests.value), roomTypeId });
    location.href = '/guest/rooms.html';
  };
  checkOut.addEventListener('input', () => checkOut.setCustomValidity(''));
  document.getElementById('home-booking-form').addEventListener('submit', event => { event.preventDefault(); proceed(); });
  document.querySelectorAll('[data-home-room]').forEach(button => button.addEventListener('click', () => {
    // Previewing a specific room should show it even when its capacity is below a previous search.
    guests.value = '1'; proceed(Number(button.dataset.homeRoom));
  }));
});
