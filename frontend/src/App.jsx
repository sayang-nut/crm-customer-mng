import { Toaster } from 'react-hot-toast';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/index';
import { AuthProvider, useAuth } from './store/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// ── Pages ──────────────────────────────────────────────────────────
import LoginPage          from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import { Page403, Page404 } from './pages/auth/ErrorPages';

import UsersPage      from './pages/users/UsersPage';
import LoginLogsPage  from './pages/users/LoginLogsPage';
import CustomersPage       from './pages/customers/CustomersPage';
import CustomerDetailPage  from './pages/customers/CustomerDetailPage';
import CustomerFormPage    from './pages/customers/CustomerFormPage';

import SolutionsPage    from './pages/solutions/SolutionsPage';
import ContractsPage    from './pages/contracts/ContractsPage';
import TicketsPage      from './pages/tickets/TicketsPage';
import RevenuesPage     from './pages/revenues/RevenuesPage';
import DashboardPage    from './pages/dashboard/DashboardPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import { ROLE_HOME } from './constants';



// ── RoleRedirect - Loading Trắng ──────────────────────────────────
const RoleRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Đang khởi tạo hệ thống...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
};

// ── MainLayout - Cấu trúc Flexbox Trắng ────────────────────────────
const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased">
      {/* Sidebar - Fix cứng độ rộng */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header - Sticky top */}
        <Header />

        {/* Nội dung trang */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ── HOC WithLayout ────────────────────────────────────────────────
const WithLayout = ({ children, allowedRoles }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

// ── AppRoutes ─────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/403"   element={<Page403 />} />
    <Route path="/404"   element={<Page404 />} />
    <Route path="/"      element={<RoleRedirect />} />

    <Route path="/change-password" element={<WithLayout><ChangePasswordPage /></WithLayout>} />


    {/* Users */}
    <Route path="/users"            element={<WithLayout allowedRoles={['admin','manager']}><UsersPage /></WithLayout>} />
    <Route path="/users/login-logs" element={<WithLayout allowedRoles={['admin']}><LoginLogsPage /></WithLayout>} />

    {/* Customers */}
    <Route path="/customers"          element={<WithLayout allowedRoles={['admin','manager','sales','cskh']}><CustomersPage /></WithLayout>} />
    <Route path="/customers/new"      element={<WithLayout allowedRoles={['admin','sales']}><CustomerFormPage /></WithLayout>} />
    <Route path="/customers/:id"      element={<WithLayout allowedRoles={['admin','manager','sales','cskh']}><CustomerDetailPage /></WithLayout>} />
    <Route path="/customers/:id/edit" element={<WithLayout allowedRoles={['admin','sales']}><CustomerFormPage /></WithLayout>} />

    {/* Others */}
    <Route path="/solutions"     element={<WithLayout><SolutionsPage /></WithLayout>} />
    <Route path="/contracts"     element={<WithLayout><ContractsPage /></WithLayout>} />
    <Route path="/tickets"       element={<WithLayout><TicketsPage /></WithLayout>} />
    <Route path="/revenues"      element={<WithLayout allowedRoles={['admin','manager','sales']}><RevenuesPage /></WithLayout>} />
    <Route path="/dashboard"     element={<WithLayout allowedRoles={['admin','manager']}><DashboardPage /></WithLayout>} />
    <Route path="/notifications" element={<WithLayout><NotificationsPage /></WithLayout>} />

    <Route path="*" element={<Page404 />} />
  </Routes>
);

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '0px', 
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </Provider>
);

export default App;