/**
 * @file     frontend/src/services/ticketsService.js
 * @location frontend/src/services/ticketsService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance với auto-refresh)
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Tầng gọi API cho module Tickets.
 * ─────────────────────────────────────────────────────────────────
 */

import api from './api';

const BASE = '/api/tickets';

export const ticketsService = {
  // Ticket Types
  getTypes:        ()              => api.get(`${BASE}/types`).then(r => r.data.data),
  createType:      (data)          => api.post(`${BASE}/types`, data).then(r => r.data.data),

  // Stats
  getStats:        ()              => api.get(`${BASE}/stats`).then(r => r.data.data),

  // Tickets CRUD
  getTickets:      (params = {})   => api.get(BASE, { params }).then(r => r.data),
  getById:         (id)            => api.get(`${BASE}/${id}`).then(r => r.data.data),
  create:          (data)          => api.post(BASE, data).then(r => r.data.data),
  update:          (id, data)      => api.put(`${BASE}/${id}`, data).then(r => r.data.data),
  updateStatus:    (id, status)    => api.put(`${BASE}/${id}/status`, { status }).then(r => r.data.data),
  assign:          (id, assignedTo)=> api.put(`${BASE}/${id}/assign`, { assignedTo }).then(r => r.data.data),

  // Comments
  addComment:      (id, content, isInternal = false) =>
    api.post(`${BASE}/${id}/comments`, { content, isInternal }).then(r => r.data.data),
  deleteComment:   (ticketId, commentId) =>
    api.delete(`${BASE}/${ticketId}/comments/${commentId}`).then(r => r.data),

  // Attachments
  addAttachment:   (id, data)      => api.post(`${BASE}/${id}/attachments`, data).then(r => r.data.data),
};

export default ticketsService;