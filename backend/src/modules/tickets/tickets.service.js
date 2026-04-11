'use strict';

/**
 * @file     backend/src/modules/tickets/tickets.service.js
 * @location backend/src/modules/tickets/tickets.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database            → sequelize
 * @requires ../../config/logger              → winston
 * @requires ../../config/constants           → ROLES, TICKET_STATUS, TICKET_PRIORITY
 * @requires ../../middleware/error.middleware → AppError
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: SERVICE (Business Logic)
 *
 *   listTickets       – Danh sách + filter (role-aware)
 *   getTicketById     – Chi tiết kèm comments + attachments
 *   createTicket      – Tạo ticket mới, reset last_updated_at
 *   updateTicket      – Cập nhật title/description/priority/assignedTo
 *   updateStatus      – Đổi trạng thái, ghi resolved_at / closed_at
 *   assignTicket      – Assign/reassign, auto set processing
 *   addAttachment     – Ghi attachment URL (file đã upload qua multer)
 *   deleteAttachment  – Xóa file đính kèm (Chỉ owner/admin, cấm xóa khi ticket đã đóng)
 *   getStats          – Thống kê nhanh cho dashboard
 *
 * PHÂN QUYỀN (trong service):
 *   Sales    → chỉ thấy ticket KH của mình (cu.assigned_to = user.id)
 *   CSKH/KT  → chỉ thấy ticket assigned cho mình hoặc tự tạo
 *   Admin/Mgr → thấy tất cả
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const sequelize    = require('@config/database');
const { AppError } = require('@middleware/error');
const logger       = require('@config/logger');
const { ROLES, TICKET_STATUS, TICKET_PRIORITY } = require('@config/constants');

// ─── Helper: lấy ticket đầy đủ ──────────────────────────────────
const _getById = async (id) => {
  const [[ticket]] = await sequelize.query(
    `SELECT t.id, t.title, t.description, t.priority, t.status,
            t.customer_id, t.contract_id, t.resolution_notes,
            t.assigned_to, t.created_by,
            t.resolved_at, t.closed_at, t.last_updated_at,
            t.stale_notified, t.resolved_remind_sent,
            t.created_at, t.updated_at,
            cu.company_name,
            ua.full_name AS assigned_to_name, ua.role AS assigned_to_role,
            cb.full_name AS created_by_name,
            TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) AS hours_since_update
     FROM tickets t
     JOIN customers cu    ON cu.id = t.customer_id
     LEFT JOIN users ua   ON ua.id = t.assigned_to
     JOIN users cb        ON cb.id = t.created_by
     WHERE t.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  const [attachments] = await sequelize.query(
    `SELECT ta.id, ta.file_name, ta.file_url, ta.file_size, ta.mime_type, ta.created_at,
            u.full_name AS uploaded_by_name
     FROM ticket_attachments ta
     JOIN users u ON u.id = ta.uploaded_by
     WHERE ta.ticket_id = ?
     ORDER BY ta.created_at DESC`,
    { replacements: [Number(id)] }
  );

  return { ...ticket, attachments };
};

// ─── Role filter ────────────────────────────────────────────────
const _applyRoleFilter = (user, conds, params) => {
  if (user.role === ROLES.SALES) {
    conds.push('cu.assigned_to = ?');
    params.push(user.id);
  } else if (user.role === ROLES.CSKH || user.role === ROLES.TECHNICAL) {
    conds.push('(t.assigned_to = ? OR t.created_by = ?)');
    params.push(user.id, user.id);
  }
};

// ─────────────────────────────────────────────────────────────────
// listTickets
// ─────────────────────────────────────────────────────────────────
const listTickets = async (user, {
  page = 1, limit = 20,
  status, priority, customerId, assignedTo, search,
} = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conds = ['1=1'], params = [];
  _applyRoleFilter(user, conds, params);

  if (status)       { conds.push('t.status = ?');          params.push(status); }
  if (priority)     { conds.push('t.priority = ?');         params.push(priority); }
  if (customerId)   { conds.push('t.customer_id = ?');       params.push(Number(customerId)); }
  if (assignedTo)   { conds.push('t.assigned_to = ?');      params.push(Number(assignedTo)); }
  if (search && search.trim()) {
    conds.push('(t.title LIKE ? OR cu.company_name LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  const where = conds.join(' AND ');

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total
     FROM tickets t
     JOIN customers cu ON cu.id = t.customer_id
     WHERE ${where}`,
    { replacements: params }
  );

  const [rows] = await sequelize.query(
    `SELECT t.id, t.title, t.priority, t.status,
            t.created_at, t.updated_at, t.last_updated_at,
            t.resolved_at, t.closed_at,
            t.customer_id, cu.company_name,
            ua.full_name AS assigned_to_name, t.assigned_to,
            cb.full_name AS created_by_name,
            TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) AS hours_since_update
     FROM tickets t
     JOIN customers cu    ON cu.id = t.customer_id
     LEFT JOIN users ua   ON ua.id = t.assigned_to
     JOIN users cb        ON cb.id = t.created_by
     WHERE ${where}
     ORDER BY FIELD(t.priority,'urgent','high','medium','low'), t.created_at DESC
     LIMIT ? OFFSET ?`,
    { replacements: [...params, limitNum, offset] }
  );

  return {
    data:       rows,
    total:      Number(total),
    page:       pageNum,
    limit:      limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
  };
};

// ─────────────────────────────────────────────────────────────────
// getTicketById
// ─────────────────────────────────────────────────────────────────
const getTicketById = async (id, user) => {
  const ticket = await _getById(id);

  // CSKH/KT chỉ xem ticket được assign hoặc tự tạo
  if (
    (user.role === ROLES.CSKH || user.role === ROLES.TECHNICAL) &&
    ticket.assigned_to !== user.id &&
    ticket.created_by  !== user.id
  ) {
    throw new AppError('Bạn không có quyền xem ticket này.', 403);
  }

  return ticket;
};

// ─────────────────────────────────────────────────────────────────
// createTicket
// ─────────────────────────────────────────────────────────────────
const createTicket = async (data, userId) => {
  const { title, description, customerId, contractId, priority } = data;

  // Validate customer tồn tại
  const [[customer]] = await sequelize.query(
    `SELECT id FROM customers WHERE id = ? LIMIT 1`,
    { replacements: [Number(customerId)] }
  );
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);

  const [result] = await sequelize.query(
    `INSERT INTO tickets
       (title, description, customer_id, contract_id,
        priority, status, created_by, last_updated_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, NOW())`,
    {
      replacements: [
        title.trim(),
        description.trim(),
        Number(customerId),
        contractId ? Number(contractId) : null,
        priority || TICKET_PRIORITY.MEDIUM,
        userId,
      ],
    }
  );

  logger.info(`[TICKETS] Created ticket id=${result} by user=${userId}`);
  return _getById(result);
};

// ─────────────────────────────────────────────────────────────────
// updateTicket
// ─────────────────────────────────────────────────────────────────
const updateTicket = async (id, data, user) => {
  const [[ticket]] = await sequelize.query(
    `SELECT id, assigned_to, created_by, status FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  // CSKH/KT chỉ sửa ticket của mình
  if (
    (user.role === ROLES.CSKH || user.role === ROLES.TECHNICAL) &&
    ticket.assigned_to !== user.id && ticket.created_by !== user.id
  ) {
    throw new AppError('Bạn không có quyền chỉnh sửa ticket này.', 403);
  }

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Không thể chỉnh sửa ticket đã đóng.', 400);
  }

  const { title, description, priority, resolutionNotes } = data;
  const fields = [], values = [];

  if (title        !== undefined) { fields.push('title = ?');          values.push(title.trim()); }
  if (description  !== undefined) { fields.push('description = ?');    values.push(description.trim()); }
  if (priority     !== undefined) { fields.push('priority = ?');       values.push(priority); }
  if (resolutionNotes !== undefined) { fields.push('resolution_notes = ?'); values.push(resolutionNotes.trim()); }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  // Ý tưởng 3: Cập nhật last_updated_at (và reset stale) CHỈ KHI thay đổi description hoặc resolutionNotes
  if (description !== undefined || resolutionNotes !== undefined) {
    fields.push('last_updated_at = NOW()');
    fields.push('stale_notified = 0');
  }

  await sequelize.query(
    `UPDATE tickets SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );

  return _getById(id);
};

// ─────────────────────────────────────────────────────────────────
// updateStatus
// ─────────────────────────────────────────────────────────────────
const updateStatus = async (ticketId, newStatus, userId) => {
  const [[ticket]] = await sequelize.query(
    `SELECT id, status, resolution_notes FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketId)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Ticket đã đóng, không thể đổi trạng thái.', 400);
  }
  if (ticket.status === newStatus) {
    throw new AppError(`Ticket đang ở trạng thái "${newStatus}" rồi.`, 400);
  }

  // Bắt buộc có ghi chú giải quyết trước khi hoàn thành Ticket
  if (newStatus === TICKET_STATUS.RESOLVED && (!ticket.resolution_notes || ticket.resolution_notes.trim() === '')) {
    throw new AppError('Vui lòng nhập ghi chú cách giải quyết trước khi hoàn thành Ticket.', 400);
  }

  const extras = [];
  if (newStatus === TICKET_STATUS.RESOLVED) extras.push('resolved_at = NOW()', 'resolved_remind_sent = 0');
  if (newStatus === TICKET_STATUS.CLOSED)   extras.push('closed_at = NOW()');
  if (newStatus === TICKET_STATUS.OPEN || newStatus === TICKET_STATUS.PROCESSING) {
    extras.push('resolved_at = NULL', 'closed_at = NULL');
  }

  const setClause = [
    'status = ?', 'last_updated_at = NOW()', 'stale_notified = 0',
    ...extras,
  ].join(', ');

  await sequelize.query(
    `UPDATE tickets SET ${setClause} WHERE id = ?`,
    { replacements: [newStatus, Number(ticketId)] }
  );

  logger.info(`[TICKETS] Ticket ${ticketId}: ${ticket.status} → ${newStatus} by user ${userId}`);
  return _getById(ticketId);
};

// ─────────────────────────────────────────────────────────────────
// assignTicket
// ─────────────────────────────────────────────────────────────────
const assignTicket = async (ticketId, assignedTo, userId) => {
  const [[ticket]] = await sequelize.query(
    `SELECT id, status FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketId)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  // Validate user tồn tại + active
  const [[target]] = await sequelize.query(
    `SELECT id FROM users WHERE id = ? AND status = 'active' LIMIT 1`,
    { replacements: [Number(assignedTo)] }
  );
  if (!target) throw new AppError('Nhân viên không tồn tại hoặc không hoạt động.', 404);

  const newStatus = ticket.status === TICKET_STATUS.OPEN ? TICKET_STATUS.PROCESSING : ticket.status;

  await sequelize.query(
    `UPDATE tickets SET assigned_to = ?, status = ?, last_updated_at = NOW(), stale_notified = 0 WHERE id = ?`,
    { replacements: [Number(assignedTo), newStatus, Number(ticketId)] }
  );

  logger.info(`[TICKETS] Ticket ${ticketId} assigned to user ${assignedTo} by ${userId}`);
  return _getById(ticketId);
};

// addAttachment
const addAttachment = async (ticketId, userId, { fileName, fileUrl, fileSize, mimeType }) => {
  if (!fileName || !fileUrl) throw new AppError('fileName và fileUrl là bắt buộc.', 400);

  const [[ticket]] = await sequelize.query(
    `SELECT id FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketId)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  const [result] = await sequelize.query(
    `INSERT INTO ticket_attachments (ticket_id, uploaded_by, file_name, file_url, file_size, mime_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    { replacements: [Number(ticketId), userId, fileName, fileUrl, fileSize || null, mimeType || null] }
  );

  return { id: result, fileName, fileUrl };
};

// deleteAttachment
const deleteAttachment = async (ticketId, attachmentId, user) => {
  // Kiểm tra ticket đã đóng chưa
  const [[ticket]] = await sequelize.query(
    `SELECT status FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketId)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);
  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Không thể xóa file đính kèm của ticket đã đóng.', 400);
  }

  const [[attachment]] = await sequelize.query(
    `SELECT id, uploaded_by FROM ticket_attachments WHERE id = ? AND ticket_id = ? LIMIT 1`,
    { replacements: [Number(attachmentId), Number(ticketId)] }
  );
  if (!attachment) throw new AppError('File đính kèm không tồn tại hoặc không thuộc ticket này.', 404);

  // Chỉ người tải file hoặc Admin mới được quyền xóa
  if (attachment.uploaded_by !== user.id && user.role !== ROLES.ADMIN) {
    throw new AppError('Bạn không có quyền xóa file đính kèm này.', 403);
  }

  await sequelize.query(
    `DELETE FROM ticket_attachments WHERE id = ?`,
    { replacements: [Number(attachmentId)] }
  );

  logger.info(`[TICKETS] Deleted attachment ${attachmentId} from ticket ${ticketId} by user ${user.id}`);
};

// ─────────────────────────────────────────────────────────────────
// getStats
// ─────────────────────────────────────────────────────────────────
const getStats = async (user) => {
  const conds = ['1=1'], params = [];
  _applyRoleFilter(user, conds, params);
  const where = conds.join(' AND ');

  const [[stats]] = await sequelize.query(
  `SELECT
      COUNT(*) AS \`total\`,
      SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) AS \`open\`,
      SUM(CASE WHEN t.status = 'processing' THEN 1 ELSE 0 END) AS \`processing\`,
      SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) AS \`resolved\`,
      SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) AS \`closed\`,
      SUM(CASE WHEN t.priority = 'urgent' THEN 1 ELSE 0 END) AS \`urgent\`,
      SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) AS \`high_priority\`,
      SUM(CASE WHEN TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) >= 36 
                AND t.status IN ('open','processing') THEN 1 ELSE 0 END) AS \`stale\`
   FROM tickets t
   JOIN customers cu ON cu.id = t.customer_id
   WHERE ${where}`,
  { replacements: params }
);

  return {
    total:        Number(stats.total || 0),
    open:         Number(stats.open || 0),
    processing:   Number(stats.processing || 0),
    resolved:     Number(stats.resolved || 0),
    closed:       Number(stats.closed || 0),
    urgent:       Number(stats.urgent || 0),
    highPriority: Number(stats.high_priority || 0),
    stale:        Number(stats.stale || 0),
  };
};

module.exports = {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateStatus,
  assignTicket,
  addAttachment,
  deleteAttachment,
  getStats,
};