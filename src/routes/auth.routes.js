const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const { issueCsrfToken } = require('../middlewares/security.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');

router.get('/csrf', issueCsrfToken, (req, res) => {
  res.json({ success: true, data: { csrfToken: req.csrfToken } });
});

// Public endpoints (áp dụng Auth Rate Limiter và Validation)
router.post('/register', authLimiter, validate(registerSchema), (req, res) => authController.register(req, res));
router.post('/login', authLimiter, validate(loginSchema), (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Authenticated endpoint
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

module.exports = router;
