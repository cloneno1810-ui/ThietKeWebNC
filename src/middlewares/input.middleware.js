const { AppError } = require('../utils/response');

const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

const validateIdParam = (field = 'id') => {
  return (req, res, next) => {
    const rawValue = req.params[field];
    if (rawValue === undefined || rawValue === null || rawValue === '' || !isPositiveInteger(rawValue)) {
      return next(new AppError('INVALID_INPUT', `Tham số ${field} không hợp lệ.`, 400));
    }

    req.params[field] = Number(rawValue);
    next();
  };
};

const validateRoomQuery = (req, res, next) => {
  const allowedStatus = ['available', 'occupied', 'cleaning', 'maintenance', 'booked'];
  const allowedSortBy = ['room_number', 'floor', 'created_at'];
  const status = req.query.status;
  const sortBy = req.query.sortBy;
  const sortOrder = req.query.sortOrder;

  if (status && !allowedStatus.includes(status)) {
    return next(new AppError('INVALID_INPUT', 'Trạng thái phòng không hợp lệ.', 400));
  }

  if (sortBy && !allowedSortBy.includes(sortBy)) {
    return next(new AppError('INVALID_INPUT', 'Trường sắp xếp không hợp lệ.', 400));
  }

  if (sortOrder && !['asc', 'desc'].includes(String(sortOrder).toLowerCase())) {
    return next(new AppError('INVALID_INPUT', 'Hướng sắp xếp không hợp lệ.', 400));
  }

  if (req.query.page && (!Number.isInteger(Number(req.query.page)) || Number(req.query.page) < 1)) {
    return next(new AppError('INVALID_INPUT', 'Trang không hợp lệ.', 400));
  }

  if (req.query.limit && (!Number.isInteger(Number(req.query.limit)) || Number(req.query.limit) < 1)) {
    return next(new AppError('INVALID_INPUT', 'Giới hạn kết quả không hợp lệ.', 400));
  }

  if (req.query.roomTypeId && !isPositiveInteger(req.query.roomTypeId)) {
    return next(new AppError('INVALID_INPUT', 'Mã hạng phòng không hợp lệ.', 400));
  }

  req.query.q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  next();
};

const validateReportQuery = (req, res, next) => {
  const { from, to } = req.query;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (from && !datePattern.test(String(from))) {
    return next(new AppError('INVALID_INPUT', 'Tham số from không hợp lệ.', 400));
  }

  if (to && !datePattern.test(String(to))) {
    return next(new AppError('INVALID_INPUT', 'Tham số to không hợp lệ.', 400));
  }

  if (from && to && String(from) > String(to)) {
    return next(new AppError('INVALID_INPUT', 'Khoảng thời gian báo cáo không hợp lệ.', 400));
  }

  next();
};

module.exports = {
  validateIdParam,
  validateRoomQuery,
  validateReportQuery
};
