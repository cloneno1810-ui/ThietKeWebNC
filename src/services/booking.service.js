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
}

module.exports = new BookingService();
