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
    const { name, description, basePricePerNight, maxOccupancy, amenities } = payload || {};

    if (!name || basePricePerNight === undefined || maxOccupancy === undefined) {
      throw new AppError(
        'INVALID_INPUT',
        'Vui lòng cung cấp name, basePricePerNight và maxOccupancy.',
        400
      );
    }

    const trimmedName = String(name).trim();
    if (!trimmedName) {
      throw new AppError('INVALID_INPUT', 'Tên hạng phòng không được để trống.', 400);
    }

    const price = Number(basePricePerNight);
    const occupancy = Number(maxOccupancy);
    if (Number.isNaN(price) || price < 0 || Number.isNaN(occupancy) || occupancy < 1) {
      throw new AppError('INVALID_INPUT', 'Giá hoặc sức chứa không hợp lệ.', 400);
    }

    const existing = await roomTypeRepository.findByName(trimmedName);
    if (existing) {
      throw new AppError('INVALID_INPUT', 'Tên hạng phòng đã tồn tại.', 400, [
        { field: 'name', issue: 'Trùng tên hạng phòng' }
      ]);
    }

    return roomTypeRepository.create({
      name: trimmedName,
      description: description !== undefined ? String(description).trim() : null,
      basePricePerNight: price,
      maxOccupancy: occupancy,
      amenities: amenities !== undefined ? amenities : null
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

    const nextName = name !== undefined ? String(name).trim() : roomType.name;
    if (name !== undefined && !nextName) {
      throw new AppError('INVALID_INPUT', 'Tên hạng phòng không được để trống.', 400);
    }

    if (name !== undefined && nextName !== roomType.name) {
      const existing = await roomTypeRepository.findByName(nextName);
      if (existing) {
        throw new AppError('INVALID_INPUT', 'Tên hạng phòng đã tồn tại.', 400);
      }
    }

    return roomTypeRepository.update(id, {
      name: nextName,
      description: description !== undefined ? String(description).trim() : roomType.description,
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
