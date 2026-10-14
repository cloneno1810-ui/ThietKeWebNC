const express = require('express');
const router = express.Router();
const roomTypeController = require('../controllers/roomType.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateId, typeBody, typeUpdate } = require('../middlewares/input.middleware');
router.use('/:id', validateId);

/**
 * GET /api/v1/room-types
 * Đã đăng nhập: xem danh sách hạng phòng
 */
router.get('/', authenticate, (req, res) => roomTypeController.list(req, res));

/**
 * POST /api/v1/room-types
 * RBAC: chỉ admin, manager. Guest / lễ tân → 403 FORBIDDEN
 */
router.post('/', authenticate, authorize('admin', 'manager'), typeBody, (req, res) =>
  roomTypeController.create(req, res)
);

router.get('/:id', authenticate, (req, res) => roomTypeController.getDetail(req, res));
router.put('/:id', authenticate, authorize('admin', 'manager'), typeUpdate, (req, res) => roomTypeController.update(req, res));
router.delete('/:id', authenticate, authorize('admin'), (req, res) => roomTypeController.delete(req, res));

module.exports = router;
