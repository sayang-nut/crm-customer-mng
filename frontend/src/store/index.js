//VAI TRÒ: Cấu hình Redux Toolkit store.
 import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import customerReducer    from './slices/customerSlice';
import notificationReducer from './slices/notificationSlice';

const store = configureStore({
  reducer: {
    auth:          authReducer,
    customers:     customerReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;