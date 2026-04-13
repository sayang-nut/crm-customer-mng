'use strict';

/**
 * @file     backend/src/modules/revenues/revenues.service.js
 * @location backend/src/modules/revenues/revenues.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database            → sequelize
 * @requires ../../config/logger              → winston
 * @requires ../../config/constants           → ROLES, PAYMENT_METHOD
 * @requires ../../middleware/error.middleware → AppError
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: SERVICE (Business Logic)  
 *
 *   listRevenues    – Danh sách bản ghi thanh toán (role-aware)
 *   getById         – Chi tiết 1 bản ghi
 *   createRevenue   – Ghi nhận thanh toán (Sales only theo design)
 *   updateRevenue   – Sửa bản ghi (tác giả hoặc Admin)
 *   deleteRevenue   – Xóa bản ghi (Admin only)
 *   getSummary      – Tổng hợp theo tháng/năm, theo giải pháp
 *   getStats        – Thống kê nhanh: tháng này, năm này, tổng
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const sequelize    = require('@config/database');
const { AppError } = require('@middleware/error');
const logger       = require('@config/logger');
const { ROLES, PAYMENT_METHOD } = require('@config/constants');

const VALID_METHODS = Object.values(PAYMENT_METHOD);

// ─── Helper ──────────────────────────────────────────────────────
const _getById = async (id) => {
  const [[rev]] = await sequelize.query(
    `SELECT r.id, r.contract_id, r.customer_id, r.amount, r.status, r.due_date,
            r.payment_date, r.payment_method, r.billing_period, r.proof_url,
            r.notes, r.created_by, r.created_at, r.updated_at,
            c.contract_number, c.assigned_to,
            cu.company_name,
            s.name  AS solution_name,
            sp.name AS package_name,
            u.full_name AS created_by_name
     FROM revenues r
     JOIN contracts c     ON c.id  = r.contract_id
     JOIN customers cu    ON cu.id = r.customer_id
     JOIN solutions s     ON s.id  = c.solution_id
     JOIN service_packages sp ON sp.id = c.package_id
     JOIN users u         ON u.id  = r.created_by
     WHERE r.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!rev) throw new AppError('Bản ghi doanh thu không tồn tại.', 404);
  return rev;
};

// listRevenues
const listRevenues = async (user, {
  page = 1, limit = 20,
  contractId, customerId, fromDate, toDate, paymentMethod,
} = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conds = ['1=1'], params = [];

  // Sales chỉ xem bản ghi thuộc hợp đồng mình phụ trách
  if (user.role === ROLES.SALES) {
    conds.push('c.assigned_to = ?');
    params.push(user.id);
  }

  if (contractId)    { conds.push('r.contract_id = ?');     params.push(Number(contractId)); }
  if (customerId)    { conds.push('r.customer_id = ?');     params.push(Number(customerId)); }
  if (fromDate)      { conds.push('r.created_at >= ?');     params.push(fromDate); } // Lọc theo ngày tạo bản ghi thay vì ngày TT
  if (toDate)        { conds.push('r.created_at <= ?');     params.push(toDate); }
  if (paymentMethod) { conds.push('r.payment_method = ?'); params.push(paymentMethod); }

  const where = conds.join(' AND ');

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total 
     FROM revenues r 
     JOIN contracts c ON c.id = r.contract_id 
     WHERE ${where}`,
    { replacements: params }
  );

  const [rows] = await sequelize.query(
    `SELECT r.id, r.contract_id, r.customer_id, r.amount, r.status, r.due_date,
            r.payment_date, r.payment_method, r.billing_period, r.proof_url,
            r.notes, r.created_at,
            c.contract_number,
            cu.company_name,
            s.name AS solution_name,
            u.full_name AS created_by_name
     FROM revenues r
     JOIN contracts c  ON c.id  = r.contract_id
     JOIN customers cu ON cu.id = r.customer_id
     JOIN solutions s  ON s.id  = c.solution_id
     JOIN users u      ON u.id  = r.created_by
     WHERE ${where}
     ORDER BY r.created_at DESC
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
// getById
const getById = async (id, user) => {
  const rev = await _getById(id);
  // Sales chỉ xem bản ghi thuộc hợp đồng mình phụ trách
  if (user.role === ROLES.SALES && rev.assigned_to !== user.id) {
    throw new AppError('Bạn không có quyền xem bản ghi này.', 403);
  }
  return rev;
};

// createRevenue
const createRevenue = async (data, userId) => {
  const { contractId, customerId, amount, status, paymentDate, paymentMethod, billingPeriod, notes, proofUrl } = data;

  // Validate contract tồn tại và thuộc customer
  const [[contract]] = await sequelize.query(
    `SELECT id, customer_id, status FROM contracts WHERE id = ? LIMIT 1`,
    { replacements: [Number(contractId)] }
  );
  if (!contract) throw new AppError('Hợp đồng không tồn tại.', 404);
  if (contract.customer_id !== Number(customerId)) {
    throw new AppError('Khách hàng không khớp với hợp đồng.', 400);
  }
  if (contract.status === 'cancelled') {
    throw new AppError('Không thể ghi doanh thu cho hợp đồng đã hủy.', 400);
  }

  if (paymentMethod && !VALID_METHODS.includes(paymentMethod)) {
    throw new AppError(`paymentMethod phải là: ${VALID_METHODS.join(' | ')}.`, 400);
  }

  if (status === 'paid' && !proofUrl) {
    throw new AppError('Bắt buộc phải đính kèm chứng từ thanh toán để xác nhận đã thu tiền.', 400);
  }

  const [result] = await sequelize.query(
    `INSERT INTO revenues
       (contract_id, customer_id, amount, status, due_date, payment_date, payment_method,
        billing_period, notes, proof_url, created_by)
     VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
    {
      replacements: [
        Number(contractId), Number(customerId),
        Number(amount), status || 'pending', paymentDate || null,
        paymentMethod || PAYMENT_METHOD.BANK_TRANSFER,
        billingPeriod || null, notes || null, proofUrl || null, userId,
      ],
    }
  );

  logger.info(`[REVENUES] Created id=${result} amount=${amount} by user=${userId}`);
  return _getById(result);
};
// updateRevenue  (tác giả hoặc Admin)
const updateRevenue = async (id, data, user) => {
  const [[rev]] = await sequelize.query(
    `SELECT r.id, r.created_by, r.status, r.proof_url, c.assigned_to 
     FROM revenues r
     JOIN contracts c ON c.id = r.contract_id
     WHERE r.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!rev) throw new AppError('Bản ghi doanh thu không tồn tại.', 404);

  if (user.role === ROLES.SALES && rev.assigned_to !== user.id) {
    throw new AppError('Bạn không có quyền chỉnh sửa bản ghi này.', 403);
  }

  const { amount, status, paymentDate, paymentMethod, billingPeriod, notes, proofUrl } = data;
  const fields = [], values = [];

  if (amount        !== undefined) { fields.push('amount = ?');         values.push(Number(amount)); }
  if (status        !== undefined) { fields.push('status = ?');         values.push(status); }
  if (paymentDate   !== undefined) { fields.push('payment_date = ?');   values.push(paymentDate || null); }
  if (proofUrl      !== undefined) { fields.push('proof_url = ?');      values.push(proofUrl || null); }
  if (paymentMethod !== undefined) {
    if (paymentMethod && !VALID_METHODS.includes(paymentMethod)) throw new AppError('paymentMethod không hợp lệ.', 400);
    fields.push('payment_method = ?'); values.push(paymentMethod || null);
  }
  if (billingPeriod !== undefined) { fields.push('billing_period = ?'); values.push(billingPeriod || null); }
  if (notes         !== undefined) { fields.push('notes = ?');          values.push(notes || null); }

  // Validation bắt buộc có ảnh chứng từ khi Kế toán/Sales đổi sang Đã Thu (paid)
  const isChangingToPaid = (status === 'paid' || rev.status === 'paid');
  if (isChangingToPaid && !proofUrl && !rev.proof_url) {
     throw new AppError('Bắt buộc phải đính kèm chứng từ thanh toán để xác nhận đã thu tiền.', 400);
  }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  await sequelize.query(
    `UPDATE revenues SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );

  return _getById(id);
};

// deleteRevenue  (Admin only)
const deleteRevenue = async (id) => {
  const [[rev]] = await sequelize.query(
    `SELECT id FROM revenues WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!rev) throw new AppError('Bản ghi doanh thu không tồn tại.', 404);

  await sequelize.query(`DELETE FROM revenues WHERE id = ?`, { replacements: [Number(id)] });
  logger.info(`[REVENUES] Deleted id=${id}`);
};

// getSummary – Doanh thu tổng hợp theo kỳ & giải pháp
const getSummary = async ({ groupBy = 'month', fromDate, toDate, solutionId } = {}) => {
  const conds = ["r.status = 'paid'"], params = []; // Chỉ tính tiền Đã thu

  if (fromDate)   { conds.push('r.payment_date >= ?'); params.push(fromDate); }
  if (toDate)     { conds.push('r.payment_date <= ?'); params.push(toDate); }
  if (solutionId) { conds.push('c.solution_id = ?');   params.push(Number(solutionId)); }

  const where    = conds.join(' AND ');
  const dateFmt  = groupBy === 'year' ? '%Y' : '%Y-%m';

  const [byPeriod] = await sequelize.query(
    `SELECT DATE_FORMAT(r.payment_date, ?) AS period,
            SUM(r.amount) AS total_amount,
            COUNT(r.id)   AS count
     FROM revenues r
     JOIN contracts c ON c.id = r.contract_id
     WHERE ${where}
     GROUP BY period
     ORDER BY period ASC`,
    { replacements: [dateFmt, ...params] }
  );

  const [bySolution] = await sequelize.query(
    `SELECT s.id AS solution_id, s.name AS solution_name,
            SUM(r.amount) AS total_amount, COUNT(r.id) AS count
     FROM revenues r
     JOIN contracts c ON c.id = r.contract_id
     JOIN solutions s ON s.id = c.solution_id
     WHERE ${where}
     GROUP BY s.id
     ORDER BY total_amount DESC`,
    { replacements: params }
  );

  const [[{ grand_total }]] = await sequelize.query(
    `SELECT COALESCE(SUM(r.amount), 0) AS grand_total
     FROM revenues r
     JOIN contracts c ON c.id = r.contract_id
     WHERE ${where}`,
    { replacements: params }
  );

  return {
    byPeriod:   byPeriod.map(r => ({ ...r, totalAmount: Number(r.total_amount), count: Number(r.count) })),
    bySolution: bySolution.map(r => ({ ...r, totalAmount: Number(r.total_amount), count: Number(r.count) })),
    grandTotal: Number(grand_total),
  };
};

// getStats  – Thống kê nhanh cho dashboard
const getStats = async (user) => {
  const conds = ["r.status = 'paid'"], params = []; // Chỉ tính tiền Đã thu
  if (user.role === ROLES.SALES) { conds.push('c.assigned_to = ?'); params.push(user.id); }
  const where = conds.join(' AND ');

  const [[s]] = await sequelize.query(
    `SELECT
       COALESCE(SUM(r.amount), 0)                                              AS total_all,
       COALESCE(SUM(CASE WHEN YEAR(r.payment_date) = YEAR(CURDATE())
                          AND MONTH(r.payment_date) = MONTH(CURDATE())
                     THEN r.amount END), 0)                                    AS this_month,
       COALESCE(SUM(CASE WHEN YEAR(r.payment_date) = YEAR(CURDATE())
                     THEN r.amount END), 0)                                    AS this_year,
       COALESCE(SUM(CASE WHEN YEAR(r.payment_date) = YEAR(CURDATE())
                          AND MONTH(r.payment_date) = MONTH(CURDATE()) - 1
                     THEN r.amount END), 0)                                    AS last_month,
       COUNT(*)                                                                 AS total_count
     FROM revenues r
     JOIN contracts c ON c.id = r.contract_id
     WHERE ${where}`,
    { replacements: params }
  );

  const mom = s.last_month > 0
    ? ((s.this_month - s.last_month) / s.last_month * 100).toFixed(1)
    : null;

  return {
    totalAll:   Number(s.total_all),
    thisMonth:  Number(s.this_month),
    thisYear:   Number(s.this_year),
    lastMonth:  Number(s.last_month),
    totalCount: Number(s.total_count),
    momGrowth:  mom ? Number(mom) : null,  // Month-over-Month %
  };
};

module.exports = {
  listRevenues, getById,
  createRevenue, updateRevenue, deleteRevenue,
  getSummary, getStats,
};