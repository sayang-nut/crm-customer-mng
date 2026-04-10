'use strict';

/**
 * @file     backend/src/modules/upload/upload.controller.js
 * @location backend/src/modules/upload/upload.controller.js
 * ─────────────────────────────────────────────────────────────────
 * Nhận file từ Multer (Cloudinary) và trả về URL
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./upload.service');

const uploadSingle = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await svc.processUpload(req.file)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadSingle };