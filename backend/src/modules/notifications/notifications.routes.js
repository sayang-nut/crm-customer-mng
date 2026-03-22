'use strict';

/**
 * @file     backend/src/modules/notifications/notifications.routes.js
 * @location backend/src/modules/notifications/notifications.routes.js
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/notifications', notificationsRoutes)
 *
 * GET  /api/notifications                 All roles – Danh sách của mình
 * GET  /api/notifications/unread-count    All roles – Số chưa đọc (badge)
 * PUT  /api/notifications/mark-all-read   All roles – Đánh dấu tất cả đã đọc
 * PUT  /api/notifications/:id/read        All roles – Đánh dấu 1 đã đọc
 *
 * LƯU Ý: /unread-count và /mark-all-read khai báo TRƯỚC /:id
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const express = require('express');
const { param, query } = require('express-validator');

const router = express.Router();
const ctrl = require('./notifications.controller');
const { authenticate, allRoles } = require('@middleware/auth/auth');
const { validate } = require('@middleware/auth/validate');

router.use(authenticate);

router.get('/',              allRoles, query('page').optional().isInt({min:1}), validate, ctrl.list);
router.get('/unread-count',  allRoles, ctrl.unreadCount);
router.put('/mark-all-read', allRoles, ctrl.markAllRead);
router.put('/:id/read',      allRoles, param('id').isInt({min:1}), validate, ctrl.markRead);

module.exports = router;