const Joi = require('joi');
const { AppError } = require('../utils/response');
const validate = require('./validate.middleware');
const id = Joi.number().integer().min(1).max(Number.MAX_SAFE_INTEGER);
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? helpers.error('any.invalid') : value;
});
const status = Joi.string().valid('available', 'occupied', 'cleaning', 'maintenance', 'booked');
function validateId(req, res, next) {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
    return next(new AppError('INVALID_INPUT', 'ID phải là số nguyên dương hợp lệ.', 400));
  }
  next();
}
const roomsQuery = validate(Joi.object({ q: Joi.string().allow('').max(200), status,
  roomTypeId: id, page: Joi.number().integer().min(1).max(1000000), limit: Joi.number().integer().min(1).max(10000),
  sortBy: Joi.string().valid('room_number', 'floor', 'created_at'), sortOrder: Joi.string().valid('asc', 'desc') }), 'query');
const roomBody = validate(Joi.object({ room_number: Joi.string().trim().max(20).required(),
  room_type_id: id.required(), floor: Joi.number().integer().min(-10).max(200).required(), status }));
const typeSchema = { name: Joi.string().trim().min(1).max(100), description: Joi.string().allow('', null).max(5000),
  basePricePerNight: Joi.number().min(0).max(9999999999.99), maxOccupancy: Joi.number().integer().min(1).max(1000),
  amenities: Joi.string().allow('', null).max(5000) };
const typeBody = validate(Joi.object({ ...typeSchema, name: typeSchema.name.required(),
  basePricePerNight: typeSchema.basePricePerNight.required(), maxOccupancy: typeSchema.maxOccupancy.required() }));
const typeUpdate = validate(Joi.object(typeSchema).min(1));
const bookingBody = validate(Joi.object({ room_type_id: id.required(), room_id: id, check_in_date: date.required(),
  check_out_date: date.required(), num_guests: Joi.number().integer().min(1).max(1000).required(),
  guest_name: Joi.string().trim().max(100), guest_email: Joi.string().email().max(255),
  guest_phone: Joi.string().pattern(/^[0-9+ -]{7,20}$/), user_id: id.allow(null) }));
const availableRoomsQuery = validate(Joi.object({ room_type_id: id.required(),
  check_in_date: date.required(), check_out_date: date.required()
}).custom((value, helpers) => value.check_out_date > value.check_in_date ? value : helpers.error('any.invalid')), 'query');
module.exports = { validateId, roomsQuery, availableRoomsQuery, roomBody, typeBody, typeUpdate, bookingBody,
  reportQuery: validate(Joi.object({ from: date, to: date }), 'query') };
