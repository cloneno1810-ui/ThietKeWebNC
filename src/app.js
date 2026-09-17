const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const healthRoutes = require('./routes/health.routes');

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Route kiem tra suc khoe goc phuc vu Render Health Check
app.get('/health', (req, res) => res.redirect('/api/v1/health'));

// Xu ly 404 cho API
app.use('/api', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Điểm cuối API không tồn tại',
      requestId: req.id
    }
  });
});

// Xu ly loi tap trung (BM9 - Khong lo thong tin loi noi bo / SQL ra ngoai)
app.use((err, req, res, next) => {
  console.error(`[LOI HE THONG] RequestId: ${req.id} -`, err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.' 
        : err.message,
      requestId: req.id
    }
  });
});

module.exports = app;
