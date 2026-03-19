/**
 * @file     frontend/src/pages/users/UsersPage.jsx
 * @location frontend/src/pages/users/UsersPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/usersService
 * @requires ../../store/authContext
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang quản lý nhân viên (Admin + Manager).
 *   - Danh sách nhân viên với filter role/status/search
 *   - Tạo mới / chỉnh sửa (Admin only)
 *   - Khoá / mở khoá tài khoản (Admin only)
 *   - Reset mật khẩu (Admin only)
 *   - Xem login logs theo từng user
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@store/authContext';
import usersService from '@services/usersService';

// ── Constants ─────────────────────────────────────────────────────
const ROLES = ['admin','manager','sales','cskh','technical'];
const ROLE_LABELS = { admin:'Admin', manager:'Manager', sales:'Sales', cskh:'CSKH', technical:'Kỹ thuật' };
const ROLE_COLORS = {
  admin:     { bg:'rgba(239,68,68,0.15)',   text:'#FCA5A5',  border:'rgba(239,68,68,0.3)'   },
  manager:   { bg:'rgba(168,85,247,0.15)',  text:'#D8B4FE',  border:'rgba(168,85,247,0.3)'  },
  sales:     { bg:'rgba(37,99,235,0.15)',   text:'#93C5FD',  border:'rgba(37,99,235,0.3)'   },
  cskh:      { bg:'rgba(16,185,129,0.15)',  text:'#6EE7B7',  border:'rgba(16,185,129,0.3)'  },
  technical: { bg:'rgba(245,158,11,0.15)',  text:'#FCD34D',  border:'rgba(245,158,11,0.3)'  },
};
const STATUS_COLORS = {
  active:   { bg:'rgba(16,185,129,0.12)', text:'#6EE7B7', border:'rgba(16,185,129,0.3)' },
  inactive: { bg:'rgba(100,116,139,0.12)',text:'#94A3B8', border:'rgba(100,116,139,0.3)'},
  locked:   { bg:'rgba(239,68,68,0.12)',  text:'#FCA5A5', border:'rgba(239,68,68,0.3)'  },
};
const STATUS_LABELS = { active:'Hoạt động', inactive:'Tạm dừng', locked:'Bị khoá' };

// ── Reusable UI pieces ────────────────────────────────────────────
const Badge = ({ type, value, label }) => {
  const map = type === 'role' ? ROLE_COLORS : STATUS_COLORS;
  const c   = map[value] || { bg:'#1e293b', text:'#94A3B8', border:'#334155' };
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:20,
      fontSize:12, fontWeight:600, letterSpacing:'0.03em',
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
    }}>{label}</span>
  );
};

const Avatar = ({ name, size = 36 }) => {
  const initials = name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
  const colors   = ['#2563EB','#7C3AED','#0891B2','#059669','#D97706'];
  const color    = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg, ${color}, ${color}99)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0,
    }}>{initials}</div>
  );
};

// ── Modal: Tạo / Chỉnh sửa user ───────────────────────────────────
const UserModal = ({ user, onClose, onSaved }) => {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    fullName:      user?.full_name   || '',
    email:         user?.email       || '',
    role:          user?.role        || 'sales',
    password:      '',
    telegramChatId:user?.telegram_chat_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isEdit) {
        await usersService.update(user.id, {
          fullName: form.fullName,
          role:     form.role,
          telegramChatId: form.telegramChatId || null,
        });
      } else {
        await usersService.create({
          fullName:       form.fullName,
          email:          form.email,
          role:           form.role,
          password:       form.password || undefined,
          telegramChatId: form.telegramChatId || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { setLoading(false); }
  };

  const inp = {
    width:'100%', boxSizing:'border-box', padding:'10px 12px',
    background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)',
    borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none',
    fontFamily:'inherit', transition:'border 0.2s',
  };
  const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#94A3B8', marginBottom:6 };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:50,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width:'100%', maxWidth:440,
        background:'#0D1424', border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:16, padding:28,
        boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700, color:'#F1F5F9' }}>
          {isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        </h3>

        {error && (
          <div style={{ padding:'10px 12px', background:'rgba(239,68,68,0.1)',
            border:'1px solid rgba(239,68,68,0.25)', borderRadius:8,
            color:'#FCA5A5', fontSize:13, marginBottom:16 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Họ tên *</label>
            <input style={inp} value={form.fullName}
              onChange={e => set('fullName', e.target.value)} required placeholder="Nguyễn Văn A" />
          </div>

          {!isEdit && (
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Email *</label>
              <input style={inp} type="email" value={form.email}
                onChange={e => set('email', e.target.value)} required placeholder="nhanvien@bado.vn" />
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Vai trò *</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.role}
              onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>

          {!isEdit && (
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Mật khẩu (để trống → dùng Bado@123)</label>
              <input style={inp} type="password" value={form.password}
                onChange={e => set('password', e.target.value)} placeholder="Bado@123" />
            </div>
          )}

          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Telegram Chat ID</label>
            <input style={inp} value={form.telegramChatId}
              onChange={e => set('telegramChatId', e.target.value)} placeholder="Tuỳ chọn" />
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
              background:'rgba(255,255,255,0.06)', color:'#94A3B8',
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit',
            }}>Huỷ</button>
            <button type="submit" disabled={loading} style={{
              padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
              background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff',
              border:'none', cursor:loading?'not-allowed':'pointer', fontFamily:'inherit',
              opacity:loading?0.7:1,
            }}>{loading ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Tạo tài khoản')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Reset mật khẩu ─────────────────────────────────────────
const ResetPwModal = ({ user, onClose }) => {
  const [pw,      setPw]      = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await usersService.resetPassword(user.id, pw || undefined);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:50,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width:'100%', maxWidth:380,
        background:'#0D1424', border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:16, padding:28,
      }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#F1F5F9', marginBottom:8 }}>
              Reset thành công
            </div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>
              Mật khẩu của <strong style={{ color:'#94A3B8' }}>{user.full_name}</strong> đã được đặt lại.
            </div>
            <button onClick={onClose} style={{
              padding:'9px 20px', borderRadius:8, fontSize:14, fontWeight:600,
              background:'rgba(37,99,235,0.15)', color:'#60A5FA',
              border:'1px solid rgba(37,99,235,0.3)', cursor:'pointer', fontFamily:'inherit',
            }}>Đóng</button>
          </div>
        ) : (
          <>
            <h3 style={{ margin:'0 0 6px', fontSize:18, fontWeight:700, color:'#F1F5F9' }}>
              Reset mật khẩu
            </h3>
            <p style={{ margin:'0 0 20px', fontSize:13, color:'#64748B' }}>
              Đặt lại mật khẩu cho <strong style={{ color:'#94A3B8' }}>{user.full_name}</strong>.
              Để trống → dùng <code style={{ color:'#60A5FA' }}>Bado@123</code>.
            </p>
            {error && <div style={{ padding:'10px 12px', background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.25)', borderRadius:8,
              color:'#FCA5A5', fontSize:13, marginBottom:14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <input
                type="password" value={pw} onChange={e => setPw(e.target.value)}
                placeholder="Mật khẩu mới (tuỳ chọn)"
                style={{
                  width:'100%', boxSizing:'border-box', padding:'10px 12px',
                  background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)',
                  borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none',
                  fontFamily:'inherit', marginBottom:16,
                }}
              />
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={onClose} style={{
                  padding:'9px 16px', borderRadius:8, fontSize:14, fontWeight:600,
                  background:'rgba(255,255,255,0.06)', color:'#94A3B8',
                  border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit',
                }}>Huỷ</button>
                <button type="submit" disabled={loading} style={{
                  padding:'9px 16px', borderRadius:8, fontSize:14, fontWeight:600,
                  background:'rgba(239,68,68,0.15)', color:'#FCA5A5',
                  border:'1px solid rgba(239,68,68,0.3)', cursor:'pointer', fontFamily:'inherit',
                }}>{loading ? 'Đang xử lý…' : 'Reset mật khẩu'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const UsersPage = () => {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';

  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Filters
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const LIMIT = 15;

  // Modals
  const [editUser,  setEditUser]  = useState(null);   // null=closed, {}=create, {id}=edit
  const [resetUser, setResetUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await usersService.list({ page, limit: LIMIT, search, role, status });
      setUsers(res.data);
      setTotal(res.total);
    } catch { setError('Không thể tải danh sách nhân viên.'); }
    finally { setLoading(false); }
  }, [page, search, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusToggle = async (u) => {
    const next = u.status === 'active' ? 'locked' : 'active';
    if (!window.confirm(`${next === 'locked' ? 'Khoá' : 'Mở khoá'} tài khoản ${u.full_name}?`)) return;
    try {
      await usersService.setStatus(u.id, next);
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  // ── Styles ──────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight:'100vh', background:'#080E1A',
      fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'#F1F5F9',
    },
    inner: { maxWidth:1200, margin:'0 auto', padding:'32px 24px' },
    header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 },
    title:  { fontSize:26, fontWeight:800, letterSpacing:'-0.4px', margin:0 },
    sub:    { fontSize:14, color:'#64748B', marginTop:4 },
    addBtn: {
      display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
      background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none',
      borderRadius:10, color:'#fff', fontSize:14, fontWeight:700,
      cursor:'pointer', fontFamily:'inherit',
      boxShadow:'0 4px 16px rgba(37,99,235,0.3)',
    },
    filterBar: {
      display:'flex', gap:10, marginBottom:20, flexWrap:'wrap',
    },
    filterInput: {
      padding:'9px 14px', background:'rgba(255,255,255,0.05)',
      border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:9,
      color:'#F1F5F9', fontSize:14, outline:'none', fontFamily:'inherit',
    },
    table: {
      width:'100%', borderCollapse:'collapse',
      background:'rgba(13,20,36,0.7)',
      border:'1px solid rgba(255,255,255,0.06)', borderRadius:12,
      overflow:'hidden',
    },
    th: {
      padding:'12px 16px', textAlign:'left', fontSize:12,
      fontWeight:700, color:'#64748B', letterSpacing:'0.06em',
      textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.06)',
      background:'rgba(255,255,255,0.02)',
    },
    td: {
      padding:'13px 16px', fontSize:14, color:'#CBD5E1',
      borderBottom:'1px solid rgba(255,255,255,0.04)',
    },
    actionBtn: (color) => ({
      padding:'5px 12px', borderRadius:7, fontSize:12, fontWeight:600,
      background:`rgba(${color},0.12)`, color:`rgb(${color})`,
      border:`1px solid rgba(${color},0.25)`, cursor:'pointer',
      fontFamily:'inherit', transition:'all 0.15s',
    }),
    pagination: {
      display:'flex', alignItems:'center', justifyContent:'space-between',
      marginTop:16, fontSize:13, color:'#64748B',
    },
    pgBtn: (disabled) => ({
      padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600,
      background:'rgba(255,255,255,0.05)', color: disabled ? '#334155' : '#94A3B8',
      border:'1px solid rgba(255,255,255,0.08)', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:'inherit',
    }),
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>

      {editUser  !== null && <UserModal  user={editUser?.id ? editUser : null} onClose={() => setEditUser(null)}  onSaved={() => { setEditUser(null); fetchUsers(); }} />}
      {resetUser !== null && <ResetPwModal user={resetUser} onClose={() => { setResetUser(null); fetchUsers(); }} />}

      <div style={s.page}>
        <div style={s.inner}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Quản lý nhân viên</h1>
              <p style={s.sub}>{total} nhân viên trong hệ thống</p>
            </div>
            {isAdmin && (
              <button style={s.addBtn} onClick={() => setEditUser({})}>
                + Thêm nhân viên
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={s.filterBar}>
            <input
              style={{ ...s.filterInput, minWidth:220 }}
              placeholder="🔍  Tìm theo tên, email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select style={{ ...s.filterInput, cursor:'pointer' }}
              value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
              <option value="">Tất cả vai trò</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <select style={{ ...s.filterInput, cursor:'pointer' }}
              value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="locked">Bị khoá</option>
            </select>
          </div>

          {/* Error */}
          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.1)',
            border:'1px solid rgba(239,68,68,0.25)', borderRadius:10,
            color:'#FCA5A5', marginBottom:16 }}>{error}</div>}

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Nhân viên','Vai trò','Trạng thái','Đăng nhập cuối','Thao tác'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign:'center', color:'#475569', padding:40 }}>
                    Đang tải…
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign:'center', color:'#475569', padding:40 }}>
                    Không tìm thấy nhân viên nào
                  </td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.015)' }}>
                    {/* User info */}
                    <td style={s.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <Avatar name={u.full_name} />
                        <div>
                          <div style={{ fontWeight:600, color:'#F1F5F9', fontSize:14 }}>{u.full_name}</div>
                          <div style={{ fontSize:12, color:'#64748B' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td style={s.td}>
                      <Badge type="role" value={u.role} label={ROLE_LABELS[u.role]} />
                    </td>
                    {/* Status */}
                    <td style={s.td}>
                      <Badge type="status" value={u.status} label={STATUS_LABELS[u.status]} />
                    </td>
                    {/* Last login */}
                    <td style={{ ...s.td, color:'#64748B', fontSize:13 }}>
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                    {/* Actions */}
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {isAdmin && (
                          <>
                            <button style={s.actionBtn('99,179,237')}
                              onClick={() => setEditUser(u)}>Sửa</button>
                            <button style={s.actionBtn('250,204,21')}
                              onClick={() => setResetUser(u)}>Reset PW</button>
                            <button
                              style={s.actionBtn(u.status==='active' ? '239,68,68' : '16,185,129')}
                              onClick={() => handleStatusToggle(u)}>
                              {u.status === 'active' ? 'Khoá' : 'Mở khoá'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pagination}>
              <span>Trang {page} / {totalPages} &nbsp;·&nbsp; {total} nhân viên</span>
              <div style={{ display:'flex', gap:8 }}>
                <button style={s.pgBtn(page <= 1)} disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}>← Trước</button>
                <button style={s.pgBtn(page >= totalPages)} disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}>Sau →</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default UsersPage;