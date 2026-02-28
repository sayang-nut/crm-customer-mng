import api from './api';

const customerService = {
  // Get all customers with pagination and filters
  getCustomers: async (params) => {
    const response = await api.get('/customers', { params });
    return response;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response;
  },

  // Create new customer
  createCustomer: async (data) => {
    const response = await api.post('/customers', data);
    return response;
  },

  // Update customer
  updateCustomer: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response;
  },

  // Get customer statistics
  getCustomerStats: async () => {
    const response = await api.get('/customers/statistics');
    return response;
  },

  // Export customers
  exportCustomers: async (params) => {
    const response = await api.get('/customers/export', {
      params,
      responseType: 'blob',
    });
    return response;
  },
};

export default customerService;