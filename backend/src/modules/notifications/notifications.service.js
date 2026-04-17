 'use strict';

/**
 * @file     backend/src/modules/notifications/notifications.service.js
 * @location backend/src/modules/notifications/notifications.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database  → sequelize
 * @requires ../../config/logger    → winston
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: In-app notification management
 *
 *   createNotification – Tạo 1 notification cho user
 *   notifyUsers        – Gửi cho danh sách userId (dùng trong cron)
 *   listNotifications  – Danh sách của user, có filter unread
 *   markRead           – Đánh dấu 1 notification đã đọc
 *   markAllRead        – Đánh dấu tất cả đã đọc
 *   getUnreadCount     – Số notification chưa đọc (cho badge)
 */

const sequelize = require('../../config/database');
const logger   = require('../../config/logger');

// createNotification
const createNotification = async (userId, type, title, message, refType = null, refId = null) => {
  const [result] = await sequelize.query(
    `INSERT INTO notifications (user_id, type, title, message, ref_type, ref_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    { replacements: [userId, type, title, message, refType, refId] }
  );

  return { id: result.insertId };
};

// notifyUsers – Gửi cho danh sách userId (dùng trong cron)
const notifyUsers = async (userIds, type, title, message, refType = null, refId = null) => {
  const results = [];
  for (const uid of userIds) {
    try {
      const r = await createNotification(uid, type, title, message, refType, refId);
      results.push({ userId: uid, ...r });
    } catch (err) {
      logger.error(`[NOTIFICATIONS] Failed for userId=${uid}:`, err.message);
    }
  }
  return results;
};

// listNotifications
const listNotifications = async (userId, { page = 1, limit = 20, unreadOnly } = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conds = ['user_id = ?'], params = [userId];
  if (unreadOnly === 'true' || unreadOnly === true) { conds.push('is_read = 0'); }

  const where = conds.join(' AND ');

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE ${where}`,
    { replacements: params }
  );
  const [[{ unread_count }]] = await sequelize.query(
    `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
    { replacements: [userId] }
  );
  const [rows] = await sequelize.query(
    `SELECT id, type, title, message, ref_type, ref_id, is_read, created_at
     FROM notifications WHERE ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    { replacements: [...params, limitNum, offset] }
  );

  return {
    data:        rows,
    total:       Number(total),
    unreadCount: Number(unread_count),
    page:        pageNum,
    limit:       limitNum,
    totalPages:  Math.ceil(Number(total) / limitNum),
  };
};

// markRead / markAllRead / getUnreadCount
const markRead = async (notificationId, userId) => {
  await sequelize.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    { replacements: [Number(notificationId), userId] }
  );
};

const markAllRead = async (userId) => {
  await sequelize.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
    { replacements: [userId] }
  );
};

const getUnreadCount = async (userId) => {
  const [[{ count }]] = await sequelize.query(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
    { replacements: [userId] }
  );
  return Number(count);
};

module.exports = {
  createNotification,
  notifyUsers,
  listNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
};