/**
 * @file     frontend/src/pages/contracts/ContractsPage.jsx
 * @theme    WHITE PLAIN - Sync with RevenuesPage
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import contractsService from '../../services/contractsService';
import solutionsService from '../../services/solutionsService';

// ── Helpers ───────────────────────────────────────────────────────
const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const STATUS_CFG = {
  active: { label: 'Đang hoạt động', bg: '#10B981', text: '#fff', className: 'bg-green-500 text-white' },
  near_expired: { label: 'Sắp hết hạn', bg: '#F59E0B', text: '#fff', className: 'bg-orange-500 text-white' },
  expired: { label: 'Đã hết hạn', bg: '#EF4444', text: '#fff', className: 'bg-red-500 text-white' },
  cancelled: { label: 'Đã hủy', bg: '#6B7280', text: '#fff', className: 'bg-gray-500 text-white' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.active;
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
      {c.label}
    </span>
  );
};

const ExpiryBadge = ({ days }) => {
  if (days == null) return null;
  const d = Number(days);
  let variant, label;
  
  if (d < 0 || d <= 7) {
    variant = 'bg-red-500 text-white';
    label = d < 0 ? `Hết hạn ${Math.abs(d)}n` : d === 0 ? 'Hôm nay' : `Còn ${d}n`;
  } else if (d <= 30) {
    variant = 'bg-orange-500 text-white';
    label = `Còn ${d}n`;
  } else {
    variant = 'bg-green-500 text-white';
    label = `Còn ${d}n`;
  }
  
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${variant}`}>{label}</span>;
};

// ── Stat card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#3B82F6' }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{label}</div>
    <div className="text-3xl font-black" style={{ color }}>{value}</div>
    {sub && <div className="text-sm text-gray-600 mt-2">{sub}</div>}
  </div>
);

const ContractsPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin', 'sales', 'manager'].includes(user?.role);

  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');
  const [modal, setModal] = useState({ type: null, id: null, contract: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: LIMIT,
        search: search || undefined,
        status: filterStatus || undefined,
        expiringSoon: filterExpiry || undefined
      };
      const [res, st] = await Promise.all([
        contractsService.getContracts(params),
        contractsService.getStats(),
      ]);
      setContracts(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterExpiry]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-3">Quản lý hợp đồng</h1>
            <p className="text-xl text-gray-600">Theo dõi và quản lý vòng đời dịch vụ khách hàng</p>
          </div>
          {canWrite && (
            <button 
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200"
              onClick={() => setModal({ type: 'create' })}
            >
              + Tạo hợp đồng
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard label="Tổng hợp đồng" value={stats.total} sub={`${stats.active} đang hoạt động`} />
            <StatCard label="Sắp hết hạn (30n)" value={stats.expiring30d} color="#F59E0B" sub="Cần gia hạn" />
            <StatCard label="Sắp hết hạn (7n)" value={stats.expiring7d} color="#EF4444" sub="Xử lý gấp" />
            <StatCard label="Giá trị Active" value={fmtVND(stats.activeValue)} color="#10B981" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <input
            className="flex-1 lg:w-96 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-lg placeholder-gray-500"
            placeholder="🔍 Số HĐ, tên công ty..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            className="w-full lg:w-64 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="near_expired">Sắp hết hạn</option>
            <option value="expired">Đã hết hạn</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select 
            className="w-full lg:w-64 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={filterExpiry} 
            onChange={e => { setFilterExpiry(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả thời hạn</option>
            <option value="7">Hết hạn trong 7 ngày</option>
            <option value="30">Hết hạn trong 30 ngày</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  {['Số HĐ', 'Khách hàng', 'Thời hạn', 'Trạng thái', 'Hết hạn', 'Giá trị', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Không có hợp đồng nào
                    </td>
                  </tr>
                ) : (
                  contracts.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setModal({ type: 'detail', id: c.id })}>
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-blue-600 text-lg">{c.contract_number}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{c.company_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {fmtDate(c.start_date)} - {fmtDate(c.end_date)}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-6 py-4"><ExpiryBadge days={c.days_until_expiry} /></td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{fmtVND(c.final_value)}</td>
                      <td className="px-6 py-4">
                        {canWrite && c.status !== 'cancelled' && (
                          <button 
                            className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-all text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({type: 'renew', contract: c});
                            }}
                          >
                            Gia hạn
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Trang {page} / {totalPages} · {total} hợp đồng</span>
                <div className="flex gap-2">
                  <button 
                    disabled={page <= 1}
                    onClick={() => setPage(p => p-1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  <button 
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p+1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {modal.type === 'create' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={e => e.target === e.currentTarget && setModal({type: null})}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Tạo hợp đồng mới</h2>
              <button onClick={() => setModal({type: null})} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số hợp đồng *</label>
                  <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer ID *</label>
                  <input type="number" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                </div>
              </div>
              <div className="flex gap-6">
                <button type="button" className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex-1" onClick={() => setModal({type: null})}>
                  Huỷ
                </button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all flex-1">
                  Tạo hợp đồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;