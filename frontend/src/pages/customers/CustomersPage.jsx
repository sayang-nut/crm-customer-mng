/**
 * @file     frontend/src/pages/customers/CustomersPage.jsx
 * @theme    WHITE PLAIN - No gradient, no rounded, no effects
 */
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
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

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
      toast.success(`Khách hàng ${customerToDelete.company_name} đã được xóa`);
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi xóa khách hàng');
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
      <Badge variant={config.variant} className="!rounded-none !shadow-none font-bold">
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
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-dark-900 text-sm">{row.company_name}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{row.tax_code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      label: 'Ngành nghề',
      render: (row) => (
        <span className="text-sm text-gray-800 font-medium">{row.industry}</span>
      ),
    },
    {
      key: 'representative',
      label: 'Người đại diện',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-dark-900">
            {row.representative_name}
          </p>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 truncate max-w-[150px]">{row.email}</span>
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
          <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
          <span className="text-sm text-gray-700 font-medium">
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
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen(actionMenuOpen === row.id ? null : row.id);
            }}
            className="p-2 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {actionMenuOpen === row.id && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl z-50 py-1">
              <button
                onClick={() => {
                  navigate(`/customers/${row.id}`);
                  setActionMenuOpen(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Xem chi tiết</span>
              </button>
              <button
                onClick={() => {
                  navigate(`/customers/${row.id}/edit`);
                  setActionMenuOpen(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleDeleteClick(row)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
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
    <div className="bg-white min-h-full p-1 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-black text-dark-900 tracking-tight mb-2">
            Quản lý khách hàng
          </h1>
          <p className="text-gray-700 text-lg font-medium">
            Tổng cộng <span className="font-black text-primary-600">{pagination.total}</span> khách hàng
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          className="!rounded-none !shadow-none !bg-primary-600 hover:!bg-primary-700 h-12 px-6 text-lg font-bold"
          onClick={() => navigate('/customers/new')}
        >
          Thêm khách hàng
        </Button>
      </div>

      {/* Filters & Search - PLAIN STYLE */}
      <div className="border border-gray-200 bg-white">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên công ty, mã số thuế, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none text-dark-900 bg-white"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button type="submit" variant="primary" className="!rounded-none h-12 px-6">
                Tìm kiếm
              </Button>
              <Button
                type="button"
                variant="outline"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                className="!rounded-none h-12 px-6"
              >
                Bộ lọc
              </Button>
                         </div>
          </form>
        </div>

        {/* Advanced Filters Area */}
        {showFilters && (
          <div className="p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-bold text-dark-900 mb-2 block">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-11 border border-gray-300 px-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="lead">Lead</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="expired">Hết hạn</option>
                  <option value="churned">Rời bỏ</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-dark-900 mb-2 block">Ngành nghề</label>
                <select
                  value={filters.industry}
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                  className="w-full h-11 border border-gray-300 px-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="retail">Bán lẻ</option>
                  <option value="hospitality">Lưu trú</option>
                  <option value="beauty">Làm đẹp</option>
                  <option value="fnb">F&B</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-dark-900 mb-2 block">Sales phụ trách</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  className="w-full h-11 border border-gray-300 px-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="1">Nguyễn Văn A</option>
                  <option value="2">Trần Thị B</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              <Button variant="secondary" onClick={handleClearFilters} className="!rounded-none">
                Xóa bộ lọc
              </Button>
              <Button variant="primary" className="!rounded-none px-8">
                Áp dụng
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
             <Loading />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Chưa có khách hàng"
            action
            actionLabel="Thêm khách hàng"
            onAction={() => navigate('/customers/new')}
            className="py-20"
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              onRowClick={(row) => navigate(`/customers/${row.id}`)}
              className="!border-none !shadow-none"
            />

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={customerToDelete?.company_name}
        title="Xác nhận xóa khách hàng"
        warningMessage="Hành động này sẽ xóa toàn bộ dữ liệu liên quan và không thể khôi phục lại."
      />
    </div>
  );
};

export default CustomersPage;