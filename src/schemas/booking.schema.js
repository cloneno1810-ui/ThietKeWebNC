const Joi = require('joi');

const createBookingSchema = Joi.object({
  room_type_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Mã hạng phòng không hợp lệ.',
    'number.integer': 'Mã hạng phòng phải là số nguyên.',
    'number.positive': 'Mã hạng phòng phải lớn hơn 0.',
    'any.required': 'Vui lòng chọn hạng phòng.'
  }),
  room_id: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Mã phòng không hợp lệ.',
    'number.integer': 'Mã phòng phải là số nguyên.',
    'number.positive': 'Mã phòng phải lớn hơn 0.'
  }),
  guest_name: Joi.string().trim().min(2).max(100).optional().messages({
    'string.min': 'Tên khách hàng phải có ít nhất 2 ký tự.',
    'string.max': 'Tên khách hàng tối đa 100 ký tự.'
  }),
  guest_phone: Joi.string().trim().pattern(/^[0-9+() -]{8,20}$/).optional().messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ.'
  }),
  guest_email: Joi.string().trim().email().optional().allow('').messages({
    'string.email': 'Email không hợp lệ.'
  }),
  check_in_date: Joi.date().iso().required().messages({
    'date.base': 'Ngày nhận phòng không hợp lệ.',
    'date.iso': 'Ngày nhận phòng phải theo định dạng ISO.',
    'any.required': 'Vui lòng nhập ngày nhận phòng.'
  }),
  check_out_date: Joi.date().iso().required().messages({
    'date.base': 'Ngày trả phòng không hợp lệ.',
    'date.iso': 'Ngày trả phòng phải theo định dạng ISO.',
    'any.required': 'Vui lòng nhập ngày trả phòng.'
  }),
  num_guests: Joi.number().integer().min(1).max(10).required().messages({
    'number.base': 'Số khách không hợp lệ.',
    'number.integer': 'Số khách phải là số nguyên.',
    'number.min': 'Số khách phải lớn hơn 0.',
    'number.max': 'Số khách tối đa là 10 người.',
    'any.required': 'Vui lòng nhập số khách.'
  }),
  total_price: Joi.number().min(0).optional().messages({
    'number.base': 'Tổng tiền không hợp lệ.',
    'number.min': 'Tổng tiền phải lớn hơn hoặc bằng 0.'
  }),
  status: Joi.string().valid('pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show').optional().messages({
    'any.only': 'Trạng thái đặt phòng không hợp lệ.'
  })
}).custom((value, helpers) => {
  if (!value.check_in_date || !value.check_out_date) {
    return value;
  }

  const checkIn = new Date(value.check_in_date);
  const checkOut = new Date(value.check_out_date);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return value;
  }

  if (checkOut <= checkIn) {
    return helpers.message({ custom: 'Ngày trả phòng phải sau ngày nhận phòng.' });
  }

  return value;
});

module.exports = {
  createBookingSchema
};
