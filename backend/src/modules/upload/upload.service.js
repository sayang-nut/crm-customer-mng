'use strict';

/**
 * @file     backend/src/modules/upload/upload.service.js
 * @location backend/src/modules/upload/upload.service.js
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Service xử lý logic upload.
 * ─────────────────────────────────────────────────────────────────
 */

require('module-alias/register');
const { AppError } = require('@middleware/error');

const processUpload = async (file) => {
  if (!file) {
    throw new AppError('Không có file nào được tải lên.', 400);
  }
  return { url: file.path };
};

module.exports = { processUpload };