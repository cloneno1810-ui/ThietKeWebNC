const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload, verifyUpload } = require('../middlewares/upload.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { sendSuccess, sendError } = require('../utils/response');

router.post('/uploads', authenticate, authorize('admin', 'manager', 'receptionist'), upload.single('file'), verifyUpload,
  audit({
    action: 'FILE_UPLOADED',
    targetEntity: 'uploads',
    getDetails: (req) => `Đã tải tệp ${req.file.safeName} (${req.file.detectedMime}, ${req.file.size} bytes)`
  }),
  (req, res) => {
    try {
      return sendSuccess(res, {
        file: { name: req.file.safeName, mimeType: req.file.detectedMime, size: req.file.size },
        message: 'Tải tệp an toàn thành công.'
      }, 201);
    } catch (error) {
      return sendError(res, error);
    }
  }
);

module.exports = router;
