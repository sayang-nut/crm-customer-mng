'use strict';

/**
 * @file     backend/src/config/constants.js
 * @location backend/src/config/constants.js
 * ─────────────────────────────────────────────────────────────────
 * Tất cả enums và business rules dùng chung toàn app.
 * Import: const { ROLES } = require('../config/constants');
 *         const { TICKET_STATUS } = require('../../config/constants');
 * ─────────────────────────────────────────────────────────────────
 */

module.exports = {

  // Vai trò nhân viên
  ROLES: {
    ADMIN:     'admin',
    MANAGER:   'manager',
    SALES:     'sales',
    CSKH:      'cskh',
    TECHNICAL: 'technical',
  },

  // Trạng thái user
  USER_STATUS: {
    ACTIVE:   'active',
    INACTIVE: 'inactive',
    LOCKED:   'locked',
  },

  //Trạng thái khách hàng 
  CUSTOMER_STATUS: {
    LEAD:    'lead',
    ACTIVE:  'active',
    EXPIRED: 'expired',
    CHURNED: 'churned' ,
  },

  //Trạng thái hợp đồng
  CONTRACT_STATUS: {
    ACTIVE:       'active',
    NEAR_EXPIRED: 'near_expired',
    EXPIRED:      'expired',
    CHURNED: 'churned',
    CANCELLED:    'cancelled',
  },

  //Ticket
  TICKET_STATUS: {
    OPEN:       'open',
    PROCESSING: 'processing',
    RESOLVED:   'resolved',
    CLOSED:     'closed',
  },

  TICKET_PRIORITY: {
    LOW:    'low',
    MEDIUM: 'medium',
    HIGH:   'high',
    URGENT: 'urgent',
  },

  TICKET_TYPE: {
    TECHNICAL: 'technical',
    PAYMENT:   'payment',
    GUIDANCE:  'guidance',
    UPGRADE:   'upgrade',
    COMPLAINT: 'complaint',
    CARE:      'care',
  },

  // ── Thanh toán ───────────────────────────────────────────────
  PAYMENT_METHOD: {
    BANK_TRANSFER: 'bank_transfer',
    CASH:          'cash',
    ONLINE:        'online',
  },

  BILLING_CYCLE: {
    MONTHLY: 'monthly',
    YEARLY:  'yearly',
  },

  // ── Gói dịch vụ ──────────────────────────────────────────────
  PACKAGE_STATUS: {
    ACTIVE:   'active',
    INACTIVE: 'inactive',
  },

  // ── Loại thông báo ───────────────────────────────────────────
  NOTIFICATION_TYPE: {
    CONTRACT_WARN_30:          'contract_warn_30',
    CONTRACT_WARN_7:           'contract_warn_7',
    CONTRACT_EXPIRED_UNRENEWED:'contract_expired_unrenewed',
    TICKET_STALE:              'ticket_stale',
    TICKET_RESOLVED_REMIND:    'ticket_resolved_remind',
    TICKET_AUTO_CLOSED:        'ticket_auto_closed',
  },

  // ── Business rules (fallback nếu .env không set) ─────────────
  BUSINESS_RULES: {
    CONTRACT_WARN_DAYS_1:          parseInt(process.env.CONTRACT_WARN_DAYS_1)          || 30,
    CONTRACT_WARN_DAYS_2:          parseInt(process.env.CONTRACT_WARN_DAYS_2)          || 7,
    CONTRACT_EXPIRED_REMIND_HOURS: parseInt(process.env.CONTRACT_EXPIRED_REMIND_HOURS) || 24,
    TICKET_STALE_HOURS:            parseInt(process.env.TICKET_STALE_HOURS)            || 36,
    TICKET_RESOLVED_CLOSE_HOURS:   parseInt(process.env.TICKET_RESOLVED_CLOSE_HOURS)   || 48,
    TICKET_RESOLVED_REMIND_HOURS:  24,
  },

};