/**
 * @file     frontend/src/App.jsx
 * @location frontend/src/
 * ─────────────────────────────────────────────────────────────────
 * Root component – Router + AuthProvider + MainLayout
 * ─────────────────────────────────────────────────────────────────
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Provider } from 'react-redux';
import store from './store/index';
import { AuthProvider, useAuth } from './store/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// ── Pages ──────────────────────────────────────────────────────────
import LoginPage          from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import { Page403, Page404 } from './pages/auth/ErrorPages';

import UsersPage     from './pages/users/UsersPage';
import LoginLogsPage from './pages/users/LoginLogsPage';

import CustomersPage      from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CustomerFormPage   from './pages/customers/CustomerFormPage';

import SolutionsPage    from './pages/solutions/SolutionsPage';
import ContractsPage    from './pages/contracts/ContractsPage';
import TicketsPage      from './pages/tickets/TicketsPage';
import RevenuesPage     from './pages/revenues/RevenuesPage';
import DashboardPage    from './pages/dashboard/DashboardPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// ── Role home map ─────────────────────────────────────────────────
const ROLE_HOME = {
  admin:     '/dashboard',
  manager:   '/dashboard',
  sales:     '/customers',
  cskh:      '/tickets',
  technical: '/tickets',
};

// ── RoleRedirect – CHỜ isLoading xong mới redirect ───────────────
const RoleRedirect = () => {
  const { user, isLoading } = useAuth();

  // ✅ Quan trọng: chờ init xong
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080E1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif', color: '#64748B', fontSize: 14,
      }}>
        Đang tải...
      </div>
    );
  }

  // Chưa đăng nhập → login
  if (!user) return <Navigate to="/login" replace />;

  // Đã đăng nhập → trang chủ theo role
  return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
};

// ── Nav items ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key:'dashboard',     label:'Dashboard',    path:'/dashboard',     roles:['admin','manager'] },
  { key:'customers',     label:'Khách hàng',   path:'/customers',     roles:['admin','manager','sales','cskh'] },
  { key:'contracts',     label:'Hợp đồng',     path:'/contracts',     roles:['admin','manager','sales','cskh','technical'] },
  { key:'tickets',       label:'Tickets',      path:'/tickets',       roles:['admin','manager','sales','cskh','technical'] },
  { key:'revenues',      label:'Doanh thu',    path:'/revenues',      roles:['admin','manager','sales'] },
  { key:'solutions',     label:'Danh mục SP',  path:'/solutions',     roles:['admin','manager','sales','cskh','technical'] },
  { key:'users',         label:'Nhân viên',    path:'/users',         roles:['admin','manager'] },
  { key:'notifications', label:'Thông báo',    path:'/notifications', roles:['admin','manager','sales','cskh','technical'] },
];

const ROLE_LABELS = { admin:'Admin', manager:'Manager', sales:'Sales', cskh:'CSKH', technical:'Kỹ thuật' };

// ── Icon helpers ──────────────────────────────────────────────────
const Icon = ({ d, size = 18, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={active ? '#60A5FA' : '#64748B'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_ICONS = {
  dashboard:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  customers:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  contracts:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  tickets:       'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  revenues:      'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  solutions:     'M22 12h-4l-3 9L9 3l-3 9H2',
  users:         'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  notifications: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
};

// ── MainLayout ────────────────────────────────────────────────────
const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_ITEMS.filter(i => i.roles.includes(user?.role));
  const initials = user?.fullName?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const s = {
    layout:  { display:'flex', minHeight:'100vh', background:'#080E1A', fontFamily:"'DM Sans','Segoe UI',sans-serif" },
    sidebar: { width: collapsed ? 64 : 220, flexShrink:0, background:'rgba(9,14,26,0.98)', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', transition:'width 0.22s ease', overflow:'hidden', position:'sticky', top:0, height:'100vh' },
    logoArea:{ padding: collapsed ? '20px 0' : '20px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.05)', justifyContent: collapsed ? 'center' : 'flex-start' },
    logoMark:{ width:32, height:32, borderRadius:9, flexShrink:0, background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff' },
    logoText:{ fontSize:16, fontWeight:800, color:'#F1F5F9', letterSpacing:'-0.3px', whiteSpace:'nowrap', opacity: collapsed ? 0 : 1, transition:'opacity 0.15s', overflow:'hidden' },
    nav:     { flex:1, padding:'12px 0', overflowY:'auto', overflowX:'hidden' },
    userArea:{ padding: collapsed ? '14px 0' : '14px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:10, justifyContent: collapsed ? 'center' : 'flex-start' },
    avatar:  { width:34, height:34, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' },
    colBtn:  { padding:'12px', display:'flex', justifyContent:'center', cursor:'pointer', borderTop:'1px solid rgba(255,255,255,0.05)' },
    main:    { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
    topbar:  { height:56, flexShrink:0, background:'rgba(9,14,26,0.97)', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:10 },
    topBtn:  { padding:'7px 12px', borderRadius:8, fontSize:13, fontWeight:600, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#64748B', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 },
    content: { flex:1, overflow:'auto' },
  };

  const navItem = (active) => ({
    display:'flex', alignItems:'center', gap:10,
    padding: collapsed ? '11px 0' : '10px 18px',
    margin:'1px 8px', borderRadius:9, cursor:'pointer',
    background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
    color: active ? '#60A5FA' : '#64748B',
    fontSize:13.5, fontWeight: active ? 600 : 500,
    textDecoration:'none', transition:'background 0.15s',
    justifyContent: collapsed ? 'center' : 'flex-start',
    whiteSpace:'nowrap',
    borderLeft: active ? '2px solid #2563EB' : '2px solid transparent',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box} body{margin:0}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        a{text-decoration:none}
      `}</style>
      <div style={s.layout}>
        <aside style={s.sidebar}>
          <div style={s.logoArea}>
            <div style={s.logoMark}>B</div>
            <span style={s.logoText}>Bado CRM</span>
          </div>
          <nav style={s.nav}>
            {navItems.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
              return (
                <Link key={item.key} to={item.path} style={navItem(active)} title={collapsed ? item.label : undefined}>
                  <Icon d={NAV_ICONS[item.key]} active={active} />
                  <span style={{ opacity: collapsed ? 0 : 1, transition:'opacity 0.15s', overflow:'hidden' }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div style={s.userArea}>
            <div style={s.avatar}>{initials}</div>
            {!collapsed && (
              <div style={{ flex:1, overflow:'hidden', minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#F1F5F9', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.fullName}</div>
                <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>{ROLE_LABELS[user?.role]}</div>
              </div>
            )}
          </div>
          <div style={s.colBtn} onClick={() => setCollapsed(c => !c)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </div>
        </aside>

        <div style={s.main}>
          <header style={s.topbar}>
            <div style={{ fontSize:14, color:'#64748B', fontWeight:500 }}>
              {navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Bado CRM'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Link to="/notifications" style={{ ...s.topBtn, color: location.pathname === '/notifications' ? '#60A5FA' : '#64748B' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </Link>
              <Link to="/change-password" style={s.topBtn} title="Đổi mật khẩu">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </Link>
              <button onClick={handleLogout} style={{ ...s.topBtn, color:'#FCA5A5', borderColor:'rgba(239,68,68,0.2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Đăng xuất
              </button>
            </div>
          </header>
          <main style={s.content}>{children}</main>
        </div>
      </div>
    </>
  );
};

// ── WithLayout ────────────────────────────────────────────────────
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

    <Route path="/users"            element={<WithLayout allowedRoles={['admin','manager']}><UsersPage /></WithLayout>} />
    <Route path="/users/login-logs" element={<WithLayout allowedRoles={['admin']}><LoginLogsPage /></WithLayout>} />

    <Route path="/customers"          element={<WithLayout allowedRoles={['admin','manager','sales','cskh']}><CustomersPage /></WithLayout>} />
    <Route path="/customers/new"      element={<WithLayout allowedRoles={['admin','sales']}><CustomerFormPage /></WithLayout>} />
    <Route path="/customers/:id"      element={<WithLayout allowedRoles={['admin','manager','sales','cskh']}><CustomerDetailPage /></WithLayout>} />
    <Route path="/customers/:id/edit" element={<WithLayout allowedRoles={['admin','sales']}><CustomerFormPage /></WithLayout>} />

    <Route path="/solutions"    element={<WithLayout><SolutionsPage /></WithLayout>} />
    <Route path="/contracts"    element={<WithLayout><ContractsPage /></WithLayout>} />
    <Route path="/tickets"      element={<WithLayout><TicketsPage /></WithLayout>} />
    <Route path="/revenues"     element={<WithLayout allowedRoles={['admin','manager','sales']}><RevenuesPage /></WithLayout>} />
    <Route path="/dashboard"    element={<WithLayout allowedRoles={['admin','manager']}><DashboardPage /></WithLayout>} />
    <Route path="/notifications"element={<WithLayout><NotificationsPage /></WithLayout>} />

    <Route path="*" element={<Page404 />} />
  </Routes>
);

// ── Root ──────────────────────────────────────────────────────────
const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </Provider>
);

export default App;