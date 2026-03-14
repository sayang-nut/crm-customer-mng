require('module-alias/register');

const cron = require('node-cron');
const sequelize = require('@config/database');
const logger = require('@config/logger');
const { notifyUsers } = require('../modules/notifications/notifications.service');
const { NOTIFICATION_TYPE, BUSINESS_RULES } = require('../config/constants');

// ============================================================
// JOB 1: Contract expiry warnings (runs every day at 08:00)
// ============================================================
const contractExpiryJob = cron.schedule('0 8 * * *', async () => {
  logger.info('[CRON] Running contract expiry check...');

  try {
    const {
      CONTRACT_WARN_DAYS_1,
      CONTRACT_WARN_DAYS_2,
      CONTRACT_EXPIRED_REMIND_HOURS,
    } = BUSINESS_RULES;

    // --- WARN 30 days ---
    const [warn30Contracts] = await sequelize.query(`
      SELECT c.id, c.contract_number, c.end_date, c.assigned_to,
             cu.company_name,
             DATEDIFF(c.end_date, CURDATE()) as days_left
      FROM contracts c
      JOIN customers cu ON cu.id = c.customer_id
      WHERE c.status = 'active'
        AND DATEDIFF(c.end_date, CURDATE()) <= ?
        AND DATEDIFF(c.end_date, CURDATE()) > ?
        AND c.warn_30_sent = 0
    `, { replacements: [CONTRACT_WARN_DAYS_1, CONTRACT_WARN_DAYS_2] });

    for (const contract of warn30Contracts) {
      const title = `Hợp đồng sắp hết hạn – ${contract.company_name}`;
      const message = `Hợp đồng <b>${contract.contract_number}</b> của khách hàng <b>${contract.company_name}</b> sẽ hết hạn vào <b>${contract.end_date}</b> (còn ${contract.days_left} ngày).\n\nVui lòng liên hệ khách hàng để tư vấn gia hạn.`;

      // Get CSKH assigned to this customer
      const [cskhs] = await sequelize.query(`
        SELECT DISTINCT u.id FROM users u
        WHERE u.role = 'cskh' AND u.status = 'active'
      `);
      const userIds = [contract.assigned_to, ...cskhs.map(u => u.id)];

      await notifyUsers([...new Set(userIds)], NOTIFICATION_TYPE.CONTRACT_WARN_30, title, message, 'contract', contract.id);
      await sequelize.query(`UPDATE contracts SET warn_30_sent = 1 WHERE id = ?`, { replacements: [contract.id] });
      logger.info(`[CRON] Warn-30 sent for contract ${contract.contract_number}`);
    }

    // --- WARN 7 days ---
    const [warn7Contracts] = await sequelize.query(`
      SELECT c.id, c.contract_number, c.end_date, c.assigned_to,
             cu.company_name,
             DATEDIFF(c.end_date, CURDATE()) as days_left
      FROM contracts c
      JOIN customers cu ON cu.id = c.customer_id
      WHERE c.status = 'active'
        AND DATEDIFF(c.end_date, CURDATE()) <= ?
        AND DATEDIFF(c.end_date, CURDATE()) >= 0
        AND c.warn_7_sent = 0
    `, { replacements: [CONTRACT_WARN_DAYS_2] });

    for (const contract of warn7Contracts) {
      const title = `⚠️ Hợp đồng còn ${contract.days_left} ngày hết hạn – ${contract.company_name}`;
      const message = `Hợp đồng <b>${contract.contract_number}</b> của <b>${contract.company_name}</b> sẽ hết hạn vào <b>${contract.end_date}</b>.\n\n⚠️ Chỉ còn <b>${contract.days_left} ngày</b>. Hãy xác nhận gia hạn ngay!`;

      const [cskhs] = await sequelize.query(`SELECT id FROM users WHERE role='cskh' AND status='active'`);
      const userIds = [contract.assigned_to, ...cskhs.map(u => u.id)];

      await notifyUsers([...new Set(userIds)], NOTIFICATION_TYPE.CONTRACT_WARN_7, title, message, 'contract', contract.id);
      await sequelize.query(`UPDATE contracts SET warn_7_sent = 1, status = 'near_expired' WHERE id = ?`, { replacements: [contract.id] });
      logger.info(`[CRON] Warn-7 sent for contract ${contract.contract_number}`);
    }

    // --- EXPIRED - update status ---
    await sequelize.query(`
      UPDATE contracts SET status = 'expired'
      WHERE status IN ('active','near_expired') AND end_date < CURDATE()
    `);

    // Auto-expire customers whose all contracts are expired
    await sequelize.query(`
      UPDATE customers SET status = 'expired'
      WHERE status = 'active'
        AND id NOT IN (
          SELECT DISTINCT customer_id FROM contracts
          WHERE status = 'active' AND end_date >= CURDATE()
        )
        AND id IN (SELECT DISTINCT customer_id FROM contracts WHERE status = 'expired')
    `);

    // --- EXPIRED unrenewed 24h reminder ---
    const expiredReminderHoursAgo = new Date(Date.now() - CONTRACT_EXPIRED_REMIND_HOURS * 60 * 60 * 1000);
    const [expiredUnrenewed] = await sequelize.query(`
      SELECT c.id, c.contract_number, c.end_date, c.assigned_to, cu.company_name
      FROM contracts c
      JOIN customers cu ON cu.id = c.customer_id
      WHERE c.status = 'expired'
        AND c.end_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND c.expired_remind_sent = 0
    `);

    for (const contract of expiredUnrenewed) {
      const title = `🔴 Hợp đồng đã hết hạn chưa gia hạn – ${contract.company_name}`;
      const message = `Hợp đồng <b>${contract.contract_number}</b> của <b>${contract.company_name}</b> đã hết hạn ngày <b>${contract.end_date}</b> và chưa được gia hạn.\n\nVui lòng liên hệ khách hàng sớm nhất có thể.`;

      const [cskhs] = await sequelize.query(`SELECT id FROM users WHERE role='cskh' AND status='active'`);
      const userIds = [contract.assigned_to, ...cskhs.map(u => u.id)];

      await notifyUsers([...new Set(userIds)], NOTIFICATION_TYPE.CONTRACT_EXPIRED_UNRENEWED, title, message, 'contract', contract.id);
      await sequelize.query(`UPDATE contracts SET expired_remind_sent = 1 WHERE id = ?`, { replacements: [contract.id] });
    }

    logger.info('[CRON] Contract expiry check completed.');
  } catch (err) {
    logger.error('[CRON] Contract expiry job error:', err);
  }
}, { timezone: 'Asia/Ho_Chi_Minh' });

// ============================================================
// JOB 2: Ticket stale check (runs every hour)
// ============================================================
const ticketStaleJob = cron.schedule('0 * * * *', async () => {
  logger.info('[CRON] Running ticket stale check...');

  try {
    const { TICKET_STALE_HOURS, TICKET_RESOLVED_CLOSE_HOURS, TICKET_RESOLVED_REMIND_HOURS } = BUSINESS_RULES;

    // --- Stale tickets (open/processing, no update > 36h) ---
    const [staleTickets] = await sequelize.query(`
      SELECT t.id, t.title, t.status, t.assigned_to, t.created_by,
             cu.company_name,
             TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) as stale_hours
      FROM tickets t
      JOIN customers cu ON cu.id = t.customer_id
      WHERE t.status IN ('open','processing')
        AND TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) >= ?
        AND t.stale_notified = 0
    `, { replacements: [TICKET_STALE_HOURS] });

    for (const ticket of staleTickets) {
      const title = `⏰ Ticket chưa cập nhật – ${ticket.company_name}`;
      const message = `Ticket <b>#${ticket.id}: ${ticket.title}</b> của khách hàng <b>${ticket.company_name}</b> chưa được cập nhật trong ${ticket.stale_hours} giờ.\n\nVui lòng xử lý hoặc cập nhật trạng thái.`;

      const userIds = [...new Set([ticket.assigned_to, ticket.created_by].filter(Boolean))];

      // Also notify managers
      const [managers] = await sequelize.query(`SELECT id FROM users WHERE role='manager' AND status='active'`);
      userIds.push(...managers.map(u => u.id));

      await notifyUsers([...new Set(userIds)], NOTIFICATION_TYPE.TICKET_STALE, title, message, 'ticket', ticket.id);
      await sequelize.query(`UPDATE tickets SET stale_notified = 1 WHERE id = ?`, { replacements: [ticket.id] });
    }

    // --- Resolved tickets: remind at 24h ---
    const [resolvedToRemind] = await sequelize.query(`
      SELECT t.id, t.title, t.assigned_to, t.created_by, cu.company_name
      FROM tickets t
      JOIN customers cu ON cu.id = t.customer_id
      WHERE t.status = 'resolved'
        AND TIMESTAMPDIFF(HOUR, t.resolved_at, NOW()) >= ?
        AND t.resolved_remind_sent = 0
    `, { replacements: [TICKET_RESOLVED_REMIND_HOURS] });

    for (const ticket of resolvedToRemind) {
      const title = `📋 Ticket sẽ tự động đóng sau 24h – #${ticket.id}`;
      const message = `Ticket <b>#${ticket.id}: ${ticket.title}</b> đang ở trạng thái Resolved.\n\nNếu không có phản hồi thêm, ticket sẽ tự động chuyển sang <b>Closed</b> sau 24 giờ nữa.`;

      const userIds = [...new Set([ticket.assigned_to, ticket.created_by].filter(Boolean))];
      await notifyUsers([...new Set(userIds)], NOTIFICATION_TYPE.TICKET_RESOLVED_REMIND, title, message, 'ticket', ticket.id);
      await sequelize.query(`UPDATE tickets SET resolved_remind_sent = 1 WHERE id = ?`, { replacements: [ticket.id] });
    }

    // --- Auto-close resolved tickets after 48h ---
    const [toAutoClose] = await sequelize.query(`
      SELECT t.id, t.title, t.assigned_to, t.created_by, cu.company_name
      FROM tickets t
      JOIN customers cu ON cu.id = t.customer_id
      WHERE t.status = 'resolved'
        AND TIMESTAMPDIFF(HOUR, t.resolved_at, NOW()) >= ?
    `, { replacements: [TICKET_RESOLVED_CLOSE_HOURS] });

    for (const ticket of toAutoClose) {
      await sequelize.query(
        `UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE id = ?`,
        { replacements: [ticket.id] }
      );

      const title = `✅ Ticket đã tự động đóng – #${ticket.id}`;
      const message = `Ticket <b>#${ticket.id}: ${ticket.title}</b> đã được hệ thống tự động chuyển sang trạng thái <b>Closed</b>.`;

      const userIds = [...new Set([ticket.assigned_to, ticket.created_by].filter(Boolean))];
      await notifyUsers([...new Set(userIds)], NOTIFICATION_TYPE.TICKET_AUTO_CLOSED, title, message, 'ticket', ticket.id);
      logger.info(`[CRON] Auto-closed ticket #${ticket.id}`);
    }

    logger.info('[CRON] Ticket stale check completed.');
  } catch (err) {
    logger.error('[CRON] Ticket stale job error:', err);
  }
}, { timezone: 'Asia/Ho_Chi_Minh' });

const startCronJobs = () => {
  contractExpiryJob.start();
  ticketStaleJob.start();
  logger.info('[CRON] All cron jobs started.');
};

const stopCronJobs = () => {
  contractExpiryJob.stop();
  ticketStaleJob.stop();
};

module.exports = { startCronJobs, stopCronJobs };