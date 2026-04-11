'use strict';

/**
 * @file     backend/src/modules/tickets/tickets.controller.js
 * @location backend/src/modules/tickets/tickets.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./tickets.service
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: CONTROLLER (HTTP Handler)
 *
 *   stats        GET  /api/tickets/stats
 *   list         GET  /api/tickets
 *   getOne       GET  /api/tickets/:id
 *   create       POST /api/tickets
 *   update       PUT  /api/tickets/:id
 *   updateStatus PUT  /api/tickets/:id/status
 *   assign       PUT  /api/tickets/:id/assign
 *   addAttachment POST /api/tickets/:id/attachments
 *   deleteAttachment DELETE /api/tickets/:id/attachments/:attachmentId
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./tickets.service');

const stats         = async (req, res, next) => { try { res.json({ success: true, data: await svc.getStats(req.user) }); } catch (e) { next(e); } };
const list          = async (req, res, next) => { try { res.json({ success: true, ...(await svc.listTickets(req.user, req.query)) }); } catch (e) { next(e); } };
const getOne        = async (req, res, next) => { try { res.json({ success: true, data: await svc.getTicketById(req.params.id, req.user) }); } catch (e) { next(e); } };
const create        = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createTicket(req.body, req.user.id) }); } catch (e) { next(e); } };
const update        = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateTicket(req.params.id, req.body, req.user) }); } catch (e) { next(e); } };
const updateStatus  = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateStatus(req.params.id, req.body.status, req.user.id) }); } catch (e) { next(e); } };
const assign        = async (req, res, next) => { try { res.json({ success: true, data: await svc.assignTicket(req.params.id, req.body.assignedTo, req.user.id) }); } catch (e) { next(e); } };
const addAttachment = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.addAttachment(req.params.id, req.user.id, req.body) }); } catch (e) { next(e); } };
const deleteAttachment = async (req, res, next) => { try { await svc.deleteAttachment(req.params.id, req.params.attachmentId, req.user); res.json({ success: true, message: 'Xóa file đính kèm thành công.' }); } catch (e) { next(e); } };

module.exports = {
  stats,
  list, getOne, create, update,
  updateStatus, assign,
  addAttachment, deleteAttachment,
};