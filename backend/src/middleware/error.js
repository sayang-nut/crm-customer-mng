'use strict';

/**
 * Error Middleware
 * ─────────────────────────────────────────────────────────────────
 * AppError   : Custom operational error (có statusCode, isOperational)
 * errorHandler: Express global error handler (4 tham số)
 * ─────────────────────────────────────────────────────────────────
 */

const logger = require('@config/logger');

// ─────────────────────────────────────────────────────────────────
// AppError – Operational errors (expected, safe to send to client)
// ─────────────────────────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode   = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log chi tiết (không log stack trong production)
  logger.error({
    message:    err.message,
    stack:      process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    url:        req.originalUrl,
    method:     req.method,
    userId:     req.user?.id,
    statusCode: err.statusCode,
  });

  // ── Sequelize errors ──────────────────────────────────────────
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors:  err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      message: `Giá trị của "${field}" đã tồn tại trong hệ thống.`,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu liên quan không tồn tại hoặc vi phạm ràng buộc.',
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    logger.error('SequelizeDatabaseError:', err.original?.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
    });
  }

  // ── JWT errors ────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token đã hết hạn.', code: 'TOKEN_EXPIRED' });
  }

  // ── Operational errors (AppError) ────────────────────────────
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ── Unknown / programming errors ─────────────────────────────
  // Không để lộ thông tin nội bộ ra client
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
  });
};

module.exports = { AppError, errorHandler };