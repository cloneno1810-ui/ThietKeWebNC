const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { AppError } = require('../utils/response');

const uploadDirectory = path.resolve(__dirname, '../../storage/uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDirectory),
  filename: (req, file, callback) => callback(null, `${Date.now()}-${crypto.randomUUID()}.upload`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => callback(null, true)
});

function detectType(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', extension: 'png' };
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { mime: 'image/jpeg', extension: 'jpg' };
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return { mime: 'application/pdf', extension: 'pdf' };
  return null;
}

function verifyUpload(req, res, next) {
  try {
    if (!req.file) throw new AppError('INVALID_FILE', 'Vui lòng chọn một tệp.', 400);
    const header = fs.readFileSync(req.file.path).subarray(0, 16);
    const detected = detectType(header);
    if (!detected) {
      fs.unlinkSync(req.file.path);
      throw new AppError('INVALID_FILE', 'Tệp không có chữ ký PNG, JPEG hoặc PDF hợp lệ.', 400);
    }
    const finalPath = path.join(uploadDirectory, `${path.parse(req.file.filename).name}.${detected.extension}`);
    fs.renameSync(req.file.path, finalPath);
    req.file.safeName = path.basename(finalPath);
    req.file.detectedMime = detected.mime;
    req.file.path = finalPath;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, verifyUpload };
