'use strict';

/**
 * @file     backend/src/modules/notifications/notifications.controller.js
 * @location backend/src/modules/notifications/notifications.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./notifications.service
 * ─────────────────────────────────────────────────────────────────
 * GET  /api/notifications                → list
 * GET  /api/notifications/unread-count   → unreadCount
 * PUT  /api/notifications/mark-all-read  → markAllRead
 * PUT  /api/notifications/:id/read       → markRead
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./notifications.service');

const list         = async (req, res, next) => { try { res.json({ success:true, ...(await svc.listNotifications(req.user.id, req.query)) }); } catch(e) { next(e); } };
const unreadCount  = async (req, res, next) => { try { res.json({ success:true, data: { count: await svc.getUnreadCount(req.user.id) } }); } catch(e) { next(e); } };
const markAllRead  = async (req, res, next) => { try { await svc.markAllRead(req.user.id); res.json({ success:true, message:'Đã đánh dấu tất cả đã đọc.' }); } catch(e) { next(e); } };
const markRead     = async (req, res, next) => { try { await svc.markRead(req.params.id, req.user.id); res.json({ success:true }); } catch(e) { next(e); } };

module.exports = { list, unreadCount, markAllRead, markRead };