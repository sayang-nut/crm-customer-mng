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

// Header chống cache cho các request GET quan trọng
const noCache = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } };

// Helper quét tìm mảng dữ liệu an toàn để chống lỗi sập UI
const extractArray = (r) => {
  const d = r.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  if (d && Array.isArray(d.rows)) return d.rows;
  if (d && typeof d === 'object') {
    const arr = Object.values(d).find(v => Array.isArray(v));
    if (arr) return arr;
  }
  return [];
};

export const solutionsService = {

  // ── Industries ──────────────────────────────────────────────────
  getIndustries:    ()           => api.get(`${BASE}/industries`, noCache).then(extractArray),
  createIndustry:   (name)       => api.post(`${BASE}/industries`, { name }).then(r => r.data.data),
  updateIndustry:   (id, name)   => api.put(`${BASE}/industries/${id}`, { name }).then(r => r.data.data),
  deleteIndustry:   (id)         => api.delete(`${BASE}/industries/${id}`).then(r => r.data),

  // ── Solution Groups ─────────────────────────────────────────────
  getGroups:        ()           => api.get(`${BASE}/groups`, noCache).then(extractArray),
  getGroupById:     (id)         => api.get(`${BASE}/groups/${id}`).then(r => r.data.data),
  createGroup:      (data)       => api.post(`${BASE}/groups`, data).then(r => r.data.data),
  updateGroup:      (id, data)   => api.put(`${BASE}/groups/${id}`, data).then(r => r.data.data),
  deleteGroup:      (id)         => api.delete(`${BASE}/groups/${id}`).then(r => r.data),

  // Solutions
  getSolutions:     (params={})  => api.get(BASE, { params, ...noCache }).then(extractArray),
  getSolutionById:  (id)         => api.get(`${BASE}/${id}`).then(r => r.data.data),
  createSolution:   (data)       => api.post(BASE, data).then(r => r.data.data),
  updateSolution:   (id, data)   => api.put(`${BASE}/${id}`, data).then(r => r.data.data),
  deleteSolution:   (id)         => api.delete(`${BASE}/${id}`).then(r => r.data),

  // ── Packages ────────────────────────────────────────────────────
  getPackages:      (params={})  => api.get(`${BASE}/packages`, { params, ...noCache }).then(extractArray),
  getPackageById:   (id)         => api.get(`${BASE}/packages/${id}`).then(r => r.data.data),
  createPackage:    (data)       => api.post(`${BASE}/packages`, data).then(r => r.data.data),
  updatePackage:    (id, data)   => api.put(`${BASE}/packages/${id}`, data).then(r => r.data.data),
  setPackageStatus: (id, status) => api.put(`${BASE}/packages/${id}/status`, { status }).then(r => r.data.data),
  deletePackage:    (id)         => api.delete(`${BASE}/packages/${id}`).then(r => r.data),
};

export default solutionsService;