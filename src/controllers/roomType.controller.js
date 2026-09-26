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
      return sendSuccess(res, { roomType }, 201);
    } catch (err) {
      return sendError(res, err);
    }
  }
}

module.exports = new RoomTypeController();
