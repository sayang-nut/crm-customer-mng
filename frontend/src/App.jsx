import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';

// Layouts
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';

// Common Components
import Toast from './components/common/Toast';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toast />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/customerdetailpage" element={<CustomerDetailPage />} />
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Customers */}
            <Route path="customers">
              <Route index element={<CustomersPage />} />
              <Route path="new" element={<CustomerFormPage />} />
              <Route path=":id" element={<CustomerDetailPage />} />
              <Route path=":id/edit" element={<CustomerFormPage />} />
            </Route>
            
            {/* Add more routes here */}
          </Route>
          
          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
                  <h2 className="text-2xl font-bold text-dark-900 mb-2">
                    Trang không tìm thấy
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa
                  </p>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;