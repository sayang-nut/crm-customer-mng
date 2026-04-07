import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, FileText,
  Building2, Package, Calendar, DollarSign, User
} from 'lucide-react';
import { useAuth } from '../../store/authContext';
import contractsService from '../../services/contractsService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';

const fmtVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

// Helper xử lý link file đính kèm
const getFileLink = (url) => {
  if (!url) return '#';
  let finalUrl = url;
  if (!url.startsWith('http')) {
    finalUrl = `http://localhost:5000/${url.replace(/\\/g, '/')}`; // Xử lý file local cũ
  }
  // Dùng Google Docs Viewer cho file Word (nếu là link Cloudinary public)
  if (finalUrl.match(/\.(doc|docx)$/i) && finalUrl.includes('cloudinary.com')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(finalUrl)}`;
  }
  return finalUrl;
};

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

const ContractDetailPage = ({ id, onBack, onUpdated }) => {
  const { user } = useAuth();
  const isManager = ['admin', 'manager'].includes(user?.role);

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await contractsService.getById(id);
        setContract(data);
      } catch (err) {
        setError('Không thể tải chi tiết hợp đồng.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Xác nhận duyệt hợp đồng này?')) return;
    try {
      await contractsService.approve(id);
      onUpdated();
      onBack();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối');
    try {
      await contractsService.reject(id, rejectReason);
      setRejectModal(false);
      onUpdated();
      onBack();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 font-medium">{error || 'Không tìm thấy dữ liệu'}</div>
        <Button variant="secondary" onClick={onBack}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full">
      <div className="mb-8 pb-6 border-b border-gray-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại danh sách hợp đồng</span>
          </button>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {contract.contract_number}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
        </div>

        {isManager && contract.status === 'pending' && (
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="!rounded-none shadow-sm"
              onClick={() => setRejectModal(true)}
            >
              <XCircle className="w-4 h-4 mr-2 inline" /> Từ chối
            </Button>
            <Button
              variant="primary"
              className="!rounded-none bg-green-600 hover:bg-green-700 shadow-sm"
              onClick={handleApprove}
            >
              <CheckCircle className="w-4 h-4 mr-2 inline" /> Duyệt hợp đồng
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {contract.status === 'rejected' && contract.reject_reason && (
            <div className="bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
              <span className="font-bold">Lý do từ chối: </span>
              {contract.reject_reason}
            </div>
          )}

          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Thông tin Khách hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500 mb-1">Tên doanh nghiệp</span>
                  <strong className="text-gray-900 text-base">{contract.company_name}</strong>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Mã số thuế</span>
                  <span className="text-gray-900 font-mono">{contract.tax_code || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Sản phẩm & Giải pháp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="block text-gray-500 mb-1">Giải pháp phần mềm</span>
                  <strong className="text-gray-900 text-base">{contract.solution_name}</strong>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Gói dịch vụ</span>
                  <span className="text-gray-900 font-medium">{contract.package_name} ({String(contract.package_level).toUpperCase()})</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Tài chính & Thời hạn
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-6 pb-6 border-b border-gray-100">
                <div>
                  <span className="block text-gray-500 mb-1">Chu kỳ thanh toán</span>
                  <span className="text-gray-900 capitalize">{contract.billing_cycle === 'yearly' ? 'Theo Năm' : 'Theo Tháng'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Ngày bắt đầu</span>
                  <span className="text-gray-900">{fmtDate(contract.start_date)}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Ngày kết thúc</span>
                  <span className="text-gray-900 font-medium">{fmtDate(contract.end_date)}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Thời gian còn lại</span>
                  <span className="text-gray-900">{contract.days_until_expiry} ngày</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4">
                <div>
                  <span className="block text-gray-500 mb-1">Giá trị gốc</span>
                  <span className="text-xl font-bold text-gray-700">{fmtVND(contract.value)}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Chiết khấu</span>
                  <span className="text-xl font-bold text-gray-700">{contract.discount}%</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Giá trị thu thực</span>
                  <span className="text-2xl font-black text-green-600">{fmtVND(contract.final_value)}</span>
                </div>
              </div>
            </div>
          </Card>

          {contract.renewalHistory && contract.renewalHistory.length > 0 && (
            <Card className="border border-gray-200 !rounded-none !shadow-none">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Lịch sử gia hạn
                </h3>
                <div className="space-y-4">
                  {contract.renewalHistory.map((h, i) => (
                    <div key={h.id} className="text-sm border-l-2 border-blue-500 pl-4 py-1">
                      <div className="text-gray-500 text-xs mb-1">{fmtDate(h.created_at)} bởi {h.renewed_by_name}</div>
                      <div className="text-gray-900">
                        Gia hạn đến <strong className="text-blue-600">{fmtDate(h.new_end_date)}</strong>
                        {h.new_package_name && h.new_package_name !== h.old_package_name && ` - Đổi gói: ${h.new_package_name}`}
                      </div>
                      {h.notes && <div className="text-gray-500 italic mt-1 text-xs">Ghi chú: {h.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Chứng từ đính kèm
              </h3>
              {contract.attachment_url ? (
                <a
                  href={getFileLink(contract.attachment_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700">Xem bản cứng</div>
                    <div className="text-xs text-gray-500">Mở trong tab mới</div>
                  </div>
                </a>
              ) : (
                <div className="text-sm text-gray-500 italic">Không có file đính kèm</div>
              )}
            </div>
          </Card>

          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Sales phụ trách
                </h3>
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <User className="w-4 h-4 text-gray-400" />
                  {contract.assigned_to_name || 'Chưa phân công'}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Người tạo
                </h3>
                <div className="text-sm text-gray-700">
                  {contract.created_by_name} <br/>
                  <span className="text-gray-400 text-xs">{fmtDate(contract.created_at)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Ghi chú
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3">
                  {contract.notes || 'Không có ghi chú'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Từ chối hợp đồng</h2>
              <button onClick={() => setRejectModal(false)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleReject} className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do từ chối *</label>
              <textarea
                required
                rows={4}
                className="w-full border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-red-500"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Nhập lý do để Sales biết cách sửa..."
              ></textarea>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="secondary" className="!rounded-none" onClick={() => setRejectModal(false)}>Hủy</Button>
                <Button type="submit" variant="danger" className="!rounded-none">Xác nhận Từ Chối</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetailPage;