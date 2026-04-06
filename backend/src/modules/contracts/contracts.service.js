'use strict';

/**
 * @file     backend/src/modules/contracts/contracts.service.js
 * @location backend/src/modules/contracts/contracts.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database          → sequelize
 * @requires ../../config/logger            → winston
 * @requires ../../config/constants         → ROLES, CONTRACT_STATUS
 * @requires ../../middleware/error.middleware → AppError
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: SERVICE (Business Logic)
 *
 *   listContracts    – Danh sách + filter + phân trang (role-aware)
 *   getContractById  – Chi tiết kèm renewal history
 *   createContract   – Tạo HĐ, auto-update customer → active
 *   updateContract   – Cập nhật ghi chú / assigned_to
 *   renewContract    – Gia hạn: lưu history, reset warn flags
 *   cancelContract   – Hủy HĐ, ghi lý do vào notes
 *   getStats         – Thống kê nhanh: tổng HĐ, sắp hết hạn, doanh thu
 *
 * PHÂN QUYỀN (áp dụng trong service, không chỉ route):
 *   Sales    : chỉ xem/sửa HĐ được assigned cho mình
 *   Technical: chỉ xem HĐ status = active
 *   Admin/Manager/CSKH: xem tất cả
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const sequelize    = require('@config/database');
const { AppError } = require('@middleware/error');
const logger       = require('@config/logger');
const { ROLES, CONTRACT_STATUS } = require('@config/constants');

// ─── Helper: lấy contract đầy đủ ────────────────────────────────
const _getById = async (id) => {
  const [[contract]] = await sequelize.query(
    `SELECT c.id, c.contract_number, c.customer_id, c.solution_id, c.package_id,
            c.billing_cycle, c.start_date, c.end_date,
            c.value, c.discount, c.final_value, c.status,
            c.notes, c.assigned_to, c.created_by,
            c.warn_30_sent, c.warn_7_sent, c.expired_remind_sent,
            c.created_at, c.updated_at,
            cu.company_name, cu.tax_code,
            s.name  AS solution_name,
            sp.name AS package_name, sp.level AS package_level,
            sp.price_monthly, sp.price_yearly,
            u.full_name  AS assigned_to_name,
            cb.full_name AS created_by_name,
            DATEDIFF(c.end_date, CURDATE()) AS days_until_expiry
     FROM contracts c
     JOIN customers cu     ON cu.id  = c.customer_id
     JOIN solutions s      ON s.id   = c.solution_id
     JOIN service_packages sp ON sp.id = c.package_id
     JOIN users u          ON u.id   = c.assigned_to
     LEFT JOIN users cb    ON cb.id  = c.created_by
     WHERE c.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!contract) throw new AppError('Hợp đồng không tồn tại.', 404);

  const [renewals] = await sequelize.query(
    `SELECT crh.id, crh.old_end_date, crh.new_end_date,
            crh.old_value, crh.new_value, crh.notes, crh.created_at,
            op.name AS old_package_name,
            np.name AS new_package_name,
            u.full_name AS renewed_by_name
     FROM contract_renewal_history crh
     LEFT JOIN service_packages op ON op.id = crh.old_package_id
     LEFT JOIN service_packages np ON np.id = crh.new_package_id
     JOIN users u ON u.id = crh.renewed_by
     WHERE crh.contract_id = ?
     ORDER BY crh.created_at DESC`,
    { replacements: [Number(id)] }
  );

  return { ...contract, renewalHistory: renewals };
};

// ─── Build WHERE theo role ───────────────────────────────────────
const _applyRoleFilter = (user, conds, params) => {
  if (user.role === ROLES.SALES) {
    conds.push('c.assigned_to = ?');
    params.push(user.id);
  } else if (user.role === ROLES.TECHNICAL) {
    conds.push("c.status = 'active'");
  }
  // CSKH, Manager, Admin: xem tất cả
};

// ─────────────────────────────────────────────────────────────────
// listContracts
// ─────────────────────────────────────────────────────────────────
const listContracts = async (user, {
  page = 1, limit = 20,
  status, customerId, assignedTo, expiringSoon, search,
} = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const conds = ['1=1'], params = [];
  _applyRoleFilter(user, conds, params);

  if (status)      { conds.push('c.status = ?');      params.push(status); }
  if (customerId)  { conds.push('c.customer_id = ?'); params.push(Number(customerId)); }
  if (assignedTo)  { conds.push('c.assigned_to = ?'); params.push(Number(assignedTo)); }
  if (expiringSoon) {
    conds.push('c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
    params.push(parseInt(expiringSoon, 10));
  }
  if (search && search.trim()) {
    conds.push('(c.contract_number LIKE ? OR cu.company_name LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  const where = conds.join(' AND ');

  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) AS total
     FROM contracts c
     JOIN customers cu ON cu.id = c.customer_id
     WHERE ${where}`,
    { replacements: params }
  );

  const [rows] = await sequelize.query(
    `SELECT c.id, c.contract_number, c.billing_cycle, c.start_date, c.end_date,
            c.value, c.discount, c.final_value, c.status, c.created_at,
            cu.id AS customer_id, cu.company_name,
            s.name  AS solution_name,
            sp.name AS package_name, sp.level AS package_level,
            u.full_name AS assigned_to_name, c.assigned_to,
            DATEDIFF(c.end_date, CURDATE()) AS days_until_expiry
     FROM contracts c
     JOIN customers cu     ON cu.id  = c.customer_id
     JOIN solutions s      ON s.id   = c.solution_id
     JOIN service_packages sp ON sp.id = c.package_id
     JOIN users u          ON u.id   = c.assigned_to
     WHERE ${where}
     ORDER BY c.end_date ASC
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
// getContractById
// ─────────────────────────────────────────────────────────────────
const getContractById = async (id, user) => {
  const contract = await _getById(id);

  if (user.role === ROLES.SALES && contract.assigned_to !== user.id) {
    throw new AppError('Bạn không có quyền xem hợp đồng này.', 403);
  }

  return contract;
};

// ─────────────────────────────────────────────────────────────────
// createContract
// ─────────────────────────────────────────────────────────────────
const createContract = async (data, userId) => {
  const {
    contractNumber, customerId, solutionId, packageId,
    billingCycle, startDate, endDate, value, discount, notes, assignedTo,
  } = data;

  // Số HĐ unique
  const [[existing]] = await sequelize.query(
    `SELECT id FROM contracts WHERE contract_number = ? LIMIT 1`,
    { replacements: [contractNumber.trim()] }
  );
  if (existing) throw new AppError('Số hợp đồng đã tồn tại trong hệ thống.', 409);

  // Validate ngày
  if (new Date(endDate) <= new Date(startDate)) {
    throw new AppError('Ngày kết thúc phải sau ngày bắt đầu.', 400);
  }

  // Validate package thuộc solution
  const [[pkg]] = await sequelize.query(
    `SELECT id FROM service_packages WHERE id = ? AND solution_id = ? LIMIT 1`,
    { replacements: [Number(packageId), Number(solutionId)] }
  );
  if (!pkg) throw new AppError('Gói dịch vụ không thuộc giải pháp đã chọn.', 400);

  const disc       = Math.min(100, Math.max(0, Number(discount) || 0));
  const finalValue = Number(value) * (1 - disc / 100);
  const assignee   = assignedTo || userId;

  const [result] = await sequelize.query(
    `INSERT INTO contracts
       (contract_number, customer_id, solution_id, package_id, billing_cycle,
        start_date, end_date, value, discount, final_value,
        status, assigned_to, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    {
      replacements: [
        contractNumber.trim(), Number(customerId), Number(solutionId),
        Number(packageId), billingCycle || 'yearly',
        startDate, endDate,
        Number(value), disc, finalValue,
        Number(assignee), notes || null, userId,
      ],
    }
  );

  // Auto-switch customer → active nếu đang là lead/expired
  const [[customer]] = await sequelize.query(
    `SELECT status FROM customers WHERE id = ? LIMIT 1`,
    { replacements: [Number(customerId)] }
  );
  if (customer && customer.status !== 'active') {
    await sequelize.query(
      `UPDATE customers SET status = 'active', updated_at = NOW() WHERE id = ?`,
      { replacements: [Number(customerId)] }
    );
    await sequelize.query(
      `INSERT INTO customer_status_history
         (customer_id, from_status, to_status, reason, changed_by)
       VALUES (?, ?, 'active', 'Ký hợp đồng mới', ?)`,
      { replacements: [Number(customerId), customer.status, userId] }
    );
    logger.info(`[CONTRACTS] Customer ${customerId} auto-activated via new contract`);
  }

  logger.info(`[CONTRACTS] Created contract id=${result} no=${contractNumber}`);
  return _getById(result);
};

// ─────────────────────────────────────────────────────────────────
// updateContract  (chỉ cho phép sửa notes, assigned_to)
// ─────────────────────────────────────────────────────────────────
const updateContract = async (id, data, user) => {
  const [[contract]] = await sequelize.query(
    `SELECT id, assigned_to, status FROM contracts WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!contract) throw new AppError('Hợp đồng không tồn tại.', 404);

  if (user.role === ROLES.SALES && contract.assigned_to !== user.id) {
    throw new AppError('Bạn không có quyền chỉnh sửa hợp đồng này.', 403);
  }
  if (contract.status === CONTRACT_STATUS.CANCELLED) {
    throw new AppError('Không thể chỉnh sửa hợp đồng đã hủy.', 400);
  }

  const fields = [], values = [];
  const { notes, assignedTo } = data;

  if (notes      !== undefined) { fields.push('notes = ?');       values.push(notes); }
  if (assignedTo !== undefined && [ROLES.ADMIN, ROLES.MANAGER].includes(user.role)) {
    fields.push('assigned_to = ?'); values.push(Number(assignedTo));
  }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  await sequelize.query(
    `UPDATE contracts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );

  return _getById(id);
};

// ─────────────────────────────────────────────────────────────────
// renewContract
// ─────────────────────────────────────────────────────────────────
const renewContract = async (contractId, data, userId) => {
  const contract = await _getById(contractId);

  if (contract.status === CONTRACT_STATUS.CANCELLED) {
    throw new AppError('Không thể gia hạn hợp đồng đã hủy.', 400);
  }

  const { newEndDate, newPackageId, newValue, discount, notes } = data;

  if (new Date(newEndDate) <= new Date(contract.end_date)) {
    throw new AppError('Ngày gia hạn mới phải sau ngày kết thúc hiện tại.', 400);
  }

  const usePackageId = newPackageId || contract.package_id;
  const useValue     = newValue     != null ? Number(newValue) : contract.final_value;
  const disc         = Math.min(100, Math.max(0, Number(discount) || 0));
  const finalValue   = useValue * (1 - disc / 100);

  // Lưu lịch sử gia hạn
  await sequelize.query(
    `INSERT INTO contract_renewal_history
       (contract_id, old_end_date, new_end_date,
        old_package_id, new_package_id,
        old_value, new_value, renewed_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    {
      replacements: [
        Number(contractId),
        contract.end_date, newEndDate,
        contract.package_id, Number(usePackageId),
        contract.final_value, finalValue,
        userId, notes || null,
      ],
    }
  );

  // Cập nhật hợp đồng + reset warn flags
  await sequelize.query(
    `UPDATE contracts
     SET end_date = ?, package_id = ?, value = ?, discount = ?, final_value = ?,
         status = 'active',
         warn_30_sent = 0, warn_7_sent = 0, expired_remind_sent = 0,
         updated_at = NOW()
     WHERE id = ?`,
    { replacements: [newEndDate, Number(usePackageId), useValue, disc, finalValue, Number(contractId)] }
  );

  // Đảm bảo customer vẫn active
  await sequelize.query(
    `UPDATE customers SET status = 'active', updated_at = NOW() WHERE id = ?`,
    { replacements: [contract.customer_id] }
  );

  logger.info(`[CONTRACTS] Renewed contract ${contractId} → ${newEndDate}`);
  return _getById(contractId);
};

// ─────────────────────────────────────────────────────────────────
// cancelContract
// ─────────────────────────────────────────────────────────────────
const cancelContract = async (contractId, reason, userId) => {
  const [[contract]] = await sequelize.query(
    `SELECT id, status, customer_id FROM contracts WHERE id = ? LIMIT 1`,
    { replacements: [Number(contractId)] }
  );
  if (!contract) throw new AppError('Hợp đồng không tồn tại.', 404);
  if (contract.status === CONTRACT_STATUS.CANCELLED) {
    throw new AppError('Hợp đồng đã được hủy trước đó.', 400);
  }

  const cancelNote = `\n[HỦY ${new Date().toLocaleDateString('vi-VN')}] ${reason || 'Hủy theo yêu cầu'} (bởi user ${userId})`;

  await sequelize.query(
    `UPDATE contracts
     SET status = 'cancelled', notes = CONCAT(COALESCE(notes,''), ?), updated_at = NOW()
     WHERE id = ?`,
    { replacements: [cancelNote, Number(contractId)] }
  );

  logger.info(`[CONTRACTS] Cancelled contract ${contractId} by user ${userId}`);
};

// ─────────────────────────────────────────────────────────────────
// getStats  – Thống kê nhanh cho dashboard
// ─────────────────────────────────────────────────────────────────
const getStats = async (user) => {
  const conds = ['1=1'], params = [];
  _applyRoleFilter(user, conds, params);
  const where = conds.join(' AND ');

  const [[stats]] = await sequelize.query(
    `SELECT
       COUNT(*)                                                                  AS total,
       SUM(c.status = 'active')                                                 AS active,
       SUM(c.status = 'near_expired')                                           AS near_expired,
       SUM(c.status = 'expired')                                                AS expired,
       SUM(c.status = 'cancelled')                                              AS cancelled,
       SUM(CASE WHEN DATEDIFF(c.end_date, CURDATE()) BETWEEN 0 AND 30
                 AND c.status IN ('active','near_expired') THEN 1 ELSE 0 END)   AS expiring_30d,
       SUM(CASE WHEN DATEDIFF(c.end_date, CURDATE()) BETWEEN 0 AND 7
                 AND c.status IN ('active','near_expired') THEN 1 ELSE 0 END)   AS expiring_7d,
       COALESCE(SUM(CASE WHEN c.status = 'active' THEN c.final_value END), 0)  AS active_value
     FROM contracts c
     JOIN customers cu ON cu.id = c.customer_id
     WHERE ${where}`,
    { replacements: params }
  );

  return {
    total:       Number(stats.total),
    active:      Number(stats.active),
    nearExpired: Number(stats.near_expired),
    expired:     Number(stats.expired),
    cancelled:   Number(stats.cancelled),
    expiring30d: Number(stats.expiring_30d),
    expiring7d:  Number(stats.expiring_7d),
    activeValue: Number(stats.active_value),
  };
};

module.exports = {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  renewContract,
  cancelContract,
  getStats,
};