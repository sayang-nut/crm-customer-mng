'use strict';

/**
 * @file     backend/src/modules/users/users.service.js
 * @location backend/src/modules/users/users.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database       → sequelize instance
 * @requires ../../config/logger         → winston logger
 * @requires ../../middleware/error.middleware → AppError
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: SERVICE (Business Logic)
 *
 * Xử lý toàn bộ nghiệp vụ quản lý nhân viên nội bộ:
 *   listUsers      – Danh sách có filter + phân trang
 *   getUserById    – Chi tiết 1 user
 *   createUser     – Tạo mới (Admin), mật khẩu mặc định Bado@123
 *   updateUser     – Cập nhật thông tin (Admin)
 *   resetPassword  – Admin đặt lại mật khẩu, revoke session
 *   toggleStatus   – Admin khoá / mở khoá tài khoản
 *   updateProfile  – Nhân viên tự cập nhật profile của mình
 *   getLoginLogs   – Lấy lịch sử đăng nhập (all hoặc theo userId)
 * ─────────────────────────────────────────────────────────────────
 */

const bcrypt     = require('bcryptjs');
const sequelize  = require('@config/database');
const { AppError } = require('@middleware/error');
const logger     = require('@config/logger');

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Lấy 1 user theo id — không trả password_hash ra ngoài.
 * Dùng nội bộ sau mỗi thao tác create/update để trả response.
 */
const _getById = async (id) => {
  const [[user]] = await sequelize.query(
    `SELECT id, full_name, email, role, status,
            avatar_url, last_login_at,
            created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!user) throw new AppError('Nhân viên không tồn tại.', 404);
  return user;
};

/**
 * Build WHERE clause động từ filter object.
 * Trả về { where: string, replacements: any[] }
 */
const _buildWhere = ({ status, role, search }) => {
  const conds        = ['1=1'];
  const replacements = [];

  if (status) {
    conds.push('status = ?');
    replacements.push(status);
  }
  if (role) {
    conds.push('role = ?');
    replacements.push(role);
  }
  if (search && search.trim()) {
    conds.push('(full_name LIKE ? OR email LIKE ?)');
    replacements.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  return { where: conds.join(' AND '), replacements };
};

// ─── Service functions ────────────────────────────────────────────

/**
 * Danh sách nhân viên với filter + phân trang.
 * @param {{ page, limit, status, role, search }} query
 */
const listUsers = async ({ page = 1, limit = 20, status, role, search } = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const { where, replacements } = _buildWhere({ status, role, search });

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM users WHERE ${where}`,
    { replacements }
  );

  const [users] = await sequelize.query(
    `SELECT id, full_name, email, role, status,
            avatar_url, last_login_at,
            created_at, updated_at
     FROM users
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    { replacements: [...replacements, limitNum, offset] }
  );

  return {
    data:       users,
    total:      Number(total),
    page:       pageNum,
    limit:      limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
  };
};

/**
 * Chi tiết 1 nhân viên theo id.
 */
const getUserById = async (id) => _getById(id);

/**
 * Tạo nhân viên mới (Admin only).
 * Mật khẩu mặc định: Bado@123 nếu không truyền password.
 * Sau khi tạo: trả về user đầy đủ (không có hash).
 */
const createUser = async ({ fullName, email, role, password, avatarUrl }) => {
  // Kiểm tra email trùng
  const [[existing]] = await sequelize.query(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    { replacements: [email.toLowerCase().trim()] }
  );
  if (existing) throw new AppError('Email này đã được sử dụng.', 409);

  const hash = await bcrypt.hash(password || 'Bado@123', 12);

  const [result] = await sequelize.query(
    `INSERT INTO users (full_name, email, password_hash, role, avatar_url, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    {
      replacements: [
        fullName.trim(),
        email.toLowerCase().trim(),
        hash,
        role,
        avatarUrl    || null,
      ],
    }
  );

  logger.info(`[USERS] Created user id=${result} email=${email} role=${role}`);
  return _getById(result);
};

/**
 * Cập nhật thông tin nhân viên (Admin only).
 * Chỉ update các field được truyền vào (partial update).
 */
const updateUser = async (id, { fullName, role, status, avatarUrl }) => {
  await _getById(id); // throws 404 nếu không tìm thấy

  const fields = [];
  const values = [];

  if (fullName      !== undefined) { fields.push('full_name = ?');        values.push(fullName.trim()); }
  if (role          !== undefined) { fields.push('role = ?');             values.push(role); }
  if (status        !== undefined) { fields.push('status = ?');           values.push(status); }
  if (avatarUrl     !== undefined) { fields.push('avatar_url = ?');       values.push(avatarUrl); }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  // Nếu khoá / inactive → revoke session
  if (status && status !== 'active') {
    fields.push('refresh_token = NULL');
  }

  await sequelize.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );

  logger.info(`[USERS] Updated user id=${id}`);
  return _getById(id);
};

/**
 * Admin đặt lại mật khẩu cho nhân viên.
 * Sau khi reset: revoke refresh_token → buộc đăng nhập lại.
 */
const resetPassword = async (targetId, newPassword, adminId) => {
  await _getById(targetId);

  const pw   = newPassword && newPassword.trim() ? newPassword.trim() : 'Bado@123';
  const hash = await bcrypt.hash(pw, 12);

  await sequelize.query(
    `UPDATE users SET password_hash = ?, refresh_token = NULL, updated_at = NOW() WHERE id = ?`,
    { replacements: [hash, Number(targetId)] }
  );

  logger.info(`[USERS] Admin ${adminId} reset password for user ${targetId}`);
};

/**
 * Khoá / mở khoá / deactivate tài khoản (Admin only).
 * Nếu status !== 'active' → revoke session ngay.
 */
const toggleStatus = async (id, status, adminId) => {
  await _getById(id);

  const extra = status !== 'active' ? ', refresh_token = NULL' : '';
  await sequelize.query(
    `UPDATE users SET status = ?${extra}, updated_at = NOW() WHERE id = ?`,
    { replacements: [status, Number(id)] }
  );

  logger.info(`[USERS] Admin ${adminId} set user ${id} status → ${status}`);
  return _getById(id);
};

/**
 * Nhân viên tự cập nhật profile (fullName, avatar, password).
 * Không được đổi role / status qua endpoint này.
 */
const updateProfile = async (userId, { fullName, avatarUrl, currentPassword, newPassword }) => {
  const fields = [];
  const values = [];

  // Validate current password if changing password
  if (newPassword) {
    if (!currentPassword) {
      throw new AppError('Vui lòng nhập mật khẩu hiện tại.', 400);
    }

    // Get current user with password hash
    const [[user]] = await sequelize.query(
      `SELECT password_hash FROM users WHERE id = ? LIMIT 1`,
      { replacements: [Number(userId)] }
    );

    if (!user) throw new AppError('Người dùng không tồn tại.', 404);

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Mật khẩu hiện tại không đúng.', 400);
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);
    fields.push('password_hash = ?');
    values.push(newHash);
  }

  if (fullName !== undefined) { fields.push('full_name = ?'); values.push(fullName.trim()); }
  if (avatarUrl !== undefined) { fields.push('avatar_url = ?'); values.push(avatarUrl); }

  if (fields.length > 0) {
    await sequelize.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      { replacements: [...values, Number(userId)] }
    );
  }

  return _getById(userId);
};

/**
 * Lịch sử đăng nhập.
 * @param {number|null} userId  – null = lấy tất cả (Admin)
 * @param {{ page, limit }}
 */
const getLoginLogs = async (userId, { page = 1, limit = 50 } = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const cond         = userId ? 'll.user_id = ?' : '1=1';
  const baseParams   = userId ? [Number(userId)] : [];

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM login_logs ll WHERE ${cond}`,
    { replacements: baseParams }
  );

  const [logs] = await sequelize.query(
    `SELECT ll.id, ll.user_id, u.full_name, u.email, u.role,
            ll.status, ll.created_at
     FROM login_logs ll
     JOIN users u ON u.id = ll.user_id
     WHERE ${cond}
     ORDER BY ll.created_at DESC
     LIMIT ? OFFSET ?`,
    { replacements: [...baseParams, limitNum, offset] }
  );

  return {
    data:       logs,
    total:      Number(total),
    page:       pageNum,
    limit:      limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
  };
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  toggleStatus,
  updateProfile,
  getLoginLogs,
};