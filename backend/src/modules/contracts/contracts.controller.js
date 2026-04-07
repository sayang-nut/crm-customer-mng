'use strict';

/**
 * @file     backend/src/modules/contracts/contracts.controller.js
 * @location backend/src/modules/contracts/contracts.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./contracts.service
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: CONTROLLER (HTTP Handler)
 *
 *   list          GET    /api/contracts
 *   stats         GET    /api/contracts/stats
 *   getOne        GET    /api/contracts/:id
 *   create        POST   /api/contracts
 *   update        PUT    /api/contracts/:id
 *   renew         POST   /api/contracts/:id/renew
 *   cancel        POST   /api/contracts/:id/cancel
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./contracts.service');

const list   = async (req, res, next) => { try { res.json({ success: true, ...(await svc.listContracts(req.user, req.query)) }); } catch (e) { next(e); } };
const stats  = async (req, res, next) => { try { res.json({ success: true, data: await svc.getStats(req.user) }); } catch (e) { next(e); } };
const getOne = async (req, res, next) => { try { res.json({ success: true, data: await svc.getContractById(req.params.id, req.user) }); } catch (e) { next(e); } };
const create = async (req, res, next) => { 
  try { 
    const data = { ...req.body };
    if (req.file) {
      data.attachmentUrl = req.file.path; // Lấy URL từ Cloudinary sau khi upload
    }
    res.status(201).json({ success: true, data: await svc.createContract(data, req.user.id) }); 
  } catch (e) { next(e); } 
};
const approve = async (req, res, next) => { try { res.json({ success: true, data: await svc.approveContract(req.params.id, req.user.id) }); } catch (e) { next(e); } };
const reject  = async (req, res, next) => { try { res.json({ success: true, data: await svc.rejectContract(req.params.id, req.body.reason, req.user.id) }); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateContract(req.params.id, req.body, req.user) }); } catch (e) { next(e); } };
const renew  = async (req, res, next) => { try { res.json({ success: true, data: await svc.renewContract(req.params.id, req.body, req.user.id) }); } catch (e) { next(e); } };
const cancel = async (req, res, next) => {
  try {
    await svc.cancelContract(req.params.id, req.body.reason, req.user.id);
    res.json({ success: true, message: 'Hợp đồng đã được hủy.' });
  } catch (e) { next(e); }
};

module.exports = { list, stats, getOne, create, approve, reject, update, renew, cancel };