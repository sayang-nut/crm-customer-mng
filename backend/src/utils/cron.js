'use strict';

/**
 * @file     backend/src/utils/cron.js
 * @location backend/src/utils/cron.js
 * ─────────────────────────────────────────────────────────────────
 * @requires node-cron              → job scheduler
 * @requires ../config/database     → sequelize
 * @requires ../config/logger       → winston
 * @requires ../config/constants    → NOTIFICATION_TYPE, BUSINESS_RULES
 * @requires ../modules/notifications/notifications.service → notifyUsers
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Tất cả 6 business triggers tự động.
 *
 * JOB 1 – contractExpiryJob  (08:00 mỗi ngày, UTC+7)
 *   Trigger 1: Hợp đồng sắp hết hạn 30 ngày → warn_30_sent
 *   Trigger 2: Hợp đồng sắp hết hạn 7 ngày  → warn_7_sent, status=near_expired
 *   Trigger 3: Hợp đồng đã hết hạn 24h chưa gia hạn → expired_remind_sent
 *   Extra:     Auto-update status expired + auto-expire customer nếu 0 HĐ active
 *
 * JOB 2 – ticketStaleJob  (mỗi giờ, UTC+7)
 *   Trigger 4: Ticket open/processing chưa cập nhật 36h → stale_notified
 *   Trigger 5: Ticket resolved 24h → nhắc sắp tự đóng → resolved_remind_sent
 *   Trigger 6: Ticket resolved 48h → auto close → status=closed
 *
 * ENV VARS:
 *   CONTRACT_WARN_DAYS_1         (default 30)
 *   CONTRACT_WARN_DAYS_2         (default 7)
 *   CONTRACT_EXPIRED_REMIND_HOURS (default 24)
 *   TICKET_STALE_HOURS           (default 36)
 *   TICKET_RESOLVED_CLOSE_HOURS  (default 48)
 *   TICKET_RESOLVED_REMIND_HOURS (default 24)
 */

const cron      = require('node-cron');
const sequelize = require('../config/database');
const logger    = require('../config/logger');
const { notifyUsers }             = require('../modules/notifications/notifications.service');
const { NOTIFICATION_TYPE, BUSINESS_RULES } = require('../config/constants');

// ─── Helper: lấy danh sách Admin + Manager để cũng nhận thông báo ──
const getManagerIds = async () => {
  const [rows] = await sequelize.query(
    `SELECT id FROM users WHERE role IN ('admin','manager') AND status = 'active'`
  );
  return rows.map(r => r.id);
};

const getCskhIds = async () => {
  const [rows] = await sequelize.query(
    `SELECT id FROM users WHERE role = 'cskh' AND status = 'active'`
  );
  return rows.map(r => r.id);
};
// JOB 1: Contract expiry – chạy 08:00 mỗi ngày (UTC+7)
const contractExpiryJob = cron.schedule('0 8 * * *', async () => {
  logger.info('[CRON] Contract expiry check started…');
  try {
    const {
      CONTRACT_WARN_DAYS_1: W1,
      CONTRACT_WARN_DAYS_2: W2,
    } = BUSINESS_RULES;

    const mgrs  = await getManagerIds();
    const cskhs = await getCskhIds();

    // ── Trigger 1: Warn 30 ngày ────────────────────────────────
    const [warn30] = await sequelize.query(
      `SELECT c.id, c.contract_number, c.end_date, c.assigned_to,
              cu.company_name,
              DATEDIFF(c.end_date, CURDATE()) AS days_left
       FROM contracts c
       JOIN customers cu ON cu.id = c.customer_id
       WHERE c.status IN ('active','near_expired')
         AND DATEDIFF(c.end_date, CURDATE()) <= ?
         AND DATEDIFF(c.end_date, CURDATE()) >  ?
         AND c.warn_30_sent = 0`,
      { replacements: [W1, W2] }
    );

    for (const ct of warn30) {
      const title = `Hợp đồng sắp hết hạn – ${ct.company_name}`;
      const msg   = `Hợp đồng <b>${ct.contract_number}</b> của <b>${ct.company_name}</b> hết hạn ngày <b>${ct.end_date}</b> (còn ${ct.days_left} ngày). Vui lòng liên hệ gia hạn.`;
      const ids   = [...new Set([ct.assigned_to, ...cskhs, ...mgrs].filter(Boolean))];
      await notifyUsers(ids, NOTIFICATION_TYPE.CONTRACT_WARN_30, title, msg, 'contract', ct.id);
      await sequelize.query(`UPDATE contracts SET warn_30_sent = 1 WHERE id = ?`, { replacements: [ct.id] });
      logger.info(`[CRON] Warn-30 → contract ${ct.contract_number}`);
    }

    // ── Trigger 2: Warn 7 ngày ─────────────────────────────────
    const [warn7] = await sequelize.query(
      `SELECT c.id, c.contract_number, c.end_date, c.assigned_to,
              cu.company_name,
              DATEDIFF(c.end_date, CURDATE()) AS days_left
       FROM contracts c
       JOIN customers cu ON cu.id = c.customer_id
       WHERE c.status IN ('active','near_expired')
         AND DATEDIFF(c.end_date, CURDATE()) <= ?
         AND DATEDIFF(c.end_date, CURDATE()) >= 0
         AND c.warn_7_sent = 0`,
      { replacements: [W2] }
    );

    for (const ct of warn7) {
      const title = `⚠ Hợp đồng còn ${ct.days_left} ngày hết hạn – ${ct.company_name}`;
      const msg   = `Hợp đồng <b>${ct.contract_number}</b> của <b>${ct.company_name}</b> hết hạn <b>${ct.end_date}</b>. Chỉ còn <b>${ct.days_left} ngày</b>!`;
      const ids   = [...new Set([ct.assigned_to, ...cskhs, ...mgrs].filter(Boolean))];
      await notifyUsers(ids, NOTIFICATION_TYPE.CONTRACT_WARN_7, title, msg, 'contract', ct.id);
      await sequelize.query(
        `UPDATE contracts SET warn_7_sent = 1, status = 'near_expired' WHERE id = ?`,
        { replacements: [ct.id] }
      );
      logger.info(`[CRON] Warn-7 → contract ${ct.contract_number}`);
    }

    // ── Auto-update expired status ──────────────────────────────
    await sequelize.query(
      `UPDATE contracts SET status = 'expired'
       WHERE status IN ('active','near_expired') AND end_date < CURDATE()`
    );

    // ── Auto-expire customer nếu hết HĐ active ─────────────────
    await sequelize.query(
      `UPDATE customers cu
       SET status = 'expired'
       WHERE status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM contracts c
           WHERE c.customer_id = cu.id
             AND c.status IN ('active','near_expired')
             AND c.end_date >= CURDATE()
         )
         AND EXISTS (
           SELECT 1 FROM contracts c
           WHERE c.customer_id = cu.id AND c.status = 'expired'
         )`
    );

    // ── Trigger 3: Expired 24h chưa gia hạn ───────────────────
    const [expiredUnrenewed] = await sequelize.query(
      `SELECT c.id, c.contract_number, c.end_date, c.assigned_to, cu.company_name
       FROM contracts c
       JOIN customers cu ON cu.id = c.customer_id
       WHERE c.status = 'expired'
         AND c.end_date >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)
         AND c.expired_remind_sent = 0`
    );

    for (const ct of expiredUnrenewed) {
      const title = `🔴 Hợp đồng hết hạn chưa gia hạn – ${ct.company_name}`;
      const msg   = `Hợp đồng <b>${ct.contract_number}</b> của <b>${ct.company_name}</b> đã hết hạn ngày <b>${ct.end_date}</b> và chưa được gia hạn. Hãy liên hệ ngay!`;
      const ids   = [...new Set([ct.assigned_to, ...cskhs, ...mgrs].filter(Boolean))];
      await notifyUsers(ids, NOTIFICATION_TYPE.CONTRACT_EXPIRED_UNRENEWED, title, msg, 'contract', ct.id);
      await sequelize.query(`UPDATE contracts SET expired_remind_sent = 1 WHERE id = ?`, { replacements: [ct.id] });
      logger.info(`[CRON] Expired-remind → contract ${ct.contract_number}`);
    }

    logger.info(`[CRON] Contract expiry done. warn30=${warn30.length} warn7=${warn7.length} expired=${expiredUnrenewed.length}`);
  } catch (err) {
    logger.error('[CRON] contractExpiryJob error:', err.message);
  }
}, { timezone: 'Asia/Ho_Chi_Minh' });

// JOB 2: Ticket stale check – chạy mỗi giờ

const ticketStaleJob = cron.schedule('0 * * * *', async () => {
  logger.info('[CRON] Ticket stale check started…');
  try {
    const {
      TICKET_STALE_HOURS:           STALE_H,
      TICKET_RESOLVED_CLOSE_HOURS:  CLOSE_H,
      TICKET_RESOLVED_REMIND_HOURS: REMIND_H,
    } = BUSINESS_RULES;

    const mgrs = await getManagerIds();

    // ── Trigger 4: Ticket stale ≥ 36h 
    const [stale] = await sequelize.query(
      `SELECT t.id, t.title, t.assigned_to, t.created_by, cu.company_name,
              TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) AS stale_hours
       FROM tickets t
       JOIN customers cu ON cu.id = t.customer_id
       WHERE t.status IN ('open','processing')
         AND TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) >= ?
         AND t.stale_notified = 0`,
      { replacements: [STALE_H] }
    );

    for (const tk of stale) {
      const title = `⏰ Ticket chưa cập nhật ${tk.stale_hours}h – ${tk.company_name}`;
      const msg   = `Ticket <b>#${tk.id}: ${tk.title}</b> (${tk.company_name}) chưa được cập nhật trong <b>${tk.stale_hours} giờ</b>. Vui lòng xử lý.`;
      const ids   = [...new Set([tk.assigned_to, tk.created_by, ...mgrs].filter(Boolean))];
      await notifyUsers(ids, NOTIFICATION_TYPE.TICKET_STALE, title, msg, 'ticket', tk.id);
      await sequelize.query(`UPDATE tickets SET stale_notified = 1 WHERE id = ?`, { replacements: [tk.id] });
    }

    // ── Trigger 5: Resolved → remind 24h ──────────────────────
    const [toRemind] = await sequelize.query(
      `SELECT t.id, t.title, t.assigned_to, t.created_by, cu.company_name
       FROM tickets t
       JOIN customers cu ON cu.id = t.customer_id
       WHERE t.status = 'resolved'
         AND TIMESTAMPDIFF(HOUR, t.resolved_at, NOW()) >= ?
         AND t.resolved_remind_sent = 0`,
      { replacements: [REMIND_H] }
    );

    for (const tk of toRemind) {
      const title = `📋 Ticket sẽ tự đóng sau 24h – #${tk.id}`;
      const msg   = `Ticket <b>#${tk.id}: ${tk.title}</b> đang Resolved. Sẽ tự động <b>Closed</b> sau 24h nếu không có cập nhật thêm.`;
      const ids   = [...new Set([tk.assigned_to, tk.created_by].filter(Boolean))];
      await notifyUsers(ids, NOTIFICATION_TYPE.TICKET_RESOLVED_REMIND, title, msg, 'ticket', tk.id);
      await sequelize.query(`UPDATE tickets SET resolved_remind_sent = 1 WHERE id = ?`, { replacements: [tk.id] });
    }

    // ── Trigger 6: Auto-close resolved ≥ 48h ──────────────────
    const [toClose] = await sequelize.query(
      `SELECT t.id, t.title, t.assigned_to, t.created_by, cu.company_name
       FROM tickets t
       JOIN customers cu ON cu.id = t.customer_id
       WHERE t.status = 'resolved'
         AND TIMESTAMPDIFF(HOUR, t.resolved_at, NOW()) >= ?`,
      { replacements: [CLOSE_H] }
    );

    for (const tk of toClose) {
      await sequelize.query(
        `UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE id = ?`,
        { replacements: [tk.id] }
      );
      const title = `✅ Ticket tự động đóng – #${tk.id}`;
      const msg   = `Ticket <b>#${tk.id}: ${tk.title}</b> đã được hệ thống tự động chuyển sang <b>Closed</b>.`;
      const ids   = [...new Set([tk.assigned_to, tk.created_by].filter(Boolean))];
      await notifyUsers(ids, NOTIFICATION_TYPE.TICKET_AUTO_CLOSED, title, msg, 'ticket', tk.id);
      logger.info(`[CRON] Auto-closed ticket #${tk.id}`);
    }

    logger.info(`[CRON] Ticket stale done. stale=${stale.length} remind=${toRemind.length} closed=${toClose.length}`);
  } catch (err) {
    logger.error('[CRON] ticketStaleJob error:', err.message);
  }
}, { timezone: 'Asia/Ho_Chi_Minh' });

// Export
const startCronJobs = () => {
  contractExpiryJob.start();
  ticketStaleJob.start();
  logger.info('[CRON] All 2 jobs started (contractExpiry@08:00 + ticketStale@hourly)');
};

const stopCronJobs = () => {
  contractExpiryJob.stop();
  ticketStaleJob.stop();
  logger.info('[CRON] All jobs stopped');
};

module.exports = { startCronJobs, stopCronJobs };