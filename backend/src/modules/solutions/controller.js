'use strict';

/**
 * @file     backend/src/modules/solutions/solutions.controller.js
 * @location backend/src/modules/solutions/solutions.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./solutions.service
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: CONTROLLER (HTTP Handler)
 *
 * Industries:
 *   GET    /api/solutions/industries          → listIndustries
 *   POST   /api/solutions/industries          → createIndustry
 *   PUT    /api/solutions/industries/:id      → updateIndustry
 *   DELETE /api/solutions/industries/:id      → deleteIndustry
 *
 * Solution Groups:
 *   GET    /api/solutions/groups              → listGroups
 *   GET    /api/solutions/groups/:id          → getGroup
 *   POST   /api/solutions/groups              → createGroup
 *   PUT    /api/solutions/groups/:id          → updateGroup
 *   DELETE /api/solutions/groups/:id          → deleteGroup
 *
 * Solutions:
 *   GET    /api/solutions                     → listSolutions
 *   GET    /api/solutions/:id                 → getSolution
 *   POST   /api/solutions                     → createSolution
 *   PUT    /api/solutions/:id                 → updateSolution
 *   DELETE /api/solutions/:id                 → deleteSolution
 *
 * Packages:
 *   GET    /api/solutions/packages            → listPackages
 *   GET    /api/solutions/packages/:id        → getPackage
 *   POST   /api/solutions/packages            → createPackage
 *   PUT    /api/solutions/packages/:id        → updatePackage
 *   PUT    /api/solutions/packages/:id/status → togglePackageStatus
 *   DELETE /api/solutions/packages/:id        → deletePackage
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./service');

// ── Industries ────────────────────────────────────────────────────
const listIndustries     = async (req, res, next) => { try { res.json({ success: true, data: await svc.listIndustries() }); } catch (e) { next(e); } };
const createIndustry     = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createIndustry(req.body.name) }); } catch (e) { next(e); } };
const updateIndustry     = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateIndustry(req.params.id, req.body.name) }); } catch (e) { next(e); } };
const deleteIndustry     = async (req, res, next) => { try { await svc.deleteIndustry(req.params.id); res.json({ success: true, message: 'Đã xóa ngành nghề.' }); } catch (e) { next(e); } };

// ── Solution Groups ───────────────────────────────────────────────
const listGroups         = async (req, res, next) => { try { res.json({ success: true, data: await svc.listGroups() }); } catch (e) { next(e); } };
const getGroup           = async (req, res, next) => { try { res.json({ success: true, data: await svc.getGroupById(req.params.id) }); } catch (e) { next(e); } };
const createGroup        = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createGroup(req.body) }); } catch (e) { next(e); } };
const updateGroup        = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateGroup(req.params.id, req.body) }); } catch (e) { next(e); } };
const deleteGroup        = async (req, res, next) => { try { await svc.deleteGroup(req.params.id); res.json({ success: true, message: 'Đã xóa nhóm giải pháp.' }); } catch (e) { next(e); } };

// ── Solutions ─────────────────────────────────────────────────────
const listSolutions      = async (req, res, next) => { try { res.json({ success: true, data: await svc.listSolutions(req.query) }); } catch (e) { next(e); } };
const getSolution        = async (req, res, next) => { try { res.json({ success: true, data: await svc.getSolutionById(req.params.id) }); } catch (e) { next(e); } };
const createSolution     = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createSolution(req.body) }); } catch (e) { next(e); } };
const updateSolution     = async (req, res, next) => { try { res.json({ success: true, data: await svc.updateSolution(req.params.id, req.body) }); } catch (e) { next(e); } };
const deleteSolution     = async (req, res, next) => { try { await svc.deleteSolution(req.params.id); res.json({ success: true, message: 'Đã xóa giải pháp.' }); } catch (e) { next(e); } };

// ── Packages ──────────────────────────────────────────────────────
const listPackages        = async (req, res, next) => { try { res.json({ success: true, data: await svc.listPackages(req.query) }); } catch (e) { next(e); } };
const getPackage          = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPackageById(req.params.id) }); } catch (e) { next(e); } };
const createPackage       = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.createPackage(req.body) }); } catch (e) { next(e); } };
const updatePackage       = async (req, res, next) => { try { res.json({ success: true, data: await svc.updatePackage(req.params.id, req.body) }); } catch (e) { next(e); } };
const togglePackageStatus = async (req, res, next) => { try { res.json({ success: true, data: await svc.togglePackageStatus(req.params.id, req.body.status) }); } catch (e) { next(e); } };
const deletePackage       = async (req, res, next) => { try { await svc.deletePackage(req.params.id); res.json({ success: true, message: 'Đã xóa gói dịch vụ.' }); } catch (e) { next(e); } };

module.exports = {
  listIndustries, createIndustry, updateIndustry, deleteIndustry,
  listGroups, getGroup, createGroup, updateGroup, deleteGroup,
  listSolutions, getSolution, createSolution, updateSolution, deleteSolution,
  listPackages, getPackage, createPackage, updatePackage, togglePackageStatus, deletePackage,
};