const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Vui lòng cung cấp email.'
  }),
  password: Joi.string().min(8).custom((value, helpers) => Buffer.byteLength(value, 'utf8') <= 72 ? value : helpers.error('string.max')).required().messages({
    'string.max': 'Mật khẩu tối đa 72 byte UTF-8.',
    'string.min': 'Mật khẩu phải chứa ít nhất 8 ký tự.',
    'any.required': 'Vui lòng cung cấp mật khẩu.'
  }),
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Họ tên phải có ít nhất 2 ký tự.',
    'any.required': 'Vui lòng cung cấp họ và tên.'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).required().messages({
    'string.pattern.base': 'Số điện thoại phải từ 10-11 số.',
    'any.required': 'Vui lòng cung cấp số điện thoại.'
  }),
  identityCard: Joi.string().pattern(/^[0-9]{9,12}$/).required().messages({
    'string.pattern.base': 'CCCD/CMND phải từ 9 đến 12 số.',
    'any.required': 'Vui lòng cung cấp CCCD/CMND.'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Vui lòng cung cấp email.'
  }),
  password: Joi.string().custom((value, helpers) => Buffer.byteLength(value, 'utf8') <= 72 ? value : helpers.error('string.max')).required().messages({
    'string.max': 'Mật khẩu tối đa 72 byte UTF-8.',
    'any.required': 'Vui lòng cung cấp mật khẩu.'
  })
});

module.exports = {
  registerSchema,
  loginSchema
};