'use strict';

/**
 * @file     backend/src/modules/dashboard/dashboard.routes.js
 * @location backend/src/modules/dashboard/dashboard.routes.js
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/dashboard', dashboardRoutes)
 *
 * GET /api/dashboard/admin  Admin+Manager      – KPI tổng toàn hệ thống
 * GET /api/dashboard/sales  Admin+Manager+Sales – KPI Sales cá nhân
 * GET /api/dashboard/cskh   Admin+Manager+CSKH  – KPI CSKH cá nhân
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const express = require('express');
const router  = express.Router();
const ctrl    = require('./dashboard.controller');
const { authenticate, authorize } = require('@middleware/auth/auth');
const { ROLES } = require('@config/constants');

router.use(authenticate);
router.get('/admin', authorize(ROLES.ADMIN, ROLES.MANAGER), ctrl.admin);
router.get('/sales', authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES), ctrl.sales);
router.get('/cskh',  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CSKH),  ctrl.cskh);

module.exports = router;