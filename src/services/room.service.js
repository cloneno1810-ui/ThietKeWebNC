const roomRepository = require('../repositories/room.repository');
const { AppError } = require('../utils/response');

class RoomService {
  async getAvailableRooms(query) {
    await require('../repositories/booking.repository').expireHolds();
    return roomRepository.findAvailable(query);
  }
  async getRooms(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const requestedLimit = parseInt(query.limit, 10) || 10;
    const limit = Math.min(Math.max(1, requestedLimit), 50);
    const sortBy = ['room_number', 'floor', 'created_at'].includes(query.sortBy) ? query.sortBy : 'room_number';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;
    
    const { data, total } = await roomRepository.findAll({
      status: query.status,
      q: (query.q || '').trim(),
      roomTypeId: query.roomTypeId ? Number(query.roomTypeId) : null,
      sortBy,
      sortOrder,
      limit,
      offset
    });

    return {
      rooms: data,
      pagination: {
        total,
        page,
        limit,
        maxLimit: 50,
        sortBy,
        sortOrder,
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
    
    try {
      return await roomRepository.create(data);
    } catch (error) {
      if (error.code === 'P0010' || (error.code === '23505' && error.constraint === 'rooms_type_slot_unique')) {
        throw new AppError('ROOM_LIMIT_REACHED', 'Mỗi hạng phòng có tối đa 10 phòng.', 409);
      }
      throw error;
    }
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

    throw new AppError('INVALID_STATE', 'Mỗi hạng duy trì 10 phòng. Hãy chuyển phòng sang bảo trì thay vì xóa.', 409);
  }
}

module.exports = new RoomService();
