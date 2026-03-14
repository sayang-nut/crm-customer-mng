'use strict';
require('module-alias/register');
/**
 * Auth Middleware
 * ─────────────────────────────────────────────────────────────────
 * authenticate : Verify JWT access token, gán req.user
 * authorize    : Kiểm tra role (variadic, dùng spread ...roles)
 *
 * Shorthand exports:
 *   isAdmin          – chỉ admin
 *   isAdminOrManager – admin | manager
 *   isAdminOrSales   – admin | sales
 *   isSalesOrCSKH    – sales | cskh
 *   notTechnical     – mọi role trừ technical
 *   allRoles         – tất cả 5 roles
 * ─────────────────────────────────────────────────────────────────
 */

const jwt = require('jsonwebtoken');
const { ROLES } = require('@config/constants');
const { AppError } = require('../error');

// ─────────────────────────────────────────────────────────────────
// authenticate – Xác minh access token
// ─────────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access token không được cung cấp.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;   // { id, email, role, fullName, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token đã hết hạn.', 401));
    }
    return next(new AppError('Access token không hợp lệ.', 401));
  }
};

// ─────────────────────────────────────────────────────────────────
// authorize – Kiểm tra role
// ─────────────────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực. Vui lòng đăng nhập.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này.', 403));
    }

    next();
  };
};

// ─────────────────────────────────────────────────────────────────
// Shorthands
// ─────────────────────────────────────────────────────────────────
const isAdmin          = authorize(ROLES.ADMIN);
const isAdminOrManager = authorize(ROLES.ADMIN, ROLES.MANAGER);
const isAdminOrSales   = authorize(ROLES.ADMIN, ROLES.SALES);
const isSalesOrCSKH    = authorize(ROLES.SALES, ROLES.CSKH);
const notTechnical     = authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.CSKH);
const allRoles         = authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.CSKH, ROLES.TECHNICAL);

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isAdminOrManager,
  isAdminOrSales,
  isSalesOrCSKH,
  notTechnical,
  allRoles,
};