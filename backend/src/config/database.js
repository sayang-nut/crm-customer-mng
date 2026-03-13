'use strict';

// ─────────────────────────────────────────────────────────────────
// @file    backend/src/config/database.js
// @module  Module 1 – Auth
// ─────────────────────────────────────────────────────────────────

/**
 * Database Config – Sequelize + MySQL
 * ─────────────────────────────────────────────────────────────────
 * - Connection pool: min=2, max=10
 * - Timezone: UTC+7 (Asia/Ho_Chi_Minh)
 * - Logging: chỉ bật trong development
 * - underscored: true → auto mapping snake_case ↔ camelCase
 * ─────────────────────────────────────────────────────────────────
 */

const { Sequelize } = require('sequelize');
const logger        = require('./logger');

require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST     || 'localhost',
    port:    parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',

    logging: process.env.NODE_ENV === 'development'
      ? (sql) => logger.debug(`[SQL] ${sql}`)
      : false,

    pool: {
      max:     parseInt(process.env.DB_POOL_MAX,  10) || 10,
      min:     parseInt(process.env.DB_POOL_MIN,  10) || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle:    parseInt(process.env.DB_POOL_IDLE,    10) || 10000,
    },

    define: {
      timestamps:  true,
      underscored: true,
      createdAt:   'created_at',
      updatedAt:   'updated_at',
      charset:     'utf8mb4',
      collate:     'utf8mb4_unicode_ci',
    },

    timezone: '+07:00',

    dialectOptions: {
      charset:         'utf8mb4',
      dateStrings:     true,
      typeCast:        true,
      connectTimeout:  60000,
    },
  }
);

module.exports = sequelize;