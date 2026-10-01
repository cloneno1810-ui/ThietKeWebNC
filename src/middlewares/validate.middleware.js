const Joi = require('joi');
const { AppError, sendError } = require('../utils/response');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Trả về tất cả các lỗi thay vì dừng ở lỗi đầu tiên
      stripUnknown: true, // Loại bỏ các trường không được định nghĩa trong schema
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.context.key,
        message: detail.message.replace(/\"/g, ''),
      }));

      const appError = new AppError('INVALID_INPUT', 'Dữ liệu đầu vào không hợp lệ.', 400);
      appError.details = errorDetails;
      return sendError(res, appError);
    }

    // Cập nhật lại req với dữ liệu đã được làm sạch (stripped)
    req[source] = value;
    next();
  };
};

module.exports = validate;
