/**
 * @file     frontend/src/store/slices/customerSlice.js
 * @location frontend/src/store/slices/customerSlice.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../../services/customerService → API calls
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Redux slice quản lý state khách hàng.
 *
 * State:
 *   items[]          – danh sách customer trang hiện tại
 *   currentCustomer  – customer đang xem chi tiết
 *   pagination       – { page, limit, total, totalPages }
 *   filters          – { status, industryId, assignedTo, source, search }
 *   loading          – boolean
 *   error            – string | null
 *
 * Thunks:
 *   fetchCustomers(params)
 *   fetchCustomerById(id)
 *   createCustomer(data)
 *   updateCustomer({ id, data })
 *   deleteCustomer(id)
 *   changeCustomerStatus({ id, status, reason })
 *
 * Actions:
 *   setFilters(filters)
 *   clearFilters()
 *   setPage(page)
 *   clearCurrentCustomer()
 * ─────────────────────────────────────────────────────────────────
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import customerService from '../../services/customerService';

// ── Thunks ────────────────────────────────────────────────────────

export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await customerService.getCustomers(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải danh sách');
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await customerService.getCustomerById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải khách hàng');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await customerService.createCustomer(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tạo khách hàng');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await customerService.updateCustomer(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi cập nhật');
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await customerService.deleteCustomer(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi xóa khách hàng');
    }
  }
);

export const changeCustomerStatus = createAsyncThunk(
  'customers/changeStatus',
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      const res = await customerService.changeStatus(id, status, reason);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi đổi trạng thái');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    items:           [],
    currentCustomer: null,
    pagination: {
      page:       1,
      limit:      20,
      total:      0,
      totalPages: 0,
    },
    filters: {
      status:     '',
      industryId: '',
      assignedTo: '',
      source:     '',
      search:     '',
    },
    loading: false,
    error:   null,
  },

  reducers: {
    setFilters: (state, action) => {
      state.filters     = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // reset về trang 1 khi filter
    },
    clearFilters: (state) => {
      state.filters = { status:'', industryId:'', assignedTo:'', source:'', search:'' };
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
    },
  },

  extraReducers: (builder) => {
    // fetchCustomers
    builder
      .addCase(fetchCustomers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading        = false;
        state.items          = action.payload.data || [];
        state.pagination = {
          page:       action.payload.page,
          limit:      action.payload.limit,
          total:      action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // fetchCustomerById
    builder
      .addCase(fetchCustomerById.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading         = false;
        state.currentCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // createCustomer
    builder
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      });

    // updateCustomer
    builder
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentCustomer?.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      });

    // deleteCustomer
    builder
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items          = state.items.filter(c => c.id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      });

    // changeCustomerStatus
    builder
      .addCase(changeCustomerStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentCustomer?.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      });
  },
});

export const { setFilters, clearFilters, setPage, clearCurrentCustomer } = customerSlice.actions;
export default customerSlice.reducer;