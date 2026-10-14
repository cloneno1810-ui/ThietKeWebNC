const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public/Guest có thể xem danh sách và chi tiết phòng
router.get('/', authenticate, (req, res) => roomController.getAll(req, res));
router.get('/:id', authenticate, (req, res) => roomController.getDetail(req, res));

// Chỉ Admin và Manager mới có quyền tạo và cập nhật phòng
router.post('/', authenticate, authorize('admin', 'manager'), (req, res) => roomController.create(req, res));
router.patch('/:id/status', authenticate, authorize('admin', 'manager', 'receptionist'), (req, res) => roomController.updateStatus(req, res));

// Chỉ Admin mới được xóa
router.delete('/:id', authenticate, authorize('admin'), (req, res) => roomController.delete(req, res));

module.exports = router;
