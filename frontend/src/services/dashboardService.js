/**
 * @file     frontend/src/services/dashboardService.js
 * @location frontend/src/services/dashboardService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance với auto-refresh)
 * ─────────────────────────────────────────────────────────────────
 */
import { api } from './authService';
const BASE = '/api/dashboard';

export const dashboardService = {
  getAdmin: ()         => api.get(`${BASE}/admin`).then(r => r.data.data),
  getSales: (userId)   => api.get(`${BASE}/sales`, { params: userId ? { userId } : {} }).then(r => r.data.data),
  getCSKH:  (userId)   => api.get(`${BASE}/cskh`,  { params: userId ? { userId } : {} }).then(r => r.data.data),
};
export default dashboardService;