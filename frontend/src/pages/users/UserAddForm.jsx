import { useState } from 'react';
import usersService from '../../services/usersService';

// Constants needed for the form
const ROLES = ['admin', 'manager', 'sales', 'cskh', 'technical'];
const ROLE_LABELS = { 
  admin: 'Admin', 
  manager: 'Manager', 
  sales: 'Sales', 
  cskh: 'CSKH', 
  technical: 'Kỹ thuật' 
};

const UserAddForm = ({ onSaved, onCancel }) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'sales',
    password: '',
    telegramChatId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
        setError('Họ tên và Email là bắt buộc.');
        return;
    }
    setLoading(true);
    setError('');
    try {
      await usersService.create({
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        password: form.password || undefined,
        telegramChatId: form.telegramChatId || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-blue-200 animate-in fade-in slide-in-from-top-4 duration-300">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Thêm nhân viên mới</h3>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên *</label>
            <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" value={form.fullName} onChange={e => setField('fullName', e.target.value)} required placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
            <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" type="email" value={form.email} onChange={e => setField('email', e.target.value)} required placeholder="nhanvien@bado.vn" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò *</label>
            <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer" value={form.role} onChange={e => setField('role', e.target.value)}>
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu (mặc định: Bado@123)</label>
            <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Để trống để dùng mật khẩu mặc định" />
          </div>
        
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 mt-6 border-t border-gray-200">
          <button type="button" className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all" onClick={onCancel} disabled={loading}>
            Huỷ
          </button>
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50" disabled={loading}>
            {loading ? 'Đang lưu…' : 'Lưu nhân viên'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserAddForm;