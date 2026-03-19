'use strict';

/**
 * @file     backend/src/modules/users/users.controller.js
 * @location backend/src/modules/users/users.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./users.service  → business logic layer
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: CONTROLLER (HTTP Handler)
 *
 * Nhận HTTP request → trích xuất data → gọi service → trả response.
 * KHÔNG chứa business logic, KHÔNG giao tiếp DB trực tiếp.
 *
 * Handlers:
 *   list          GET  /api/users
 *   getOne        GET  /api/users/:id
 *   create        POST /api/users
 *   update        PUT  /api/users/:id
 *   resetPassword PUT  /api/users/:id/reset-password
 *   toggleStatus  PUT  /api/users/:id/status
 *   updateProfile PUT  /api/users/profile
 *   loginLogs     GET  /api/users/login-logs
 *                 GET  /api/users/:userId/login-logs
 * ─────────────────────────────────────────────────────────────────
 */

const usersService = require('./service');

// GET /api/users?page=1&limit=20&status=active&role=sales&search=...
const list = async (req, res, next) => {
  try {
    const result = await usersService.listUsers(req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /api/users/:id
const getOne = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// POST /api/users
const create = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id
const update = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/reset-password
const resetPassword = async (req, res, next) => {
  try {
    await usersService.resetPassword(req.params.id, req.body.newPassword, req.user.id);
    res.json({ success: true, message: 'Mật khẩu đã được đặt lại thành công.' });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/status
const toggleStatus = async (req, res, next) => {
  try {
    const user = await usersService.toggleStatus(req.params.id, req.body.status, req.user.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/profile  (self-update)
const updateProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// GET /api/users/login-logs              → tất cả (Admin)
// GET /api/users/:userId/login-logs      → theo user (Admin)
const loginLogs = async (req, res, next) => {
  try {
    const userId = req.params.userId ? Number(req.params.userId) : null;
    const result = await usersService.getLoginLogs(userId, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

module.exports = {
  list,
  getOne,
  create,
  update,
  resetPassword,
  toggleStatus,
  updateProfile,
  loginLogs,
};