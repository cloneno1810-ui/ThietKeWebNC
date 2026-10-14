const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Vui lòng cung cấp email.'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Mật khẩu phải chứa ít nhất 8 ký tự.',
    'any.required': 'Vui lòng cung cấp mật khẩu.'
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
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
  password: Joi.string().required().messages({
    'any.required': 'Vui lòng cung cấp mật khẩu.'
  })
});

module.exports = {
  registerSchema,
  loginSchema
};
