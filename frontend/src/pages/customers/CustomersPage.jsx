import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  Mail,
  Phone,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCustomers,
  deleteCustomer,
  setFilters,
  clearFilters,
  setPage,
} from '../../store/slices/customerSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const CustomersPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, pagination, filters, loading } = useAppSelector(
    (state) => state.customers
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomers({ ...filters, page: pagination.page }));
  }, [dispatch, filters, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(clearFilters());
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
    setActionMenuOpen(null);
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteCustomer(customerToDelete.id)).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          title: 'Xóa thành công',
          message: `Khách hàng ${customerToDelete.company_name} đã được xóa`,
        })
      );
      setShowDeleteModal(false);
      setCustomerToDelete(null);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      lead: { variant: 'info', label: 'Lead' },
      active: { variant: 'success', label: 'Đang hoạt động' },
      expired: { variant: 'danger', label: 'Hết hạn' },
      churned: { variant: 'gray', label: 'Rời bỏ' },
    };

    const config = statusConfig[status] || statusConfig.lead;
    return (
      <Badge variant={config.variant} dot>
        {config.label}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'company_name',
      label: 'Công ty',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-dark-900">{row.company_name}</p>
            <p className="text-sm text-gray-600">{row.tax_code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      label: 'Ngành nghề',
      render: (row) => (
        <span className="text-sm text-gray-700">{row.industry}</span>
      ),
    },
    {
      key: 'representative',
      label: 'Người đại diện',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-dark-900">
            {row.representative_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'assigned_sales',
      label: 'Sales phụ trách',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-gray-600" />
          </div>
          <span className="text-sm text-gray-700">
            {row.assigned_sales?.full_name || 'Chưa phân công'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="relative">
          <button
            onClick={() =>
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id)
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {actionMenuOpen === row.id && (
            <div className="dropdown-menu right-0">
              <button
                onClick={() => {
                  navigate(`/customers/${row.id}`);
                  setActionMenuOpen(null);
                }}
                className="dropdown-item"
              >
                <Eye className="w-4 h-4" />
                <span>Xem chi tiết</span>
              </button>
              <button
                onClick={() => {
                  navigate(`/customers/${row.id}/edit`);
                  setActionMenuOpen(null);
                }}
                className="dropdown-item"
              >
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
              <div className="dropdown-divider" />
              <button
                onClick={() => handleDeleteClick(row)}
                className="dropdown-item text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 mb-2">
            Quản lý khách hàng
          </h1>
          <p className="text-gray-600">
            Tổng cộng {pagination.total} khách hàng
          </p>
        </div>

        <Button
          variant="primary-gradient"
          icon={Plus}
          onClick={() => navigate('/customers/new')}
        >
          Thêm khách hàng
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="card mb-6">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên công ty, mã số thuế, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <Button type="submit" variant="primary">
              <Search className="w-4 h-4" />
              Tìm kiếm
            </Button>

            <Button
              type="button"
              variant="secondary"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Bộ lọc
            </Button>

            <Button type="button" variant="outline" icon={Download}>
              Xuất Excel
            </Button>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Trạng thái</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="select"
                  >
                    <option value="">Tất cả</option>
                    <option value="lead">Lead</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="expired">Hết hạn</option>
                    <option value="churned">Rời bỏ</option>
                  </select>
                </div>

                <div>
                  <label className="label">Ngành nghề</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                    className="select"
                  >
                    <option value="">Tất cả</option>
                    <option value="retail">Bán lẻ</option>
                    <option value="hospitality">Lưu trú</option>
                    <option value="beauty">Làm đẹp</option>
                    <option value="fnb">F&B</option>
                  </select>
                </div>

                <div>
                  <label className="label">Sales phụ trách</label>
                  <select
                    value={filters.assignedTo}
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    className="select"
                  >
                    <option value="">Tất cả</option>
                    <option value="1">Nguyễn Văn A</option>
                    <option value="2">Trần Thị B</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={handleClearFilters}>
                  Xóa bộ lọc
                </Button>
                <Button variant="primary">Áp dụng</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Chưa có khách hàng"
              description="Bắt đầu bằng cách thêm khách hàng đầu tiên của bạn"
              action
              actionLabel="Thêm khách hàng"
              onAction={() => navigate('/customers/new')}
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={items}
                onRowClick={(row) => navigate(`/customers/${row.id}`)}
              />

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            </>
          )}
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
            <Button variant="danger" onClick={handleConfirmDelete}>
              Xóa khách hàng
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Bạn có chắc chắn muốn xóa khách hàng{' '}
          <span className="font-semibold">{customerToDelete?.company_name}</span>?
          Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
};

export default CustomersPage;