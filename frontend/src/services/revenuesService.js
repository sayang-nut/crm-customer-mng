/**
 * @file     frontend/src/services/revenuesService.js
 * @location frontend/src/services/revenuesService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance với auto-refresh)
 * ─────────────────────────────────────────────────────────────────
 */
import api from './api';
const BASE = '/api/revenues';

export const revenuesService = {
  getStats:    ()           => api.get(`${BASE}/stats`).then(r => r.data.data),
  getSummary:  (params={})  => api.get(`${BASE}/summary`, { params }).then(r => r.data.data),
  getRevenues: (params={})  => api.get(BASE, { params }).then(r => r.data),
  getById:     (id)         => api.get(`${BASE}/${id}`).then(r => r.data.data),
  create:      (data)       => api.post(BASE, data).then(r => r.data.data),
  update:      (id, data)   => api.put(`${BASE}/${id}`, data).then(r => r.data.data),
  remove:      (id)         => api.delete(`${BASE}/${id}`).then(r => r.data),
}; 
export default revenuesService;