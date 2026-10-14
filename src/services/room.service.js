const roomRepository = require('../repositories/room.repository');
const { AppError } = require('../utils/response');

class RoomService {
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
    if (!data || typeof data !== 'object') {
      throw new AppError('INVALID_INPUT', 'Dữ liệu phòng không hợp lệ.', 400);
    }

    const roomNumber = String(data.room_number ?? '').trim();
    const floor = Number(data.floor);
    const roomTypeId = Number(data.room_type_id);

    if (!roomNumber) {
      throw new AppError('INVALID_INPUT', 'Vui lòng nhập số phòng.', 400);
    }
    if (!Number.isInteger(roomTypeId) || roomTypeId <= 0) {
      throw new AppError('INVALID_INPUT', 'Mã hạng phòng không hợp lệ.', 400);
    }
    if (!Number.isInteger(floor) || floor < 1) {
      throw new AppError('INVALID_INPUT', 'Tầng phòng không hợp lệ.', 400);
    }

    const existing = await roomRepository.findByRoomNumber(roomNumber);
    if (existing) {
      throw new AppError('RESOURCE_EXISTS', 'Số phòng này đã tồn tại trong hệ thống.', 400);
    }

    return await roomRepository.create({
      room_number: roomNumber,
      room_type_id: roomTypeId,
      floor,
      status: data.status || 'available'
    });
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
