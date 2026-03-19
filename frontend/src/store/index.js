/**
 * @file     frontend/src/store/index.js
 * @location frontend/src/store/index.js
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Cấu hình Redux Toolkit store.
 * Import: import store from '../store'
 * ─────────────────────────────────────────────────────────────────
 */

import { configureStore } from '@reduxjs/toolkit';
import customerReducer    from './slices/customerSlice';
import notificationReducer from './slices/notificationSlice';

const store = configureStore({
  reducer: {
    customers:     customerReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;