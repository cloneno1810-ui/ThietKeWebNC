const router = require('express').Router();
const Joi = require('joi');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerSchema } = require('../schemas/auth.schema');
const { audit } = require('../middlewares/audit.middleware');
const service = require('../services/staffAccount.service');
const { sendSuccess, sendError } = require('../utils/response');
const schema = registerSchema.fork(['phone', 'identityCard'], field => field.optional()).keys({
  role: Joi.string().valid('receptionist', 'manager', 'admin').required()
});
router.use(authenticate, authorize('admin'));
router.get('/', async (req, res) => {
  try { return sendSuccess(res, { users: await service.list() }, 200); }
  catch (error) { return sendError(res, error); }
});
router.post('/', validate(schema), audit({ action: 'STAFF_ACCOUNT_CREATED', targetEntity: 'users',
  getEntityId: (req, res) => Number(res.locals.createdUserId),
  getDetails: req => `Tạo tài khoản vai trò ${req.body.role}`
}), async (req, res) => {
  try {
    const user = await service.create(req.body, req.user);
    res.locals.createdUserId = user.id;
    return sendSuccess(res, { user, message: 'Đã tạo tài khoản nhân viên.' }, 201);
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
