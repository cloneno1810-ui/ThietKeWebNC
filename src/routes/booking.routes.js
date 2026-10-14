const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateIdParam } = require('../middlewares/input.middleware');
const { createBookingSchema } = require('../schemas/booking.schema');

/**
 * GET /api/v1/bookings
 * Khách hàng đã đăng nhập (guest) hoặc Nhân viên (receptionist, manager, admin)
 */
router.get('/', authenticate, (req, res) => bookingController.getAll(req, res));

/**
 * PATCH /api/v1/bookings/:id/cancel
 * ABAC / chống truy cập chéo: guest không được hủy đơn của guest khác
 */
router.patch('/:id/cancel', authenticate, validateIdParam('id'), (req, res) => bookingController.cancel(req, res));

/**
 * GET /api/v1/bookings/:id
 * Kiểm tra quyền trên đối tượng (Object-level authorization check - IDOR protection)
 */
router.get('/:id', authenticate, validateIdParam('id'), (req, res) => bookingController.getDetail(req, res));

/**
 * POST /api/v1/bookings
 */
router.post('/', authenticate, validate(createBookingSchema), (req, res) => bookingController.create(req, res));

/**
 * POST /api/v1/bookings/:id/check-in
 */
router.post('/:id/check-in', authenticate, authorize('admin', 'manager', 'receptionist'), validateIdParam('id'), (req, res) => bookingController.checkIn(req, res));

/**
 * POST /api/v1/bookings/:id/check-out
 */
router.post('/:id/check-out', authenticate, authorize('admin', 'manager', 'receptionist'), validateIdParam('id'), (req, res) => bookingController.checkOut(req, res));

module.exports = router;
