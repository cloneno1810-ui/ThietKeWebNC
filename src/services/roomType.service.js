const roomTypeRepository = require('../repositories/roomType.repository');
const { AppError } = require('../utils/response');

class RoomTypeService {
  async list() {
    return roomTypeRepository.findAll();
  }

  /**
   * Chỉ admin / manager được tạo hạng phòng (RBAC).
   * Guest gọi điểm cuối này bị middleware authorize chặn 403 trước khi vào đây.
   */
  async create(payload) {
    const { name, description, basePricePerNight, maxOccupancy, amenities } = payload;

    if (!name || basePricePerNight === undefined || maxOccupancy === undefined) {
      throw new AppError(
        'INVALID_INPUT',
        'Vui lòng cung cấp name, basePricePerNight và maxOccupancy.',
        400
      );
    }

    const price = Number(basePricePerNight);
    const occupancy = Number(maxOccupancy);
    if (Number.isNaN(price) || price < 0 || Number.isNaN(occupancy) || occupancy < 1) {
      throw new AppError('INVALID_INPUT', 'Giá hoặc sức chứa không hợp lệ.', 400);
    }

    const existing = await roomTypeRepository.findByName(name.trim());
    if (existing) {
      throw new AppError('INVALID_INPUT', 'Tên hạng phòng đã tồn tại.', 400, [
        { field: 'name', issue: 'Trùng tên hạng phòng' }
      ]);
    }

    return roomTypeRepository.create({
      name: name.trim(),
      description,
      basePricePerNight: price,
      maxOccupancy: occupancy,
      amenities
    });
  }

  async getById(id) {
    const roomType = await roomTypeRepository.findById(id);
    if (!roomType) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy thông tin hạng phòng.', 404);
    }
    return roomType;
  }

  async update(id, payload) {
    const roomType = await roomTypeRepository.findById(id);
    if (!roomType) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy hạng phòng để cập nhật.', 404);
    }

    const { name, description, basePricePerNight, maxOccupancy, amenities } = payload;
    
    const price = basePricePerNight !== undefined ? Number(basePricePerNight) : roomType.base_price_per_night;
    const occupancy = maxOccupancy !== undefined ? Number(maxOccupancy) : roomType.max_occupancy;
    
    if (Number.isNaN(price) || price < 0 || Number.isNaN(occupancy) || occupancy < 1) {
      throw new AppError('INVALID_INPUT', 'Giá hoặc sức chứa không hợp lệ.', 400);
    }

    if (name && name.trim() !== roomType.name) {
      const existing = await roomTypeRepository.findByName(name.trim());
      if (existing) {
        throw new AppError('INVALID_INPUT', 'Tên hạng phòng đã tồn tại.', 400);
      }
    }

    return roomTypeRepository.update(id, {
      name: name ? name.trim() : roomType.name,
      description: description !== undefined ? description : roomType.description,
      basePricePerNight: price,
      maxOccupancy: occupancy,
      amenities: amenities !== undefined ? amenities : roomType.amenities
    });
  }

  async delete(id) {
    const roomType = await roomTypeRepository.findById(id);
    if (!roomType) {
      throw new AppError('RESOURCE_NOT_FOUND', 'Không tìm thấy hạng phòng để xóa.', 404);
    }
    await roomTypeRepository.delete(id);
    return true;
  }
}

module.exports = new RoomTypeService();
