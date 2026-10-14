const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { validateIdParam, validateRoomQuery } = require('../middlewares/input.middleware');

// Public/Guest có thể xem danh sách và chi tiết phòng
router.get('/', authenticate, validateRoomQuery, (req, res) => roomController.getAll(req, res));
router.get('/:id', authenticate, validateIdParam('id'), (req, res) => roomController.getDetail(req, res));

// Chỉ Admin và Manager mới có quyền tạo và cập nhật phòng
router.post('/', authenticate, authorize('admin', 'manager'), (req, res) => roomController.create(req, res));
router.patch('/:id/status', authenticate, authorize('admin', 'manager', 'receptionist'), validateIdParam('id'), (req, res) => roomController.updateStatus(req, res));

// Chỉ Admin mới được xóa
router.delete('/:id', authenticate, authorize('admin'), validateIdParam('id'), audit({
  action: 'ROOM_DELETED', targetEntity: 'rooms', getEntityId: (req) => Number(req.params.id),
  getDetails: (req) => `Xóa phòng ID ${req.params.id}`
}), (req, res) => roomController.delete(req, res));

module.exports = router;
