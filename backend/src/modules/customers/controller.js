'use strict';

/**
 * @file     backend/src/modules/customers/customers.controller.js
 * @location backend/src/modules/customers/customers.controller.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./customers.service
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ – LAYER: CONTROLLER (HTTP Handler)
 *
 * GET    /api/customers              → list
 * GET    /api/customers/industries   → industries  (dropdown)
 * GET    /api/customers/sales-users  → salesUsers  (dropdown)
 * POST   /api/customers              → create
 * GET    /api/customers/:id          → getOne
 * PUT    /api/customers/:id          → update
 * PUT    /api/customers/:id/status   → changeStatus
 * GET    /api/customers/:id/status-history → statusHistory
 * POST   /api/customers/:id/contacts        → addContact
 * PUT    /api/customers/:id/contacts/:contactId → updateContact
 * DELETE /api/customers/:id/contacts/:contactId → deleteContact
 * ─────────────────────────────────────────────────────────────────
 */

const svc = require('./service');

const list = async (req, res, next) => {
  try {
    const result = await svc.listCustomers(req.user, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const customer = await svc.getCustomerById(req.params.id, req.user);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const customer = await svc.createCustomer(req.body, req.user.id);
    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const customer = await svc.updateCustomer(req.params.id, req.body, req.user);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

const changeStatus = async (req, res, next) => {
  try {
    const customer = await svc.changeStatus(
      req.params.id, req.body.status, req.body.reason, req.user.id
    );
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

const statusHistory = async (req, res, next) => {
  try {
    const history = await svc.getStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

const addContact = async (req, res, next) => {
  try {
    const contact = await svc.addContact(req.params.id, req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (err) { next(err); }
};

const updateContact = async (req, res, next) => {
  try {
    await svc.updateContact(req.params.contactId, req.body);
    res.json({ success: true, message: 'Cập nhật đầu mối thành công.' });
  } catch (err) { next(err); }
};

const deleteContact = async (req, res, next) => {
  try {
    await svc.deleteContact(req.params.contactId);
    res.json({ success: true, message: 'Đã xóa đầu mối liên hệ.' });
  } catch (err) { next(err); }
};

// Lookups
const industries = async (req, res, next) => {
  try {
    const data = await svc.listIndustries();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const salesUsers = async (req, res, next) => {
  try {
    const data = await svc.listSalesUsers();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  list, getOne, create, update,
  changeStatus, statusHistory,
  addContact, updateContact, deleteContact,
  industries, salesUsers,
};