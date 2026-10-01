const roomTypeService = require('../services/roomType.service');
const { sendSuccess, sendError } = require('../utils/response');

class RoomTypeController {
  async list(req, res) {
    try {
      const roomTypes = await roomTypeService.list();
      return sendSuccess(res, { roomTypes, count: roomTypes.length }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  /**
   * POST /api/v1/room-types
   * RBAC: chỉ admin, manager
   */
  async create(req, res) {
    try {
      const roomType = await roomTypeService.create(req.body);
      return sendSuccess(res, { roomType, message: 'Tạo hạng phòng thành công' }, 201);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async getDetail(req, res) {
    try {
      const roomType = await roomTypeService.getById(req.params.id);
      return sendSuccess(res, { roomType }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async update(req, res) {
    try {
      const roomType = await roomTypeService.update(req.params.id, req.body);
      return sendSuccess(res, { roomType, message: 'Cập nhật hạng phòng thành công' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async delete(req, res) {
    try {
      await roomTypeService.delete(req.params.id);
      return sendSuccess(res, { message: 'Xóa hạng phòng thành công' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }
}

module.exports = new RoomTypeController();
