'use strict';

/**
 * @file     backend/src/modules/customers/customers.service.js
 * @location backend/src/modules/customers/customers.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database          → sequelize
 * @requires ../../config/logger            → winston logger
 * @requires ../../middleware/error.middleware → AppError
 * @requires ../../config/constants         → ROLES, CUSTOMER_STATUS
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: SERVICE (Business Logic)
 *
 * Quản lý khách hàng doanh nghiệp + contacts:
 *   listCustomers    – Danh sách, filter, phân trang (Sales chỉ thấy KH của mình)
 *   getCustomerById  – Chi tiết kèm contacts + lịch sử trạng thái
 *   createCustomer   – Tạo mới, log status_history
 *   updateCustomer   – Partial update (Sales không đổi được assigned_to)
 *   changeStatus     – Chuyển trạng thái lead→active→expired, log lịch sử
 *   getStatusHistory – Lịch sử thay đổi trạng thái
 *   addContact       – Thêm đầu mối liên hệ
 *   updateContact    – Cập nhật đầu mối
 *   deleteContact    – Xóa đầu mối
 *   listIndustries   – Danh sách ngành nghề (dùng cho dropdown)
 *   listSalesUsers   – Danh sách Sales để assign (Admin/Manager)
 * ─────────────────────────────────────────────────────────────────
 */

const sequelize    = require('@config/database');
const { AppError } = require('@middleware/error');
const logger       = require('@config/logger');
const { ROLES, CUSTOMER_STATUS } = require('@config/constants');

// ─── Helper: lấy customer đầy đủ (dùng nội bộ) ──────────────────
const _getById = async (id) => {
  const [[customer]] = await sequelize.query(
    `SELECT c.id, c.company_name, c.tax_code, c.address, c.website,
            c.source, c.status, c.notes,
            c.industry_id, i.name AS industry_name,
            c.assigned_to, u.full_name AS assigned_to_name,
            c.created_by, cb.full_name AS created_by_name,
            c.created_at, c.updated_at
     FROM customers c
     LEFT JOIN industries i  ON i.id  = c.industry_id
     LEFT JOIN users u       ON u.id  = c.assigned_to
     LEFT JOIN users cb      ON cb.id = c.created_by
     WHERE c.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);

  const [contacts] = await sequelize.query(
    `SELECT id, full_name, phone, email, notes, is_primary
     FROM contacts WHERE customer_id = ? ORDER BY is_primary DESC, id ASC`,
    { replacements: [Number(id)] }
  );

  return { ...customer, contacts };
};

// ─────────────────────────────────────────────────────────────────
// listCustomers
// ─────────────────────────────────────────────────────────────────
const listCustomers = async (user, {
  page = 1, limit = 20,
  status, industryId, assignedTo, source, search,
} = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conds        = ['1=1'];
  const replacements = [];

  // Sales chỉ xem KH được assign cho mình
  if (user.role === ROLES.SALES) {
    conds.push('c.assigned_to = ?');
    replacements.push(user.id);
  }

  if (status)     { conds.push('c.status = ?');      replacements.push(status); }
  if (industryId) { conds.push('c.industry_id = ?'); replacements.push(Number(industryId)); }
  if (assignedTo) { conds.push('c.assigned_to = ?'); replacements.push(Number(assignedTo)); }
  if (source)     { conds.push('c.source = ?');      replacements.push(source); }
  if (search && search.trim()) {
    conds.push('(c.company_name LIKE ? OR c.tax_code LIKE ?)');
    replacements.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  const where = conds.join(' AND ');

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM customers c WHERE ${where}`,
    { replacements }
  );

  const [customers] = await sequelize.query(
    `SELECT c.id, c.company_name, c.tax_code, c.source, c.status,
            c.industry_id, i.name AS industry_name,
            c.assigned_to, u.full_name AS assigned_to_name,
            c.created_at, c.updated_at
     FROM customers c
     LEFT JOIN industries i ON i.id = c.industry_id
     LEFT JOIN users u      ON u.id = c.assigned_to
     WHERE ${where}
     ORDER BY c.updated_at DESC
     LIMIT ? OFFSET ?`,
    { replacements: [...replacements, limitNum, offset] }
  );

  return {
    data:       customers,
    total:      Number(total),
    page:       pageNum,
    limit:      limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
  };
};

// ─────────────────────────────────────────────────────────────────
// getCustomerById
// ─────────────────────────────────────────────────────────────────
const getCustomerById = async (id, user) => {
  const customer = await _getById(id);

  // Sales chỉ được xem KH được assign cho mình
  if (user.role === ROLES.SALES && customer.assigned_to !== user.id) {
    throw new AppError('Bạn không có quyền xem khách hàng này.', 403);
  }

  return customer;
};

// ─────────────────────────────────────────────────────────────────
// createCustomer
// ─────────────────────────────────────────────────────────────────
const createCustomer = async (data, userId) => {
  const { companyName, taxCode, address, industryId, website, source, assignedTo, notes } = data;

  // Kiểm tra mã số thuế trùng
  if (taxCode && taxCode.trim()) {
    const [[existing]] = await sequelize.query(
      `SELECT id FROM customers WHERE tax_code = ? LIMIT 1`,
      { replacements: [taxCode.trim()] }
    );
    if (existing) throw new AppError('Mã số thuế này đã tồn tại trong hệ thống.', 409);
  }

  const [result] = await sequelize.query(
    `INSERT INTO customers
       (company_name, tax_code, address, industry_id, website,
        source, assigned_to, notes, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'lead', ?)`,
    {
      replacements: [
        companyName.trim(),
        taxCode?.trim() || null,
        address        || null,
        industryId     || null,
        website        || null,
        source         || null,
        assignedTo     || userId,
        notes          || null,
        userId,
      ],
    }
  );

  // Ghi status history: tạo mới → lead
  await sequelize.query(
    `INSERT INTO customer_status_history
       (customer_id, from_status, to_status, reason, changed_by)
     VALUES (?, NULL, 'lead', 'Tạo khách hàng mới', ?)`,
    { replacements: [result.insertId, userId] }
  );

  logger.info(`[CUSTOMERS] Created customer id=${result.insertId} by user=${userId}`);
  return _getById(result.insertId);
};

// ─────────────────────────────────────────────────────────────────
// updateCustomer
// ─────────────────────────────────────────────────────────────────
const updateCustomer = async (id, data, user) => {
  const [[existing]] = await sequelize.query(
    `SELECT id, assigned_to FROM customers WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!existing) throw new AppError('Khách hàng không tồn tại.', 404);

  // Sales chỉ sửa KH của mình
  if (user.role === ROLES.SALES && existing.assigned_to !== user.id) {
    throw new AppError('Bạn không có quyền chỉnh sửa khách hàng này.', 403);
  }

  const { companyName, taxCode, address, industryId, website, source, assignedTo, notes } = data;
  const fields = [];
  const values = [];

  if (companyName !== undefined) { fields.push('company_name = ?'); values.push(companyName.trim()); }
  if (taxCode     !== undefined) { fields.push('tax_code = ?');     values.push(taxCode?.trim() || null); }
  if (address     !== undefined) { fields.push('address = ?');      values.push(address); }
  if (industryId  !== undefined) { fields.push('industry_id = ?');  values.push(industryId || null); }
  if (website     !== undefined) { fields.push('website = ?');      values.push(website); }
  if (source      !== undefined) { fields.push('source = ?');       values.push(source); }
  if (notes       !== undefined) { fields.push('notes = ?');        values.push(notes); }

  // Chỉ Admin/Manager được đổi assigned_to
  if (assignedTo !== undefined && [ROLES.ADMIN, ROLES.MANAGER].includes(user.role)) {
    fields.push('assigned_to = ?');
    values.push(assignedTo || null);
  }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  await sequelize.query(
    `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );

  return _getById(id);
};

// ─────────────────────────────────────────────────────────────────
// changeStatus
// ─────────────────────────────────────────────────────────────────
const changeStatus = async (id, newStatus, reason, userId) => {
  const [[customer]] = await sequelize.query(
    `SELECT id, status FROM customers WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!customer) throw new AppError('Khách hàng không tồn tại.', 404);
  if (customer.status === newStatus) {
    throw new AppError(`Trạng thái hiện tại đã là "${newStatus}".`, 400);
  }

  await sequelize.query(
    `UPDATE customers SET status = ?, updated_at = NOW() WHERE id = ?`,
    { replacements: [newStatus, Number(id)] }
  );
  await sequelize.query(
    `INSERT INTO customer_status_history
       (customer_id, from_status, to_status, reason, changed_by)
     VALUES (?, ?, ?, ?, ?)`,
    { replacements: [Number(id), customer.status, newStatus, reason || null, userId] }
  );

  logger.info(`[CUSTOMERS] Status changed id=${id}: ${customer.status} → ${newStatus}`);
  return _getById(id);
};

// ─────────────────────────────────────────────────────────────────
// getStatusHistory
// ─────────────────────────────────────────────────────────────────
const getStatusHistory = async (customerId) => {
  const [history] = await sequelize.query(
    `SELECT h.id, h.from_status, h.to_status, h.reason, h.created_at,
            u.full_name AS changed_by_name
     FROM customer_status_history h
     JOIN users u ON u.id = h.changed_by
     WHERE h.customer_id = ?
     ORDER BY h.created_at DESC`,
    { replacements: [Number(customerId)] }
  );
  return history;
};

// ─────────────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────────────
const addContact = async (customerId, { fullName, phone, email, notes, isPrimary }) => {
  // Nếu set primary → bỏ primary của contact khác
  if (isPrimary) {
    await sequelize.query(
      `UPDATE contacts SET is_primary = 0 WHERE customer_id = ?`,
      { replacements: [Number(customerId)] }
    );
  }

  const [result] = await sequelize.query(
    `INSERT INTO contacts (customer_id, full_name, phone, email, notes, is_primary)
     VALUES (?, ?, ?, ?, ?, ?)`,
    { replacements: [
      Number(customerId),
      fullName.trim(),
      phone || null,
      email || null,
      notes || null,
      isPrimary ? 1 : 0,
    ]}
  );

  const [[contact]] = await sequelize.query(
    `SELECT * FROM contacts WHERE id = ? LIMIT 1`,
    { replacements: [result.insertId] }
  );
  return contact;
};

const updateContact = async (contactId, data) => {
  const [[contact]] = await sequelize.query(
    `SELECT id, customer_id FROM contacts WHERE id = ? LIMIT 1`,
    { replacements: [Number(contactId)] }
  );
  if (!contact) throw new AppError('Đầu mối liên hệ không tồn tại.', 404);

  const { fullName, phone, email, notes, isPrimary } = data;

  if (isPrimary) {
    await sequelize.query(
      `UPDATE contacts SET is_primary = 0 WHERE customer_id = ?`,
      { replacements: [contact.customer_id] }
    );
  }

  const fields = [];
  const values = [];
  if (fullName  !== undefined) { fields.push('full_name = ?');  values.push(fullName.trim()); }
  if (phone     !== undefined) { fields.push('phone = ?');      values.push(phone || null); }
  if (email     !== undefined) { fields.push('email = ?');      values.push(email || null); }
  if (notes     !== undefined) { fields.push('notes = ?');      values.push(notes || null); }
  if (isPrimary !== undefined) { fields.push('is_primary = ?'); values.push(isPrimary ? 1 : 0); }

  if (fields.length > 0) {
    await sequelize.query(
      `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
      { replacements: [...values, Number(contactId)] }
    );
  }
};

const deleteContact = async (contactId) => {
  const [[contact]] = await sequelize.query(
    `SELECT id FROM contacts WHERE id = ? LIMIT 1`,
    { replacements: [Number(contactId)] }
  );
  if (!contact) throw new AppError('Đầu mối liên hệ không tồn tại.', 404);
  await sequelize.query(`DELETE FROM contacts WHERE id = ?`, { replacements: [Number(contactId)] });
};

// ─────────────────────────────────────────────────────────────────
// Lookups (dùng cho dropdown FE)
// ─────────────────────────────────────────────────────────────────
const listIndustries = async () => {
  const [rows] = await sequelize.query(`SELECT id, name FROM industries ORDER BY name ASC`);
  return rows;
};

const listSalesUsers = async () => {
  const [rows] = await sequelize.query(
    `SELECT id, full_name, email FROM users
     WHERE role IN ('admin','sales','manager') AND status = 'active'
     ORDER BY full_name ASC`
  );
  return rows;
};

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  changeStatus,
  getStatusHistory,
  addContact,
  updateContact,
  deleteContact,
  listIndustries,
  listSalesUsers,
};