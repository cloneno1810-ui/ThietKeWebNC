const bookingRepository = require('../repositories/booking.repository');
const { AppError } = require('../utils/response');

class BookingService {
  /**
   * Lấy chi tiết đơn đặt phòng với KIỂM SOÁT QUYỀN TRÊN ĐỐI TƯỢNG (Chống IDOR - BM4)
   * 
   * Quy tắc nghiệp vụ (QTNV):
   * - Role 'admin', 'manager', 'receptionist': Xem được tất cả đơn đặt phòng.
   * - Role 'guest': Chỉ xem được đơn đặt phòng của CHÍNH MÌNH (user_id === req.user.id).
   * - Nếu truy cập chéo sang booking của người khác -> Bị từ chối với mã 403 FORBIDDEN.
   */
  async getBookingDetail(bookingId, currentUser) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('RESOURCE_NOT_FOUND', `Không tìm thấy đơn đặt phòng với ID ${bookingId}.`, 404);
    }

    // Kiểm tra quyền trên đối tượng (Object-level authorization check)
    const isStaff = ['admin', 'manager', 'receptionist'].includes(currentUser.role);
    const isOwner = booking.user_id && String(booking.user_id) === String(currentUser.id);

    if (!isStaff && !isOwner) {
      // Rủi ro BM4 (IDOR) được ngăn chặn tại đây!
      throw new AppError(
        'FORBIDDEN',
        'Bạn không có quyền xem thông tin đơn đặt phòng của khách hàng khác (Vi phạm kiểm soát quyền đối tượng).',
        403
      );
    }

    return booking;
  }

  /**
   * Lấy danh sách đơn đặt phòng theo vai trò
   */
  async getBookings(currentUser) {
    const isStaff = ['admin', 'manager', 'receptionist'].includes(currentUser.role);

    if (isStaff) {
      return await bookingRepository.findAll();
    }

    // Khách hàng thông thường: chỉ trả về các đơn của chính mình
    return await bookingRepository.findByUserId(currentUser.id);
  }

  /**
   * Hủy đơn đặt phòng — kiểm soát quyền trên đối tượng (ABAC / chống IDOR).
   * Guest chỉ được hủy đơn của chính mình. Truy cập chéo → 403 FORBIDDEN.
   */
  async cancelBooking(bookingId, currentUser) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError('RESOURCE_NOT_FOUND', `Không tìm thấy đơn đặt phòng với ID ${bookingId}.`, 404);
    }

    const isStaff = ['admin', 'manager', 'receptionist'].includes(currentUser.role);
    const isOwner = booking.user_id && String(booking.user_id) === String(currentUser.id);

    if (!isStaff && !isOwner) {
      throw new AppError(
        'FORBIDDEN',
        'Bạn không có quyền hủy đơn đặt phòng của khách hàng khác (Vi phạm kiểm soát quyền đối tượng).',
        403
      );
    }

    if (booking.status === 'cancelled') {
      throw new AppError('INVALID_INPUT', 'Đơn đặt phòng này đã được hủy trước đó.', 400);
    }

    if (['checked_out', 'no_show'].includes(booking.status)) {
      throw new AppError('INVALID_INPUT', `Không thể hủy đơn ở trạng thái ${booking.status}.`, 400);
    }

    const updated = await bookingRepository.updateStatus(booking.id, 'cancelled');
    return updated;
  }

  async createBooking(data, currentUser) {
    // Generate unique booking code
    data.booking_code = 'BK' + Date.now().toString().slice(-8);
    // Bind to user if logged in as guest
    if (currentUser.role === 'guest') {
      data.user_id = currentUser.id;
      if(!data.guest_name) data.guest_name = currentUser.fullName;
      if(!data.guest_email) data.guest_email = currentUser.email;
      
      const authService = require('../services/auth.service');
      const user = await authService.getMe(currentUser.id);
      if(!data.guest_phone) data.guest_phone = user.phone;
    }
    
    // Check if room type exists and is available
    const roomTypeRepository = require('../repositories/roomType.repository');
    const roomType = await roomTypeRepository.findById(data.room_type_id);
    if (!roomType) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Hạng phòng không tồn tại.', 404);
    }
    
    // Simple mock logic: if total price isn't provided, calculate basic price
    if (!data.total_price) {
      const days = (new Date(data.check_out_date) - new Date(data.check_in_date)) / (1000 * 60 * 60 * 24);
      data.total_price = roomType.base_price_per_night * (days > 0 ? days : 1);
    }
    
    return await bookingRepository.create(data);
  }

  async checkInBooking(id, currentUser) {
    const isStaff = ['admin', 'manager', 'receptionist'].includes(currentUser.role);
    if (!isStaff) {
      throw new AppError('FORBIDDEN', 'Chỉ nhân viên mới được phép check-in.', 403);
    }
    
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new AppError('RESOURCE_NOT_FOUND', 'Đơn đặt phòng không tồn tại.', 404);
    
    if (booking.status !== 'confirmed' && booking.status !== 'pending_payment') {
      throw new AppError('INVALID_STATE', `Không thể check-in phòng đang ở trạng thái ${booking.status}.`, 400);
    }
    
    // Update booking status
    const updated = await bookingRepository.updateStatus(booking.id, 'checked_in');
    
    // If a room is assigned, update room status
    if (booking.room_id) {
      const roomRepository = require('../repositories/room.repository');
      await roomRepository.updateStatus(booking.room_id, 'occupied');
    }
    
    return updated;
  }

  async checkOutBooking(id, currentUser) {
    const isStaff = ['admin', 'manager', 'receptionist'].includes(currentUser.role);
    if (!isStaff) {
      throw new AppError('FORBIDDEN', 'Chỉ nhân viên mới được phép check-out.', 403);
    }
    
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new AppError('RESOURCE_NOT_FOUND', 'Đơn đặt phòng không tồn tại.', 404);
    
    if (booking.status !== 'checked_in') {
      throw new AppError('INVALID_STATE', `Không thể check-out phòng chưa check-in. Trạng thái: ${booking.status}.`, 400);
    }
    
    const updated = await bookingRepository.updateStatus(booking.id, 'checked_out');
    
    if (booking.room_id) {
      const roomRepository = require('../repositories/room.repository');
      await roomRepository.updateStatus(booking.room_id, 'cleaning');
    }
    
    return updated;
  }
}

module.exports = new BookingService();
