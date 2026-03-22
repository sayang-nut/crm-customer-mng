/**
 * @file     frontend/src/services/solutionsService.js
 * @location frontend/src/services/solutionsService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance với auto-refresh)
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Tầng gọi API cho module Solutions.
 * Bao gồm: industries, solution groups, solutions, service packages.
 * ─────────────────────────────────────────────────────────────────
 */

import api from './api';

const BASE = '/api/solutions';

export const solutionsService = {

  // ── Industries ──────────────────────────────────────────────────
  getIndustries:    ()           => api.get(`${BASE}/industries`).then(r => r.data.data),
  createIndustry:   (name)       => api.post(`${BASE}/industries`, { name }).then(r => r.data.data),
  updateIndustry:   (id, name)   => api.put(`${BASE}/industries/${id}`, { name }).then(r => r.data.data),
  deleteIndustry:   (id)         => api.delete(`${BASE}/industries/${id}`).then(r => r.data),

  // ── Solution Groups ─────────────────────────────────────────────
  getGroups:        ()           => api.get(`${BASE}/groups`).then(r => r.data.data),
  getGroupById:     (id)         => api.get(`${BASE}/groups/${id}`).then(r => r.data.data),
  createGroup:      (data)       => api.post(`${BASE}/groups`, data).then(r => r.data.data),
  updateGroup:      (id, data)   => api.put(`${BASE}/groups/${id}`, data).then(r => r.data.data),
  deleteGroup:      (id)         => api.delete(`${BASE}/groups/${id}`).then(r => r.data),

  // ── Solutions ───────────────────────────────────────────────────
  getSolutions:     (params={})  => api.get(BASE, { params }).then(r => r.data.data),
  getSolutionById:  (id)         => api.get(`${BASE}/${id}`).then(r => r.data.data),
  createSolution:   (data)       => api.post(BASE, data).then(r => r.data.data),
  updateSolution:   (id, data)   => api.put(`${BASE}/${id}`, data).then(r => r.data.data),
  deleteSolution:   (id)         => api.delete(`${BASE}/${id}`).then(r => r.data),

  // ── Packages ────────────────────────────────────────────────────
  getPackages:      (params={})  => api.get(`${BASE}/packages`, { params }).then(r => r.data.data),
  getPackageById:   (id)         => api.get(`${BASE}/packages/${id}`).then(r => r.data.data),
  createPackage:    (data)       => api.post(`${BASE}/packages`, data).then(r => r.data.data),
  updatePackage:    (id, data)   => api.put(`${BASE}/packages/${id}`, data).then(r => r.data.data),
  setPackageStatus: (id, status) => api.put(`${BASE}/packages/${id}/status`, { status }).then(r => r.data.data),
  deletePackage:    (id)         => api.delete(`${BASE}/packages/${id}`).then(r => r.data),
};

export default solutionsService;