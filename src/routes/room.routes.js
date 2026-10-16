const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { validateId, roomBody, roomsQuery, availableRoomsQuery } = require('../middlewares/input.middleware');
router.get('/available', authenticate, availableRoomsQuery, (req, res) => roomController.getAvailable(req, res));
router.use('/:id', validateId);

// Public/Guest có thể xem danh sách và chi tiết phòng
router.get('/', authenticate, roomsQuery, (req, res) => roomController.getAll(req, res));
router.get('/:id', authenticate, (req, res) => roomController.getDetail(req, res));

// Chỉ Admin và Manager mới có quyền tạo và cập nhật phòng
router.post('/', authenticate, authorize('admin', 'manager'), roomBody, (req, res) => roomController.create(req, res));
router.patch('/:id/status', authenticate, authorize('admin', 'manager', 'receptionist'), (req, res) => roomController.updateStatus(req, res));

// Chỉ Admin mới được xóa
router.delete('/:id', authenticate, authorize('admin'), audit({
  action: 'ROOM_DELETED', targetEntity: 'rooms', getEntityId: (req) => Number(req.params.id),
  getDetails: (req) => `Xóa phòng ID ${req.params.id}`
}), (req, res) => roomController.delete(req, res));

module.exports = router;
