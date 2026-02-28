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
//import CustomersPage from './pages/customers/CustomersPage';
//import CustomerDetailPage from './pages/customers/CustomerDetailPage';
//import CustomerFormPage from './pages/customers/CustomerFormPage';

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
            
            {/* Customers 
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="customers/new" element={<CustomerFormPage />} />
            <Route path="customers/:id/edit" element={<CustomerFormPage />} />
            */}
            {/* Add more routes here */}
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center h-screen"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;