const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomType.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateIdParam } = require('../middlewares/input.middleware');

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

router.get('/:id', authenticate, validateIdParam('id'), (req, res) => roomTypeController.getDetail(req, res));
router.put('/:id', authenticate, authorize('admin', 'manager'), validateIdParam('id'), (req, res) => roomTypeController.update(req, res));
router.delete('/:id', authenticate, authorize('admin'), validateIdParam('id'), (req, res) => roomTypeController.delete(req, res));

module.exports = router;
