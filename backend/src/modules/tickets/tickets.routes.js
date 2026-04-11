'use strict';

/**
 * @file     backend/src/modules/tickets/tickets.routes.js
 * @location backend/src/modules/tickets/tickets.routes.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./tickets.controller
 * @requires ../../middleware/auth.middleware  → authenticate, authorize, isAdmin, allRoles
 * @requires ../../middleware/validate.middleware → validate
 * @requires ../../config/constants → ROLES, TICKET_STATUS, TICKET_PRIORITY
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/tickets', ticketsRoutes)
 *
 * ROUTES (12 endpoints):
 *   GET    /api/tickets/stats                       All roles  – Thống kê
 *   GET    /api/tickets                             All roles  – Danh sách
 *   POST   /api/tickets                             All except Mgr – Tạo ticket
 *   GET    /api/tickets/:id                         All roles  – Chi tiết
 *   PUT    /api/tickets/:id                         Writer     – Sửa info
 *   PUT    /api/tickets/:id/status                  Writer     – Đổi trạng thái
 *   PUT    /api/tickets/:id/assign                  Admin+Mgr+CSKH – Assign
 *   POST   /api/tickets/:id/attachments            Writer     – Thêm attachment
 *   DELETE /api/tickets/:id/attachments/:attId     Writer     – Xóa attachment
 *
 * LƯU Ý: /stats khai báo trước /:id
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const ctrl = require('./tickets.controller');
const {
  authenticate, authorize, isAdmin, allRoles,
} = require('@middleware/auth/auth');
const { validate } = require('@middleware/auth/validate');
const { ROLES, TICKET_STATUS, TICKET_PRIORITY } = require('@config/constants');

const VALID_STATUS   = Object.values(TICKET_STATUS);
const VALID_PRIORITY = Object.values(TICKET_PRIORITY);
const WRITE_ROLES    = [ROLES.ADMIN, ROLES.SALES, ROLES.CSKH, ROLES.TECHNICAL];
const ASSIGN_ROLES   = [ROLES.ADMIN, ROLES.MANAGER, ROLES.CSKH];

router.use(authenticate);

// ── Static routes (trước /:id) ───────────────────────────────────

router.get('/stats', allRoles, ctrl.stats);

// ── Collection ───────────────────────────────────────────────────

router.get('/',
  allRoles,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(VALID_STATUS).withMessage(`status: ${VALID_STATUS.join(' | ')}`),
    query('priority').optional().isIn(VALID_PRIORITY).withMessage(`priority: ${VALID_PRIORITY.join(' | ')}`),
    query('customerId').optional().isInt({ min: 1 }),
    query('assignedTo').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.list
);

router.post('/',
  authorize(...WRITE_ROLES),
  [
    body('title').notEmpty().trim().withMessage('Tiêu đề không được để trống.'),
    body('description').notEmpty().trim().withMessage('Mô tả không được để trống.'),
    body('customerId').isInt({ min: 1 }).withMessage('customerId không hợp lệ.'),
    body('priority').optional().isIn(VALID_PRIORITY).withMessage(`priority: ${VALID_PRIORITY.join(' | ')}`),
    body('contractId').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.create
);

// ── Item routes (:id) ────────────────────────────────────────────

router.get('/:id',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.getOne
);

router.put('/:id',
  authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().notEmpty().trim(),
    body('description').optional().notEmpty().trim(),
    body('priority').optional().isIn(VALID_PRIORITY),
    body('resolutionNotes').optional().isString(),
  ],
  validate,
  ctrl.update
);

router.put('/:id/status',
  authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(VALID_STATUS).withMessage(`status: ${VALID_STATUS.join(' | ')}`),
  ],
  validate,
  ctrl.updateStatus
);

router.put('/:id/assign',
  authorize(...ASSIGN_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('assignedTo').isInt({ min: 1 }).withMessage('assignedTo phải là số nguyên dương.'),
  ],
  validate,
  ctrl.assign
);

// ── Attachments ───────────────────────────────────────────────────

router.post('/:id/attachments',
  authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('fileName').notEmpty().withMessage('fileName không được để trống.'),
    body('fileUrl').notEmpty().withMessage('fileUrl không được để trống.'),
    body('fileSize').optional().isInt({ min: 0 }),
    body('mimeType').optional().isString(),
  ],
  validate,
  ctrl.addAttachment
);

router.delete('/:id/attachments/:attachmentId',
  authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min: 1 }),
    param('attachmentId').isInt({ min: 1 }),
  ],
  validate,
  ctrl.deleteAttachment
);

module.exports = router;