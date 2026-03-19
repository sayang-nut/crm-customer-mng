/**
 * @file     frontend/src/pages/contracts/ContractsPage.jsx
 * @location frontend/src/pages/contracts/ContractsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/contractsService
 * @requires ../../services/solutionsService  → dropdown packages
 * @requires ../../store/authContext → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang quản lý hợp đồng dịch vụ.
 *
 * Tính năng:
 *   - Danh sách hợp đồng với filter status / expiringSoon / search
 *   - Thẻ thống kê nhanh: tổng, active, sắp hết hạn 30 ngày / 7 ngày
 *   - Badge màu ngày hết hạn: đỏ (<7d), cam (<30d), xanh (bình thường)
 *   - Modal tạo mới hợp đồng (Admin + Sales)
 *   - Modal gia hạn hợp đồng (giữ nguyên hoặc đổi gói)
 *   - Modal hủy hợp đồng với lý do
 *   - Modal chi tiết + lịch sử gia hạn
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import contractsService from '../../services/contractsService';
import solutionsService from '../../services/solutionsService';

// ── Helpers ───────────────────────────────────────────────────────
const fmtVND  = (n) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', notation:'compact', maximumFractionDigits:1 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtFull = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

const STATUS_CFG = {
  active:       { label:'Đang hoạt động', bg:'rgba(16,185,129,0.15)',  text:'#6EE7B7', border:'rgba(16,185,129,0.3)'  },
  near_expired: { label:'Sắp hết hạn',    bg:'rgba(245,158,11,0.15)',  text:'#FCD34D', border:'rgba(245,158,11,0.3)'  },
  expired:      { label:'Đã hết hạn',     bg:'rgba(239,68,68,0.15)',   text:'#FCA5A5', border:'rgba(239,68,68,0.3)'   },
  cancelled:    { label:'Đã hủy',         bg:'rgba(100,116,139,0.15)', text:'#94A3B8', border:'rgba(100,116,139,0.3)' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.active;
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20,
      background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>{c.label}</span>
  );
};

const ExpiryBadge = ({ days }) => {
  if (days == null) return null;
  const d = Number(days);
  const [bg, text] = d < 0 ? ['rgba(239,68,68,0.15)','#FCA5A5']
    : d <= 7  ? ['rgba(239,68,68,0.15)','#FCA5A5']
    : d <= 30 ? ['rgba(245,158,11,0.15)','#FCD34D']
    :           ['rgba(16,185,129,0.1)','#6EE7B7'];
  const label = d < 0 ? `Hết hạn ${Math.abs(d)}n` : d === 0 ? 'Hôm nay' : `Còn ${d}n`;
  return <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:bg, color:text }}>{label}</span>;
};

// ── Stat card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#60A5FA' }) => (
  <div style={{ background:'rgba(13,20,36,0.7)', border:'1px solid rgba(255,255,255,0.06)',
    borderRadius:12, padding:'16px 20px', minWidth:0 }}>
    <div style={{ fontSize:11, color:'#64748B', fontWeight:600, textTransform:'uppercase',
      letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:800, color, letterSpacing:'-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>{sub}</div>}
  </div>
);

// ── Simple modal wrapper ──────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.65)',
    backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
    justifyContent:'center', padding:16, overflowY:'auto' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ width:'100%', maxWidth: wide ? 640 : 460,
      background:'#0D1424', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:16, padding:28, boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
      margin:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'#F1F5F9' }}>{title}</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748B',
          cursor:'pointer', fontSize:22, lineHeight:1, padding:0 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const inp  = { width:'100%', boxSizing:'border-box', padding:'10px 12px', marginBottom:14,
  background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)',
  borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none', fontFamily:'inherit' };
const lbl  = { display:'block', fontSize:12, fontWeight:600, color:'#94A3B8', marginBottom:6 };
const btnP = { padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
  background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', border:'none',
  cursor:'pointer', fontFamily:'inherit' };
const btnS = { padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
  background:'rgba(255,255,255,0.06)', color:'#94A3B8',
  border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit' };
const btnD = { padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
  background:'rgba(239,68,68,0.12)', color:'#FCA5A5',
  border:'1px solid rgba(239,68,68,0.25)', cursor:'pointer', fontFamily:'inherit' };

// ── Create Contract Modal ─────────────────────────────────────────
const CreateModal = ({ onClose, onSaved, userId }) => {
  const [solutions, setSolutions] = useState([]);
  const [packages,  setPackages]  = useState([]);
  const [selSol,    setSelSol]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => { solutionsService.getSolutions().then(setSolutions); }, []);
  useEffect(() => {
    if (!selSol) { setPackages([]); return; }
    solutionsService.getPackages({ solutionId: selSol, status:'active' }).then(setPackages);
  }, [selSol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const fd = new FormData(e.target);
    try {
      await contractsService.create({
        contractNumber: fd.get('contractNumber'),
        customerId:     Number(fd.get('customerId')),
        solutionId:     Number(selSol),
        packageId:      Number(fd.get('packageId')),
        billingCycle:   fd.get('billingCycle'),
        startDate:      fd.get('startDate'),
        endDate:        fd.get('endDate'),
        value:          Number(fd.get('value')),
        discount:       Number(fd.get('discount')) || 0,
        notes:          fd.get('notes'),
      });
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Tạo hợp đồng mới" onClose={onClose} wide>
      {error && <div style={{ padding:'10px 12px', background:'rgba(239,68,68,0.1)',
        border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#FCA5A5',
        fontSize:13, marginBottom:14 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
          <div>
            <label style={lbl}>Số hợp đồng *</label>
            <input style={inp} name="contractNumber" required placeholder="VD: HD-2025-001" />
          </div>
          <div>
            <label style={lbl}>Customer ID *</label>
            <input style={inp} name="customerId" type="number" min="1" required placeholder="ID khách hàng" />
          </div>
          <div>
            <label style={lbl}>Giải pháp *</label>
            <select style={{ ...inp, cursor:'pointer' }} value={selSol}
              onChange={e => setSelSol(e.target.value)} required>
              <option value="">Chọn giải pháp</option>
              {solutions.map(s => <option key={s.id} value={s.id}>{s.group_name} – {s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Gói dịch vụ *</label>
            <select style={{ ...inp, cursor:'pointer' }} name="packageId" required disabled={!selSol}>
              <option value="">Chọn gói</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Ngày bắt đầu *</label>
            <input style={inp} name="startDate" type="date" required />
          </div>
          <div>
            <label style={lbl}>Ngày kết thúc *</label>
            <input style={inp} name="endDate" type="date" required />
          </div>
          <div>
            <label style={lbl}>Chu kỳ thanh toán</label>
            <select style={{ ...inp, cursor:'pointer' }} name="billingCycle">
              <option value="yearly">Năm</option>
              <option value="monthly">Tháng</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Giá trị HĐ (VNĐ) *</label>
            <input style={inp} name="value" type="number" min="0" required placeholder="0" />
          </div>
          <div>
            <label style={lbl}>Chiết khấu (%)</label>
            <input style={inp} name="discount" type="number" min="0" max="100" defaultValue="0" />
          </div>
        </div>
        <label style={lbl}>Ghi chú</label>
        <textarea style={{ ...inp, resize:'vertical', minHeight:72, marginBottom:18 }} name="notes" />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" style={btnS} onClick={onClose}>Huỷ</button>
          <button type="submit" style={btnP} disabled={loading}>{loading ? 'Đang lưu…' : 'Tạo hợp đồng'}</button>
        </div>
      </form>
    </Modal>
  );
};

// ── Renew Modal ───────────────────────────────────────────────────
const RenewModal = ({ contract, onClose, onSaved }) => {
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    solutionsService.getPackages({ solutionId: contract.solution_id, status:'active' }).then(setPackages);
  }, [contract.solution_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const fd = new FormData(e.target);
    try {
      await contractsService.renew(contract.id, {
        newEndDate:   fd.get('newEndDate'),
        newPackageId: fd.get('newPackageId') ? Number(fd.get('newPackageId')) : undefined,
        newValue:     fd.get('newValue')     ? Number(fd.get('newValue'))     : undefined,
        discount:     fd.get('discount')     ? Number(fd.get('discount'))     : undefined,
        notes:        fd.get('notes'),
      });
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={`Gia hạn: ${contract.contract_number}`} onClose={onClose}>
      <div style={{ padding:'8px 12px', background:'rgba(37,99,235,0.08)',
        border:'1px solid rgba(37,99,235,0.2)', borderRadius:8, marginBottom:16, fontSize:13 }}>
        <span style={{ color:'#64748B' }}>Ngày kết thúc hiện tại: </span>
        <strong style={{ color:'#93C5FD' }}>{fmtDate(contract.end_date)}</strong>
      </div>
      {error && <div style={{ padding:'10px 12px', background:'rgba(239,68,68,0.1)',
        border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'#FCA5A5',
        fontSize:13, marginBottom:14 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label style={lbl}>Ngày hết hạn mới *</label>
        <input style={inp} name="newEndDate" type="date" required />
        <label style={lbl}>Đổi gói (để trống = giữ nguyên)</label>
        <select style={{ ...inp, cursor:'pointer' }} name="newPackageId">
          <option value="">Giữ gói hiện tại ({contract.package_name})</option>
          {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
          <div>
            <label style={lbl}>Giá trị mới (để trống = giữ)</label>
            <input style={inp} name="newValue" type="number" min="0" placeholder={contract.final_value} />
          </div>
          <div>
            <label style={lbl}>Chiết khấu (%)</label>
            <input style={inp} name="discount" type="number" min="0" max="100" defaultValue="0" />
          </div>
        </div>
        <label style={lbl}>Ghi chú gia hạn</label>
        <textarea style={{ ...inp, resize:'vertical', minHeight:60, marginBottom:18 }} name="notes" />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" style={btnS} onClick={onClose}>Huỷ</button>
          <button type="submit" style={btnP} disabled={loading}>{loading ? 'Đang lưu…' : 'Gia hạn'}</button>
        </div>
      </form>
    </Modal>
  );
};

// ── Cancel Modal ──────────────────────────────────────────────────
const CancelModal = ({ contract, onClose, onSaved }) => {
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Vui lòng nhập lý do hủy.'); return; }
    setLoading(true);
    try { await contractsService.cancel(contract.id, reason); onSaved(); }
    catch (err) { setError(err.response?.data?.message || 'Lỗi.'); setLoading(false); }
  };

  return (
    <Modal title="Hủy hợp đồng" onClose={onClose}>
      <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.08)',
        border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, marginBottom:16, fontSize:13, color:'#FCA5A5' }}>
        ⚠ Bạn sắp hủy hợp đồng <strong>{contract.contract_number}</strong>
        {' – '}{contract.company_name}. Hành động này không thể hoàn tác.
      </div>
      {error && <div style={{ color:'#FCA5A5', fontSize:13, marginBottom:12 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label style={lbl}>Lý do hủy *</label>
        <textarea style={{ ...inp, resize:'vertical', minHeight:80, marginBottom:18 }}
          value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập lý do hủy hợp đồng..." />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" style={btnS} onClick={onClose}>Quay lại</button>
          <button type="submit" style={btnD} disabled={loading}>{loading ? 'Đang hủy…' : 'Xác nhận hủy'}</button>
        </div>
      </form>
    </Modal>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────
const DetailModal = ({ id, onClose, canWrite, onRenew, onCancel }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contractsService.getById(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Modal title="Chi tiết hợp đồng" onClose={onClose}>
    <div style={{ color:'#64748B', textAlign:'center', padding:32 }}>Đang tải…</div>
  </Modal>;

  if (!data) return null;

  const row = (label, value) => (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8,
      padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:13, color:'#64748B' }}>{label}</span>
      <span style={{ fontSize:14, color:'#E2E8F0', fontWeight:500 }}>{value}</span>
    </div>
  );

  return (
    <Modal title={`HĐ: ${data.contract_number}`} onClose={onClose} wide>
      <div style={{ marginBottom:16 }}>
        <StatusBadge status={data.status} />
        {data.status !== 'cancelled' && <ExpiryBadge days={data.days_until_expiry} />}
      </div>

      {row('Khách hàng',       data.company_name)}
      {row('Giải pháp',        data.solution_name)}
      {row('Gói dịch vụ',      `${data.package_name} (${data.package_level})`)}
      {row('Chu kỳ TT',        data.billing_cycle === 'yearly' ? 'Năm' : 'Tháng')}
      {row('Thời hạn',         `${fmtDate(data.start_date)} → ${fmtDate(data.end_date)}`)}
      {row('Giá trị gốc',      fmtVND(data.value))}
      {row('Chiết khấu',       `${data.discount}%`)}
      {row('Giá trị cuối',     <strong style={{ color:'#60A5FA' }}>{fmtVND(data.final_value)}</strong>)}
      {row('Phụ trách',        data.assigned_to_name)}
      {row('Ghi chú',          data.notes || '—')}

      {/* Renewal history */}
      {data.renewalHistory?.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94A3B8', marginBottom:8,
            textTransform:'uppercase', letterSpacing:'0.06em' }}>Lịch sử gia hạn</div>
          {data.renewalHistory.map(r => (
            <div key={r.id} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, marginBottom:8, fontSize:13 }}>
              <div style={{ color:'#E2E8F0', marginBottom:4 }}>
                {fmtDate(r.old_end_date)} → <strong style={{ color:'#6EE7B7' }}>{fmtDate(r.new_end_date)}</strong>
                {r.new_package_name !== r.old_package_name &&
                  <span style={{ color:'#A78BFA', marginLeft:8 }}>Đổi: {r.old_package_name} → {r.new_package_name}</span>}
              </div>
              <div style={{ color:'#64748B' }}>{r.renewed_by_name} · {fmtFull(r.created_at)}</div>
              {r.notes && <div style={{ color:'#94A3B8', marginTop:4 }}>{r.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {canWrite && data.status !== 'cancelled' && (
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
          <button style={btnD} onClick={() => onCancel(data)}>Hủy HĐ</button>
          <button style={btnP} onClick={() => onRenew(data)}>Gia hạn</button>
        </div>
      )}
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const ContractsPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin', 'sales'].includes(user?.role);

  const [contracts, setContracts] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const LIMIT = 15;

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');

  const [modal, setModal] = useState(null);
  // modal types: 'create' | 'detail' | 'renew' | 'cancel'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, search: search||undefined,
        status: filterStatus||undefined,
        expiringSoon: filterExpiry||undefined };
      const [res, st] = await Promise.all([
        contractsService.getContracts(params),
        contractsService.getStats(),
      ]);
      setContracts(res.data || []);
      setTotal(res.total || 0);
      setStats(st);
    } catch { /* handled by axios interceptor */ }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterExpiry]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeAndRefresh = () => { setModal(null); fetchData(); };
  const totalPages = Math.ceil(total / LIMIT);

  const s = {
    page:  { minHeight:'100vh', background:'#080E1A', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'#F1F5F9' },
    inner: { maxWidth:1280, margin:'0 auto', padding:'32px 24px' },
    filterInput: { padding:'9px 14px', background:'rgba(255,255,255,0.05)',
      border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:9,
      color:'#F1F5F9', fontSize:14, outline:'none', fontFamily:'inherit' },
    th: { padding:'12px 14px', textAlign:'left', fontSize:11, fontWeight:700,
      color:'#64748B', letterSpacing:'0.06em', textTransform:'uppercase',
      borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' },
    td: { padding:'13px 14px', fontSize:13, color:'#CBD5E1',
      borderBottom:'1px solid rgba(255,255,255,0.04)' },
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>

      {modal?.type === 'create' && <CreateModal userId={user?.id} onClose={() => setModal(null)} onSaved={closeAndRefresh} />}
      {modal?.type === 'detail' && <DetailModal id={modal.id} onClose={() => setModal(null)}
        canWrite={canWrite}
        onRenew={c => setModal({ type:'renew',  contract:c })}
        onCancel={c => setModal({ type:'cancel', contract:c })} />}
      {modal?.type === 'renew'  && <RenewModal  contract={modal.contract} onClose={() => setModal(null)} onSaved={closeAndRefresh} />}
      {modal?.type === 'cancel' && <CancelModal contract={modal.contract} onClose={() => setModal(null)} onSaved={closeAndRefresh} />}

      <div style={s.page}>
        <div style={s.inner}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.4px', margin:'0 0 4px' }}>Quản lý hợp đồng</h1>
              <p style={{ fontSize:14, color:'#64748B', margin:0 }}>Theo dõi vòng đời hợp đồng dịch vụ</p>
            </div>
            {canWrite && (
              <button style={{ ...btnP, fontSize:15 }} onClick={() => setModal({ type:'create' })}>
                + Tạo hợp đồng
              </button>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
              <StatCard label="Tổng hợp đồng"   value={stats.total}       sub={`${stats.active} đang hoạt động`} />
              <StatCard label="Sắp hết hạn 30n"  value={stats.expiring30d} color="#FCD34D" sub="Cần liên hệ gia hạn" />
              <StatCard label="Sắp hết hạn 7n"   value={stats.expiring7d}  color="#FCA5A5" sub="Cần xử lý gấp" />
              <StatCard label="Doanh thu active"  value={fmtVND(stats.activeValue)} color="#6EE7B7" sub="Tổng giá trị" />
            </div>
          )}

          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            <input style={{ ...s.filterInput, minWidth:240 }} placeholder="🔍 Số HĐ, tên công ty…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select style={{ ...s.filterInput, cursor:'pointer' }}
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="near_expired">Sắp hết hạn</option>
              <option value="expired">Đã hết hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select style={{ ...s.filterInput, cursor:'pointer' }}
              value={filterExpiry} onChange={e => { setFilterExpiry(e.target.value); setPage(1); }}>
              <option value="">Tất cả thời hạn</option>
              <option value="7">Hết hạn trong 7 ngày</option>
              <option value="30">Hết hạn trong 30 ngày</option>
              <option value="60">Hết hạn trong 60 ngày</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse',
              background:'rgba(13,20,36,0.7)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:12, overflow:'hidden' }}>
              <thead>
                <tr>
                  {['Số HĐ','Khách hàng','Giải pháp / Gói','Thời hạn','Ngày HH','Giá trị','Trạng thái',''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ ...s.td, textAlign:'center', color:'#475569', padding:40 }}>Đang tải…</td></tr>
                ) : contracts.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...s.td, textAlign:'center', color:'#475569', padding:40 }}>Không có hợp đồng nào</td></tr>
                ) : contracts.map((c, i) => (
                  <tr key={c.id} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.015)',
                    cursor:'pointer' }}
                    onClick={() => setModal({ type:'detail', id:c.id })}>
                    <td style={s.td}>
                      <span style={{ fontFamily:'Courier New', fontSize:13, color:'#93C5FD', fontWeight:600 }}>
                        {c.contract_number}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight:600, color:'#F1F5F9' }}>{c.company_name}</div>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontSize:13, color:'#94A3B8' }}>{c.solution_name}</div>
                      <div style={{ fontSize:12, color:'#64748B' }}>{c.package_name}</div>
                    </td>
                    <td style={{ ...s.td, fontSize:12, color:'#64748B' }}>
                      {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                    </td>
                    <td style={s.td}>
                      <ExpiryBadge days={c.days_until_expiry} />
                    </td>
                    <td style={{ ...s.td, fontWeight:600, color:'#60A5FA' }}>
                      {fmtVND(c.final_value)}
                    </td>
                    <td style={s.td}><StatusBadge status={c.status} /></td>
                    <td style={{ ...s.td }} onClick={e => e.stopPropagation()}>
                      {canWrite && c.status !== 'cancelled' && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button style={{ padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:600,
                            background:'rgba(99,179,237,0.1)', color:'#93C5FD',
                            border:'1px solid rgba(99,179,237,0.25)', cursor:'pointer', fontFamily:'inherit' }}
                            onClick={() => setModal({ type:'renew', contract:c })}>Gia hạn</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              marginTop:16, fontSize:13, color:'#64748B' }}>
              <span>Trang {page} / {totalPages} · {total} hợp đồng</span>
              <div style={{ display:'flex', gap:8 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p-1)}
                  style={{ padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600,
                    background:'rgba(255,255,255,0.05)', color: page<=1?'#334155':'#94A3B8',
                    border:'1px solid rgba(255,255,255,0.08)', cursor:page<=1?'not-allowed':'pointer', fontFamily:'inherit' }}>
                  ← Trước
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)}
                  style={{ padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600,
                    background:'rgba(255,255,255,0.05)', color: page>=totalPages?'#334155':'#94A3B8',
                    border:'1px solid rgba(255,255,255,0.08)', cursor:page>=totalPages?'not-allowed':'pointer', fontFamily:'inherit' }}>
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContractsPage;