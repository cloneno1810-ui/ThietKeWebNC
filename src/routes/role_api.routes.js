const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * 1. API ĐẶC QUYỀN ADMIN: GET /api/v1/audit-logs
 * Ma trận phân quyền: Chỉ Admin (A4) có quyền truy cập
 */
router.get('/audit-logs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const logs = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;');
    return sendSuccess(res, {
      role: req.user.role,
      user: req.user.email,
      description: 'API Nhật ký hệ thống (Đặc quyền Quản trị viên - Admin)',
      logs: logs.rows,
      count: logs.rowCount
    });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * 2. API ĐẶC QUYỀN QUẢN LÝ: GET /api/v1/reports/revenue
 * Ma trận phân quyền: Chỉ Manager (A3) và Admin (A4) có quyền truy cập
 */
router.get('/reports/revenue', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const summary = await db.query(`
      SELECT 
        COUNT(id) as total_bookings,
        COALESCE(SUM(total_price), 0) as expected_revenue,
        COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as completed_bookings
      FROM bookings;
    `);

    return sendSuccess(res, {
      role: req.user.role,
      user: req.user.email,
      description: 'API Báo cáo Doanh thu Khách sạn (Đặc quyền Quản lý - Manager & Admin)',
      report: summary.rows[0]
    });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * 3. API ĐẶC QUYỀN LỄ TÂN: GET /api/v1/customers
 * Ma trận phân quyền: Chỉ Receptionist (A2), Manager (A3) và Admin (A4) có quyền truy cập
 */
router.get('/customers', authenticate, authorize('receptionist', 'manager', 'admin'), async (req, res) => {
  try {
    const customers = await db.query(`
      SELECT id, email, full_name, phone, identity_card, role, created_at
      FROM users
      WHERE role = 'guest'
      ORDER BY created_at DESC;
    `);

    return sendSuccess(res, {
      role: req.user.role,
      user: req.user.email,
      description: 'API Danh sách Hồ sơ Khách hàng (Đặc quyền Lễ tân - Receptionist)',
      customers: customers.rows,
      count: customers.rowCount
    });
  } catch (err) {
    return sendError(res, err);
  }
});

module.exports = router;
