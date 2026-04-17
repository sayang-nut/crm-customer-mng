/**
 * @file     frontend/src/pages/users/UsersPage.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import usersService from '../../services/usersService';
import UserAddForm from './UserAddForm';
import UserEditForm from './UserEditForm';
import { Link } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────
const ROLES = ['admin', 'manager', 'sales', 'cskh', 'technical'];
const ROLE_LABELS = { 
  admin: 'Admin', 
  manager: 'Manager', 
  sales: 'Sales', 
  cskh: 'CSKH', 
  technical: 'Kỹ thuật' 
};
const ROLE_COLORS = {
  admin: 'bg-red-500 text-white',
  manager: 'bg-purple-500 text-white',
  sales: 'bg-blue-500 text-white',
  cskh: 'bg-green-500 text-white',
  technical: 'bg-orange-500 text-white',
};
const STATUS_COLORS = {
  active: 'bg-green-500 text-white',
  inactive: 'bg-gray-400 text-white',
  locked: 'bg-red-500 text-white',
};
const STATUS_LABELS = { 
  active: 'Hoạt động', 
  locked: 'Bị khoá' 
};

// Reusable UI pieces
const Badge = ({ type, value, label }) => {
  const map = type === 'role' ? ROLE_COLORS : STATUS_COLORS;
  const colorClass = map[value] || 'bg-gray-400 text-white';
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
      {label}
    </span>
  );
};

const Avatar = ({ name, size = 40 }) => {
  const initials = name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
  const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  
  return (
    <div 
      className="flex items-center justify-center font-bold rounded-full flex-shrink-0"
      style={{ 
        width: size, 
        height: size, 
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        fontSize: size * 0.4,
        color: '#fff' 
      }}
    >
      {initials}
    </div>
  );
};

// ── Modal: Reset mật khẩu ─────────────────────────────────────────
const ResetPwModal = ({ user, onClose }) => {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    try {
      await usersService.resetPassword(user.id, pw || undefined);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { 
      setLoading(false); 
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50" 
           onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reset thành công</h3>
          <p className="text-gray-600 mb-8">
            Mật khẩu của <strong className="text-gray-900">{user.full_name}</strong> đã được đặt lại.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50" 
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Reset mật khẩu</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Đặt lại mật khẩu cho <strong className="font-semibold">{user.full_name}</strong>.
          Để trống → dùng <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600">Bado@123</code>.
        </p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password" 
              value={pw} 
              onChange={e => setPw(e.target.value)}
              placeholder="Mật khẩu mới (tuỳ chọn)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" 
            />
          </div>
          
          <div className="flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              Huỷ
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Đang xử lý…' : 'Reset mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const UsersPage = () => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // Modals
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); 
    setError('');
    try {
      // Bỏ các params rỗng để tránh backend query sai
      const params = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const fetchFn = usersService.list || usersService.getUsers || usersService.getAll;
      const res = await fetchFn(params);
      
      // Xử lý an toàn cấu trúc trả về từ backend (tránh lỗi bọc payload của Axios)
      const items = res?.data?.data || res?.data || [];
      const totalItems = res?.data?.total || res?.total || res?.pagination?.total || items.length || 0;
      
      setUsers(items);
      setTotal(totalItems);
    } catch (err) { 
      console.error('[UsersPage] API Error:', err);
      const msg = err?.response?.data?.message || 'Không thể tải danh sách nhân viên. Vui lòng kiểm tra API hoặc kết nối.';
      setError(msg); 
    } finally { 
      setLoading(false); 
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusToggle = async (u) => {
    const next = u.status === 'active' ? 'locked' : 'active';
    if (!window.confirm(`${next === 'locked' ? 'Khoá' : 'Mở khoá'} tài khoản ${u.full_name}?`)) return;
    try {
      await usersService.setStatus(u.id, next);
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.message || 'Lỗi.'); 
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Quản lý nhân viên</h1>
            <p className="text-xl text-gray-600">{total} nhân viên trong hệ thống</p>
          </div>
          {isAdmin && (
            <button 
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:bg-gray-400 disabled:shadow-none"
              onClick={() => setIsAdding(true)}
              disabled={isAdding || !!editUser}
            >
              <span>+</span> Thêm nhân viên
            </button>
          )}
        </div>

        {isAdmin && isAdding && (
          <UserAddForm 
            onCancel={() => setIsAdding(false)}
            onSaved={() => {
              setIsAdding(false);
              fetchUsers();
            }}
          />
        )}

        {editUser && (
          <UserEditForm 
            user={editUser}
            onCancel={() => setEditUser(null)}
            onSaved={() => {
              setEditUser(null);
              fetchUsers();
            }}
          />
        )}

        {!isAdding && !editUser && (
          <>
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <input
            className="flex-1 lg:w-96 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-lg placeholder-gray-500"
            placeholder="🔍 Tìm theo tên, email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            className="w-full lg:w-56 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={roleFilter} 
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả vai trò</option>
            {ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <select 
            className="w-full lg:w-56 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khoá</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  {['Nhân viên', 'Vai trò', 'Trạng thái', 'Đăng nhập cuối', 'Thao tác'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                        Đang tải…
                      </div>
                    </td>
                  </tr>
        ) : error ? (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-red-500 font-medium">
              Đã xảy ra lỗi khi tải dữ liệu. Vui lòng làm mới trang.
            </td>
          </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar name={u.full_name} />
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{u.full_name}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge type="role" value={u.role} label={ROLE_LABELS[u.role]} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge type="status" value={u.status} label={STATUS_LABELS[u.status]} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {u.last_login_at
                            ? new Date(u.last_login_at).toLocaleString('vi-VN')
                            : '—'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin && (
                  <div className="flex flex-wrap gap-2">
                            <button 
                              className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-all text-sm"
                              onClick={() => setEditUser(u)}
                            >
                              Sửa
                            </button>
                    <Link 
                      to={`/users/login-logs?userId=${u.id}`}
                      className="px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-lg hover:bg-purple-200 transition-all text-sm flex items-center"
                    >
                      Lịch sử ĐN
                    </Link>
                            <button 
                              className="px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-lg hover:bg-yellow-200 transition-all text-sm"
                              onClick={() => setResetUser(u)}
                            >
                              Reset PW
                            </button>
                            <button
                              className={`px-4 py-2 font-semibold rounded-lg text-sm transition-all ${
                                u.status === 'active' 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              onClick={() => handleStatusToggle(u)}
                            >
                              {u.status === 'active' ? 'Khoá' : 'Mở khoá'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Trang {page} / {totalPages} · {total} nhân viên</span>
                <div className="flex gap-2">
                  <button 
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  <button 
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Modals */}
        {resetUser !== null && (
          <ResetPwModal 
            user={resetUser} 
            onClose={() => { setResetUser(null); fetchUsers(); }} 
          />
        )}
      </div>
    </div>
  );
};

export default UsersPage;