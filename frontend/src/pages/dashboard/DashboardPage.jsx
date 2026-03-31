/**
 * @file     frontend/src/pages/dashboard/DashboardPage.jsx
 * @location frontend/src/pages/dashboard/DashboardPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/dashboardService
 * @requires ../../store/authContext → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang Dashboard – hiển thị KPI theo role.
 *   Admin/Manager → Admin Dashboard (full overview)
 *   Sales         → Sales Dashboard (my KPIs)
 *   CSKH          → CSKH Dashboard (my tickets)
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../store/authContext';
import dashboardService from '../../services/dashboardService';

// ✅ COMMON COMPONENTS
import StatsCard from '../../components/dashboard/StatsCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

// ✅ ICONS
import { Users, FileText, Ticket, DollarSign, AlertTriangle } from 'lucide-react';

const fmtVND = (n) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', notation: 'compact', maximumFractionDigits: 1
}).format(n || 0);

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ LOGIC GIỮ NGUYÊN 100%
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        if (['admin', 'manager'].includes(user?.role)) 
          setData(await dashboardService.getAdmin());
        else if (user?.role === 'sales') 
          setData(await dashboardService.getSales());
        else if (user?.role === 'cskh') 
          setData(await dashboardService.getCSKH());
        else 
          setData({});
      } finally { 
        setLoading(false); 
      }
    };
    if (user) fetch();
  }, [user]);

  const roleName = { admin: 'Admin', manager: 'Manager', sales: 'Sales', cskh: 'CSKH', technical: 'Kỹ thuật' };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="spinner w-12 h-12 text-primary-500 mx-auto" />
          <p className="text-gray-400 text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <EmptyState 
        title="Không có dữ liệu" 
        description={`Dashboard cho role ${roleName[user?.role]} đang được phát triển.`}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - 100% Tailwind */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary-400 via-blue-300 to-accent-400 bg-clip-text text-transparent tracking-tight drop-shadow-lg">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Xin chào, <span className="font-semibold text-white">{user?.fullName}</span> ·{' '}
            <Badge variant="primary">{roleName[user?.role]}</Badge>
          </p>
        </div>
      </header>

      {/* Role-specific Dashboards */}
      {['admin', 'manager'].includes(user?.role) && <AdminDashboard data={data} />}
      {user?.role === 'sales' && <SalesDashboard data={data} />}
      {user?.role === 'cskh' && <CSKHDashboard data={data} />}
    </div>
  );
};

// ✅ ADMIN DASHBOARD - StatsCard + Card + Badge
const AdminDashboard = ({ data }) => (
  <div className="space-y-8">
    {/* KPI Grid - Responsive */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <StatsCard 
        title="Khách hàng" 
        value={data.customerStats?.total || 0}
        change={"+12.5%"}
        changeType="up"
        icon={Users}
        color="primary"
      >
        <Badge variant="gray" className="ml-2">
          {data.customerStats?.active_count || 0} active
        </Badge>
      </StatsCard>

      <StatsCard 
        title="Hợp đồng" 
        value={data.contractStats?.total || 0}
        change={"+8.2%"}
        changeType="up"
        icon={FileText}
        color="success"
      >
        <Badge variant="success" className="ml-2">
          {data.contractStats?.active_count || 0} active
        </Badge>
      </StatsCard>

      <StatsCard 
        title="Tickets" 
        value={data.ticketStats?.total || 0}
        change={"+3.1%"}
        changeType="down"
        icon={Ticket}
        color="warning"
      >
        <Badge variant="danger" className="ml-2">
          {data.ticketStats?.open_count || 0} mở
        </Badge>
      </StatsCard>

      <StatsCard 
        title="Doanh thu tháng" 
        value={fmtVND(data.revenue?.currentMonth)}
        change={"+25.7%"}
        changeType="up"
        icon={DollarSign}
        color="accent"
      >
        Tháng hiện tại
      </StatsCard>
    </div>

    {/* Expiring Contracts Table */}
    {data.expiringContracts?.length > 0 && (
      <Card className="!bg-gradient-to-r !from-yellow-500/10 !to-orange-500/10 !border-yellow-500/30">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <h3 className="text-xl font-bold text-yellow-100">
            Hợp đồng sắp hết hạn (30 ngày) - {data.expiringContracts.length}
          </h3>
        </div>
        
        <div className="divide-y divide-white/10">
          {data.expiringContracts.slice(0, 5).map((c) => (  // ✅ Limit 5 items
            <div key={c.id} className="flex items-center justify-between py-4 hover:bg-white/5 rounded-lg transition-colors">
              <div className="space-y-1 min-w-0">
                <code className="text-sm font-mono text-primary-400 bg-primary-500/10 px-2 py-1 rounded-lg">
                  {c.contract_number}
                </code>
                <div className="text-sm font-medium text-white truncate">{c.company_name}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">{c.sales_name}</span>
                <Badge 
                  variant={c.days_left <= 7 ? 'danger' : 'warning'}
                  size="sm"
                >
                  Còn {c.days_left} ngày
                </Badge>
              </div>
            </div>
          ))}
          {data.expiringContracts.length > 5 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              +{data.expiringContracts.length - 5} hợp đồng khác
            </div>
          )}
        </div>
      </Card>
    )}
  </div>
);

// ✅ SALES DASHBOARD (tương tự)
const SalesDashboard = ({ data }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <StatsCard 
        title="Khách hàng của tôi" 
        value={data.myCustomers?.total || 0}
        change={"+15.3%"}
        changeType="up"
        icon={Users}
        color="primary"
      >
        <div className="flex gap-2 mt-2">
          <Badge variant="info">{data.myCustomers?.lead || 0} lead</Badge>
          <Badge variant="success">{data.myCustomers?.active || 0} active</Badge>
        </div>
      </StatsCard>

      <StatsCard 
        title="Doanh thu tháng" 
        value={fmtVND(data.myRevenue?.month_total)}
        change={"+28.9%"}
        changeType="up"
        icon={DollarSign}
        color="success"
      />
    </div>

    {/* My Expiring Contracts */}
    {data.myExpiringContracts?.length > 0 && (
      <Card className="!bg-gradient-to-r !from-orange-500/10 !to-red-500/10 !border-orange-500/30">
        <h3 className="text-xl font-bold text-orange-100 mb-6">
          Hợp đồng sắp hết hạn của tôi ({data.myExpiringContracts.length})
        </h3>
        <div className="space-y-3">
          {data.myExpiringContracts.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <code className="text-primary-400 font-mono">{c.contract_number}</code>
                <span className="ml-3 font-medium">{c.company_name}</span>
              </div>
              <Badge variant={c.days_left <= 7 ? 'danger' : 'warning'}>
                Còn {c.days_left}n
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    )}
  </div>
);

// ✅ CSKH DASHBOARD (tương tự)
const CSKHDashboard = ({ data }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard 
        title="Ticket của tôi" 
        value={data.myTickets?.total || 0}
        change={"+5.2%"}
        changeType="up"
        icon={Ticket}
        color="primary"
      >
        <Badge variant="warning">{data.myTickets?.open || 0} mở</Badge>
      </StatsCard>

      <StatsCard 
        title="Đang xử lý" 
        value={data.myTickets?.processing || 0}
        icon={Ticket}
        color="info"
      />

      <StatsCard 
        title="Đã giải quyết" 
        value={data.myTickets?.resolved || 0}
        change={"+12.1%"}
        changeType="up"
        icon={Ticket}
        color="success"
      />
    </div>

    {/* My Overdue Tickets */}
    {data.myOverdueTickets?.length > 0 && (
      <Card className="!bg-gradient-to-r !from-red-500/10 !to-orange-500/10 !border-red-500/30">
        <h3 className="text-xl font-bold text-red-100 mb-6">
          Ticket stale của tôi ({data.myOverdueTickets.length})
        </h3>
        <div className="space-y-3">
          {data.myOverdueTickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="space-y-1">
                <span className="text-sm text-gray-400">#{t.id}</span>
                <span className="font-medium">{t.title}</span>
                <span className="text-sm text-gray-400">· {t.company_name}</span>
              </div>
              <Badge variant="warning">
                {Math.floor(t.stale_hours)}h
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    )}
  </div>
);

export default DashboardPage;