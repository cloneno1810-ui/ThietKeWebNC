const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomType.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * GET /api/v1/room-types
 * Đã đăng nhập: xem danh sách hạng phòng
 */
router.get('/', authenticate, (req, res) => roomTypeController.list(req, res));

/**
 * POST /api/v1/room-types
 * RBAC: chỉ admin, manager. Guest / lễ tân → 403 FORBIDDEN
 */
router.post('/', authenticate, authorize('admin', 'manager'), (req, res) =>
  roomTypeController.create(req, res)
);

module.exports = router;
