/**
 * @file     frontend/src/services/contractsService.js
 * @location frontend/src/services/contractsService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance với auto-refresh)
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Tầng gọi API cho module Contracts.
 * ─────────────────────────────────────────────────────────────────
 */

import api from './api';

const BASE = '/api/contracts';

export const contractsService = {

  /** Danh sách hợp đồng với filter */
  getContracts: (params = {}) =>
    api.get(BASE, { params }).then(r => r.data),

  /** Thống kê nhanh */
  getStats: () =>
    api.get(`${BASE}/stats`).then(r => r.data.data),

  /** Chi tiết hợp đồng kèm lịch sử gia hạn */
  getById: (id) =>
    api.get(`${BASE}/${id}`).then(r => r.data.data),

  /**
   * Tạo hợp đồng mới.
   * Body: { contractNumber, customerId, solutionId, packageId,
   *         billingCycle, startDate, endDate, value, discount, notes, assignedTo }
   */
  create: (data) =>
    api.post(BASE, data).then(r => r.data.data),

  /** Cập nhật notes / assignedTo */
  update: (id, data) =>
    api.put(`${BASE}/${id}`, data).then(r => r.data.data),

  /**
   * Gia hạn hợp đồng.
   * Body: { newEndDate, newPackageId?, newValue?, discount?, notes? }
   */
  renew: (id, data) =>
    api.post(`${BASE}/${id}/renew`, data).then(r => r.data.data),

  /** Hủy hợp đồng */
  cancel: (id, reason = '') =>
    api.post(`${BASE}/${id}/cancel`, { reason }).then(r => r.data),
};

export default contractsService;