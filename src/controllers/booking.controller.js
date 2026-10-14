const bookingService = require('../services/booking.service');
const { sendSuccess, sendError } = require('../utils/response');

class BookingController {
  /**
   * GET /api/v1/bookings/:id
   * Thử nghiệm kiểm tra quyền trên đối tượng (Object-level check)
   */
  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingDetail(id, req.user);
      return sendSuccess(res, { booking }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  /**
   * GET /api/v1/bookings
   */
  async getAll(req, res) {
    try {
      const bookings = await bookingService.getBookings(req.user);
      return sendSuccess(res, { bookings, count: bookings.length }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/cancel
   * ABAC: guest chỉ hủy đơn của mình
   */
  async cancel(req, res) {
    try {
      const { id } = req.params;
      const booking = await bookingService.cancelBooking(id, req.user);
      return sendSuccess(res, { booking, message: 'Hủy đơn đặt phòng thành công.' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async create(req, res) {
    try {
      const booking = await bookingService.createBooking(req.body, req.user);
      return sendSuccess(res, { booking, message: 'Tạo đơn đặt phòng thành công.' }, 201);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async checkIn(req, res) {
    try {
      const booking = await bookingService.checkInBooking(req.params.id, req.user);
      return sendSuccess(res, { booking, message: 'Check-in thành công.' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async checkOut(req, res) {
    try {
      const booking = await bookingService.checkOutBooking(req.params.id, req.user);
      return sendSuccess(res, { booking, message: 'Check-out thành công.' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }
}

module.exports = new BookingController();
