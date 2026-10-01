const roomService = require('../services/room.service');
const { sendSuccess, sendError } = require('../utils/response');

class RoomController {
  async getAll(req, res) {
    try {
      const result = await roomService.getRooms(req.query);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async getDetail(req, res) {
    try {
      const room = await roomService.getRoomById(req.params.id);
      return sendSuccess(res, { room }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async create(req, res) {
    try {
      const room = await roomService.createRoom(req.body);
      return sendSuccess(res, { room, message: 'Tạo phòng thành công.' }, 201);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const room = await roomService.updateRoomStatus(req.params.id, status);
      return sendSuccess(res, { room, message: 'Cập nhật trạng thái phòng thành công.' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }

  async delete(req, res) {
    try {
      await roomService.deleteRoom(req.params.id);
      return sendSuccess(res, { message: 'Xóa phòng thành công.' }, 200);
    } catch (err) {
      return sendError(res, err);
    }
  }
}

module.exports = new RoomController();
