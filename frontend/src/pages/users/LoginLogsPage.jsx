/**
 * @file     frontend/src/pages/users/LoginLogsPage.jsx
 * @location frontend/src/pages/users/LoginLogsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/usersService → getLoginLogs, getUserLoginLogs
 * @requires ../../store/authContext     → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang xem lịch sử đăng nhập hệ thống (Admin only).
 *  - Bảng log toàn bộ hệ thống: user, email, role, status, IP, thời gian
 *  - Filter: success/failed, search theo email
 *  - Phân trang
 *  - Nếu truyền prop userId → chỉ hiện log của user đó
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft, ShieldCheck, ShieldAlert, UserRound } from 'lucide-react';
import { useAuth } from '../../store/authContext';
import usersService from '../../services/usersService';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const LIMIT = 30;

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  cskh: 'CSKH',
  technical: 'Kỹ thuật',
};

const ROLE_VARIANTS = {
  admin: 'danger',
  manager: 'purple',
  sales: 'info',
  cskh: 'success',
  technical: 'warning',
};

const LoginLogsPage = ({ userId = null }) => {
  const { user: me } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = userId || searchParams.get('userId') || null;

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(''); // '' | 'success' | 'failed'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: LIMIT,
        ...(targetUserId ? { userId: targetUserId } : {}),
        ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
        ...(filter ? { status: filter } : {}),
      };

      const res = targetUserId
        ? await usersService.getUserLoginLogs(targetUserId, params)
        : await usersService.getLoginLogs(params);

      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setError('Không thể tải lịch sử đăng nhập.');
    } finally {
      setLoading(false);
    }
  }, [page, targetUserId, searchTerm, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const getStatusBadge = (status) => {
    const success = status === 'success';
    return (
      <Badge variant={success ? 'success' : 'danger'} className="!rounded-none !shadow-none font-bold">
        <span className="inline-flex items-center gap-2">
          {success ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          {success ? 'Thành công' : 'Thất bại'}
        </span>
      </Badge>
    );
  };

  return (
    <div className="bg-white min-h-screen p-1">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Back */}
        <Link
          to={targetUserId ? `/users/${targetUserId}` : '/users'}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {targetUserId ? 'Quay lại chi tiết nhân viên' : 'Quay lại danh sách nhân viên'}
        </Link>

        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            {targetUserId ? 'Lịch sử đăng nhập' : 'Lịch sử đăng nhập hệ thống'}
          </h1>
          <p className="text-lg text-gray-600">
            {total} bản ghi đăng nhập
          </p>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6 space-y-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
              <form onSubmit={handleSearch} className="flex-1 flex gap-3">
                <div className="flex-1">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo email..."
                    icon={Search}
                    className="!rounded-none"
                  />
                </div>
                <Button type="submit" variant="primary" className="!rounded-none px-6">
                  Tìm kiếm
                </Button>
              </form>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={filter === '' ? 'primary' : 'secondary'}
                className="!rounded-none px-5"
                onClick={() => handleFilter('')}
              >
                Tất cả
              </Button>
              <Button
                type="button"
                variant={filter === 'success' ? 'primary' : 'secondary'}
                className="!rounded-none px-5"
                onClick={() => handleFilter('success')}
              >
                Thành công
              </Button>
              <Button
                type="button"
                variant={filter === 'failed' ? 'primary' : 'secondary'}
                className="!rounded-none px-5"
                onClick={() => handleFilter('failed')}
              >
                Thất bại
              </Button>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <Card className="border border-gray-200 !rounded-none !shadow-none overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center">
              <Loading />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="Không có dữ liệu"
              description="Chưa có bản ghi đăng nhập nào phù hợp với bộ lọc hiện tại."
              className="py-20"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Nhân viên', 'Vai trò', 'Kết quả', 'IP Address', 'Thời gian'].map((h) => (
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
                  {logs.map((log, i) => (
                    <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900 text-sm">
                            {log.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.email}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={ROLE_VARIANTS[log.role] || 'gray'}
                          className="!rounded-none !shadow-none font-bold"
                        >
                          {ROLE_LABELS[log.role] || log.role}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(log.status)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                        {log.ip_address || '—'}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && logs.length > 0 && totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LoginLogsPage;