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
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
  fileFilter: (req, file, callback) => callback(null, true)
});

function detectType(buffer) {
  if (validPng(buffer)) return { mime: 'image/png', extension: 'png' };
  if (buffer.length > 4 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) &&
      buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))) return { mime: 'image/jpeg', extension: 'jpg' };
  if (/^%PDF-[12]\.\d/.test(buffer.subarray(0, 8).toString('ascii')) &&
      /%%EOF\s*$/.test(buffer.subarray(-1024).toString('latin1')) &&
      !/\/(?:JavaScript|JS|OpenAction|AA|Launch|EmbeddedFile)\b/.test(buffer.toString('latin1'))) {
    return { mime: 'application/pdf', extension: 'pdf' };
  }
  return null;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function validPng(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return false;
  let offset = 8;
  let imageData = false;
  while (offset + 12 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    if (size > buffer.length - offset - 12) return false;
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (offset === 8 && (type !== 'IHDR' || size !== 13 || !buffer.readUInt32BE(offset + 8) || !buffer.readUInt32BE(offset + 12))) return false;
    if (crc32(buffer.subarray(offset + 4, offset + 8 + size)) !== buffer.readUInt32BE(offset + 8 + size)) return false;
    if (type === 'IDAT') imageData = true;
    offset += size + 12;
    if (type === 'IEND') return size === 0 && imageData && offset === buffer.length;
  }
  return false;
}

function verifyUpload(req, res, next) {
  try {
    if (!req.file) throw new AppError('INVALID_FILE', 'Vui lòng chọn một tệp.', 400);
    const buffer = fs.readFileSync(req.file.path);
    const detected = detectType(buffer);
    const extension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = detected?.extension === 'jpg' ? ['.jpg', '.jpeg'] : ['.' + detected?.extension];
    if (!detected || !allowedExtensions.includes(extension)) {
      throw new AppError('INVALID_FILE', 'Nội dung hoặc phần mở rộng PNG, JPEG, PDF không hợp lệ.', 400);
    }
    const finalPath = path.join(uploadDirectory, `${path.parse(req.file.filename).name}.${detected.extension}`);
    fs.renameSync(req.file.path, finalPath);
    req.file.safeName = path.basename(finalPath);
    req.file.detectedMime = detected.mime;
    req.file.path = finalPath;
    next();
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
}

module.exports = { upload, verifyUpload, detectType };
