const roomRepository = require('../repositories/room.repository');
const { AppError } = require('../utils/response');

class RoomService {
  async getRooms(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    const { data, total } = await roomRepository.findAll({
      status: query.status,
      limit,
      offset
    });

    return {
      rooms: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getRoomById(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy thông tin phòng.', 404);
    }
    return room;
  }

  async createRoom(data) {
    // Kiểm tra số phòng đã tồn tại chưa
    const existing = await roomRepository.findByRoomNumber(data.room_number);
    if (existing) {
      throw new AppError('RESOURCE_EXISTS', 'Số phòng này đã tồn tại trong hệ thống.', 400);
    }
    
    return await roomRepository.create(data);
  }

  async updateRoomStatus(id, status) {
    const validStatuses = ['available', 'occupied', 'cleaning', 'maintenance', 'booked'];
    if (!validStatuses.includes(status)) {
      throw new AppError('INVALID_INPUT', 'Trạng thái phòng không hợp lệ.', 400);
    }
    
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy thông tin phòng để cập nhật.', 404);
    }

    return await roomRepository.updateStatus(id, status);
  }

  async deleteRoom(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy thông tin phòng để xóa.', 404);
    }

    if (room.status === 'occupied' || room.status === 'booked') {
      throw new AppError('INVALID_STATE', 'Không thể xóa phòng đang có khách hoặc đã được đặt.', 400);
    }

    await roomRepository.delete(id);
    return true;
  }
}

module.exports = new RoomService();
