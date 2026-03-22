 'use strict';

/**
 * @file     backend/src/modules/notifications/notifications.service.js
 * @location backend/src/modules/notifications/notifications.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires axios             → Telegram Bot API
 * @requires ../../config/database  → sequelize
 * @requires ../../config/logger    → winston
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: In-app notification + Telegram push
 *
 *   createNotification – Tạo 1 notification, gửi Telegram nếu có chatId
 *   notifyUsers        – Gửi cho danh sách userId (dùng trong cron)
 *   listNotifications  – Danh sách của user, có filter unread
 *   markRead           – Đánh dấu 1 notification đã đọc
 *   markAllRead        – Đánh dấu tất cả đã đọc
 *   getUnreadCount     – Số notification chưa đọc (cho badge)
 *   sendTelegram       – Gửi tin nhắn Telegram trực tiếp
 * ─────────────────────────────────────────────────────────────────
 */

const axios    = require('axios');
const sequelize = require('../../config/database');
const logger   = require('../../config/logger');

const BOT_TOKEN       = () => process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ON     = () => process.env.TELEGRAM_ENABLED === 'true';

// ─────────────────────────────────────────────────────────────────
// sendTelegram
// ─────────────────────────────────────────────────────────────────
const sendTelegram = async (chatId, message) => {
  if (!TELEGRAM_ON() || !BOT_TOKEN() || !chatId) return false;
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`,
      { chat_id: chatId, text: message, parse_mode: 'HTML' }
    );
    return true;
  } catch (err) {
    logger.error('[TELEGRAM] Send error:', err.response?.data || err.message);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────
// createNotification
// ─────────────────────────────────────────────────────────────────
const createNotification = async (userId, type, title, message, refType = null, refId = null) => {
  const [result] = await sequelize.query(
    `INSERT INTO notifications (user_id, type, title, message, ref_type, ref_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    { replacements: [userId, type, title, message, refType, refId] }
  );

  // Gửi Telegram nếu user có chatId
  const [[user]] = await sequelize.query(
    `SELECT telegram_chat_id FROM users WHERE id = ? AND status = 'active' LIMIT 1`,
    { replacements: [userId] }
  );

  let sentTelegram = false;
  if (user?.telegram_chat_id) {
    sentTelegram = await sendTelegram(user.telegram_chat_id, `🔔 <b>${title}</b>\n\n${message}`);
    if (sentTelegram) {
      await sequelize.query(
        `UPDATE notifications SET sent_telegram = 1 WHERE id = ?`,
        { replacements: [result.insertId] }
      );
    }
  }

  return { id: result.insertId, sentTelegram };
};

// ─────────────────────────────────────────────────────────────────
// notifyUsers – Gửi cho danh sách userId (dùng trong cron)
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// listNotifications
// ─────────────────────────────────────────────────────────────────
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
    `SELECT id, type, title, message, ref_type, ref_id, is_read, sent_telegram, created_at
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

// ─────────────────────────────────────────────────────────────────
// markRead / markAllRead / getUnreadCount
// ─────────────────────────────────────────────────────────────────
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
  sendTelegram,
  createNotification,
  notifyUsers,
  listNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
};