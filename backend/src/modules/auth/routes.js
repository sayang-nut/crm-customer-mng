'use strict';

/**
 * Auth Routes – Module 1
 * ─────────────────────────────────────────────────────────────────
 * POST   /api/auth/login              Public  – Đăng nhập
 * POST   /api/auth/refresh            Public  – Làm mới token
 * POST   /api/auth/logout             Auth    – Đăng xuất
 * GET    /api/auth/me                 Auth    – Lấy thông tin bản thân
 * PUT    /api/auth/change-password    Auth    – Đổi mật khẩu cá nhân
 * DELETE /api/auth/sessions/:userId   Admin   – Thu hồi phiên nhân viên
 * ─────────────────────────────────────────────────────────────────
 */

const express    = require('express');
const { body, param } = require('express-validator');
const router     = express.Router();

const controller = require('./auth.controller');
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { validate }              = require('../../middleware/validate.middleware');

// ── Validation schemas ────────────────────────────────────────────

const loginValidation = [
  body('email')
    .isEmail().withMessage('Email không hợp lệ.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống.')
    .isLength({ max: 128 }).withMessage('Mật khẩu không được vượt quá 128 ký tự.'),
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token không được để trống.'),
];

const changePasswordValidation = [
  body('oldPassword')
    .notEmpty().withMessage('Mật khẩu hiện tại không được để trống.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.')
    .isLength({ max: 128 }).withMessage('Mật khẩu mới không được vượt quá 128 ký tự.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.'),
];

const revokeSessionValidation = [
  param('userId')
    .isInt({ min: 1 }).withMessage('userId phải là số nguyên dương.'),
];

// ── Routes ────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/login
 * @access  Public
 * @desc    Đăng nhập, nhận access + refresh token
 */
router.post('/login',
  loginValidation,
  validate,
  controller.login
);

/**
 * @route   POST /api/auth/refresh
 * @access  Public
 * @desc    Cấp lại access token từ refresh token (rotation)
 */
router.post('/refresh',
  refreshValidation,
  validate,
  controller.refresh
);

/**
 * @route   POST /api/auth/logout
 * @access  Private (tất cả roles)
 * @desc    Đăng xuất, vô hiệu hóa refresh token
 */
router.post('/logout',
  authenticate,
  controller.logout
);

/**
 * @route   GET /api/auth/me
 * @access  Private (tất cả roles)
 * @desc    Lấy thông tin đầy đủ của user đang đăng nhập
 */
router.get('/me',
  authenticate,
  controller.me
);

/**
 * @route   PUT /api/auth/change-password
 * @access  Private (tất cả roles)
 * @desc    Đổi mật khẩu cá nhân (cần mật khẩu cũ)
 */
router.put('/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  controller.changePassword
);

/**
 * @route   DELETE /api/auth/sessions/:userId
 * @access  Admin only
 * @desc    Thu hồi phiên đăng nhập của nhân viên
 */
router.delete('/sessions/:userId',
  authenticate,
  isAdmin,
  revokeSessionValidation,
  validate,
  controller.revokeSession
);

module.exports = router;