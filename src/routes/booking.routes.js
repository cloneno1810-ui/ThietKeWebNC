const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateId, bookingBody } = require('../middlewares/input.middleware');
const { audit } = require('../middlewares/audit.middleware');
router.use('/:id', validateId);

/**
 * GET /api/v1/bookings
 * Khách hàng đã đăng nhập (guest) hoặc Nhân viên (receptionist, manager, admin)
 */
router.get('/', authenticate, (req, res) => bookingController.getAll(req, res));

/**
 * PATCH /api/v1/bookings/:id/cancel
 * ABAC / chống truy cập chéo: guest không được hủy đơn của guest khác
 */
router.patch('/:id/cancel', authenticate, (req, res) => bookingController.cancel(req, res));

/**
 * GET /api/v1/bookings/:id
 * Kiểm tra quyền trên đối tượng (Object-level authorization check - IDOR protection)
 */
router.get('/:id', authenticate, (req, res) => bookingController.getDetail(req, res));

/**
 * POST /api/v1/bookings
 */
router.post('/', authenticate, bookingBody, (req, res) => bookingController.create(req, res));

/**
 * POST /api/v1/bookings/:id/confirm
 * Mô phỏng hoàn tất thanh toán: pending_payment -> confirmed.
 */
router.post('/:id/confirm', authenticate, authorize('admin', 'manager', 'receptionist'), audit({
  action: 'BOOKING_PAYMENT_CONFIRMED', targetEntity: 'bookings', getEntityId: req => Number(req.params.id),
  getDetails: () => 'Nhân viên xác nhận đã nhận thanh toán tại quầy'
}), (req, res) => bookingController.confirm(req, res));

/**
 * POST /api/v1/bookings/:id/check-in
 */
router.post('/:id/check-in', authenticate, authorize('admin', 'manager', 'receptionist'), audit({
  action: 'BOOKING_CHECKED_IN', targetEntity: 'bookings', getEntityId: req => Number(req.params.id)
}), (req, res) => bookingController.checkIn(req, res));

/**
 * POST /api/v1/bookings/:id/check-out
 */
router.post('/:id/check-out', authenticate, authorize('admin', 'manager', 'receptionist'), (req, res) => bookingController.checkOut(req, res));

module.exports = router;
