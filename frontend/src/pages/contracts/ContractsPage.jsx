/**
 * @file     frontend/src/pages/contracts/ContractsPage.jsx
 * @theme    WHITE PLAIN - sync with shared components
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import contractsService from '../../services/contractsService';
import ContractAddForm from './ContractAddForm';
import ContractDetailPage from './ContractDetailPage';
import ContractRenewForm from './ContractRenewForm';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';

const fmtVND = (n) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const STATUS_CFG = {
  active: { label: 'Đang hoạt động', variant: 'success' },
  pending: { label: 'Chờ duyệt', variant: 'warning' },
  rejected: { label: 'Bị từ chối', variant: 'danger' },
  near_expired: { label: 'Sắp hết hạn', variant: 'warning' },
  expired: { label: 'Đã hết hạn', variant: 'danger' },
  cancelled: { label: 'Đã hủy', variant: 'gray' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.active;
  return (
    <Badge variant={c.variant} className="!rounded-none !shadow-none font-bold">
      {c.label}
    </Badge>
  );
};

const getFileLink = (url) => {
  if (!url) return '#';
  let finalUrl = url;
  if (!url.startsWith('http')) {
    finalUrl = `http://localhost:5000/${url.replace(/\\/g, '/')}`;
  }
  if (finalUrl.match(/\.(doc|docx)$/i) && finalUrl.includes('cloudinary.com')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(finalUrl)}`;
  }
  return finalUrl;
};

const ExpiryBadge = ({ days }) => {
  if (days == null || days === '') return null;

  const d = Number(days);
  let variant = 'success';
  let label = '';

  if (d < 0) {
    variant = 'danger';
    label = `Đã hết hạn ${Math.abs(d)} ngày`;
  } else if (d === 0) {
    variant = 'danger';
    label = 'Hết hạn hôm nay';
  } else if (d <= 7) {
    variant = 'danger';
    label = `Còn ${d} ngày`;
  } else if (d <= 30) {
    variant = 'warning';
    label = `Còn ${d} ngày`;
  } else {
    variant = 'success';
    label = `Còn ${d} ngày`;
  }

  return (
    <Badge variant={variant} className="!rounded-none !shadow-none font-bold">
      {label}
    </Badge>
  );
};

const StatCard = ({ label, value, sub, colorClass = 'text-blue-600' }) => (
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

const ContractsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = ['admin', 'sales', 'manager'].includes(user?.role);
  const isManager = ['admin', 'manager'].includes(user?.role);

  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const LIMIT = 15;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');
  const [modal, setModal] = useState({ type: null, id: null, contract: null });
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: LIMIT,
        search: search || undefined,
        status: filterStatus || undefined,
        expiringSoon: filterExpiry || undefined,
      };

      const [res, st] = await Promise.all([
        contractsService.getContracts(params),
        contractsService.getStats(),
      ]);

      setContracts(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } catch (err) {
      setError('Không thể tải dữ liệu hợp đồng.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterExpiry]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Xác nhận duyệt hợp đồng này?')) return;
    try {
      await contractsService.approve(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối');
    try {
      await contractsService.reject(modal.id, rejectReason);
      setModal({ type: null });
      setRejectReason('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  if (modal.type === 'create') {
    return (
      <div className="bg-white min-h-screen p-1">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <ContractAddForm
            onCancel={() => setModal({ type: null, id: null, contract: null })}
            onSaved={() => {
              setModal({ type: null, id: null, contract: null });
              fetchData();
            }}
          />
        </div>
      </div>
    );
  }

  if (modal.type === 'detail' && modal.id) {
    return (
      <div className="bg-white min-h-screen p-1">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <ContractDetailPage
            id={modal.id}
            onBack={() => setModal({ type: null, id: null, contract: null })}
            onUpdated={fetchData}
          />
        </div>
      </div>
    );
  }

  if (modal.type === 'renew' && modal.contract) {
    return (
      <div className="bg-white min-h-screen p-1">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <ContractRenewForm
            contract={modal.contract}
            onCancel={() => setModal({ type: null, id: null, contract: null })}
            onSaved={() => {
              setModal({ type: null, id: null, contract: null });
              fetchData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-1">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              Quản lý hợp đồng
            </h1>
            <p className="text-lg text-gray-600">
              Theo dõi và quản lý vòng đời dịch vụ khách hàng
            </p>
          </div>

          {canWrite && (
            <Button
              variant="primary"
              onClick={() => setModal({ type: 'create', id: null, contract: null })}
              className="!rounded-none px-6 h-12 font-bold"
            >
              + Tạo hợp đồng
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              label="Tổng hợp đồng"
              value={stats.total}
              sub={`${stats.active} đang hoạt động`}
              colorClass="text-blue-600"
            />
            <StatCard
              label="Sắp hết hạn (30 ngày)"
              value={stats.expiring30d}
              sub="Cần gia hạn"
              colorClass="text-amber-600"
            />
            <StatCard
              label="Sắp hết hạn (7 ngày)"
              value={stats.expiring7d}
              sub="Xử lý gấp"
              colorClass="text-red-600"
            />
            <StatCard
              label="Giá trị Active"
              value={fmtVND(stats.activeValue)}
              colorClass="text-emerald-600"
            />
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
                placeholder="Số HĐ, tên công ty..."
                className="!rounded-none"
              />

              <select
                className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="pending">Chờ duyệt</option>
                <option value="rejected">Bị từ chối</option>
                <option value="near_expired">Sắp hết hạn</option>
                <option value="expired">Đã hết hạn</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              <select
                className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={filterExpiry}
                onChange={(e) => {
                  setFilterExpiry(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả thời hạn</option>
                <option value="7">Hết hạn trong 7 ngày</option>
                <option value="30">Hết hạn trong 30 ngày</option>
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
          ) : contracts.length === 0 ? (
            <EmptyState
              title="Không có hợp đồng nào"
              description="Hãy tạo hợp đồng đầu tiên để bắt đầu quản lý."
              className="py-20"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Số HĐ', 'Khách hàng', 'Thời hạn', 'Trạng thái', 'Hết hạn', 'Giá trị', ''].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {contracts.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setModal({ type: 'detail', id: c.id, contract: c })}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-blue-600 text-sm">
                            {c.contract_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{c.company_name}</div>
                          {c.status === 'rejected' && (
                            <div className="text-xs text-red-500 mt-1 italic line-clamp-1 truncate max-w-[200px]" title={c.reject_reason}>
                              Lý do: {c.reject_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {fmtDate(c.start_date)} - {fmtDate(c.end_date)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4">
                          <ExpiryBadge days={c.days_until_expiry} />
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {fmtVND(c.final_value)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 items-center justify-end">
                          {c.attachment_url && (
                            <a href={getFileLink(c.attachment_url)} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600" onClick={e=>e.stopPropagation()} title="Xem chứng từ">
                              <FileText className="w-5 h-5" />
                            </a>
                          )}
                          {isManager && c.status === 'pending' && (
                            <>
                              <button onClick={(e) => handleApprove(e, c.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded" title="Duyệt">
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setModal({ type: 'reject', id: c.id }); }} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Từ chối">
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}

                          {canWrite && c.status !== 'cancelled' && (
                            <Button
                              variant="secondary"
                              className="!rounded-none px-4 h-10 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ type: 'renew', contract: c });
                              }}
                            >
                              Gia hạn
                            </Button>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

        {/* Modal nhập lý do từ chối */}
        {modal.type === 'reject' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-none shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Từ chối hợp đồng</h2>
                <button onClick={() => {setModal({type: null}); setRejectReason('')}} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleReject} className="p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do từ chối *</label>
                <textarea required rows={4} className="w-full border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-red-500" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Nhập lý do để Sales biết cách sửa..."></textarea>
                <div className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="secondary" className="!rounded-none" onClick={() => {setModal({type: null}); setRejectReason('')}}>Hủy</Button>
                  <Button type="submit" variant="danger" className="!rounded-none">Xác nhận Từ Chối</Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ContractsPage;