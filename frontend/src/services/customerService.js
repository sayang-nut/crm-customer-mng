/**
 * @file     frontend/src/services/customerService.js
 * @location frontend/src/services/customerService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./api → axios instance (có auto-refresh token)
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Tầng gọi API cho module Customers.
 *
 * LƯU Ý CÁC FIX SO VỚI VERSION CŨ:
 *   1. Thêm /api prefix vào tất cả URL
 *   2. Chuyển field names sang camelCase cho BE (companyName, taxCode...)
 *   3. Bỏ getCustomerStats (endpoint chưa implement)
 *   4. Bỏ exportCustomers (endpoint chưa implement)
 *   5. Thêm changeStatus, getStatusHistory, contacts CRUD, getIndustries, getSalesUsers
 * ─────────────────────────────────────────────────────────────────
 */

import api from './api';

const customerService = {

  // ── CRUD chính ──────────────────────────────────────────────────

  /**
   * Danh sách khách hàng có filter + phân trang.
   * @param {{ page, limit, status, industryId, assignedTo, source, search }} params
   */
  getCustomers: (params = {}) => {
    // Lọc bỏ các tham số rỗng/null/undefined để tránh url bị thừa và lỗi validation
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    return api.get('/api/customers', { params: cleanParams });
  },

  /** Chi tiết 1 khách hàng (kèm contacts) */
  getCustomerById: (id) =>
    api.get(`/api/customers/${id}`),

  /**
   * Tạo khách hàng mới.
   * BE nhận camelCase: companyName, taxCode, industryId, assignedTo, website, source, notes, address
   *
   * Nếu FE form dùng snake_case (company_name...) → map ở đây trước khi gửi.
   */
  createCustomer: (data) => {
    const payload = _mapToBackend(data);
    return api.post('/api/customers', payload);
  },

  /**
   * Cập nhật khách hàng (partial update).
   * Tương tự createCustomer: map field names về camelCase.
   */
  updateCustomer: (id, data) => {
    const payload = _mapToBackend(data);
    return api.put(`/api/customers/${id}`, payload);
  },

  /** Xóa khách hàng */
  deleteCustomer: (id) =>
    api.delete(`/api/customers/${id}`),

  // ── Status ───────────────────────────────────────────────────────

  /**
   * Đổi trạng thái khách hàng.
   * @param {string} status – lead | active | expired
   * @param {string} reason – lý do (tuỳ chọn)
   */
  changeStatus: (id, status, reason = '') =>
    api.put(`/api/customers/${id}/status`, { status, reason }),

  /** Lịch sử thay đổi trạng thái */
  getStatusHistory: (id) =>
    api.get(`/api/customers/${id}/status-history`),

  // ── Contacts ─────────────────────────────────────────────────────

  /** Thêm đầu mối liên hệ */
  addContact: (customerId, data) =>
    api.post(`/api/customers/${customerId}/contacts`, {
      fullName:  data.fullName  || data.full_name,
      phone:     data.phone,
      email:     data.email,
      notes:     data.notes,
      isPrimary: data.isPrimary ?? data.is_primary ?? false,
    }),

  /** Cập nhật đầu mối liên hệ */
  updateContact: (customerId, contactId, data) =>
    api.put(`/api/customers/${customerId}/contacts/${contactId}`, {
      fullName:  data.fullName  || data.full_name,
      phone:     data.phone,
      email:     data.email,
      notes:     data.notes,
      isPrimary: data.isPrimary ?? data.is_primary,
    }),

  /** Xóa đầu mối liên hệ */
  deleteContact: (customerId, contactId) =>
    api.delete(`/api/customers/${customerId}/contacts/${contactId}`),

  // ── Lookups (dropdown) ────────────────────────────────────────────

  /** Danh sách ngành nghề cho dropdown */
  getIndustries: () =>
    api.get('/api/customers/industries'),

  /** Danh sách Sales/Admin/Manager có thể assign */
  getSalesUsers: () =>
    api.get('/api/customers/sales-users'),
};

// ── Helper: map snake_case FE → camelCase BE ─────────────────────
function _mapToBackend(data) {
  const map = {
    company_name:             'companyName',
    tax_code:                 'taxCode',
    industry_id:              'industryId',
    assigned_to:              'assignedTo',
    // representative_name/position KHÔNG phải field của customer
    // → phải tạo qua addContact() riêng
  };

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const beKey = map[key] || key;  // giữ nguyên nếu không cần map
    if (value !== undefined && value !== null && value !== '') result[beKey] = value;
  }
  return result;
}

export default customerService;