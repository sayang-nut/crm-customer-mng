'use strict';

/**
 * @file     backend/src/modules/users/users.routes.js
 * @location backend/src/modules/users/users.routes.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./users.controller
 * @requires ../../middleware/auth.middleware   → authenticate, isAdmin, isAdminOrManager, allRoles
 * @requires ../../middleware/validate.middleware → validate
 * @requires ../../config/constants            → ROLES
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: ROUTES
 * Mount tại: app.js → app.use('/api/users', usersRoutes)
 *
 * ROUTES:
 *   GET    /api/users                       Admin + Manager  – Danh sách
 *   POST   /api/users                       Admin only       – Tạo mới
 *   GET    /api/users/login-logs            Admin only       – Log tất cả
 *   PUT    /api/users/profile               All roles        – Tự cập nhật
 *   GET    /api/users/:id                   Admin + Manager  – Chi tiết
 *   PUT    /api/users/:id                   Admin only       – Cập nhật
 *   PUT    /api/users/:id/reset-password    Admin only       – Reset mật khẩu
 *   PUT    /api/users/:id/status            Admin only       – Khoá/mở khoá
 *   GET    /api/users/:userId/login-logs    Admin only       – Log theo user
 *
 * LƯU Ý THỨ TỰ ROUTE:
 *   Static path (/login-logs, /profile) phải khai báo TRƯỚC /:id
 *   để Express không nhầm "login-logs" là một :id param.
 * ─────────────────────────────────────────────────────────────────
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const ctrl = require('./controller');
const {
  authenticate,
  isAdmin,
  isAdminOrManager,
  allRoles,
} = require('@middleware/auth/auth');
const { validate } = require('@middleware/auth/validate');
const { ROLES, USER_STATUS } = require('@config/constants');

const VALID_ROLES   = Object.values(ROLES);
const VALID_STATUS  = Object.values(USER_STATUS);

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// ── Static routes (khai báo trước /:id) ──────────────────────────

/**
 * GET /api/users/login-logs
 * Admin xem toàn bộ lịch sử đăng nhập hệ thống
 */
router.get('/login-logs',
  isAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương.'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit từ 1–200.'),
  ],
  validate,
  ctrl.loginLogs
);

/**
 * PUT /api/users/profile
 * Nhân viên tự cập nhật thông tin cá nhân (fullName, avatar, telegram)
 */
router.put('/profile',
  allRoles,
  [
    body('fullName').optional().notEmpty().withMessage('Họ tên không được để trống.'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL không hợp lệ.'),
    body('telegramChatId').optional().isString(),
  ],
  validate,
  ctrl.updateProfile
);

// ── Collection routes ─────────────────────────────────────────────

/**
 * GET /api/users
 * Danh sách nhân viên (Admin + Manager), hỗ trợ filter + phân trang
 */
router.get('/',
  isAdminOrManager,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(VALID_STATUS).withMessage('status không hợp lệ.'),
    query('role').optional().isIn(VALID_ROLES).withMessage('role không hợp lệ.'),
  ],
  validate,
  ctrl.list
);

/**
 * POST /api/users
 * Admin tạo tài khoản nhân viên mới
 */
router.post('/',
  isAdmin,
  [
    body('fullName').notEmpty().withMessage('Họ tên không được để trống.'),
    body('email').isEmail().withMessage('Email không hợp lệ.').normalizeEmail(),
    body('role').isIn(VALID_ROLES).withMessage('Vai trò không hợp lệ.'),
    body('password')
      .optional()
      .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Mật khẩu phải có chữ hoa, chữ thường và số.'),
    body('telegramChatId').optional().isString(),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL không hợp lệ.'),
  ],
  validate,
  ctrl.create
);

// ── Item routes (:id) ─────────────────────────────────────────────

/**
 * GET /api/users/:id
 * Chi tiết 1 nhân viên (Admin + Manager)
 */
router.get('/:id',
  isAdminOrManager,
  param('id').isInt({ min: 1 }).withMessage('id phải là số nguyên dương.'),
  validate,
  ctrl.getOne
);

/**
 * PUT /api/users/:id
 * Admin cập nhật thông tin nhân viên (partial update)
 */
router.put('/:id',
  isAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('id không hợp lệ.'),
    body('role').optional().isIn(VALID_ROLES).withMessage('Vai trò không hợp lệ.'),
    body('status').optional().isIn(VALID_STATUS).withMessage('Trạng thái không hợp lệ.'),
    body('fullName').optional().notEmpty().withMessage('Họ tên không được để trống.'),
    body('avatarUrl').optional().isURL().withMessage('Avatar URL không hợp lệ.'),
  ],
  validate,
  ctrl.update
);

/**
 * PUT /api/users/:id/reset-password
 * Admin đặt lại mật khẩu → revoke session của user đó
 */
router.put('/:id/reset-password',
  isAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('id không hợp lệ.'),
    body('newPassword')
      .optional()
      .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Mật khẩu phải có chữ hoa, chữ thường và số.'),
  ],
  validate,
  ctrl.resetPassword
);

/**
 * PUT /api/users/:id/status
 * Admin khoá / mở khoá / deactivate tài khoản
 */
router.put('/:id/status',
  isAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('id không hợp lệ.'),
    body('status').isIn(VALID_STATUS).withMessage('status phải là: active | inactive | locked.'),
  ],
  validate,
  ctrl.toggleStatus
);

/**
 * GET /api/users/:userId/login-logs
 * Admin xem lịch sử đăng nhập của 1 nhân viên cụ thể
 */
router.get('/:userId/login-logs',
  isAdmin,
  [
    param('userId').isInt({ min: 1 }).withMessage('userId không hợp lệ.'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validate,
  ctrl.loginLogs
);

module.exports = router;