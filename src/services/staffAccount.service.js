const bcrypt = require('bcryptjs');
const users = require('../repositories/user.repository');
const { AppError } = require('../utils/response');

module.exports = {
  async create(data, actor) {
    if (actor.role !== 'admin') throw new AppError('FORBIDDEN', 'Chỉ admin được tạo tài khoản nhân viên.', 403);
    if (!['receptionist', 'manager', 'admin'].includes(data.role)) {
      throw new AppError('INVALID_INPUT', 'Vai trò nhân viên không hợp lệ.', 400);
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await users.create({ ...data, passwordHash });
    return { id: user.id, email: user.email, fullName: user.full_name, role: user.role };
  },
  list() { return users.findStaff(); }
};
