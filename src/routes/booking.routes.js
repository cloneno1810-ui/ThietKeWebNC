const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * GET /api/v1/bookings
 * Khách hàng đã đăng nhập (guest) hoặc Nhân viên (receptionist, manager, admin)
 */
router.get('/', authenticate, (req, res) => bookingController.getAll(req, res));

/**
 * GET /api/v1/bookings/:id
 * Kiểm tra quyền trên đối tượng (Object-level authorization check - IDOR protection)
 */
router.get('/:id', authenticate, (req, res) => bookingController.getDetail(req, res));

module.exports = router;
