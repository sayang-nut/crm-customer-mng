/**
 * @file     frontend/src/services/notificationsService.js
 * @location frontend/src/services/notificationsService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance với auto-refresh)
 * ─────────────────────────────────────────────────────────────────
 */
import api from './api';
const BASE = '/api/notifications';

export const notificationsService = {
  getList:       (params={}) => api.get(BASE, { params }).then(r => r.data),
  getUnreadCount:()          => api.get(`${BASE}/unread-count`).then(r => r.data.data.count),
  markRead:      (id)        => api.put(`${BASE}/${id}/read`).then(r => r.data),
  markAllRead:   ()          => api.put(`${BASE}/mark-all-read`).then(r => r.data),
};
export default notificationsService;