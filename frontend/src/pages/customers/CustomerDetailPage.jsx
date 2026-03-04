import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  User,
  Calendar,
  FileText,
  Ticket,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCustomerById,
  deleteCustomer,
  clearCurrentCustomer,
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

    return () => {
      dispatch(clearCurrentCustomer());
    };
  }, [dispatch, id]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteCustomer(id)).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          title: 'Xóa thành công',
          message: `Khách hàng ${currentCustomer.company_name} đã được xóa`,
        })
      );
      navigate('/customers');
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Xóa thất bại',
          message: error.message || 'Có lỗi xảy ra khi xóa khách hàng',
        })
      );
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      lead: {
        variant: 'info',
        label: 'Lead',
        icon: AlertCircle,
        color: 'text-blue-600',
      },
      active: {
        variant: 'success',
        label: 'Đang hoạt động',
        icon: CheckCircle,
        color: 'text-green-600',
      },
      expired: {
        variant: 'danger',
        label: 'Hết hạn',
        icon: XCircle,
        color: 'text-red-600',
      },
      churned: {
        variant: 'gray',
        label: 'Rời bỏ',
        icon: XCircle,
        color: 'text-gray-600',
      },
    };
    return configs[status] || configs.lead;
  };

  if (loading) {
    return <Loading fullScreen text="Đang tải thông tin khách hàng..." />;
  }

  if (!currentCustomer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-dark-900 mb-2">
            Không tìm thấy khách hàng
          </h2>
          <Button onClick={() => navigate('/customers')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(currentCustomer.status);
  const StatusIcon = statusConfig.icon;

  // Mock data for contracts, tickets, activities
  const contracts = [
    {
      id: 1,
      solution: 'Bado Retail',
      package: 'Gói Chuyên nghiệp',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      value: 15000000,
      status: 'active',
    },
  ];

  const tickets = [
    {
      id: 1,
      title: 'Lỗi đồng bộ dữ liệu',
      priority: 'high',
      status: 'processing',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      title: 'Yêu cầu hướng dẫn sử dụng',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2024-01-10',
    },
  ];

  const activities = [
    {
      id: 1,
      type: 'status_change',
      description: 'Chuyển trạng thái từ Lead sang Active',
      user: 'Nguyễn Văn A',
      time: '2 ngày trước',
    },
    {
      id: 2,
      type: 'contract',
      description: 'Ký hợp đồng Gói Chuyên nghiệp',
      user: 'Nguyễn Văn A',
      time: '3 ngày trước',
    },
    {
      id: 3,
      type: 'contact',
      description: 'Gọi điện tư vấn sản phẩm',
      user: 'Nguyễn Văn A',
      time: '1 tuần trước',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách khách hàng</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-900 mb-2">
                {currentCustomer.company_name}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant={statusConfig.variant} dot>
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  MST: {currentCustomer.tax_code}
                </span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">
                  {currentCustomer.industry}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Edit}
              onClick={() => navigate(`/customers/${id}/edit`)}
            >
              Chỉnh sửa
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setShowDeleteModal(true)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { key: 'overview', label: 'Tổng quan', icon: Building2 },
            { key: 'contracts', label: 'Hợp đồng', icon: FileText },
            { key: 'tickets', label: 'Tickets', icon: Ticket },
            { key: 'activities', label: 'Hoạt động', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Company Info */}
              <Card title="Thông tin công ty">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Tên công ty
                    </label>
                    <p className="text-dark-900 mt-1">
                      {currentCustomer.company_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Mã số thuế
                    </label>
                    <p className="text-dark-900 mt-1">
                      {currentCustomer.tax_code}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ngành nghề
                    </label>
                    <p className="text-dark-900 mt-1">
                      {currentCustomer.industry}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Website
                    </label>
                    <a
                      href={currentCustomer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 mt-1 flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      {currentCustomer.website}
                    </a>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Địa chỉ
                    </label>
                    <p className="text-dark-900 mt-1 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      {currentCustomer.address}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Representative Info */}
              <Card title="Người đại diện">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Họ và tên
                    </label>
                    <p className="text-dark-900 mt-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {currentCustomer.representative_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Chức vụ
                    </label>
                    <p className="text-dark-900 mt-1">
                      {currentCustomer.representative_position}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <a
                      href={`mailto:${currentCustomer.email}`}
                      className="text-primary-600 hover:text-primary-700 mt-1 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {currentCustomer.email}
                    </a>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Số điện thoại
                    </label>
                    <a
                      href={`tel:${currentCustomer.phone}`}
                      className="text-primary-600 hover:text-primary-700 mt-1 flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      {currentCustomer.phone}
                    </a>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {currentCustomer.notes && (
                <Card title="Ghi chú">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {currentCustomer.notes}
                  </p>
                </Card>
              )}
            </>
          )}

          {activeTab === 'contracts' && (
            <Card title="Danh sách hợp đồng">
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-dark-900 mb-1">
                          {contract.solution}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {contract.package}
                        </p>
                      </div>
                      <Badge variant="success">Đang hoạt động</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Bắt đầu:</span>
                        <p className="font-medium text-dark-900 mt-1">
                          {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Kết thúc:</span>
                        <p className="font-medium text-dark-900 mt-1">
                          {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Giá trị:</span>
                        <p className="font-medium text-primary-600 mt-1">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(contract.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'tickets' && (
            <Card title="Danh sách tickets">
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-dark-900">
                        {ticket.title}
                      </h4>
                      <Badge
                        variant={
                          ticket.priority === 'high'
                            ? 'danger'
                            : ticket.priority === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {ticket.priority === 'high'
                          ? 'Cao'
                          : ticket.priority === 'medium'
                          ? 'Trung bình'
                          : 'Thấp'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Trạng thái:{' '}
                        <span className="font-medium text-dark-900">
                          {ticket.status === 'processing'
                            ? 'Đang xử lý'
                            : 'Đã giải quyết'}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'activities' && (
            <Card title="Lịch sử hoạt động">
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary-600" />
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-dark-900 font-medium mb-1">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card title="Thống kê nhanh">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Hợp đồng
                  </span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {contracts.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Tickets
                  </span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {tickets.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Doanh thu
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {new Intl.NumberFormat('vi-VN', {
                    notation: 'compact',
                  }).format(15000000)}
                </span>
              </div>
            </div>
          </Card>

          {/* Assigned Team */}
          <Card title="Nhân viên phụ trách">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">A</span>
                </div>
                <div>
                  <p className="font-medium text-dark-900">Nguyễn Văn A</p>
                  <p className="text-sm text-gray-600">Sales</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">C</span>
                </div>
                <div>
                  <p className="font-medium text-dark-900">Lê Văn C</p>
                  <p className="text-sm text-gray-600">CSKH</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card title="Thông tin khác">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Ngày tạo:</span>
                <p className="font-medium text-dark-900 mt-1">
                  {new Date(currentCustomer.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Cập nhật lần cuối:</span>
                <p className="font-medium text-dark-900 mt-1">
                  {new Date(currentCustomer.updated_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Người tạo:</span>
                <p className="font-medium text-dark-900 mt-1">
                  {currentCustomer.created_by?.full_name || 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
          <p className="text-gray-700">
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <span className="font-semibold">{currentCustomer.company_name}</span>?
          </p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Cảnh báo:</strong> Hành động này sẽ xóa tất cả dữ liệu liên
              quan bao gồm hợp đồng, tickets và không thể hoàn tác.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;