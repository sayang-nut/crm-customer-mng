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
 *   addComment        – Thêm comment (public/internal), reset stale flag
 *   deleteComment     – Xóa comment của chính mình (Admin xóa được hết)
 *   addAttachment     – Ghi attachment URL (file đã upload qua multer)
 *   listTypes         – Danh sách loại ticket
 *   createType        – Tạo loại ticket mới (Admin)
 *   getStats          – Thống kê nhanh cho dashboard
 *
 * PHÂN QUYỀN (trong service):
 *   Sales    → chỉ thấy ticket KH của mình (cu.assigned_to = user.id)
 *   CSKH/KT  → chỉ thấy ticket assigned cho mình hoặc tự tạo
 *   Admin/Mgr → thấy tất cả
 * ─────────────────────────────────────────────────────────────────
 */

const sequelize    = require('../../config/database');
const { AppError } = require('../../middleware/error.middleware');
const logger       = require('../../config/logger');
const { ROLES, TICKET_STATUS, TICKET_PRIORITY } = require('../../config/constants');

// ─── Helper: lấy ticket đầy đủ ──────────────────────────────────
const _getById = async (id) => {
  const [[ticket]] = await sequelize.query(
    `SELECT t.id, t.title, t.description, t.priority, t.status,
            t.customer_id, t.contract_id, t.ticket_type_id,
            t.assigned_to, t.created_by,
            t.resolved_at, t.closed_at, t.last_updated_at,
            t.stale_notified, t.resolved_remind_sent,
            t.created_at, t.updated_at,
            cu.company_name,
            tt.name AS ticket_type_name, tt.code AS ticket_type_code,
            ua.full_name AS assigned_to_name, ua.role AS assigned_to_role,
            cb.full_name AS created_by_name,
            TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) AS hours_since_update
     FROM tickets t
     JOIN customers cu    ON cu.id = t.customer_id
     JOIN ticket_types tt ON tt.id = t.ticket_type_id
     LEFT JOIN users ua   ON ua.id = t.assigned_to
     JOIN users cb        ON cb.id = t.created_by
     WHERE t.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  const [comments] = await sequelize.query(
    `SELECT tc.id, tc.ticket_id, tc.user_id, tc.content,
            tc.is_internal, tc.created_at,
            u.full_name, u.role
     FROM ticket_comments tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.ticket_id = ?
     ORDER BY tc.created_at ASC`,
    { replacements: [Number(id)] }
  );

  const [attachments] = await sequelize.query(
    `SELECT ta.id, ta.file_name, ta.file_url, ta.file_size, ta.mime_type, ta.created_at,
            u.full_name AS uploaded_by_name
     FROM ticket_attachments ta
     JOIN users u ON u.id = ta.uploaded_by
     WHERE ta.ticket_id = ?
     ORDER BY ta.created_at DESC`,
    { replacements: [Number(id)] }
  );

  return { ...ticket, comments, attachments };
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
  status, priority, ticketTypeId, customerId, assignedTo, search,
} = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conds = ['1=1'], params = [];
  _applyRoleFilter(user, conds, params);

  if (status)       { conds.push('t.status = ?');          params.push(status); }
  if (priority)     { conds.push('t.priority = ?');         params.push(priority); }
  if (ticketTypeId) { conds.push('t.ticket_type_id = ?');   params.push(Number(ticketTypeId)); }
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
            tt.name AS ticket_type_name,
            ua.full_name AS assigned_to_name, t.assigned_to,
            cb.full_name AS created_by_name,
            TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) AS hours_since_update
     FROM tickets t
     JOIN customers cu    ON cu.id = t.customer_id
     JOIN ticket_types tt ON tt.id = t.ticket_type_id
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
  const { title, description, customerId, contractId, ticketTypeId, priority } = data;

  // Validate customer tồn tại
  const [[customer]] = await sequelize.query(
    `SELECT id FROM customers WHERE id = ? LIMIT 1`,
    { replacements: [Number(customerId)] }
  );
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);

  // Validate ticket type tồn tại
  const [[type]] = await sequelize.query(
    `SELECT id FROM ticket_types WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketTypeId)] }
  );
  if (!type) throw new AppError('Loại ticket không tồn tại.', 404);

  const [result] = await sequelize.query(
    `INSERT INTO tickets
       (title, description, customer_id, contract_id, ticket_type_id,
        priority, status, created_by, last_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?, NOW())`,
    {
      replacements: [
        title.trim(),
        description.trim(),
        Number(customerId),
        contractId ? Number(contractId) : null,
        Number(ticketTypeId),
        priority || TICKET_PRIORITY.MEDIUM,
        userId,
      ],
    }
  );

  logger.info(`[TICKETS] Created ticket id=${result.insertId} by user=${userId}`);
  return _getById(result.insertId);
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

  const { title, description, priority, ticketTypeId } = data;
  const fields = [], values = [];

  if (title        !== undefined) { fields.push('title = ?');          values.push(title.trim()); }
  if (description  !== undefined) { fields.push('description = ?');    values.push(description.trim()); }
  if (priority     !== undefined) { fields.push('priority = ?');       values.push(priority); }
  if (ticketTypeId !== undefined) { fields.push('ticket_type_id = ?'); values.push(Number(ticketTypeId)); }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

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
    `SELECT id, status FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketId)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Ticket đã đóng, không thể đổi trạng thái.', 400);
  }
  if (ticket.status === newStatus) {
    throw new AppError(`Ticket đang ở trạng thái "${newStatus}" rồi.`, 400);
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
    `UPDATE tickets SET assigned_to = ?, status = ?, last_updated_at = NOW() WHERE id = ?`,
    { replacements: [Number(assignedTo), newStatus, Number(ticketId)] }
  );

  logger.info(`[TICKETS] Ticket ${ticketId} assigned to user ${assignedTo} by ${userId}`);
  return _getById(ticketId);
};

// ─────────────────────────────────────────────────────────────────
// addComment
// ─────────────────────────────────────────────────────────────────
const addComment = async (ticketId, userId, content, isInternal = false) => {
  const [[ticket]] = await sequelize.query(
    `SELECT id, status FROM tickets WHERE id = ? LIMIT 1`,
    { replacements: [Number(ticketId)] }
  );
  if (!ticket) throw new AppError('Ticket không tồn tại.', 404);
  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new AppError('Không thể thêm comment vào ticket đã đóng.', 400);
  }

  const [result] = await sequelize.query(
    `INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
     VALUES (?, ?, ?, ?)`,
    { replacements: [Number(ticketId), userId, content.trim(), isInternal ? 1 : 0] }
  );

  // Reset stale flag khi có hoạt động mới
  await sequelize.query(
    `UPDATE tickets SET last_updated_at = NOW(), stale_notified = 0 WHERE id = ?`,
    { replacements: [Number(ticketId)] }
  );

  const [[comment]] = await sequelize.query(
    `SELECT tc.*, u.full_name, u.role
     FROM ticket_comments tc JOIN users u ON u.id = tc.user_id
     WHERE tc.id = ? LIMIT 1`,
    { replacements: [result.insertId] }
  );
  return comment;
};

// ─────────────────────────────────────────────────────────────────
// deleteComment
// ─────────────────────────────────────────────────────────────────
const deleteComment = async (commentId, user) => {
  const [[comment]] = await sequelize.query(
    `SELECT id, user_id FROM ticket_comments WHERE id = ? LIMIT 1`,
    { replacements: [Number(commentId)] }
  );
  if (!comment) throw new AppError('Comment không tồn tại.', 404);

  // Chỉ tác giả hoặc Admin được xóa
  if (comment.user_id !== user.id && user.role !== ROLES.ADMIN) {
    throw new AppError('Bạn không có quyền xóa comment này.', 403);
  }

  await sequelize.query(
    `DELETE FROM ticket_comments WHERE id = ?`,
    { replacements: [Number(commentId)] }
  );
};

// ─────────────────────────────────────────────────────────────────
// addAttachment
// ─────────────────────────────────────────────────────────────────
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

  await sequelize.query(
    `UPDATE tickets SET last_updated_at = NOW() WHERE id = ?`,
    { replacements: [Number(ticketId)] }
  );

  return { id: result.insertId, fileName, fileUrl };
};

// ─────────────────────────────────────────────────────────────────
// Ticket Types
// ─────────────────────────────────────────────────────────────────
const listTypes = async () => {
  const [rows] = await sequelize.query(
    `SELECT id, name, code, created_at FROM ticket_types ORDER BY name ASC`
  );
  return rows;
};

const createType = async ({ name, code }) => {
  if (!name || !name.trim()) throw new AppError('Tên loại ticket không được để trống.', 400);
  if (!code || !code.trim()) throw new AppError('Code loại ticket không được để trống.', 400);

  const [[existing]] = await sequelize.query(
    `SELECT id FROM ticket_types WHERE code = ? LIMIT 1`,
    { replacements: [code.trim()] }
  );
  if (existing) throw new AppError('Code loại ticket đã tồn tại.', 409);

  const [result] = await sequelize.query(
    `INSERT INTO ticket_types (name, code) VALUES (?, ?)`,
    { replacements: [name.trim(), code.trim()] }
  );
  return { id: result.insertId, name: name.trim(), code: code.trim() };
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
       COUNT(*)                              AS total,
       SUM(t.status = 'open')               AS open,
       SUM(t.status = 'processing')         AS processing,
       SUM(t.status = 'resolved')           AS resolved,
       SUM(t.status = 'closed')             AS closed,
       SUM(t.priority = 'urgent')           AS urgent,
       SUM(t.priority = 'high')             AS high_priority,
       SUM(TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) >= 36
           AND t.status IN ('open','processing')) AS stale
     FROM tickets t
     JOIN customers cu ON cu.id = t.customer_id
     WHERE ${where}`,
    { replacements: params }
  );

  return {
    total:       Number(stats.total),
    open:        Number(stats.open),
    processing:  Number(stats.processing),
    resolved:    Number(stats.resolved),
    closed:      Number(stats.closed),
    urgent:      Number(stats.urgent),
    highPriority:Number(stats.high_priority),
    stale:       Number(stats.stale),
  };
};

module.exports = {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateStatus,
  assignTicket,
  addComment,
  deleteComment,
  addAttachment,
  listTypes,
  createType,
  getStats,
};