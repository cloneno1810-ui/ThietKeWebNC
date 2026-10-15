const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs/promises');
const security = require('./config/security');
const { AppError } = require('./utils/response');
const { requestContext, requireHttps, protectOrigin } = require('./middlewares/security.middleware');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const roomTypeRoutes = require('./routes/roomType.routes');
const roomRoutes = require('./routes/room.routes');
const roleApiRoutes = require('./routes/role_api.routes');
const fileRoutes = require('./routes/file.routes');
const { sendError } = require('./utils/response');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

// Bat buoc khi chay sau proxy tren Render / Cloud (Moi truong san pham - Muc 7.6)
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || (security.production ? 1 : 0));
if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 1) throw new Error('TRUST_PROXY_HOPS chỉ nhận 0 hoặc 1.');
app.set('trust proxy', proxyHops);
app.disable('x-powered-by');
app.use(requestContext);

// Áp dụng giới hạn rate limit toàn cục cho tất cả các route API

// Security Headers (BM12)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://ui-avatars.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: security.production ? [] : null
    }
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(requireHttps);
app.use(cookieParser());
app.use(protectOrigin);

app.use(cors({
  origin: (origin, callback) => callback(null, !!origin && security.origins.has(origin)),
  credentials: true   // cho phép gửi cookie HTTP-Only
}));
app.use('/api/', globalLimiter);
app.use(express.json({ limit: '64kb' }));

// Gan requestId cho moi request de de dang truy vet loi (BM9)

// Phuc vu trang tinh (Landing Page - Buoi 01)
const publicDirectory = path.join(__dirname, 'public');
// Fresh nonce for every HTML response. Static assets have no executable inline handlers.
app.use(async (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) return next();
  let pathname;
  try { pathname = decodeURIComponent(req.path); } catch (_) { return next(new AppError('INVALID_INPUT', 'Đường dẫn không hợp lệ.', 400)); }
  if (pathname === '/') pathname = '/index.html';
  if (!pathname.endsWith('.html')) return next();
  const target = path.resolve(publicDirectory, '.' + pathname);
  if (!target.startsWith(publicDirectory + path.sep)) return next();
  try {
    const html = await fs.readFile(target, 'utf8');
    res.setHeader('Cache-Control', 'no-store');
    return res.type('html').send(html.replace(/<script\b/g, `<script nonce="${res.locals.nonce}"`));
  } catch (error) { if (error.code === 'ENOENT') return next(); return next(error); }
});
app.use(express.static(publicDirectory, { index: false, dotfiles: 'deny' }));

// Dang ky routes API v1
app.use('/api/v1', healthRoutes);
app.use('/api/v1', roleApiRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/room-types', roomTypeRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1', fileRoutes);

// Route kiem tra suc khoe goc phuc vu Render Health Check
app.get('/health', (req, res) => res.redirect('/api/v1/health'));

// Xu ly 404 cho API
app.use('/api', (req, res) => {
  return sendError(res, new AppError('RESOURCE_NOT_FOUND', 'Điểm cuối API không tồn tại.', 404));
});

// Xu ly loi tap trung (BM9 - Khong lo thong tin loi noi bo / SQL ra ngoai)
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') err = new AppError('INVALID_FILE', 'Tệp không hợp lệ hoặc vượt giới hạn 5 MB / một tệp.', 400);
  if (err.type === 'entity.parse.failed') err = new AppError('INVALID_INPUT', 'Nội dung JSON không hợp lệ.', 400);
  if (err.type === 'entity.too.large') err = new AppError('INVALID_INPUT', 'Nội dung JSON vượt giới hạn 64 KB.', 413);
  return sendError(res, err);
});

module.exports = app;
