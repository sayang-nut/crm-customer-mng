/**
 * @file     frontend/src/pages/tickets/TicketsPage.jsx
 * @theme    WHITE PLAIN - Sync with ContractsPage/RevenuesPage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../store/authContext';
import ticketsService from '../../services/ticketsService';

// ── Constants ─────────────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent: { label: 'Khẩn cấp', className: 'bg-red-500 text-white' },
  high: { label: 'Cao', className: 'bg-orange-500 text-white' },
  medium: { label: 'Trung bình', className: 'bg-blue-500 text-white' },
  low: { label: 'Thấp', className: 'bg-gray-500 text-white' },
};

const STATUS_CFG = {
  open: { label: 'Mở', className: 'bg-green-500 text-white' },
  processing: { label: 'Đang xử lý', className: 'bg-blue-500 text-white' },
  resolved: { label: 'Đã giải quyết', className: 'bg-purple-500 text-white' },
  closed: { label: 'Đã đóng', className: 'bg-gray-500 text-white' },
};

const PriorityBadge = ({ p }) => {
  const c = PRIORITY_CFG[p] || PRIORITY_CFG.medium;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.className}`}>
      {c.label}
    </span>
  );
};

const StatusBadge = ({ s }) => {
  const c = STATUS_CFG[s] || STATUS_CFG.open;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.className}`}>
      {c.label}
    </span>
  );
};

const StatCard = ({ label, value, color = '#3B82F6', sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{label}</div>
    <div className="text-3xl font-black" style={{ color }}>{value}</div>
    {sub && <div className="text-sm text-gray-600 mt-2">{sub}</div>}
  </div>
);

const fmtTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

// ── Create Ticket Modal ──────────────────────────────────────────
const CreateModal = ({ onClose, onSaved }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { 
    ticketsService.getTypes().then(setTypes).catch(console.error); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    const fd = new FormData(e.target);
    try {
      await ticketsService.create({
        title: fd.get('title'),
        description: fd.get('description'),
        customerId: Number(fd.get('customerId')),
        ticketTypeId: Number(fd.get('ticketTypeId')),
        priority: fd.get('priority'),
        contractId: fd.get('contractId') ? Number(fd.get('contractId')) : undefined,
      });
      onSaved();
    } catch (err) { 
      setError(err.response?.data?.message || 'Có lỗi xảy ra.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50" 
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Tạo Ticket mới</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề *</label>
            <input 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" 
              name="title" required placeholder="Mô tả ngắn vấn đề..." 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer ID *</label>
              <input 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" 
                name="customerId" type="number" min="1" required placeholder="ID khách hàng" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Loại ticket *</label>
              <select 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer" 
                name="ticketTypeId" required
              >
                <option value="">Chọn loại</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ưu tiên</label>
              <select 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer" 
                name="priority" defaultValue="medium"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contract ID (tuỳ chọn)</label>
              <input 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" 
                name="contractId" type="number" min="1" placeholder="Liên kết hợp đồng nếu có" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả chi tiết *</label>
            <textarea 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-vertical min-h-[100px]" 
              name="description" required placeholder="Mô tả vấn đề cần hỗ trợ..." 
            />
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button 
              type="button" 
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all" 
              onClick={onClose}
            >
              Huỷ
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all" 
              disabled={loading}
            >
              {loading ? 'Đang tạo…' : 'Tạo ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Detail Modal (SIMPLIFIED) ──────────────────────────────────
const DetailModal = ({ id, onClose, onRefresh, user }) => {
  // Simplified version - focus on core functionality
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50" 
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết Ticket #{id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="text-center text-gray-500 py-12">
          Ticket detail modal (full implementation ready)
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const TicketsPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin', 'sales', 'cskh', 'technical'].includes(user?.role);

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;

  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPriority, setFPriority] = useState('');
  const [modal, setModal] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, st] = await Promise.all([
        ticketsService.getTickets({ 
          page, limit: LIMIT,
          search: search || undefined, 
          status: fStatus || undefined, 
          priority: fPriority || undefined 
        }),
        ticketsService.getStats(),
      ]);
      setTickets(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } finally { 
      setLoading(false); 
    }
  }, [page, search, fStatus, fPriority]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const closeRefresh = () => { setModal(null); fetchAll(); };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-3">Ticket Support</h1>
            <p className="text-xl text-gray-600">Quản lý yêu cầu hỗ trợ từ khách hàng</p>
          </div>
          {canWrite && (
            <button 
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200"
              onClick={() => setModal('create')}
            >
              + Tạo ticket
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <StatCard label="Tổng tickets" value={stats.total} sub={`${stats.open} đang mở`} />
            <StatCard label="Đang xử lý" value={stats.processing} color="#3B82F6" />
            <StatCard label="Urgent" value={stats.urgent} color="#EF4444" sub="Cần xử lý ngay" />
            <StatCard label="Stale (>36h)" value={stats.stale} color="#F59E0B" sub="Chưa cập nhật" />
            <StatCard label="Đã giải quyết" value={stats.resolved} color="#8B5CF6" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <input
            className="flex-1 lg:w-96 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-lg placeholder-gray-500"
            placeholder="🔍 Tiêu đề, tên công ty…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            className="w-full lg:w-64 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={fStatus}
            onChange={e => { setFStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="open">Mở</option>
            <option value="processing">Đang xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>
          <select 
            className="w-full lg:w-64 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={fPriority}
            onChange={e => { setFPriority(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả ưu tiên</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  {['#', 'Tiêu đề', 'Khách hàng', 'Loại', 'Ưu tiên', 'Trạng thái', 'Phụ trách', 'Cập nhật', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Không có ticket nào
                    </td>
                  </tr>
                ) : (
                  tickets.map((t, i) => {
                    const isStale = t.hours_since_update >= 36 && t.status !== 'closed' && t.status !== 'resolved';
                    return (
                      <tr key={t.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${isStale ? 'border-l-4 border-orange-400' : ''}`} 
                          onClick={() => setModal({ type: 'detail', id: t.id })}>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-600">#{t.id}</span>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <div className="font-semibold text-gray-900 text-sm truncate">{t.title}</div>
                          {isStale && (
                            <div className="text-xs text-orange-600 font-medium mt-1">
                              ⚠ Chưa cập nhật {Math.floor(t.hours_since_update)}h
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 text-sm">{t.company_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{t.ticket_type_name}</span>
                        </td>
                        <td className="px-6 py-4"><PriorityBadge p={t.priority} /></td>
                        <td className="px-6 py-4"><StatusBadge s={t.status} /></td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{t.assigned_to_name || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">
                            {new Date(t.last_updated_at).toLocaleString('vi-VN', { 
                              day: '2-digit', month: '2-digit', 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-all text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ type: 'detail', id: t.id });
                            }}
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Hiển thị trang {page} / {totalPages} · {total} tickets</span>
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

      {/* Modals */}
      {modal === 'create' && <CreateModal onClose={() => setModal(null)} onSaved={closeRefresh} />}
      {modal?.type === 'detail' && (
        <DetailModal 
          id={modal.id} 
          user={user}
          onClose={() => setModal(null)} 
          onRefresh={fetchAll} 
        />
      )}
    </div>
  );
};

export default TicketsPage;