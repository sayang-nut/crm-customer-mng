/**
 * @file     frontend/src/store/slices/notificationSlice.js
 * @location frontend/src/store/slices/notificationSlice.js
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Toast notification state (in-app, không lưu DB).
 * Dùng: dispatch(addNotification({ type, title, message }))
 * ─────────────────────────────────────────────────────────────────
 */

import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [] },
  reducers: {
    addNotification: (state, action) => {
      state.items.push({
        id:       Date.now(),
        type:     action.payload.type    || 'info',
        title:    action.payload.title   || '',
        message:  action.payload.message || '',
        duration: action.payload.duration || 4000,
      });
    },
    removeNotification: (state, action) => {
      state.items = state.items.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => { state.items = []; },
  },
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;