/**
 * @file     frontend/src/pages/revenues/RevenuesPage.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import revenuesService from '../../services/revenuesService';
import { Edit, Trash2, Plus, Search, Filter, Download, Calendar, DollarSign, Paperclip, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
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
  
  const [revenues, setRevenues] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fMethod, setFMethod] = useState('');
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalStatus, setModalStatus] = useState('pending'); // Trạng thái chọn trong modal
  const [proofFile, setProofFile] = useState(null); // File upload

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

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    
    let uploadedUrl = modalData?.proof_url;
    
    // Xử lý upload file nếu trạng thái là "Đã thu" và có chọn file mới
    if (modalStatus === 'paid' && proofFile) {
      try {
        const formData = new FormData();
        formData.append('file', proofFile);
        // Thay hàm này bằng hàm gọi API upload file thực tế của bạn
        // const uploadRes = await uploadService.upload(formData); 
        // uploadedUrl = uploadRes.url;
      } catch (err) {
        setModalError('Lỗi khi tải lên chứng từ. Vui lòng thử lại.');
        setModalLoading(false);
        return;
      }
    }

    const fd = new FormData(e.target);
    const payload = {
      amount: Number(fd.get('amount')),
      status: fd.get('status'),
      paymentDate: fd.get('paymentDate'),
      paymentMethod: fd.get('paymentMethod'),
      billingPeriod: fd.get('billingPeriod') || undefined,
      notes: fd.get('notes') || undefined,
      proofUrl: uploadedUrl
    };

    // Disable sửa contractId/customerId đối với bản ghi tự sinh
    if (!modalData?.id) {
      payload.contractId = Number(fd.get('contractId'));
      payload.customerId = Number(fd.get('customerId'));
    }

    try {
      if (modalData?.id) {
        await revenuesService.update(modalData.id, payload);
      } else {
        await revenuesService.create(payload);
      }
      setShowModal(false);
      setModalData(null);
      fetchAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setModalLoading(false);
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
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              icon={Edit}
              className="!rounded-md !px-3 !py-1.5 !text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setModalData(row);
                setModalStatus(row.status || 'pending');
                setProofFile(null);
                setShowModal(true);
              }}
            >
              {row.status === 'pending' ? 'Thu tiền' : 'Sửa'}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
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
            onClick={() => {
              setModalData(null);
              setShowModal(true);
            }}
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
              <Button variant="outline" icon={Download} className="!rounded-md">
                Xuất Excel
              </Button>
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
                onAction={() => setShowModal(true)}
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

      {/* Revenue Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalData(null);
          setProofFile(null);
          setModalError('');
        }}
        title={modalData?.id ? `Cập nhật khoản thu #${modalData.id}` : 'Tạo khoản thu thủ công'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={modalLoading}
              form="revenue-form"
            >
              {modalLoading ? 'Đang lưu...' : (modalData?.id ? 'Cập nhật' : 'Ghi nhận')}
            </Button>
          </>
        }
      >
        {modalError && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {modalError}
          </div>
        )}
        <form id="revenue-form" onSubmit={handleModalSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chỉ cho nhập tay nếu tạo mới thủ công */}
            <Input
              label="Contract ID *"
              name="contractId"
              type="number"
              min="1"
              required
              defaultValue={modalData?.contract_id}
              disabled={!!modalData?.id}
            />
            <Input
              label="Customer ID *"
              name="customerId"
              type="number"
              min="1"
              required
              defaultValue={modalData?.customer_id}
              disabled={!!modalData?.id}
            />
            <Input
              label="Số tiền (VNĐ) *"
              name="amount"
              type="number"
              min="0.01"
              step="1000"
              required
              defaultValue={modalData?.amount}
            />
            <Input
              label="Trạng thái khoản thu *"
              as="select"
              name="status"
              required
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value)}
            >
              <option value="pending">🟠 Chờ khách thanh toán</option>
              <option value="paid">🟢 Đã thu tiền thành công</option>
              <option value="cancelled">⚫ Hủy bỏ khoản thu này</option>
            </Input>
            <Input
              label="Ngày thanh toán *"
              name="paymentDate"
              type="date"
              defaultValue={modalData?.payment_date?.slice(0, 10)}
              disabled={modalStatus !== 'paid'}
            />
          </div>
          <Input
            label="Phương thức *"
            as="select"
            name="paymentMethod"
            required
            defaultValue={modalData?.payment_method || 'bank_transfer'}
            disabled={modalStatus !== 'paid'}
          >
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="online">Online</option>
          </Input>

          {/* Yêu cầu đính kèm chứng từ nếu xác nhận Đã thu */}
          {modalStatus === 'paid' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <label className="block text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Đính kèm chứng từ (Bắt buộc)
              </label>
              {modalData?.proof_url && !proofFile && (
                <div className="mb-2 text-sm text-green-700 font-medium">✓ Đã có chứng từ hiện tại. Tải file mới nếu muốn ghi đè.</div>
              )}
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                required={!modalData?.proof_url} // Bắt buộc nếu chưa có ảnh
              />
              <p className="text-xs text-gray-500 mt-2">Hỗ trợ định dạng Ảnh (JPG, PNG) hoặc PDF.</p>
            </div>
          )}

          <Input
            label="Kỳ thanh toán (VD: 2025-01)"
            name="billingPeriod"
            defaultValue={modalData?.billing_period}
          />
          <Input
            label="Ghi chú"
            name="notes"
            as="textarea"
            rows={3}
            defaultValue={modalData?.notes}
          />
        </form>
      </Modal>
    </div>
  );
};

export default RevenuesPage;