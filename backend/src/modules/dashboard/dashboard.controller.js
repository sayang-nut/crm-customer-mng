'use strict';

/**
 * @file     backend/src/modules/dashboard/dashboard.controller.js
 * @location backend/src/modules/dashboard/dashboard.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./dashboard.service
 * ─────────────────────────────────────────────────────────────────
 * GET /api/dashboard/admin  → admin
 * GET /api/dashboard/sales  → sales
 * GET /api/dashboard/cskh   → cskh
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./dashboard.service');

const admin = async (req, res, next) => { try { res.json({ success:true, data: await svc.getAdminDashboard() }); } catch(e) { next(e); } };
const sales = async (req, res, next) => { try { res.json({ success:true, data: await svc.getSalesDashboard(req.query.userId || req.user.id) }); } catch(e) { next(e); } };
const cskh  = async (req, res, next) => { try { res.json({ success:true, data: await svc.getCSKHDashboard(req.query.userId || req.user.id) }); } catch(e) { next(e); } };

module.exports = { admin, sales, cskh };