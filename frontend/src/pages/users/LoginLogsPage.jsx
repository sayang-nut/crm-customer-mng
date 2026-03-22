/**
 * @file     frontend/src/pages/users/LoginLogsPage.jsx
 * @location frontend/src/pages/users/LoginLogsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/usersService → getLoginLogs, getUserLoginLogs
 * @requires ../../store/authContext     → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang xem lịch sử đăng nhập hệ thống (Admin only).
 *   - Bảng log toàn bộ hệ thống: user, email, role, status, IP, thời gian
 *   - Filter: success/failed, search theo email
 *   - Phân trang
 *   - Nếu truyền prop userId → chỉ hiện log của user đó
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import usersService from '../../services/usersService';

const LIMIT = 30;

// ── Status badge ──────────────────────────────────────────────────
const LogBadge = ({ status }) => {
  const ok = status === 'success';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      color:      ok ? '#6EE7B7'               : '#FCA5A5',
      border:     `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {ok ? 'Thành công' : 'Thất bại'}
    </span>
  );
};

const ROLE_LABELS = { admin:'Admin', manager:'Manager', sales:'Sales', cskh:'CSKH', technical:'Kỹ thuật' };
const ROLE_COLORS = {
  admin:'#FCA5A5', manager:'#D8B4FE', sales:'#93C5FD', cskh:'#6EE7B7', technical:'#FCD34D',
};

// ── Main ──────────────────────────────────────────────────────────
const LoginLogsPage = ({ userId = null }) => {
  const [searchParams] = useSearchParams();
  const targetUserId   = userId || searchParams.get('userId') || null;

  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('');  // '' | 'success' | 'failed'

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      const res = targetUserId
        ? await usersService.getUserLoginLogs(targetUserId, params)
        : await usersService.getLoginLogs(params);
      setLogs(res.data);
      setTotal(res.total);
    } catch {
      setError('Không thể tải lịch sử đăng nhập.');
    } finally {
      setLoading(false);
    }
  }, [page, targetUserId]);

  useEffect(() => { fetch(); }, [fetch]);

  const displayed    = filter ? logs.filter(l => l.status === filter) : logs;
  const totalPages   = Math.ceil(total / LIMIT);

  const s = {
    page: {
      minHeight: '100vh', background: '#080E1A',
      fontFamily: "'DM Sans','Segoe UI',sans-serif", color: '#F1F5F9',
    },
    inner:  { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title:  { fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', margin: 0 },
    sub:    { fontSize: 14, color: '#64748B', marginTop: 4 },
    back:   {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      color: '#64748B', textDecoration: 'none', fontSize: 14, marginBottom: 20,
    },
    filterBar: { display: 'flex', gap: 8, marginBottom: 20 },
    filterBtn: (active) => ({
      padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid',
      background:   active ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)',
      color:        active ? '#93C5FD'              : '#64748B',
      borderColor:  active ? 'rgba(37,99,235,0.4)'  : 'rgba(255,255,255,0.08)',
      transition: 'all 0.15s',
    }),
    table: {
      width: '100%', borderCollapse: 'collapse',
      background: 'rgba(13,20,36,0.7)',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden',
    },
    th: {
      padding: '11px 16px', textAlign: 'left', fontSize: 11,
      fontWeight: 700, color: '#475569', letterSpacing: '0.07em',
      textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
    },
    td: { padding: '12px 16px', fontSize: 13, color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    mono: { fontFamily: 'Courier New, monospace', fontSize: 12, color: '#64748B' },
    pg: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 16, fontSize: 13, color: '#64748B',
    },
    pgBtn: (disabled) => ({
      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: 'rgba(255,255,255,0.05)', color: disabled ? '#334155' : '#94A3B8',
      border: '1px solid rgba(255,255,255,0.08)', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
    }),
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>
      <div style={s.page}>
        <div style={s.inner}>

          <Link to="/users" style={s.back}>← Quay lại danh sách nhân viên</Link>

          <div style={s.header}>
            <div>
              <h1 style={s.title}>
                {targetUserId ? 'Lịch sử đăng nhập' : 'Lịch sử đăng nhập hệ thống'}
              </h1>
              <p style={s.sub}>{total} bản ghi</p>
            </div>
          </div>

          {/* Filters */}
          <div style={s.filterBar}>
            {[['', 'Tất cả'], ['success', '✓ Thành công'], ['failed', '✗ Thất bại']].map(([v, l]) => (
              <button key={v} style={s.filterBtn(filter === v)} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#FCA5A5', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Nhân viên', 'Vai trò', 'Kết quả', 'IP Address', 'Thời gian'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#475569' }}>Đang tải…</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#475569' }}>Không có dữ liệu</td></tr>
                ) : displayed.map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: 13 }}>{log.full_name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{log.email}</div>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: ROLE_COLORS[log.role] }}>
                        {ROLE_LABELS[log.role] || log.role}
                      </span>
                    </td>
                    <td style={s.td}><LogBadge status={log.status} /></td>
                    <td style={{ ...s.td, ...s.mono }}>{log.ip_address || '—'}</td>
                    <td style={{ ...s.td, ...s.mono }}>
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={s.pg}>
              <span>Trang {page} / {totalPages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.pgBtn(page <= 1)} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                <button style={s.pgBtn(page >= totalPages)} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default LoginLogsPage;