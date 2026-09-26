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
}

module.exports = new RoomTypeService();
