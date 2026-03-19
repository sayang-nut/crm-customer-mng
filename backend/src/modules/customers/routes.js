'use strict';

/**
 * @file     backend/src/modules/customers/customers.routes.js
 * @location backend/src/modules/customers/customers.routes.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./customers.controller
 * @requires ../../middleware/auth.middleware  → authenticate, authorize, allRoles, notTechnical
 * @requires ../../middleware/validate.middleware → validate
 * @requires ../../config/constants           → ROLES, CUSTOMER_STATUS
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/customers', customersRoutes)
 *
 * ROUTES:
 *   GET    /api/customers                         All roles   – Danh sách
 *   POST   /api/customers                         Admin+Sales – Tạo mới
 *   GET    /api/customers/industries              All roles   – Dropdown ngành nghề
 *   GET    /api/customers/sales-users             Admin+Mgr   – Dropdown Sales
 *   GET    /api/customers/:id                     All roles   – Chi tiết
 *   PUT    /api/customers/:id                     Admin+Sales – Cập nhật
 *   PUT    /api/customers/:id/status              Admin+Mgr+Sales – Đổi trạng thái
 *   GET    /api/customers/:id/status-history      All roles   – Lịch sử trạng thái
 *   POST   /api/customers/:id/contacts            Admin+Sales+CSKH – Thêm contact
 *   PUT    /api/customers/:id/contacts/:contactId Admin+Sales+CSKH – Sửa contact
 *   DELETE /api/customers/:id/contacts/:contactId Admin+Sales      – Xóa contact
 * ─────────────────────────────────────────────────────────────────
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const ctrl = require('./customers.controller');
const { authenticate, authorize, allRoles, notTechnical } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { ROLES, CUSTOMER_STATUS } = require('../../config/constants');

const VALID_STATUS   = Object.values(CUSTOMER_STATUS);       // lead, active, expired
const CAN_WRITE      = [ROLES.ADMIN, ROLES.SALES];
const CAN_WRITE_CTT  = [ROLES.ADMIN, ROLES.SALES, ROLES.CSKH];
const CAN_STATUS     = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES];

router.use(authenticate);

// ── Static routes (trước /:id) ────────────────────────────────────

/** GET /api/customers/industries */
router.get('/industries', allRoles, ctrl.industries);

/** GET /api/customers/sales-users */
router.get('/sales-users', authorize(ROLES.ADMIN, ROLES.MANAGER), ctrl.salesUsers);

// ── Collection ────────────────────────────────────────────────────

/** GET /api/customers */
router.get('/',
  allRoles,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(VALID_STATUS).withMessage('status không hợp lệ.'),
    query('industryId').optional().isInt({ min: 1 }),
    query('assignedTo').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.list
);

/** POST /api/customers */
router.post('/',
  authorize(...CAN_WRITE),
  [
    body('companyName').notEmpty().withMessage('Tên doanh nghiệp không được để trống.'),
    body('taxCode').optional().isString().trim(),
    body('industryId').optional().isInt({ min: 1 }),
    body('assignedTo').optional().isInt({ min: 1 }),
    body('website').optional().isURL().withMessage('Website URL không hợp lệ.'),
    body('source').optional().isString().trim(),
  ],
  validate,
  ctrl.create
);

// ── Item routes (:id) ─────────────────────────────────────────────

/** GET /api/customers/:id */
router.get('/:id',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.getOne
);

/** PUT /api/customers/:id */
router.put('/:id',
  authorize(...CAN_WRITE),
  [
    param('id').isInt({ min: 1 }),
    body('companyName').optional().notEmpty().withMessage('Tên doanh nghiệp không được để trống.'),
    body('industryId').optional().isInt({ min: 1 }),
    body('assignedTo').optional().isInt({ min: 1 }),
    body('website').optional().isURL().withMessage('Website URL không hợp lệ.'),
  ],
  validate,
  ctrl.update
);

/** PUT /api/customers/:id/status */
router.put('/:id/status',
  authorize(...CAN_STATUS),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(VALID_STATUS).withMessage(`status phải là: ${VALID_STATUS.join(' | ')}.`),
    body('reason').optional().isString().trim(),
  ],
  validate,
  ctrl.changeStatus
);

/** GET /api/customers/:id/status-history */
router.get('/:id/status-history',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.statusHistory
);

// ── Contacts ──────────────────────────────────────────────────────

/** POST /api/customers/:id/contacts */
router.post('/:id/contacts',
  authorize(...CAN_WRITE_CTT),
  [
    param('id').isInt({ min: 1 }),
    body('fullName').notEmpty().withMessage('Họ tên đầu mối không được để trống.'),
    body('phone').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Email không hợp lệ.'),
    body('isPrimary').optional().isBoolean(),
  ],
  validate,
  ctrl.addContact
);

/** PUT /api/customers/:id/contacts/:contactId */
router.put('/:id/contacts/:contactId',
  authorize(...CAN_WRITE_CTT),
  [
    param('id').isInt({ min: 1 }),
    param('contactId').isInt({ min: 1 }),
    body('fullName').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('isPrimary').optional().isBoolean(),
  ],
  validate,
  ctrl.updateContact
);

/** DELETE /api/customers/:id/contacts/:contactId */
router.delete('/:id/contacts/:contactId',
  authorize(...CAN_WRITE),
  [
    param('id').isInt({ min: 1 }),
    param('contactId').isInt({ min: 1 }),
  ],
  validate,
  ctrl.deleteContact
);

module.exports = router;