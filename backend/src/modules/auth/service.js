'use strict';
require('module-alias/register');
// ─────────────────────────────────────────────────────────────────
// @file    backend/src/modules/auth/auth.service.js
// @module  Module 1 – Auth
// ─────────────────────────────────────────────────────────────────

/**
 * Auth Service – Module 1
 * ─────────────────────────────────────────────────────────────────
 * Business logic xác thực:
 *   login, refreshTokens, logout, getMe, changePassword, revokeSession
 *
 * JWT Strategy:
 *   Access  : 15m  — payload { id, email, role, fullName }
 *   Refresh : 7d   — payload { id } — lưu DB (1 session/user, rotation)
 * ─────────────────────────c────────────────────────────────────────
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const sequelize    = require('@config/database');
const { AppError } = require('@middleware/error');
const logger       = require('@config/logger');

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Sinh cặp access + refresh token */
const generateTokenPair = (user) => {
  const payload = {
    id:       user.id,
    email:    user.email,
    role:     user.role,
    fullName: user.full_name,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );

  return { accessToken, refreshToken };
};

/** Ghi login_log – lỗi không crash request */
const writeLoginLog = async (userId, status) => {
  try {
    await sequelize.query(
      `INSERT INTO login_logs (user_id, status, created_at)
       VALUES (?, ?, NOW())`,
      { replacements: [userId, status] }
    );
  } catch (err) {
    logger.error('writeLoginLog failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────

/**
 * Đăng nhập – kiểm tra email → status → password.
 * Lưu refresh token vào DB, cập nhật last_login_at, ghi log.
 */
const login = async (email, password) => {
  const [[user]] = await sequelize.query(
    `SELECT id, full_name, email, password_hash, role, status, avatar_url
     FROM users WHERE email = ? LIMIT 1`,
    { replacements: [email.toLowerCase().trim()] }
  );

  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng.', 401);
  }

  if (user.status === 'locked') {
    throw new AppError('Tài khoản đã bị khóa. Vui lòng liên hệ Admin.', 403);
  }

  if (user.status === 'inactive') {
    throw new AppError('Tài khoản chưa được kích hoạt. Vui lòng liên hệ Admin.', 403);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    await writeLoginLog(user.id, 'failed');
    throw new AppError('Email hoặc mật khẩu không đúng.', 401);
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  await sequelize.query(
    `UPDATE users SET refresh_token = ?, last_login_at = NOW() WHERE id = ?`,
    { replacements: [refreshToken, user.id] }
  );

  await writeLoginLog(user.id, 'success');

  return {
    accessToken,
    refreshToken,
    user: {
      id:             user.id,
      fullName:       user.full_name,
      email:          user.email,
      role:           user.role,
      avatarUrl:      user.avatar_url,
    },
  };
};

/**
 * Refresh token rotation.
 * Verify → so sánh DB → sinh pair mới → lưu lại.
 * Nếu token cũ bị reuse: revoke luôn (replay attack detection).
 */
const refreshTokens = async (token) => {
  if (!token) throw new AppError('Refresh token is required.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : 'Refresh token không hợp lệ.';
    throw new AppError(msg, 401);
  }

  const [[user]] = await sequelize.query(
    `SELECT id, full_name, email, role, status, refresh_token
     FROM users WHERE id = ? LIMIT 1`,
    { replacements: [decoded.id] }
  );

  if (!user) throw new AppError('Người dùng không tồn tại.', 401);

  // Phát hiện reuse (replay attack)
  if (user.refresh_token !== token) {
    await sequelize.query(
      `UPDATE users SET refresh_token = NULL WHERE id = ?`,
      { replacements: [user.id] }
    );
    logger.warn(`[AUTH] Refresh token reuse detected – userId: ${user.id}`);
    throw new AppError('Refresh token không hợp lệ. Vui lòng đăng nhập lại.', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Tài khoản không hoạt động.', 403);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  await sequelize.query(
    `UPDATE users SET refresh_token = ? WHERE id = ?`,
    { replacements: [newRefreshToken, user.id] }
  );

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Đăng xuất – xóa refresh token khỏi DB.
 */
const logout = async (userId) => {
  await sequelize.query(
    `UPDATE users SET refresh_token = NULL WHERE id = ?`,
    { replacements: [userId] }
  );
};

/**
 * Lấy thông tin đầy đủ của user đang đăng nhập.
 * Luôn query DB (dữ liệu mới nhất, không phụ thuộc JWT payload).
 */
const getMe = async (userId) => {
  const [[user]] = await sequelize.query(
    `SELECT id, full_name, email, role, status, avatar_url,
            last_login_at, created_at
     FROM users WHERE id = ? LIMIT 1`,
    { replacements: [userId] }
  );

  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  return {
    id:             user.id,
    fullName:       user.full_name,
    email:          user.email,
    role:           user.role,
    status:         user.status,
    avatarUrl:      user.avatar_url,
    lastLoginAt:    user.last_login_at,
    createdAt:      user.created_at,
  };
};

/**
 * Đổi mật khẩu cá nhân.
 * Sau khi đổi: revoke refresh token → buộc đăng nhập lại.
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const [[user]] = await sequelize.query(
    `SELECT id, password_hash FROM users WHERE id = ? LIMIT 1`,
    { replacements: [userId] }
  );

  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  const isValid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isValid) throw new AppError('Mật khẩu hiện tại không đúng.', 400);

  if (oldPassword === newPassword) {
    throw new AppError('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 400);
  }

  const hash = await bcrypt.hash(newPassword, 12);

  await sequelize.query(
    `UPDATE users SET password_hash = ?, refresh_token = NULL WHERE id = ?`,
    { replacements: [hash, userId] }
  );

  logger.info(`[AUTH] User ${userId} changed password – session revoked.`);
};

/**
 * Admin thu hồi phiên của nhân viên khác.
 */
const revokeSession = async (targetUserId, adminId) => {
  const [[target]] = await sequelize.query(
    `SELECT id, full_name FROM users WHERE id = ? LIMIT 1`,
    { replacements: [Number(targetUserId)] }
  );

  if (!target) throw new AppError('Người dùng không tồn tại.', 404);

  await sequelize.query(
    `UPDATE users SET refresh_token = NULL WHERE id = ?`,
    { replacements: [Number(targetUserId)] }
  );

  logger.info(`[AUTH] Admin ${adminId} revoked session for user ${targetUserId} (${target.full_name}).`);
};

module.exports = {
  login,
  refreshTokens,
  logout,
  getMe,
  changePassword,
  revokeSession,
};