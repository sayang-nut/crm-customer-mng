'use strict';

/**
 * @file     backend/src/modules/revenues/revenues.routes.js
 * @location backend/src/modules/revenues/revenues.routes.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./revenues.controller
 * @requires ../../middleware/auth.middleware  → authenticate, isAdmin, authorize, allRoles
 * @requires ../../middleware/validate.middleware → validate
 * @requires ../../config/constants → ROLES, PAYMENT_METHOD
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/revenues', revenuesRoutes)
 *
 * GET    /api/revenues/stats    All roles  – Thống kê nhanh
 * GET    /api/revenues/summary  Admin+Mgr+Sales – Tổng hợp theo kỳ
 * GET    /api/revenues          All roles  – Danh sách
 * POST   /api/revenues          Admin+Sales – Tạo bản ghi
 * GET    /api/revenues/:id      All roles  – Chi tiết
 * PUT    /api/revenues/:id      Admin+Sales – Cập nhật
 * DELETE /api/revenues/:id      Admin only  – Xóa
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const ctrl = require('./revenues.controller');
const { authenticate, isAdmin, authorize, allRoles } = require('@middleware/auth/auth');
const { validate } = require('@middleware/auth/validate');
const { ROLES, PAYMENT_METHOD } = require('@config/constants');

const VALID_METHODS = Object.values(PAYMENT_METHOD);
const WRITE_ROLES   = [ROLES.ADMIN, ROLES.SALES];
const READ_ROLES    = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES];

router.use(authenticate);

// Static routes (trước /:id)
router.get('/stats',   allRoles,              ctrl.stats);
router.get('/summary', authorize(...READ_ROLES),
  [
    query('groupBy').optional().isIn(['month','year']),
    query('fromDate').optional().isDate(),
    query('toDate').optional().isDate(),
    query('solutionId').optional().isInt({ min:1 }),
  ],
  validate, ctrl.summary
);

// Collection
router.get('/', allRoles,
  [
    query('page').optional().isInt({ min:1 }),
    query('limit').optional().isInt({ min:1, max:100 }),
    query('contractId').optional().isInt({ min:1 }),
    query('customerId').optional().isInt({ min:1 }),
    query('fromDate').optional().isDate(),
    query('toDate').optional().isDate(),
    query('paymentMethod').optional().isIn(VALID_METHODS),
  ],
  validate, ctrl.list
);

router.post('/', authorize(...WRITE_ROLES),
  [
    body('contractId').isInt({ min:1 }).withMessage('contractId không hợp lệ.'),
    body('customerId').isInt({ min:1 }).withMessage('customerId không hợp lệ.'),
    body('amount').isFloat({ min:0.01 }).withMessage('amount phải > 0.'),
    body('paymentDate').isDate().withMessage('paymentDate không hợp lệ (YYYY-MM-DD).'),
    body('paymentMethod').optional().isIn(VALID_METHODS),
    body('billingPeriod').optional().isString().trim(),
  ],
  validate, ctrl.create
);

// Item routes
router.get('/:id',    allRoles, param('id').isInt({ min:1 }), validate, ctrl.getOne);
router.put('/:id',    authorize(...WRITE_ROLES),
  [
    param('id').isInt({ min:1 }),
    body('amount').optional().isFloat({ min:0.01 }),
    body('paymentDate').optional().isDate(),
    body('paymentMethod').optional().isIn(VALID_METHODS),
  ],
  validate, ctrl.update
);
router.delete('/:id', isAdmin, param('id').isInt({ min:1 }), validate, ctrl.remove);

module.exports = router;