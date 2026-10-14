const bookingRepository = require('../repositories/booking.repository');
const { AppError } = require('../utils/response');

class BookingService {
  validateBookingPayload(data) {
    if (!data || typeof data !== 'object') {
      throw new AppError('INVALID_INPUT', 'Dữ liệu đặt phòng không hợp lệ.', 400);
    }

    const requiredFields = ['room_type_id', 'check_in_date', 'check_out_date', 'num_guests'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new AppError('INVALID_INPUT', `Vui lòng cung cấp ${field}.`, 400);
      }
    }

    const roomTypeId = Number(data.room_type_id);
    if (!Number.isInteger(roomTypeId) || roomTypeId <= 0) {
      throw new AppError('INVALID_INPUT', 'Mã hạng phòng không hợp lệ.', 400);
    }

    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      throw new AppError('INVALID_INPUT', 'Ngày nhận phòng hoặc ngày trả phòng không hợp lệ.', 400);
    }

    if (checkOut <= checkIn) {
      throw new AppError('INVALID_INPUT', 'Ngày trả phòng phải sau ngày nhận phòng.', 400);
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      throw new AppError('INVALID_INPUT', 'Thời gian đặt phòng phải tối thiểu 1 ngày.', 400);
    }

    const guestCount = Number(data.num_guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      throw new AppError('INVALID_INPUT', 'Số khách phải là số nguyên dương.', 400);
    }

    if (data.total_price !== undefined && data.total_price !== null) {
      const totalPrice = Number(data.total_price);
      if (Number.isNaN(totalPrice) || totalPrice < 0) {
        throw new AppError('INVALID_INPUT', 'Tổng tiền không hợp lệ.', 400);
      }
    }

    return { roomTypeId, nights, guestCount };
  }

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
    const { roomTypeId, nights, guestCount } = this.validateBookingPayload(data);

    const roomTypeRepository = require('../repositories/roomType.repository');
    const roomType = await roomTypeRepository.findById(roomTypeId);
    if (!roomType) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Hạng phòng không tồn tại.', 404);
    }

    if (guestCount > Number(roomType.max_occupancy)) {
      throw new AppError(
        'INVALID_INPUT',
        `Số khách vượt quá sức chứa tối đa của hạng phòng (${roomType.max_occupancy} người).`,
        400
      );
    }

    // Generate unique booking code
    data.booking_code = 'BK' + Date.now().toString().slice(-8);

    // Bind to user if logged in as guest
    if (currentUser.role === 'guest') {
      data.user_id = currentUser.id;
      if (!data.guest_name) data.guest_name = currentUser.fullName;
      if (!data.guest_email) data.guest_email = currentUser.email;

      const authService = require('../services/auth.service');
      const user = await authService.getMe(currentUser.id);
      if (!data.guest_phone) data.guest_phone = user.phone;
    }

    data.room_type_id = roomTypeId;
    data.num_guests = guestCount;

    if (data.total_price === undefined || data.total_price === null || Number(data.total_price) <= 0) {
      data.total_price = Number(roomType.base_price_per_night) * nights;
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
