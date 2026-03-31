import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Globe, 
  Building2, User, Calendar, FileText, Ticket, DollarSign, 
  Clock, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCustomerById, deleteCustomer, clearCurrentCustomer,
} from '../../store/slices/customerSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCustomer, loading } = useAppSelector((state) => state.customers);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchCustomerById(id));
    return () => dispatch(clearCurrentCustomer());
  }, [dispatch, id]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteCustomer(id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Xóa thành công',
        message: `Khách hàng ${currentCustomer.company_name} đã được xóa`,
      }));
      navigate('/customers');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Xóa thất bại',
        message: error.message || 'Có lỗi xảy ra khi xóa khách hàng',
      }));
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      lead: { variant: 'info', label: 'Lead', icon: AlertCircle, color: 'text-blue-700' },
      active: { variant: 'success', label: 'Đang hoạt động', icon: CheckCircle, color: 'text-green-700' },
      expired: { variant: 'warning', label: 'Hết hạn', icon: XCircle, color: 'text-yellow-700' },
      churned: { variant: 'gray', label: 'Rời bỏ', icon: XCircle, color: 'text-gray-700' },
    };
    return configs[status] || configs.lead;
  };

  if (loading) {
    return <Loading fullScreen text="Đang tải thông tin khách hàng..." />;
  }

  if (!currentCustomer) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-dark-900 mb-4">
            Không tìm thấy khách hàng
          </h2>
          <Button onClick={() => navigate('/customers')} className="shadow-sm">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(currentCustomer.status);
  const StatusIcon = statusConfig.icon;

  // Mock data (giữ nguyên)
  const contracts = [{ id: 1, solution: 'Bado Retail', package: 'Gói Chuyên nghiệp', startDate: '2024-01-01', endDate: '2024-12-31', value: 15000000, status: 'active' }];
  const tickets = [
    { id: 1, title: 'Lỗi đồng bộ dữ liệu', priority: 'high', status: 'processing', createdAt: '2024-01-15' },
    { id: 2, title: 'Yêu cầu hướng dẫn sử dụng', priority: 'medium', status: 'resolved', createdAt: '2024-01-10' },
  ];
  const activities = [
    { id: 1, type: 'status_change', description: 'Chuyển trạng thái từ Lead sang Active', user: 'Nguyễn Văn A', time: '2 ngày trước' },
    { id: 2, type: 'contract', description: 'Ký hợp đồng Gói Chuyên nghiệp', user: 'Nguyễn Văn A', time: '3 ngày trước' },
    { id: 3, type: 'contact', description: 'Gọi điện tư vấn sản phẩm', user: 'Nguyễn Văn A', time: '1 tuần trước' },
  ];

  return (
    <div className="bg-white min-h-full space-y-8 p-1">  
      
      {/* Header */}
      <div className="bg-white">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-gray-700 hover:text-dark-900 font-medium mb-6 py-2 px-3 -ml-1 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách khách hàng
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 
                           rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            
            {/* Company Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-black text-dark-900 mb-2 leading-tight">
                {currentCustomer.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusConfig.variant} size="lg">
                  <StatusIcon className="w-4 h-4 -ml-1" />
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-gray-600 font-medium">
                  MST: {currentCustomer.tax_code}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600 font-medium">
                  {currentCustomer.industry}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              icon={Edit}
              className="border-gray-300 hover:bg-gray-50 shadow-sm"
              onClick={() => navigate(`/customers/${id}/edit`)}
            >
              Chỉnh sửa
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              className="!bg-red-50 !text-red-700 !border-red-200 hover:!bg-red-100 shadow-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px bg-white">
          {[
            { key: 'overview', label: 'Tổng quan', icon: Building2, count: null },
            { key: 'contracts', label: 'Hợp đồng', icon: FileText, count: contracts.length },
            { key: 'tickets', label: 'Tickets', icon: Ticket, count: tickets.length },
            { key: 'activities', label: 'Hoạt động', icon: Clock, count: activities.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`group flex items-center gap-2.5 py-4 px-6 rounded-t-lg -m-0.5 transition-all duration-200 font-medium ${
                  active
                    ? 'bg-white border-b-2 border-primary-500 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-dark-900 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${
                    active 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              <Card title="Thông tin công ty" className="shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Tên công ty
                    </label>
                    <p className="text-xl font-black text-dark-900">
                      {currentCustomer.company_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Mã số thuế
                    </label>
                    <p className="text-lg font-semibold text-dark-900">
                      {currentCustomer.tax_code}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Ngành nghề
                    </label>
                    <p className="text-lg font-semibold text-dark-900">
                      {currentCustomer.industry}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Website
                    </label>
                    <a
                      href={currentCustomer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 group"
                    >
                      <Globe className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      {currentCustomer.website}
                    </a>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Địa chỉ
                    </label>
                    <p className="text-lg text-dark-900 flex items-start gap-2 bg-gray-50 p-4 rounded-xl">
                      <MapPin className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>{currentCustomer.address}</span>
                    </p>
                  </div>
                </div>
              </Card>

              <Card title="Người đại diện" className="shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Họ và tên
                    </label>
                    <p className="text-lg font-semibold text-dark-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      {currentCustomer.representative_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Chức vụ
                    </label>
                    <p className="text-lg font-semibold text-dark-900">
                      {currentCustomer.representative_position}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Email
                    </label>
                    <a
                      href={`mailto:${currentCustomer.email}`}
                      className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 group"
                    >
                      <Mail className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      {currentCustomer.email}
                    </a>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Số điện thoại
                    </label>
                    <a
                      href={`tel:${currentCustomer.phone}`}
                      className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 group"
                    >
                      <Phone className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                      {currentCustomer.phone}
                    </a>
                  </div>
                </div>
              </Card>

              {currentCustomer.notes && (
                <Card title="Ghi chú" className="shadow-sm">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {currentCustomer.notes}
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <Card title="Danh sách hợp đồng" className="shadow-sm">
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="group p-6 border border-gray-200 hover:border-primary-300 hover:shadow-md rounded-xl transition-all duration-200 cursor-pointer bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-black text-dark-900 mb-1">
                          {contract.solution}
                        </h4>
                        <p className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full inline-block">
                          {contract.package}
                        </p>
                      </div>
                      <Badge variant="success" size="lg">Đang hoạt động</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm divide-y md:divide-y-0 divide-gray-200">
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">Bắt đầu</span>
                        <p className="font-black text-dark-900 mt-1">
                          {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">Kết thúc</span>
                        <p className="font-black text-dark-900 mt-1">
                          {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">Giá trị</span>
                        <p className="text-2xl font-black text-primary-600 mt-1">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
          <Card title="Thống kê nhanh" className="shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Hợp đồng</span>
                </div>
                <span className="text-2xl font-black text-green-700">{contracts.length}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Tickets</span>
                </div>
                <span className="text-2xl font-black text-orange-700">{tickets.length}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Doanh thu</span>
                </div>
                <span className="text-2xl font-black text-blue-700">
                  15T
                </span>
              </div>
            </div>
          </Card>

          <Card title="Nhân viên phụ trách" className="shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors -m-1.5">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark-900 text-sm">Nguyễn Văn A</p>
                  <p className="text-xs text-gray-600 font-medium">Sales</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors -m-1.5">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark-900 text-sm">Lê Văn C</p>
                  <p className="text-xs text-gray-600 font-medium">CSKH</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Modal - đã white từ common/Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa khách hàng"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Xóa khách hàng
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-800 text-lg">
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <span className="font-black text-dark-900">{currentCustomer.company_name}</span>?
          </p>
          <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ <strong>Cảnh báo:</strong> Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu liên quan 
              (hợp đồng, tickets) và không thể hoàn tác.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;