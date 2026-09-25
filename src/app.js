const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const roleApiRoutes = require('./routes/role_api.routes');
const { sendError } = require('./utils/response');

const app = express();

// Bat buoc khi chay sau proxy tren Render / Cloud (Moi truong san pham - Muc 7.6)
app.set('trust proxy', 1);

// Security Headers (BM12)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: true,       // phản chiếu origin của request (cho phép same-origin)
  credentials: true   // cho phép gửi cookie HTTP-Only
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Gan requestId cho moi request de de dang truy vet loi (BM9)
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Phuc vu trang tinh (Landing Page - Buoi 01)
app.use(express.static(path.join(__dirname, 'public')));

// Dang ky routes API v1
app.use('/api/v1', healthRoutes);
app.use('/api/v1', roleApiRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Route kiem tra suc khoe goc phuc vu Render Health Check
app.get('/health', (req, res) => res.redirect('/api/v1/health'));

// Xu ly 404 cho API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Điểm cuối API không tồn tại',
      details: [{ field: 'path', issue: req.originalUrl }],
      timestamp: new Date().toISOString()
    }
  });
});

// Xu ly loi tap trung (BM9 - Khong lo thong tin loi noi bo / SQL ra ngoai)
app.use((err, req, res, next) => {
  console.error(`[LOI HE THONG] RequestId: ${req.id} -`, err);
  return sendError(res, err);
});

module.exports = app;
