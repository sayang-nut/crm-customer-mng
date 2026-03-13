'use strict';

// ─────────────────────────────────────────────────────────────────
// @file    backend/src/config/logger.js
// @module  Module 1 – Auth
// ─────────────────────────────────────────────────────────────────

/**
 * Logger – Winston
 * ─────────────────────────────────────────────────────────────────
 * Development : Console (colorize + simple)
 * Production  : JSON to file (daily rotate) + Console JSON
 * ─────────────────────────────────────────────────────────────────
 */

const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const isDev  = process.env.NODE_ENV !== 'production';
const level  = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

const formats = {
  dev: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}] ${message}${extras}`;
    })
  ),
  prod: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
};

const transports = [
  new winston.transports.Console({
    format: isDev ? formats.dev : formats.prod,
  }),
];

if (!isDev) {
  // Daily rotate – cần winston-daily-rotate-file
  try {
    require('winston-daily-rotate-file');
    transports.push(
      new winston.transports.DailyRotateFile({
        dirname:        LOG_DIR,
        filename:       'app-%DATE%.log',
        datePattern:    'YYYY-MM-DD',
        maxFiles:       '30d',
        maxSize:        '50m',
        format:         formats.prod,
      }),
      new winston.transports.DailyRotateFile({
        dirname:        LOG_DIR,
        filename:       'error-%DATE%.log',
        datePattern:    'YYYY-MM-DD',
        level:          'error',
        maxFiles:       '30d',
        format:         formats.prod,
      })
    );
  } catch {
    transports.push(
      new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(LOG_DIR, 'combined.log') })
    );
  }
}

const logger = winston.createLogger({ level, transports, exitOnError: false });

module.exports = logger;