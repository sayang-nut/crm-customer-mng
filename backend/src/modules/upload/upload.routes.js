'use strict';

/**
 * @file     backend/src/modules/upload/upload.routes.js
 * @location backend/src/modules/upload/upload.routes.js
 * ─────────────────────────────────────────────────────────────────
 */

require('module-alias/register');
const express = require('express');
const router = express.Router();

const ctrl = require('./upload.controller');
const { authenticate, allRoles } = require('@middleware/auth/auth');
const { uploadCloud } = require('@config/cloudinary');

router.use(authenticate);

// Endpoint tải lên 1 file (dùng middleware uploadCloud lấy từ config)
router.post('/single', allRoles, uploadCloud.single('file'), ctrl.uploadSingle);

module.exports = router;