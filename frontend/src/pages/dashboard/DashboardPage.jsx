/**
 * @file      frontend/src/pages/dashboard/DashboardPage.jsx
 * @location  frontend/src/pages/dashboard/
 * @theme     WHITE PLAIN - Sync Header/Sidebar/MainLayout
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang Dashboard – KPI theo role (Admin/Sales/CSKH)
 * ✅ LOGIC 100% GIỮ NGUYÊN | UI WHITE PLAIN | RESPONSIVE
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
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center space-y-4">
          <div className="spinner w-12 h-12 text-primary-500 mx-auto" />
          <p className="text-gray-600 text-lg font-medium">Đang tải...</p>
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
    <div className="bg-white min-h-full space-y-8 p-1">  {/* ✅ WHITE CONTAINER */}
      
      {/* Header - WHITE PLAIN */}
      <header className="space-y-2 pb-8 border-b border-gray-200">
        <h1 className="text-4xl font-black text-dark-900 tracking-tight">
          Dashboard  {/* ✅ BLACK TEXT - visible */}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-gray-700 text-lg font-medium">
            Xin chào, <span className="font-bold text-dark-900">{user?.fullName}</span>
          </p>
          <Badge variant="primary" className="!bg-primary-100 !text-primary-800">
            {roleName[user?.role]}
          </Badge>
        </div>
      </header>

      {/* Role-specific Dashboards */}
      {['admin', 'manager'].includes(user?.role) && <AdminDashboard data={data} />}
      {user?.role === 'sales' && <SalesDashboard data={data} />}
      {user?.role === 'cskh' && <CSKHDashboard data={data} />}
    </div>
  );
};

// ✅ ADMIN DASHBOARD - WHITE PLAIN
const AdminDashboard = ({ data }) => (
  <div className="space-y-8">
    {/* KPI Grid */}
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

    {/* Expiring Contracts - LIGHT YELLOW */}
    {data.expiringContracts?.length > 0 && (
      <Card className="border border-yellow-200 bg-yellow-50 shadow-sm">
        <div className="flex items-center gap-3 p-6 mb-6">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse flex-shrink-0" />
          <h3 className="text-xl font-bold text-yellow-900">
            Hợp đồng sắp hết hạn (30 ngày) - {data.expiringContracts.length}
          </h3>
        </div>
        
        <div className="divide-y divide-yellow-200">
          {data.expiringContracts.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-4 px-6 hover:bg-yellow-25 rounded-lg transition-colors">
              <div className="space-y-1">
                <code className="text-sm font-mono bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">
                  {c.contract_number}
                </code>
                <div className="text-sm font-semibold text-dark-900 truncate">{c.company_name}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{c.sales_name}</span>
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
            <div className="text-center py-6 text-gray-500 text-sm font-medium">
              +{data.expiringContracts.length - 5} hợp đồng khác
            </div>
          )}
        </div>
      </Card>
    )}
  </div>
);

// ✅ SALES DASHBOARD - WHITE PLAIN
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
        <div className="flex flex-wrap gap-2 mt-2">
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

    {/* My Expiring Contracts - LIGHT ORANGE */}
    {data.myExpiringContracts?.length > 0 && (
      <Card className="border border-orange-200 bg-orange-50 shadow-sm">
        <h3 className="text-xl font-bold text-orange-900 p-6 border-b border-orange-200">
          Hợp đồng sắp hết hạn của tôi ({data.myExpiringContracts.length})
        </h3>
        <div className="divide-y divide-orange-200">
          {data.myExpiringContracts.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-4 px-6 hover:bg-orange-25 rounded-lg transition-colors">
              <div>
                <code className="text-primary-700 font-mono bg-primary-100 px-2 py-1 rounded text-sm">
                  {c.contract_number}
                </code>
                <span className="ml-3 font-semibold text-dark-900">{c.company_name}</span>
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

// ✅ CSKH DASHBOARD - WHITE PLAIN
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

    {/* My Overdue Tickets - LIGHT RED */}
    {data.myOverdueTickets?.length > 0 && (
      <Card className="border border-red-200 bg-red-50 shadow-sm">
        <h3 className="text-xl font-bold text-red-900 p-6 border-b border-red-200">
          Ticket stale của tôi ({data.myOverdueTickets.length})
        </h3>
        <div className="divide-y divide-red-200">
          {data.myOverdueTickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-4 px-6 hover:bg-red-25 rounded-lg transition-colors">
              <div className="space-y-1">
                <span className="text-sm font-medium text-dark-900">#{t.id}</span>
                <span className="font-semibold text-dark-900 block">{t.title}</span>
                <span className="text-sm text-gray-600">· {t.company_name}</span>
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