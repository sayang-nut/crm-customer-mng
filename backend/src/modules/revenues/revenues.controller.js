'use strict';

/**
 * @file     backend/src/modules/revenues/revenues.controller.js
 * @location backend/src/modules/revenues/revenues.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./revenues.service
 * ─────────────────────────────────────────────────────────────────
 * GET  /api/revenues/stats     → stats
 * GET  /api/revenues/summary   → summary
 * GET  /api/revenues            → list
 * POST /api/revenues            → create
 * GET  /api/revenues/:id        → getOne
 * PUT  /api/revenues/:id        → update
 * DELETE /api/revenues/:id      → remove
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./revenues.service');

const stats   = async (req, res, next) => { try { res.json({ success:true, data: await svc.getStats(req.user) }); } catch(e) { next(e); } };
const summary = async (req, res, next) => { try { res.json({ success:true, data: await svc.getSummary(req.query) }); } catch(e) { next(e); } };
const list    = async (req, res, next) => { try { res.json({ success:true, ...(await svc.listRevenues(req.user, req.query)) }); } catch(e) { next(e); } };
const getOne  = async (req, res, next) => { try { res.json({ success:true, data: await svc.getById(req.params.id, req.user) }); } catch(e) { next(e); } };
const create  = async (req, res, next) => { try { res.status(201).json({ success:true, data: await svc.createRevenue(req.body, req.user.id) }); } catch(e) { next(e); } };
const update  = async (req, res, next) => { try { res.json({ success:true, data: await svc.updateRevenue(req.params.id, req.body, req.user) }); } catch(e) { next(e); } };
const remove  = async (req, res, next) => { try { await svc.deleteRevenue(req.params.id); res.json({ success:true, message:'Đã xóa bản ghi doanh thu.' }); } catch(e) { next(e); } };

module.exports = { stats, summary, list, getOne, create, update, remove };