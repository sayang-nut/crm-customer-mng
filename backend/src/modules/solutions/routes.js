'use strict';

/**
 * @file     backend/src/modules/solutions/solutions.routes.js
 * @location backend/src/modules/solutions/solutions.routes.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./solutions.controller
 * @requires ../../middleware/auth.middleware  → authenticate, isAdmin, allRoles
 * @requires ../../middleware/validate.middleware → validate
 * ─────────────────────────────────────────────────────────────────
 * Mount tại: app.js → app.use('/api/solutions', solutionsRoutes)
 *
 * PHÂN QUYỀN:
 *   GET (read)  → allRoles   – tất cả nhân viên xem được danh mục
 *   POST/PUT/DELETE → Admin only – chỉ Admin quản lý danh mục sản phẩm
 *
 * THỨ TỰ ROUTE QUAN TRỌNG (static trước param):
 *   /industries, /groups, /packages  → khai báo trước /:id
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const ctrl = require('./controller');
const { authenticate, isAdmin, allRoles } = require('@middleware/auth/auth');
const { validate } = require('@middleware/auth/validate');

const LEVELS   = ['support', 'basic', 'professional', 'multichannel', 'enterprise'];
const PKG_STATUS = ['active', 'inactive'];

router.use(authenticate);

// ════════════════════════════════════════════════════════════════
// INDUSTRIES
// ════════════════════════════════════════════════════════════════

router.get('/industries',       allRoles, ctrl.listIndustries);

router.post('/industries',
  isAdmin,
  body('name').notEmpty().withMessage('Tên ngành nghề không được để trống.'),
  validate,
  ctrl.createIndustry
);

router.put('/industries/:id',
  isAdmin,
  [param('id').isInt({ min: 1 }), body('name').notEmpty().withMessage('Tên không được để trống.')],
  validate,
  ctrl.updateIndustry
);

router.delete('/industries/:id',
  isAdmin,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.deleteIndustry
);

// ════════════════════════════════════════════════════════════════
// SOLUTION GROUPS
// ════════════════════════════════════════════════════════════════

router.get('/groups',       allRoles, ctrl.listGroups);

router.get('/groups/:id',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.getGroup
);

router.post('/groups',
  isAdmin,
  body('name').notEmpty().withMessage('Tên nhóm không được để trống.'),
  validate,
  ctrl.createGroup
);

router.put('/groups/:id',
  isAdmin,
  [param('id').isInt({ min: 1 }), body('name').optional().notEmpty()],
  validate,
  ctrl.updateGroup
);

router.delete('/groups/:id',
  isAdmin,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.deleteGroup
);

// ════════════════════════════════════════════════════════════════
// SERVICE PACKAGES  (khai báo trước /:id để tránh conflict)
// ════════════════════════════════════════════════════════════════

router.get('/packages',
  allRoles,
  [
    query('solutionId').optional().isInt({ min: 1 }),
    query('status').optional().isIn(PKG_STATUS),
  ],
  validate,
  ctrl.listPackages
);

router.get('/packages/:id',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.getPackage
);

router.post('/packages',
  isAdmin,
  [
    body('solutionId').isInt({ min: 1 }).withMessage('solutionId không hợp lệ.'),
    body('name').notEmpty().withMessage('Tên gói không được để trống.'),
    body('level').isIn(LEVELS).withMessage(`level phải là: ${LEVELS.join(' | ')}.`),
    body('priceMonthly').optional().isFloat({ min: 0 }),
    body('priceYearly').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(PKG_STATUS),
  ],
  validate,
  ctrl.createPackage
);

router.put('/packages/:id',
  isAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().notEmpty(),
    body('level').optional().isIn(LEVELS),
    body('priceMonthly').optional().isFloat({ min: 0 }),
    body('priceYearly').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(PKG_STATUS),
  ],
  validate,
  ctrl.updatePackage
);

router.put('/packages/:id/status',
  isAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(PKG_STATUS).withMessage('status phải là: active | inactive.'),
  ],
  validate,
  ctrl.togglePackageStatus
);

router.delete('/packages/:id',
  isAdmin,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.deletePackage
);

// ════════════════════════════════════════════════════════════════
// SOLUTIONS  (/:id ở cuối)
// ════════════════════════════════════════════════════════════════

router.get('/',
  allRoles,
  query('groupId').optional().isInt({ min: 1 }),
  validate,
  ctrl.listSolutions
);

router.get('/:id',
  allRoles,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.getSolution
);

router.post('/',
  isAdmin,
  [
    body('solutionGroupId').isInt({ min: 1 }).withMessage('solutionGroupId không hợp lệ.'),
    body('name').notEmpty().withMessage('Tên giải pháp không được để trống.'),
  ],
  validate,
  ctrl.createSolution
);

router.put('/:id',
  isAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().notEmpty(),
    body('solutionGroupId').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.updateSolution
);

router.delete('/:id',
  isAdmin,
  param('id').isInt({ min: 1 }),
  validate,
  ctrl.deleteSolution
);

module.exports = router;