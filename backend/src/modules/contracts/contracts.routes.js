'use strict';

/**
 * @file     backend/src/modules/contracts/contracts.routes.js
 * @location backend/src/modules/contracts/contracts.routes.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./contracts.controller
 * @requires ../../middleware/auth.middleware  → authenticate, authorize, allRoles
 * @requires ../../middleware/validate.middleware → validate
 * @requires ../../config/constants → ROLES, CONTRACT_STATUS, BILLING_CYCLE
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/contracts', contractsRoutes)
 *
 * ROUTES:
 *   GET    /api/contracts            All roles   – Danh sách (role-filtered)
 *   GET    /api/contracts/stats      All roles   – Thống kê nhanh
 *   POST   /api/contracts            Admin+Sales – Tạo mới
 *   GET    /api/contracts/:id        All roles   – Chi tiết + renewalHistory
 *   PUT    /api/contracts/:id/approve Admin+Manager – Duyệt HĐ
 *   PUT    /api/contracts/:id/reject  Admin+Manager – Từ chối HĐ
 *   PUT    /api/contracts/:id        Admin+Sales – Cập nhật notes/assigned
 *   POST   /api/contracts/:id/renew  Admin+Sales – Gia hạn
 *   POST   /api/contracts/:id/cancel Admin+Sales – Hủy
 *
 * LƯU Ý: /stats phải khai báo TRƯỚC /:id
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const ctrl = require('./contracts.controller');
const { authenticate, authorize, allRoles } = require('@middleware/auth/auth');
const { validate } = require('@middleware/auth/validate');
const { ROLES, CONTRACT_STATUS, BILLING_CYCLE } = require('@config/constants');
const { uploadCloud } = require('@config/cloudinary');

const VALID_STATUS  = Object.values(CONTRACT_STATUS);
const VALID_CYCLE   = Object.values(BILLING_CYCLE);
const WRITE_ROLES   = [ROLES.ADMIN, ROLES.SALES];
const CANCEL_ROLES  = [ROLES.ADMIN, ROLES.SALES];

router.use(authenticate);

// ── Static routes (trước /:id) ───────────────────────────────────

/** GET /api/contracts/stats */
router.get('/stats', allRoles, ctrl.stats);

// ── Collection ───────────────────────────────────────────────────

/** GET /api/contracts */
router.get('/',
  allRoles,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(VALID_STATUS).withMessage(`status: ${VALID_STATUS.join(' | ')}`),
    query('customerId').optional().isInt({ min: 1 }),
    query('assignedTo').optional().isInt({ min: 1 }),
    query('expiringSoon').optional().isInt({ min: 1, max: 365 }),
  ],
  validate,
  ctrl.list
);

/** POST /api/contracts */
router.post('/',
  authorize(...WRITE_ROLES),
  uploadCloud.single('file'),
  [
    body('contractNumber').notEmpty().trim().withMessage('Số hợp đồng không được để trống.'),
    body('customerId').isInt({ min: 1 }).withMessage('customerId không hợp lệ.'),
    body('solutionId').isInt({ min: 1 }).withMessage('solutionId không hợp lệ.'),
    body('packageId').isInt({ min: 1 }).withMessage('packageId không hợp lệ.'),
    body('startDate').isDate().withMessage('startDate không hợp lệ (YYYY-MM-DD).'),
    body('endDate').isDate().withMessage('endDate không hợp lệ (YYYY-MM-DD).'),
    body('value').isFloat({ min: 0 }).withMessage('value phải là số không âm.'),
    body('billingCycle').optional().isIn(VALID_CYCLE).withMessage(`billingCycle: ${VALID_CYCLE.join(' | ')}`),
    body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('discount từ 0–100.'),
    body('assignedTo').optional().isInt({ min: 1 }),
    
    body('cskhId').optional().isInt({ min: 1 }).withMessage('cskhId không hợp lệ.'),

  ],
  validate,
  ctrl.create
);

// ── Item routes (:id) ────────────────────────────────────────────

/** GET /api/contracts/:id */
router.get('/:id',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.getOne
);

/** PUT /api/contracts/:id/approve */
router.put('/:id/approve',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.approve
);

/** PUT /api/contracts/:id/reject */
router.put('/:id/reject',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  [
    param('id').isInt({ min: 1 }),
    body('reason').notEmpty().trim().withMessage('Vui lòng nhập lý do từ chối.'),
  ],
  validate,
  ctrl.reject
);

/** PUT /api/contracts/:id */
router.put('/:id',
  authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('assignedTo').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.update
);

/** POST /api/contracts/:id/renew */
router.post('/:id/renew',
  authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('newEndDate').isDate().withMessage('newEndDate không hợp lệ (YYYY-MM-DD).'),
    body('newPackageId').optional().isInt({ min: 1 }),
    body('newValue').optional().isFloat({ min: 0 }),
    body('discount').optional().isFloat({ min: 0, max: 100 }),
  ],
  validate,
  ctrl.renew
);

/** POST /api/contracts/:id/cancel */
router.post('/:id/cancel',
  authorize(...CANCEL_ROLES),
  [
    param('id').isInt({ min: 1 }),
    body('reason').optional().isString().trim(),
  ],
  validate,
  ctrl.cancel
);

module.exports = router;