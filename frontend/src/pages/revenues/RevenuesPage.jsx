/**
 * @file     frontend/src/pages/revenues/RevenuesPage.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import revenuesService from '../../services/revenuesService';
import { Eye, Trash2, Plus, Search, Filter, Download, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';

const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtCpct = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const PM_LABELS = { bank_transfer: 'Chuyển khoản', cash: 'Tiền mặt', online: 'Online' };

const STATUS_UI = {
  pending: { label: 'Chờ thu', variant: 'warning' },
  paid: { label: 'Đã thu', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'danger' }
};

const StatCard = ({ label, value, sub, color = '#60A5FA', growth }) => (
  <Card className="border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">{label}</div>
    <div className="text-2xl font-black text-gray-900 mb-1 leading-tight" style={{ color }}>{value}</div>
    {sub && <div className="text-sm text-gray-600">{sub}</div>}
    {growth != null && (
      <div className={`text-sm font-semibold mt-1 ${growth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
        {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% so tháng trước
      </div>
    )}
  </Card>
);

const RevenuesPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin', 'sales'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  
  const [revenues, setRevenues] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fMethod, setFMethod] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, st] = await Promise.all([
        revenuesService.getRevenues({ page, limit: LIMIT, fromDate: fFrom || undefined, toDate: fTo || undefined, paymentMethod: fMethod || undefined }),
        revenuesService.getStats()
      ]);
      setRevenues(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }, [page, fFrom, fTo, fMethod]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      await revenuesService.remove(id);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const columns = [
    { key: 'id', label: '#', render: (row) => <span className="text-sm text-gray-600 font-mono">#{row.id}</span> },
    { 
      key: 'company_name', 
      label: 'Khách hàng', 
      render: (row) => <span className="font-semibold text-dark-900 text-sm">{row.company_name}</span> 
    },
    { 
      key: 'contract_number', 
      label: 'Hợp đồng', 
      render: (row) => <span className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded text-xs">{row.contract_number}</span> 
    },
    { 
      key: 'solution_name', 
      label: 'Giải pháp', 
      render: (row) => <span className="text-sm text-gray-700">{row.solution_name}</span> 
    },
    { 
      key: 'amount', 
      label: 'Số tiền', 
      render: (row) => <span className="text-lg font-black text-green-700">{fmtVND(row.amount)}</span> 
    },
    { 
      key: 'status', 
      label: 'Trạng thái', 
      render: (row) => (
        <Badge variant={STATUS_UI[row.status]?.variant || 'secondary'} className="!rounded-md">
          {STATUS_UI[row.status]?.label || row.status}
        </Badge>
      ) 
    },
    { 
      key: 'payment_date', 
      label: 'Hạn / Ngày TT', 
      render: (row) => (
        <div className="flex flex-col">
          {row.status === 'pending' ? (
            <span className="text-sm text-orange-600 font-semibold">Hạn: {fmtDate(row.due_date)}</span>
          ) : (
            <span className="text-sm text-gray-600">{fmtDate(row.payment_date)}</span>
          )}
        </div>
      )
    },
    { 
      key: 'payment_method', 
      label: 'Phương thức', 
      render: (row) => <Badge variant="info" className="!rounded-md">{PM_LABELS[row.payment_method] || row.payment_method}</Badge> 
    },
    { 
      key: 'billing_period', 
      label: 'Kỳ', 
      render: (row) => <span className="text-sm text-gray-600">{row.billing_period || '—'}</span> 
    },
    {
      key: 'proof',
      label: 'Chứng từ',
      render: (row) => row.proof_url ? (
        <a 
          href={row.proof_url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-medium bg-blue-50 px-2 py-1 rounded"
        >
          <ExternalLink className="w-3 h-3" /> Xem
        </a>
      ) : <span className="text-gray-400 text-xs">—</span>
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="!rounded-md !px-3 !py-1.5 !text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/revenues/${row.id}`);
          }}
        >
          {row.status === 'pending' ? 'Thu tiền' : 'Chi tiết'}
        </Button>
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              className="!rounded-md !px-3 !py-1.5 !text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.id);
              }}
            >
              Xóa
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white min-h-screen space-y-8 p-6">  {/* ✅ WHITE CONTAINER */}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-black text-dark-900 mb-2">Doanh thu</h1>
          <p className="text-xl text-gray-700 font-medium">Ghi nhận và theo dõi thanh toán từ khách hàng</p>
        </div>
        {canWrite && (
          <Button
            variant="primary"
            icon={Plus}
            size="lg"
            className="!rounded-lg shadow-sm"
            onClick={() => navigate('/revenues/new')}
          >
            Ghi nhận thanh toán
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Tháng này" value={fmtCpct(stats.thisMonth)} color="#10B981" growth={stats.momGrowth} />
          <StatCard label="Năm nay" value={fmtCpct(stats.thisYear)} color="#3B82F6" sub={`${stats.totalCount} bản ghi`} />
          <StatCard label="Tháng trước" value={fmtCpct(stats.lastMonth)} color="#6B7280" />
          <StatCard label="Tổng tất cả" value={fmtCpct(stats.totalAll)} color="#8B5CF6" />
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Từ:</label>
              <Input
                type="date"
                value={fFrom}
                onChange={(e) => { setFFrom(e.target.value); setPage(1); }}
                className="!w-44 !rounded-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Đến:</label>
              <Input
                type="date"
                value={fTo}
                onChange={(e) => { setFTo(e.target.value); setPage(1); }}
                className="!w-44 !rounded-md"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <Filter className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Phương thức:</label>
              <select
                value={fMethod}
                onChange={(e) => { setFMethod(e.target.value); setPage(1); }}
                className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Tất cả phương thức</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="flex gap-3 ml-auto">
              <Button variant="primary" icon={Search} className="!rounded-md" onClick={fetchAll}>
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={revenues}
          loading={loading}
          emptyState={
            !loading && revenues.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Chưa có bản ghi doanh thu"
                description="Ghi nhận thanh toán đầu tiên để bắt đầu theo dõi"
                action={canWrite}
                actionLabel="Ghi nhận thanh toán"
                onAction={() => navigate('/revenues/new')}
              />
            ) : null
          }
        />
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Trang {page} / {totalPages} · {total} bản ghi</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="!rounded-md"
                >
                  ← Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="!rounded-md"
                >
                  Sau →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RevenuesPage;