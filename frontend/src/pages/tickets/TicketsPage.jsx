/**
 * @file     frontend/src/pages/tickets/TicketsPage.jsx
 * @theme    WHITE PLAIN - Sync with ContractsPage/RevenuesPage
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import ticketsService from '../../services/ticketsService';

import Button from '../../components/common/Button';
import TicketAddForm from './TicketAddForm';
import TicketDetailView from './TicketDetailView';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const PRIORITY_CFG = {
  urgent: { label: 'Khẩn cấp', variant: 'danger' },
  high: { label: 'Cao', variant: 'warning' },
  medium: { label: 'Trung bình', variant: 'info' },
  low: { label: 'Thấp', variant: 'gray' },
};

const STATUS_CFG = {
  open: { label: 'Mở', variant: 'success' },
  processing: { label: 'Đang xử lý', variant: 'primary' },
  resolved: { label: 'Đã giải quyết', variant: 'purple' },
  closed: { label: 'Đã đóng', variant: 'gray' },
};

const PriorityBadge = ({ p }) => {
  const c = PRIORITY_CFG[p] || PRIORITY_CFG.medium;
  return (
    <Badge variant={c.variant} className="!rounded-none !shadow-none font-bold">
      {c.label}
    </Badge>
  );
};

const StatusBadge = ({ s }) => {
  const c = STATUS_CFG[s] || STATUS_CFG.open;
  return (
    <Badge variant={c.variant} className="!rounded-none !shadow-none font-bold">
      {c.label}
    </Badge>
  );
};

const StatCard = ({ label, value, colorClass = 'text-blue-600', sub }) => (
  <Card className="border border-gray-200 !rounded-none !shadow-none">
    <div className="p-6">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
        {label}
      </div>
      <div className={`text-3xl font-black ${colorClass}`}>{value}</div>
      {sub && <div className="text-sm text-gray-600 mt-2">{sub}</div>}
    </div>
  </Card>
);

const fmtTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TicketsPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin', 'sales', 'cskh', 'technical'].includes(user?.role);

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const LIMIT = 15;

  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPriority, setFPriority] = useState('');
  const [modal, setModal] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, st] = await Promise.all([
        ticketsService.getTickets({
          page,
          limit: LIMIT,
          search: search || undefined,
          status: fStatus || undefined,
          priority: fPriority || undefined,
        }),
        ticketsService.getStats(),
      ]);

      setTickets(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } catch {
      setError('Không thể tải dữ liệu ticket.');
    } finally {
      setLoading(false);
    }
  }, [page, search, fStatus, fPriority]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const closeRefresh = () => {
    setModal(null);
    fetchAll();
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="bg-white min-h-screen p-1">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {modal === 'create' ? (
          <TicketAddForm onCancel={() => setModal(null)} onSaved={closeRefresh} />
        ) : modal?.type === 'detail' ? (
          <TicketDetailView id={modal.id} onBack={() => setModal(null)} onRefresh={fetchAll} />
        ) : (
          <>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              Ticket Support
            </h1>
            <p className="text-lg text-gray-600">
              Quản lý yêu cầu hỗ trợ từ khách hàng
            </p>
          </div>

          {canWrite && (
            <Button
              variant="primary"
              onClick={() => setModal('create')}
              className="!rounded-none px-6 h-12 font-bold"
            >
              + Tạo ticket
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            <StatCard label="Tổng tickets" value={stats.total} sub={`${stats.open} đang mở`} />
            <StatCard label="Đang xử lý" value={stats.processing} colorClass="text-blue-600" />
            <StatCard label="Urgent" value={stats.urgent} colorClass="text-red-600" sub="Cần xử lý ngay" />
            <StatCard label="Stale (>36h)" value={stats.stale} colorClass="text-amber-600" sub="Chưa cập nhật" />
            <StatCard label="Đã giải quyết" value={stats.resolved} colorClass="text-purple-600" />
          </div>
        )}

        {/* Filters */}
        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tiêu đề, tên công ty…"
                className="!rounded-none"
              />

              <select
                className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={fStatus}
                onChange={(e) => {
                  setFStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="open">Mở</option>
                <option value="processing">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="closed">Đã đóng</option>
              </select>

              <select
                className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={fPriority}
                onChange={(e) => {
                  setFPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả ưu tiên</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none">
            {error}
          </div>
        )}

        {/* Table */}
        <Card className="border border-gray-200 !rounded-none !shadow-none overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center">
              <Loading />
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              title="Không có ticket nào"
              description="Chưa có yêu cầu hỗ trợ nào phù hợp với bộ lọc hiện tại."
              className="py-20"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['#', 'Tiêu đề', 'Khách hàng', 'Loại', 'Ưu tiên', 'Trạng thái', 'Phụ trách', 'Cập nhật', ''].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {tickets.map((t) => {
                      const isStale =
                        t.hours_since_update >= 36 &&
                        t.status !== 'closed' &&
                        t.status !== 'resolved';

                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                            isStale ? 'border-l-4 border-orange-400' : ''
                          }`}
                          onClick={() => setModal({ type: 'detail', id: t.id })}
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm font-semibold text-gray-600">
                              #{t.id}
                            </span>
                          </td>

                          <td className="px-6 py-4 max-w-md">
                            <div className="font-semibold text-gray-900 text-sm truncate">
                              {t.title}
                            </div>
                            {isStale && (
                              <div className="text-xs text-orange-600 font-medium mt-1">
                                ⚠ Chưa cập nhật {Math.floor(t.hours_since_update)} giờ
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900 text-sm">
                              {t.company_name}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {t.ticket_type_name}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <PriorityBadge p={t.priority} />
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge s={t.status} />
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {t.assigned_to_name || '—'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-500">
                              {fmtTime(t.last_updated_at)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <Button
                              variant="secondary"
                              className="!rounded-none px-4 h-10 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ type: 'detail', id: t.id });
                              }}
                            >
                              Xem
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={LIMIT}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;