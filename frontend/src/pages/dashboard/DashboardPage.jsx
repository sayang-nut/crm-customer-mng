import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  DollarSign,
  Ticket,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import StatsCard from '../../components/dashboard/StatsCard';
import RevenueChart from '../../components/charts/RevenueChart';
import CustomerDistributionChart from '../../components/charts/CustomerDistributionChart';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Mock data - sẽ fetch từ API sau
  const stats = {
    totalCustomers: 1234,
    activeContracts: 856,
    monthlyRevenue: 125000000,
    openTickets: 24,
  };

  const revenueData = [
    { month: 'T1', revenue: 85000000 },
    { month: 'T2', revenue: 92000000 },
    { month: 'T3', revenue: 98000000 },
    { month: 'T4', revenue: 105000000 },
    { month: 'T5', revenue: 112000000 },
    { month: 'T6', revenue: 125000000 },
  ];

  const customerDistribution = [
    { name: 'Bán lẻ', value: 450 },
    { name: 'Lưu trú', value: 380 },
    { name: 'Làm đẹp', value: 220 },
    { name: 'F&B', value: 184 },
  ];

  const expiringContracts = [
    {
      id: 1,
      company: 'ABC Fashion Store',
      expiryDate: '2024-01-25',
      value: 15000000,
      daysLeft: 7,
    },
    {
      id: 2,
      company: 'XYZ Restaurant',
      expiryDate: '2024-01-28',
      value: 12000000,
      daysLeft: 10,
    },
    {
      id: 3,
      company: 'DEF Spa & Wellness',
      expiryDate: '2024-02-02',
      value: 18000000,
      daysLeft: 15,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'customer',
      title: 'Khách hàng mới',
      description: 'GHI Coffee Shop đã được thêm vào hệ thống',
      time: '10 phút trước',
      user: 'Nguyễn Văn A',
    },
    {
      id: 2,
      type: 'contract',
      title: 'Gia hạn hợp đồng',
      description: 'ABC Fashion Store đã gia hạn gói Chuyên nghiệp',
      time: '1 giờ trước',
      user: 'Trần Thị B',
    },
    {
      id: 3,
      type: 'ticket',
      title: 'Ticket mới',
      description: 'XYZ Restaurant tạo ticket hỗ trợ kỹ thuật',
      time: '2 giờ trước',
      user: 'Lê Văn C',
    },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Xin chào, <span className="font-semibold">{user?.full_name}</span>! 
          Chào mừng bạn quay trở lại.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Tổng khách hàng"
          value={stats.totalCustomers.toLocaleString()}
          change="+12%"
          changeType="up"
          icon={Building2}
          color="primary"
        />
        
        <StatsCard
          title="Hợp đồng đang hoạt động"
          value={stats.activeContracts.toLocaleString()}
          change="+8%"
          changeType="up"
          icon={FileText}
          color="success"
        />
        
        <StatsCard
          title="Doanh thu tháng này"
          value={formatCurrency(stats.monthlyRevenue)}
          change="+15%"
          changeType="up"
          icon={DollarSign}
          color="warning"
        />
        
        <StatsCard
          title="Tickets đang mở"
          value={stats.openTickets}
          change="-5%"
          changeType="down"
          icon={Ticket}
          color="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card
          title="Doanh thu 6 tháng gần đây"
          subtitle="Theo dõi xu hướng doanh thu"
        >
          <RevenueChart data={revenueData} />
        </Card>

        {/* Customer Distribution */}
        <Card
          title="Phân bố khách hàng theo ngành"
          subtitle="Tổng quan khách hàng hiện tại"
        >
          <CustomerDistributionChart data={customerDistribution} />
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Contracts */}
        <Card
          title="Hợp đồng sắp hết hạn"
          subtitle="Cần liên hệ gia hạn"
          action={
            <Button variant="outline" size="sm">
              Xem tất cả
            </Button>
          }
        >
          <div className="space-y-4">
            {expiringContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-dark-900">
                      {contract.company}
                    </h4>
                    <Badge
                      variant={contract.daysLeft <= 7 ? 'danger' : 'warning'}
                      dot
                    >
                      {contract.daysLeft} ngày
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Hết hạn: {new Date(contract.expiryDate).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-sm font-medium text-primary-600">
                    {formatCurrency(contract.value)}
                  </p>
                </div>
                <Button variant="primary" size="sm">
                  Liên hệ
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activities */}
        <Card
          title="Hoạt động gần đây"
          subtitle="Cập nhật mới nhất"
        >
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
              >
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.type === 'customer' && <Building2 className="w-5 h-5 text-primary-600" />}
                  {activity.type === 'contract' && <FileText className="w-5 h-5 text-green-600" />}
                  {activity.type === 'ticket' && <Ticket className="w-5 h-5 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-900 mb-1">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.time} • {activity.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;