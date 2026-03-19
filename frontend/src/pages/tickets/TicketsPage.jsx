/**
 * @file     frontend/src/pages/tickets/TicketsPage.jsx
 * @location frontend/src/pages/tickets/TicketsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/ticketsService
 * @requires ../../store/authContext → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang quản lý Ticket Support – full lifecycle.
 *
 * Tính năng:
 *   - Stat cards: Tổng / Open / Processing / Urgent / Stale
 *   - Bảng danh sách với filter status/priority/search
 *   - Badge màu priority (urgent=đỏ, high=cam, medium=xanh, low=xám)
 *   - Modal chi tiết: comments timeline + assign + đổi trạng thái
 *   - Modal tạo ticket mới
 *   - Comment inline với phân biệt public/internal (nội bộ)
 *   - Phân trang server-side
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../store/authContext';
import ticketsService from '../../services/ticketsService';

// ── Constants ─────────────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent: { label:'Khẩn cấp', bg:'rgba(239,68,68,0.18)',  text:'#FCA5A5', border:'rgba(239,68,68,0.35)'   },
  high:   { label:'Cao',      bg:'rgba(245,158,11,0.18)',  text:'#FCD34D', border:'rgba(245,158,11,0.35)'  },
  medium: { label:'Trung bình',bg:'rgba(37,99,235,0.18)',  text:'#93C5FD', border:'rgba(37,99,235,0.35)'   },
  low:    { label:'Thấp',     bg:'rgba(100,116,139,0.18)', text:'#94A3B8', border:'rgba(100,116,139,0.35)' },
};

const STATUS_CFG = {
  open:       { label:'Mở',          bg:'rgba(16,185,129,0.15)',  text:'#6EE7B7', border:'rgba(16,185,129,0.3)'   },
  processing: { label:'Đang xử lý',  bg:'rgba(37,99,235,0.15)',   text:'#93C5FD', border:'rgba(37,99,235,0.3)'    },
  resolved:   { label:'Đã giải quyết',bg:'rgba(168,85,247,0.15)', text:'#D8B4FE', border:'rgba(168,85,247,0.3)'   },
  closed:     { label:'Đã đóng',     bg:'rgba(100,116,139,0.15)', text:'#94A3B8', border:'rgba(100,116,139,0.3)'  },
};

const PriorityBadge = ({ p }) => {
  const c = PRIORITY_CFG[p] || PRIORITY_CFG.medium;
  return <span style={{ fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,background:c.bg,color:c.text,border:`1px solid ${c.border}` }}>{c.label}</span>;
};
const StatusBadge = ({ s }) => {
  const c = STATUS_CFG[s] || STATUS_CFG.open;
  return <span style={{ fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,background:c.bg,color:c.text,border:`1px solid ${c.border}` }}>{c.label}</span>;
};
const StatCard = ({ label, value, color='#60A5FA', sub }) => (
  <div style={{ background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'16px 20px',minWidth:0 }}>
    <div style={{ fontSize:11,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:28,fontWeight:800,color,letterSpacing:'-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize:12,color:'#475569',marginTop:4 }}>{sub}</div>}
  </div>
);

const fmtTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN',{ day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' });
};

// ── Shared styles ────────────────────────────────────────────────
const inp  = { width:'100%',boxSizing:'border-box',padding:'10px 12px',marginBottom:12,
  background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.1)',
  borderRadius:8,color:'#F1F5F9',fontSize:14,outline:'none',fontFamily:'inherit' };
const lbl  = { display:'block',fontSize:12,fontWeight:600,color:'#94A3B8',marginBottom:5 };
const btnP = { padding:'9px 18px',borderRadius:8,fontSize:14,fontWeight:600,
  background:'linear-gradient(135deg,#2563EB,#1D4ED8)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit' };
const btnS = { padding:'9px 18px',borderRadius:8,fontSize:14,fontWeight:600,
  background:'rgba(255,255,255,0.06)',color:'#94A3B8',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontFamily:'inherit' };

// ── Modal wrapper ────────────────────────────────────────────────
const Overlay = ({ title, onClose, children, wide }) => (
  <div style={{ position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',
    display:'flex',alignItems:'flex-start',justifyContent:'center',padding:24,overflowY:'auto' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ width:'100%',maxWidth:wide?720:460,background:'#0D1424',
      border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:28,
      boxShadow:'0 24px 60px rgba(0,0,0,0.5)',marginTop:40 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:'#F1F5F9' }}>{title}</h3>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:22,lineHeight:1,padding:0 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Create Ticket Modal ──────────────────────────────────────────
const CreateModal = ({ onClose, onSaved }) => {
  const [types,   setTypes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { ticketsService.getTypes().then(setTypes); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const fd = new FormData(e.target);
    try {
      await ticketsService.create({
        title:        fd.get('title'),
        description:  fd.get('description'),
        customerId:   Number(fd.get('customerId')),
        ticketTypeId: Number(fd.get('ticketTypeId')),
        priority:     fd.get('priority'),
        contractId:   fd.get('contractId') ? Number(fd.get('contractId')) : undefined,
      });
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  };

  return (
    <Overlay title="Tạo Ticket mới" onClose={onClose}>
      {error && <div style={{ padding:'10px 12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:8,color:'#FCA5A5',fontSize:13,marginBottom:12 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label style={lbl}>Tiêu đề *</label>
        <input style={inp} name="title" required placeholder="Mô tả ngắn vấn đề..." />
        <label style={lbl}>Customer ID *</label>
        <input style={inp} name="customerId" type="number" min="1" required placeholder="ID khách hàng" />
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px' }}>
          <div>
            <label style={lbl}>Loại ticket *</label>
            <select style={{ ...inp,cursor:'pointer' }} name="ticketTypeId" required>
              <option value="">Chọn loại</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Ưu tiên</label>
            <select style={{ ...inp,cursor:'pointer' }} name="priority" defaultValue="medium">
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>
        </div>
        <label style={lbl}>Contract ID (tuỳ chọn)</label>
        <input style={inp} name="contractId" type="number" min="1" placeholder="Liên kết hợp đồng nếu có" />
        <label style={lbl}>Mô tả chi tiết *</label>
        <textarea style={{ ...inp,resize:'vertical',minHeight:100,marginBottom:16 }} name="description" required placeholder="Mô tả vấn đề cần hỗ trợ..." />
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button type="button" style={btnS} onClick={onClose}>Huỷ</button>
          <button type="submit" style={btnP} disabled={loading}>{loading?'Đang tạo…':'Tạo ticket'}</button>
        </div>
      </form>
    </Overlay>
  );
};

// ── Detail Modal ─────────────────────────────────────────────────
const DetailModal = ({ id, onClose, onRefresh, user }) => {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const commentsEnd = useRef(null);

  const canWrite = ['admin','sales','cskh','technical'].includes(user?.role);
  const canAssign = ['admin','manager','cskh'].includes(user?.role);

  const fetchTicket = useCallback(() => {
    setLoading(true);
    ticketsService.getById(id).then(setTicket).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => { commentsEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [ticket?.comments?.length]);

  const handleStatusChange = async (newStatus) => {
    try { await ticketsService.updateStatus(id, newStatus); fetchTicket(); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const handleAssign = async (assignedTo) => {
    try { await ticketsService.assign(id, Number(assignedTo)); fetchTicket(); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try { await ticketsService.addComment(id, comment.trim(), isInternal); setComment(''); fetchTicket(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
    finally { setSending(false); }
  };

  const delComment = async (cid) => {
    if (!window.confirm('Xóa comment này?')) return;
    try { await ticketsService.deleteComment(id, cid); fetchTicket(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  if (loading) return <Overlay title="Chi tiết Ticket" onClose={onClose} wide>
    <div style={{ color:'#64748B',textAlign:'center',padding:40 }}>Đang tải…</div>
  </Overlay>;

  if (!ticket) return null;

  const nextStatuses = {
    open:       ['processing'],
    processing: ['resolved'],
    resolved:   ['closed','processing'],
    closed:     [],
  }[ticket.status] || [];

  return (
    <Overlay title={`#${ticket.id} – ${ticket.title}`} onClose={onClose} wide>
      {/* Badges */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        <StatusBadge s={ticket.status} />
        <PriorityBadge p={ticket.priority} />
        <span style={{ fontSize:12,color:'#64748B' }}>{ticket.ticket_type_name}</span>
        <span style={{ fontSize:12,color:'#64748B' }}>· {ticket.company_name}</span>
        {ticket.hours_since_update >= 36 && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
          <span style={{ fontSize:12,color:'#FCA5A5',fontWeight:600 }}>⚠ Stale {Math.floor(ticket.hours_since_update)}h</span>
        )}
      </div>

      {/* Description */}
      <div style={{ padding:'12px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:10,fontSize:14,color:'#CBD5E1',lineHeight:1.7,marginBottom:16,whiteSpace:'pre-wrap' }}>
        {ticket.description}
      </div>

      {/* Meta */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px',fontSize:13,
        color:'#94A3B8',marginBottom:16 }}>
        <span>Phụ trách: <strong style={{ color:'#F1F5F9' }}>{ticket.assigned_to_name || 'Chưa assign'}</strong></span>
        <span>Tạo bởi: <strong style={{ color:'#F1F5F9' }}>{ticket.created_by_name}</strong></span>
        <span>Tạo lúc: {fmtTime(ticket.created_at)}</span>
        <span>Cập nhật: {fmtTime(ticket.last_updated_at)}</span>
        {ticket.resolved_at && <span>Resolved: {fmtTime(ticket.resolved_at)}</span>}
        {ticket.closed_at   && <span>Closed: {fmtTime(ticket.closed_at)}</span>}
      </div>

      {/* Actions */}
      {canWrite && (
        <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
          {nextStatuses.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              style={{ ...btnP,padding:'7px 14px',fontSize:13 }}>
              → {STATUS_CFG[s]?.label || s}
            </button>
          ))}
          {canAssign && ticket.status !== 'closed' && (
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <input placeholder="Assign ID…" type="number" min="1"
                style={{ ...inp,width:120,marginBottom:0,padding:'7px 10px',fontSize:13 }}
                onKeyDown={e => e.key === 'Enter' && handleAssign(e.target.value)} />
              <span style={{ fontSize:12,color:'#475569' }}>Enter để assign</span>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div style={{ marginTop:4 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'#64748B',marginBottom:10,
          textTransform:'uppercase',letterSpacing:'0.06em' }}>
          Comments ({ticket.comments?.length || 0})
        </div>
        <div style={{ maxHeight:280,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,marginBottom:12 }}>
          {(ticket.comments || []).map(c => (
            <div key={c.id} style={{
              padding:'10px 12px',borderRadius:10,
              background: c.is_internal ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${c.is_internal ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)'}`,
              position:'relative',
            }}>
              {c.is_internal && (
                <span style={{ fontSize:10,fontWeight:700,color:'#D8B4FE',marginBottom:4,display:'block',
                  textTransform:'uppercase',letterSpacing:'0.06em' }}>Nội bộ</span>
              )}
              <div style={{ fontSize:13,color:'#CBD5E1',lineHeight:1.6,whiteSpace:'pre-wrap' }}>{c.content}</div>
              <div style={{ fontSize:11,color:'#475569',marginTop:5 }}>
                <strong style={{ color:'#64748B' }}>{c.full_name}</strong> ({c.role}) · {fmtTime(c.created_at)}
              </div>
              {(c.user_id === user?.id || user?.role === 'admin') && ticket.status !== 'closed' && (
                <button onClick={() => delComment(c.id)}
                  style={{ position:'absolute',top:8,right:8,background:'none',border:'none',
                    color:'#475569',cursor:'pointer',fontSize:16,lineHeight:1,padding:2 }}>×</button>
              )}
            </div>
          ))}
          <div ref={commentsEnd} />
        </div>

        {/* Comment input */}
        {canWrite && ticket.status !== 'closed' && (
          <div>
            <textarea
              style={{ ...inp,resize:'vertical',minHeight:72,marginBottom:8 }}
              placeholder="Thêm comment…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && sendComment()}
            />
            <div style={{ display:'flex',alignItems:'center',gap:12,justifyContent:'space-between' }}>
              <label style={{ display:'flex',alignItems:'center',gap:7,fontSize:13,color:'#94A3B8',cursor:'pointer' }}>
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                  style={{ accentColor:'#7C3AED' }} />
                Nội bộ (chỉ nhân viên thấy)
              </label>
              <div style={{ display:'flex',gap:8 }}>
                <span style={{ fontSize:12,color:'#475569' }}>Ctrl+Enter để gửi</span>
                <button onClick={sendComment} disabled={!comment.trim() || sending} style={{ ...btnP,padding:'7px 16px',fontSize:13 }}>
                  {sending ? 'Đang gửi…' : 'Gửi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const TicketsPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin','sales','cskh','technical'].includes(user?.role);

  const [tickets, setTickets] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;

  const [search,     setSearch]     = useState('');
  const [fStatus,    setFStatus]    = useState('');
  const [fPriority,  setFPriority]  = useState('');

  const [modal, setModal] = useState(null); // null | 'create' | { type:'detail', id }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, st] = await Promise.all([
        ticketsService.getTickets({ page, limit:LIMIT,
          search:search||undefined, status:fStatus||undefined, priority:fPriority||undefined }),
        ticketsService.getStats(),
      ]);
      setTickets(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } finally { setLoading(false); }
  }, [page, search, fStatus, fPriority]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const closeRefresh = () => { setModal(null); fetchAll(); };
  const totalPages = Math.ceil(total / LIMIT);

  const s = {
    page:  { minHeight:'100vh',background:'#080E1A',fontFamily:"'DM Sans','Segoe UI',sans-serif",color:'#F1F5F9' },
    inner: { maxWidth:1280,margin:'0 auto',padding:'32px 24px' },
    th:    { padding:'12px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#64748B',
             letterSpacing:'0.06em',textTransform:'uppercase',
             borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)' },
    td:    { padding:'13px 14px',fontSize:13,color:'#CBD5E1',borderBottom:'1px solid rgba(255,255,255,0.04)' },
    fi:    { padding:'9px 14px',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.08)',
             borderRadius:9,color:'#F1F5F9',fontSize:14,outline:'none',fontFamily:'inherit' },
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>

      {modal === 'create' && <CreateModal onClose={() => setModal(null)} onSaved={closeRefresh} />}
      {modal?.type === 'detail' && (
        <DetailModal id={modal.id} user={user}
          onClose={() => setModal(null)} onRefresh={fetchAll} />
      )}

      <div style={s.page}>
        <div style={s.inner}>
          {/* Header */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:26,fontWeight:800,letterSpacing:'-0.4px',margin:'0 0 4px' }}>Ticket Support</h1>
              <p style={{ fontSize:14,color:'#64748B',margin:0 }}>Quản lý yêu cầu hỗ trợ từ khách hàng</p>
            </div>
            {canWrite && (
              <button style={{ ...btnP,fontSize:15 }} onClick={() => setModal('create')}>
                + Tạo ticket
              </button>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24 }}>
              <StatCard label="Tổng tickets"   value={stats.total}       sub={`${stats.open} đang mở`} />
              <StatCard label="Đang xử lý"     value={stats.processing}  color="#93C5FD" />
              <StatCard label="Urgent"          value={stats.urgent}      color="#FCA5A5" sub="Cần xử lý ngay" />
              <StatCard label="Stale (>36h)"    value={stats.stale}       color="#FCD34D" sub="Chưa cập nhật" />
              <StatCard label="Đã giải quyết"   value={stats.resolved}    color="#D8B4FE" />
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
            <input style={{ ...s.fi,minWidth:240 }} placeholder="🔍 Tiêu đề, tên công ty…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select style={{ ...s.fi,cursor:'pointer' }} value={fStatus}
              onChange={e => { setFStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="open">Mở</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>
            <select style={{ ...s.fi,cursor:'pointer' }} value={fPriority}
              onChange={e => { setFPriority(e.target.value); setPage(1); }}>
              <option value="">Tất cả ưu tiên</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',
              background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:12,overflow:'hidden' }}>
              <thead>
                <tr>
                  {['#','Tiêu đề','Khách hàng','Loại','Ưu tiên','Trạng thái','Phụ trách','Cập nhật',''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ ...s.td,textAlign:'center',color:'#475569',padding:40 }}>Đang tải…</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...s.td,textAlign:'center',color:'#475569',padding:40 }}>Không có ticket nào</td></tr>
                ) : tickets.map((t, i) => {
                  const isStale = t.hours_since_update >= 36 && t.status !== 'closed' && t.status !== 'resolved';
                  return (
                    <tr key={t.id} style={{
                      background: i%2===0?'transparent':'rgba(255,255,255,0.015)',
                      cursor:'pointer',
                      borderLeft: isStale ? '3px solid rgba(245,158,11,0.5)' : '3px solid transparent',
                    }}
                    onClick={() => setModal({ type:'detail', id:t.id })}>
                      <td style={{ ...s.td,color:'#64748B',fontSize:12,fontFamily:'Courier New' }}>#{t.id}</td>
                      <td style={{ ...s.td,maxWidth:220 }}>
                        <div style={{ fontWeight:600,color:'#F1F5F9',fontSize:13,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.title}</div>
                        {isStale && <div style={{ fontSize:11,color:'#FCD34D',marginTop:2 }}>⚠ Chưa cập nhật {Math.floor(t.hours_since_update)}h</div>}
                      </td>
                      <td style={s.td}>{t.company_name}</td>
                      <td style={{ ...s.td,fontSize:12,color:'#94A3B8' }}>{t.ticket_type_name}</td>
                      <td style={s.td}><PriorityBadge p={t.priority} /></td>
                      <td style={s.td}><StatusBadge s={t.status} /></td>
                      <td style={{ ...s.td,fontSize:12,color:'#64748B' }}>{t.assigned_to_name || '—'}</td>
                      <td style={{ ...s.td,fontSize:11,color:'#475569' }}>
                        {new Date(t.last_updated_at).toLocaleString('vi-VN',{ day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit' })}
                      </td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={{ padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,
                          background:'rgba(99,179,237,0.1)',color:'#93C5FD',
                          border:'1px solid rgba(99,179,237,0.25)',cursor:'pointer',fontFamily:'inherit' }}
                          onClick={() => setModal({ type:'detail', id:t.id })}>Xem</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
              marginTop:16,fontSize:13,color:'#64748B' }}>
              <span>Trang {page} / {totalPages} · {total} tickets</span>
              <div style={{ display:'flex',gap:8 }}>
                {[{ label:'← Trước', disabled: page <= 1,       fn: () => setPage(p => p-1) },
                  { label:'Sau →',   disabled: page >= totalPages, fn: () => setPage(p => p+1) }].map(b => (
                  <button key={b.label} disabled={b.disabled} onClick={b.fn}
                    style={{ padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,
                      background:'rgba(255,255,255,0.05)',color:b.disabled?'#334155':'#94A3B8',
                      border:'1px solid rgba(255,255,255,0.08)',cursor:b.disabled?'not-allowed':'pointer',fontFamily:'inherit' }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default TicketsPage;