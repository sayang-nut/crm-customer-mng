'use strict';
require('module-alias/register');
/**
 * @file     backend/src/modules/solutions/solutions.service.js
 * @location backend/src/modules/solutions/solutions.service.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../config/database          → sequelize
 * @requires ../../config/logger            → winston logger
 * @requires ../../middleware/error.middleware → AppError
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: SERVICE (Business Logic)
 *
 * Quản lý danh mục sản phẩm Bado:
 *
 *   INDUSTRIES (ngành nghề KH):
 *     listIndustries, createIndustry, updateIndustry, deleteIndustry
 *
 *   SOLUTION GROUPS (nhóm giải pháp: Bán lẻ, Ăn uống...):
 *     listGroups, getGroupById, createGroup, updateGroup, deleteGroup
 *
 *   SOLUTIONS (giải pháp cụ thể: Bado Retail, Bado FnB...):
 *     listSolutions, getSolutionById, createSolution, updateSolution, deleteSolution
 *
 *   SERVICE PACKAGES (gói dịch vụ: Cơ bản, Chuyên nghiệp...):
 *     listPackages, getPackageById, createPackage, updatePackage,
 *     togglePackageStatus, deletePackage
 * ─────────────────────────────────────────────────────────────────
 */
 
const { query } = require('@config/database');
const { AppError } = require('@middleware/error');  
const { info } = require('@config/logger');
// INDUSTRIES

const listIndustries = async () => {
  const [rows] = await query(
    `SELECT id, name, created_at FROM industries ORDER BY name ASC`
  );
  return rows;
};

const createIndustry = async (name) => {
  if (!name || !name.trim()) throw new AppError('Tên ngành nghề không được để trống.', 400);

  const [[existing]] = await query(
    `SELECT id FROM industries WHERE name = ? LIMIT 1`,
    { replacements: [name.trim()] }
  );
  if (existing) throw new AppError('Ngành nghề này đã tồn tại.', 409);

  const [result] = await query(
    `INSERT INTO industries (name) VALUES (?)`,
    { replacements: [name.trim()] }
  );
  return { id: result.insertId, name: name.trim() };
};

const updateIndustry = async (id, name) => {
  if (!name || !name.trim()) throw new AppError('Tên ngành nghề không được để trống.', 400);

  const [[existing]] = await query(
    `SELECT id FROM industries WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!existing) throw new AppError('Ngành nghề không tồn tại.', 404);

  await query(
    `UPDATE industries SET name = ?, updated_at = NOW() WHERE id = ?`,
    { replacements: [name.trim(), Number(id)] }
  );
  return { id: Number(id), name: name.trim() };
};

const deleteIndustry = async (id) => {
  const [[existing]] = await query(
    `SELECT id FROM industries WHERE id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!existing) throw new AppError('Ngành nghề không tồn tại.', 404);

  // Kiểm tra có KH nào đang dùng không
  const [[inUse]] = await query(
    `SELECT id FROM customers WHERE industry_id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (inUse) throw new AppError('Ngành nghề đang được sử dụng bởi khách hàng, không thể xóa.', 400);

  await query(`DELETE FROM industries WHERE id = ?`, { replacements: [Number(id)] });
};

// ═══════════════════════════════════════════════════════════════════
// SOLUTION GROUPS
// ═══════════════════════════════════════════════════════════════════

const listGroups = async () => {
  const [groups] = await query(
    `SELECT sg.id, sg.name, sg.description, sg.created_at,
            COUNT(s.id) AS solution_count
     FROM solution_groups sg
     LEFT JOIN solutions s ON s.solution_group_id = sg.id
     GROUP BY sg.id
     ORDER BY sg.name ASC`
  );
  return groups;
};

const getGroupById = async (id) => {
  const [[group]] = await query(
    `SELECT sg.id, sg.name, sg.description, sg.created_at,
            COUNT(s.id) AS solution_count
     FROM solution_groups sg
     LEFT JOIN solutions s ON s.solution_group_id = sg.id
     WHERE sg.id = ? GROUP BY sg.id LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!group) throw new AppError('Nhóm giải pháp không tồn tại.', 404);
  return group;
};

const createGroup = async ({ name, description }) => {
  if (!name || !name.trim()) throw new AppError('Tên nhóm không được để trống.', 400);

  const [[existing]] = await query(
    `SELECT id FROM solution_groups WHERE name = ? LIMIT 1`,
    { replacements: [name.trim()] }
  );
  if (existing) throw new AppError('Tên nhóm giải pháp đã tồn tại.', 409);

  const [result] = await query(
    `INSERT INTO solution_groups (name, description) VALUES (?, ?)`,
    { replacements: [name.trim(), description || null] }
  );
  info(`[SOLUTIONS] Created group id=${result.insertId}`);
  return getGroupById(result.insertId);
};

const updateGroup = async (id, { name, description }) => {
  await getGroupById(id); // throws 404
  const fields = [], values = [];
  if (name        !== undefined) { fields.push('name = ?');        values.push(name.trim()); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description || null); }
  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  await query(
    `UPDATE solution_groups SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );
  return getGroupById(id);
};

const deleteGroup = async (id) => {
  await getGroupById(id);
  const [[inUse]] = await query(
    `SELECT id FROM solutions WHERE solution_group_id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (inUse) throw new AppError('Nhóm đang có giải pháp con, không thể xóa.', 400);
  await query(`DELETE FROM solution_groups WHERE id = ?`, { replacements: [Number(id)] });
};

// ═══════════════════════════════════════════════════════════════════
// SOLUTIONS
// ═══════════════════════════════════════════════════════════════════

const listSolutions = async ({ groupId } = {}) => {
  const conds = ['1=1'], replacements = [];
  if (groupId) { conds.push('s.solution_group_id = ?'); replacements.push(Number(groupId)); }

  const [rows] = await query(
    `SELECT s.id, s.name, s.description, s.solution_group_id,
            s.created_at, sg.name AS group_name,
            COUNT(sp.id) AS package_count
     FROM solutions s
     JOIN solution_groups sg ON sg.id = s.solution_group_id
     LEFT JOIN service_packages sp ON sp.solution_id = s.id
     WHERE ${conds.join(' AND ')}
     GROUP BY s.id
     ORDER BY sg.name ASC, s.name ASC`,
    { replacements }
  );
  return rows;
};

const getSolutionById = async (id) => {
  const [[solution]] = await query(
    `SELECT s.id, s.name, s.description, s.solution_group_id,
            s.created_at, sg.name AS group_name
     FROM solutions s
     JOIN solution_groups sg ON sg.id = s.solution_group_id
     WHERE s.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!solution) throw new AppError('Giải pháp không tồn tại.', 404);

  const [packages] = await query(
    `SELECT id, name, level, price_monthly, price_yearly, description, status
     FROM service_packages WHERE solution_id = ? ORDER BY price_monthly ASC`,
    { replacements: [Number(id)] }
  );
  return { ...solution, packages };
};

const createSolution = async ({ solutionGroupId, name, description }) => {
  if (!name || !name.trim()) throw new AppError('Tên giải pháp không được để trống.', 400);
  if (!solutionGroupId) throw new AppError('Nhóm giải pháp không được để trống.', 400);

  await getGroupById(solutionGroupId); // validate group exists

  const [[existing]] = await query(
    `SELECT id FROM solutions WHERE name = ? AND solution_group_id = ? LIMIT 1`,
    { replacements: [name.trim(), Number(solutionGroupId)] }
  );
  if (existing) throw new AppError('Giải pháp này đã tồn tại trong nhóm.', 409);

  const [result] = await query(
    `INSERT INTO solutions (solution_group_id, name, description) VALUES (?, ?, ?)`,
    { replacements: [Number(solutionGroupId), name.trim(), description || null] }
  );
  info(`[SOLUTIONS] Created solution id=${result.insertId}`);
  return getSolutionById(result.insertId);
};

const updateSolution = async (id, { solutionGroupId, name, description }) => {
  await getSolutionById(id);
  const fields = [], values = [];
  if (name            !== undefined) { fields.push('name = ?');              values.push(name.trim()); }
  if (description     !== undefined) { fields.push('description = ?');       values.push(description || null); }
  if (solutionGroupId !== undefined) { fields.push('solution_group_id = ?'); values.push(Number(solutionGroupId)); }
  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  await query(
    `UPDATE solutions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );
  return getSolutionById(id);
};

const deleteSolution = async (id) => {
  await getSolutionById(id);
  const [[inUse]] = await query(
    `SELECT id FROM service_packages WHERE solution_id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (inUse) throw new AppError('Giải pháp đang có gói dịch vụ, không thể xóa.', 400);
  await query(`DELETE FROM solutions WHERE id = ?`, { replacements: [Number(id)] });
};

// ═══════════════════════════════════════════════════════════════════
// SERVICE PACKAGES
// ═══════════════════════════════════════════════════════════════════

const LEVELS = ['support', 'basic', 'professional', 'multichannel', 'enterprise'];

const _getPackageById = async (id) => {
  const [[pkg]] = await query(
    `SELECT sp.id, sp.solution_id, sp.name, sp.level,
            sp.price_monthly, sp.price_yearly, sp.description, sp.status,
            sp.created_at, sp.updated_at,
            s.name AS solution_name, sg.name AS group_name
     FROM service_packages sp
     JOIN solutions s        ON s.id  = sp.solution_id
     JOIN solution_groups sg ON sg.id = s.solution_group_id
     WHERE sp.id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (!pkg) throw new AppError('Gói dịch vụ không tồn tại.', 404);
  return pkg;
};

const listPackages = async ({ solutionId, status } = {}) => {
  const conds = ['1=1'], replacements = [];
  if (solutionId) { conds.push('sp.solution_id = ?'); replacements.push(Number(solutionId)); }
  if (status)     { conds.push('sp.status = ?');      replacements.push(status); }

  const [rows] = await query(
    `SELECT sp.id, sp.solution_id, sp.name, sp.level,
            sp.price_monthly, sp.price_yearly, sp.description, sp.status,
            sp.created_at, s.name AS solution_name, sg.name AS group_name
     FROM service_packages sp
     JOIN solutions s        ON s.id  = sp.solution_id
     JOIN solution_groups sg ON sg.id = s.solution_group_id
     WHERE ${conds.join(' AND ')}
     ORDER BY s.name ASC, sp.price_monthly ASC`,
    { replacements }
  );
  return rows;
};

const getPackageById = async (id) => _getPackageById(id);

const createPackage = async ({ solutionId, name, level, priceMonthly, priceYearly, description, status }) => {
  if (!solutionId) throw new AppError('solutionId không được để trống.', 400);
  if (!name || !name.trim()) throw new AppError('Tên gói không được để trống.', 400);
  if (!level || !LEVELS.includes(level)) {
    throw new AppError(`level phải là: ${LEVELS.join(' | ')}.`, 400);
  }

  await getSolutionById(solutionId); // validate solution exists

  const [[existing]] = await query(
    `SELECT id FROM service_packages WHERE solution_id = ? AND level = ? LIMIT 1`,
    { replacements: [Number(solutionId), level] }
  );
  if (existing) throw new AppError(`Gói cấp "${level}" đã tồn tại trong giải pháp này.`, 409);

  const [result] = await query(
    `INSERT INTO service_packages
       (solution_id, name, level, price_monthly, price_yearly, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    {
      replacements: [
        Number(solutionId), name.trim(), level,
        priceMonthly || 0, priceYearly || 0,
        description || null,
        status || 'active',
      ],
    }
  );
  info(`[SOLUTIONS] Created package id=${result.insertId}`);
  return _getPackageById(result.insertId);
};

const updatePackage = async (id, data) => {
  await _getPackageById(id);
  const { name, level, priceMonthly, priceYearly, description, status } = data;
  const fields = [], values = [];

  if (name         !== undefined) { fields.push('name = ?');          values.push(name.trim()); }
  if (level        !== undefined) {
    if (!LEVELS.includes(level)) throw new AppError(`level không hợp lệ.`, 400);
    fields.push('level = ?'); values.push(level);
  }
  if (priceMonthly !== undefined) { fields.push('price_monthly = ?'); values.push(Number(priceMonthly)); }
  if (priceYearly  !== undefined) { fields.push('price_yearly = ?');  values.push(Number(priceYearly)); }
  if (description  !== undefined) { fields.push('description = ?');   values.push(description || null); }
  if (status       !== undefined) { fields.push('status = ?');        values.push(status); }

  if (fields.length === 0) throw new AppError('Không có trường nào để cập nhật.', 400);

  await query(
    `UPDATE service_packages SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    { replacements: [...values, Number(id)] }
  );
  return _getPackageById(id);
};

const togglePackageStatus = async (id, status) => {
  await _getPackageById(id);
  await query(
    `UPDATE service_packages SET status = ?, updated_at = NOW() WHERE id = ?`,
    { replacements: [status, Number(id)] }
  );
  return _getPackageById(id);
};

const deletePackage = async (id) => {
  await _getPackageById(id);
  // Kiểm tra gói đang được dùng trong hợp đồng
  const [[inUse]] = await query(
    `SELECT id FROM contracts WHERE package_id = ? LIMIT 1`,
    { replacements: [Number(id)] }
  );
  if (inUse) throw new AppError('Gói dịch vụ đang được sử dụng trong hợp đồng, không thể xóa.', 400);
  await query(`DELETE FROM service_packages WHERE id = ?`, { replacements: [Number(id)] });
};

module.exports = {
  // Industries
  listIndustries, createIndustry, updateIndustry, deleteIndustry,
  // Groups
  listGroups, getGroupById, createGroup, updateGroup, deleteGroup,
  // Solutions
  listSolutions, getSolutionById, createSolution, updateSolution, deleteSolution,
  // Packages
  listPackages, getPackageById, createPackage, updatePackage, togglePackageStatus, deletePackage,
};