/**
 * @file     frontend/src/pages/solutions/SolutionsPage.jsx
 * @location frontend/src/pages/solutions/SolutionsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/solutionsService
 * @requires ../../store/authContext → useAuth (kiểm tra role admin)
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang quản lý danh mục sản phẩm Bado.
 *
 * 3 tab chính:
 *   [1] Giải pháp    – Groups + Solutions (cây 2 cấp)
 *   [2] Gói dịch vụ  – Packages với giá tháng/năm
 *   [3] Ngành nghề   – Industries (simple CRUD)
 *
 * Phân quyền:
 *   Xem: tất cả roles
 *   Tạo/Sửa/Xóa: Admin only
 * ─────────────────────────────────────────────────────────────────
 */
require('module-alias/register');
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@store/authContext';
import solutionsService from '@services/solutionsService';

// ── Constants ─────────────────────────────────────────────────────
const LEVEL_LABELS = {
  support:      'Hỗ trợ',
  basic:        'Cơ bản',
  professional: 'Chuyên nghiệp',
  multichannel: 'Đa kênh',
  enterprise:   'Doanh nghiệp',
};
const LEVEL_COLORS = {
  support:      { bg:'rgba(100,116,139,0.15)', text:'#94A3B8', border:'rgba(100,116,139,0.3)' },
  basic:        { bg:'rgba(16,185,129,0.15)',  text:'#6EE7B7', border:'rgba(16,185,129,0.3)'  },
  professional: { bg:'rgba(37,99,235,0.15)',   text:'#93C5FD', border:'rgba(37,99,235,0.3)'   },
  multichannel: { bg:'rgba(168,85,247,0.15)',  text:'#D8B4FE', border:'rgba(168,85,247,0.3)'  },
  enterprise:   { bg:'rgba(245,158,11,0.15)',  text:'#FCD34D', border:'rgba(245,158,11,0.3)'  },
};

// ── Shared UI helpers ─────────────────────────────────────────────
const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', notation:'compact', maximumFractionDigits:1 }).format(n || 0);

const Badge = ({ level }) => {
  const c = LEVEL_COLORS[level] || LEVEL_COLORS.basic;
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20,
      background:c.bg, color:c.text, border:`1px solid ${c.border}`, letterSpacing:'0.04em' }}>
      {LEVEL_LABELS[level] || level}
    </span>
  );
};

const StatusDot = ({ status }) => (
  <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12,
    color: status === 'active' ? '#6EE7B7' : '#94A3B8' }}>
    <span style={{ width:6, height:6, borderRadius:'50%',
      background: status === 'active' ? '#10B981' : '#475569' }} />
    {status === 'active' ? 'Đang dùng' : 'Tạm dừng'}
  </span>
);

// ── Generic simple modal ──────────────────────────────────────────
const SimpleModal = ({ title, children, onClose }) => (
  <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.6)',
    backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
    justifyContent:'center', padding:16 }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ width:'100%', maxWidth:420, background:'#0D1424',
      border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:28,
      boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'#F1F5F9' }}>{title}</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748B',
          cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const inp = { width:'100%', boxSizing:'border-box', padding:'10px 12px',
  background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)',
  borderRadius:8, color:'#F1F5F9', fontSize:14, outline:'none', fontFamily:'inherit',
  marginBottom:14 };
const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#94A3B8', marginBottom:6 };
const btnPrimary = { padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
  background:'linear-gradient(135deg,#2563EB,#1D4ED8)', color:'#fff', border:'none',
  cursor:'pointer', fontFamily:'inherit' };
const btnSecondary = { padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:600,
  background:'rgba(255,255,255,0.06)', color:'#94A3B8',
  border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontFamily:'inherit' };
const btnDanger = { padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600,
  background:'rgba(239,68,68,0.1)', color:'#FCA5A5',
  border:'1px solid rgba(239,68,68,0.25)', cursor:'pointer', fontFamily:'inherit' };
const btnEdit = { padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600,
  background:'rgba(99,179,237,0.1)', color:'#93C5FD',
  border:'1px solid rgba(99,179,237,0.25)', cursor:'pointer', fontFamily:'inherit' };

// ════════════════════════════════════════════════════════════════
// TAB 1: SOLUTIONS (Groups + Solutions tree)
// ════════════════════════════════════════════════════════════════
const SolutionsTab = ({ isAdmin }) => {
  const [groups,    setGroups]    = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // { type, data }

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s] = await Promise.all([solutionsService.getGroups(), solutionsService.getSolutions()]);
      setGroups(g); setSolutions(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const confirmDelete = async (type, id) => {
    if (!window.confirm('Xác nhận xóa?')) return;
    try {
      if (type === 'group')    await solutionsService.deleteGroup(id);
      if (type === 'solution') await solutionsService.deleteSolution(id);
      fetch();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  // Group form submit
  const submitGroup = async (e, data, id) => {
    e.preventDefault();
    try {
      if (id) await solutionsService.updateGroup(id, data);
      else    await solutionsService.createGroup(data);
      setModal(null); fetch();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  // Solution form submit
  const submitSolution = async (e, data, id) => {
    e.preventDefault();
    try {
      if (id) await solutionsService.updateSolution(id, data);
      else    await solutionsService.createSolution(data);
      setModal(null); fetch();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  if (loading) return <div style={{ color:'#64748B', padding:40, textAlign:'center' }}>Đang tải…</div>;

  return (
    <div>
      {/* Group Form Modal */}
      {modal?.type === 'group' && (
        <SimpleModal title={modal.data?.id ? 'Sửa nhóm giải pháp' : 'Thêm nhóm giải pháp'}
          onClose={() => setModal(null)}>
          <form onSubmit={e => {
            const fd = new FormData(e.target);
            submitGroup(e, { name: fd.get('name'), description: fd.get('description') }, modal.data?.id);
          }}>
            <label style={lbl}>Tên nhóm *</label>
            <input style={inp} name="name" required defaultValue={modal.data?.name || ''} placeholder="VD: Bán lẻ" />
            <label style={lbl}>Mô tả</label>
            <input style={inp} name="description" defaultValue={modal.data?.description || ''} placeholder="Tuỳ chọn" />
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" style={btnSecondary} onClick={() => setModal(null)}>Huỷ</button>
              <button type="submit" style={btnPrimary}>Lưu</button>
            </div>
          </form>
        </SimpleModal>
      )}

      {/* Solution Form Modal */}
      {modal?.type === 'solution' && (
        <SimpleModal title={modal.data?.id ? 'Sửa giải pháp' : 'Thêm giải pháp'}
          onClose={() => setModal(null)}>
          <form onSubmit={e => {
            const fd = new FormData(e.target);
            submitSolution(e, {
              solutionGroupId: Number(fd.get('groupId')),
              name: fd.get('name'), description: fd.get('description'),
            }, modal.data?.id);
          }}>
            <label style={lbl}>Nhóm giải pháp *</label>
            <select style={{ ...inp, cursor:'pointer' }} name="groupId" required
              defaultValue={modal.data?.solution_group_id || ''}>
              <option value="">Chọn nhóm</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <label style={lbl}>Tên giải pháp *</label>
            <input style={inp} name="name" required defaultValue={modal.data?.name || ''} placeholder="VD: Bado Retail" />
            <label style={lbl}>Mô tả</label>
            <input style={inp} name="description" defaultValue={modal.data?.description || ''} />
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" style={btnSecondary} onClick={() => setModal(null)}>Huỷ</button>
              <button type="submit" style={btnPrimary}>Lưu</button>
            </div>
          </form>
        </SimpleModal>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:14, color:'#64748B' }}>{groups.length} nhóm · {solutions.length} giải pháp</div>
        {isAdmin && (
          <div style={{ display:'flex', gap:10 }}>
            <button style={btnSecondary} onClick={() => setModal({ type:'group', data:null })}>+ Nhóm</button>
            <button style={btnPrimary}   onClick={() => setModal({ type:'solution', data:null })}>+ Giải pháp</button>
          </div>
        )}
      </div>

      {/* Tree view */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {groups.map(g => {
          const groupSolutions = solutions.filter(s => s.solution_group_id === g.id);
          return (
            <div key={g.id} style={{ background:'rgba(13,20,36,0.7)',
              border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' }}>
              {/* Group header */}
              <div style={{ padding:'14px 18px', display:'flex', alignItems:'center',
                justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.05)',
                background:'rgba(37,99,235,0.06)' }}>
                <div>
                  <span style={{ fontWeight:700, color:'#F1F5F9', fontSize:15 }}>{g.name}</span>
                  <span style={{ marginLeft:10, fontSize:12, color:'#64748B' }}>{g.description}</span>
                  <span style={{ marginLeft:10, fontSize:12, color:'#60A5FA' }}>{groupSolutions.length} giải pháp</span>
                </div>
                {isAdmin && (
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={btnEdit} onClick={() => setModal({ type:'group', data:g })}>Sửa</button>
                    <button style={btnDanger} onClick={() => confirmDelete('group', g.id)}>Xóa</button>
                  </div>
                )}
              </div>

              {/* Solutions in group */}
              {groupSolutions.length === 0 ? (
                <div style={{ padding:'14px 18px', color:'#475569', fontSize:13, fontStyle:'italic' }}>
                  Chưa có giải pháp nào
                </div>
              ) : (
                groupSolutions.map((s, i) => (
                  <div key={s.id} style={{ padding:'12px 18px 12px 32px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    borderBottom: i < groupSolutions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:600, color:'#E2E8F0', fontSize:14 }}>{s.name}</div>
                        {s.description && <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{s.description}</div>}
                      </div>
                      <span style={{ fontSize:12, color:'#475569' }}>{s.package_count} gói</span>
                    </div>
                    {isAdmin && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button style={btnEdit} onClick={() => setModal({ type:'solution', data:s })}>Sửa</button>
                        <button style={btnDanger} onClick={() => confirmDelete('solution', s.id)}>Xóa</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 2: PACKAGES
// ════════════════════════════════════════════════════════════════
const PackagesTab = ({ isAdmin }) => {
  const [packages,  setPackages]  = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('');
  const [modal,     setModal]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([solutionsService.getPackages(), solutionsService.getSolutions()]);
      setPackages(p); setSolutions(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const submitPkg = async (e, id) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      solutionId:   Number(fd.get('solutionId')),
      name:         fd.get('name'),
      level:        fd.get('level'),
      priceMonthly: Number(fd.get('priceMonthly')) || 0,
      priceYearly:  Number(fd.get('priceYearly'))  || 0,
      description:  fd.get('description'),
      status:       fd.get('status') || 'active',
    };
    try {
      if (id) await solutionsService.updatePackage(id, data);
      else    await solutionsService.createPackage(data);
      setModal(null); fetch();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const toggleStatus = async (pkg) => {
    const next = pkg.status === 'active' ? 'inactive' : 'active';
    try { await solutionsService.setPackageStatus(pkg.id, next); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const deletePkg = async (id) => {
    if (!window.confirm('Xóa gói dịch vụ này?')) return;
    try { await solutionsService.deletePackage(id); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const filtered = filter ? packages.filter(p => p.solution_id === Number(filter)) : packages;

  if (loading) return <div style={{ color:'#64748B', padding:40, textAlign:'center' }}>Đang tải…</div>;

  return (
    <div>
      {modal && (
        <SimpleModal title={modal.id ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}
          onClose={() => setModal(null)}>
          <form onSubmit={e => submitPkg(e, modal.id)}>
            <label style={lbl}>Giải pháp *</label>
            <select style={{ ...inp, cursor:'pointer' }} name="solutionId" required
              defaultValue={modal.solution_id || ''}>
              <option value="">Chọn giải pháp</option>
              {solutions.map(s => <option key={s.id} value={s.id}>{s.group_name} – {s.name}</option>)}
            </select>
            <label style={lbl}>Tên gói *</label>
            <input style={inp} name="name" required defaultValue={modal.name || ''} placeholder="VD: Bado Retail – Cơ bản" />
            <label style={lbl}>Cấp độ *</label>
            <select style={{ ...inp, cursor:'pointer' }} name="level" required defaultValue={modal.level || 'basic'}>
              {Object.entries(LEVEL_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={lbl}>Giá tháng (VNĐ)</label>
                <input style={{ ...inp, marginBottom:0 }} name="priceMonthly" type="number" min="0"
                  defaultValue={modal.price_monthly || 0} />
              </div>
              <div>
                <label style={lbl}>Giá năm (VNĐ)</label>
                <input style={{ ...inp, marginBottom:0 }} name="priceYearly" type="number" min="0"
                  defaultValue={modal.price_yearly || 0} />
              </div>
            </div>
            <div style={{ marginTop:14 }}>
              <label style={lbl}>Mô tả</label>
              <input style={inp} name="description" defaultValue={modal.description || ''} />
            </div>
            {modal.id && (
              <>
                <label style={lbl}>Trạng thái</label>
                <select style={{ ...inp, cursor:'pointer' }} name="status" defaultValue={modal.status || 'active'}>
                  <option value="active">Đang dùng</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
              <button type="button" style={btnSecondary} onClick={() => setModal(null)}>Huỷ</button>
              <button type="submit" style={btnPrimary}>Lưu</button>
            </div>
          </form>
        </SimpleModal>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <select style={{ padding:'8px 12px', background:'rgba(255,255,255,0.05)',
            border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:9, color:'#F1F5F9',
            fontSize:14, cursor:'pointer', fontFamily:'inherit' }}
            value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Tất cả giải pháp</option>
            {solutions.map(s => <option key={s.id} value={s.id}>{s.group_name} – {s.name}</option>)}
          </select>
          <span style={{ fontSize:13, color:'#64748B' }}>{filtered.length} gói</span>
        </div>
        {isAdmin && (
          <button style={btnPrimary} onClick={() => setModal({})}>+ Thêm gói</button>
        )}
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse',
          background:'rgba(13,20,36,0.7)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' }}>
          <thead>
            <tr>
              {['Gói dịch vụ','Giải pháp','Cấp độ','Giá tháng','Giá năm','Trạng thái',''].map(h => (
                <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:12,
                  fontWeight:700, color:'#64748B', letterSpacing:'0.06em', textTransform:'uppercase',
                  borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#475569' }}>Chưa có gói nào</td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.015)' }}>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ fontWeight:600, color:'#F1F5F9', fontSize:14 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{p.description}</div>}
                </td>
                <td style={{ padding:'12px 14px', fontSize:13, color:'#94A3B8' }}>
                  <div style={{ fontSize:11, color:'#64748B' }}>{p.group_name}</div>
                  <div>{p.solution_name}</div>
                </td>
                <td style={{ padding:'12px 14px' }}><Badge level={p.level} /></td>
                <td style={{ padding:'12px 14px', fontSize:14, color:'#60A5FA', fontWeight:600 }}>{fmtVND(p.price_monthly)}/th</td>
                <td style={{ padding:'12px 14px', fontSize:14, color:'#A78BFA', fontWeight:600 }}>{fmtVND(p.price_yearly)}/năm</td>
                <td style={{ padding:'12px 14px' }}><StatusDot status={p.status} /></td>
                <td style={{ padding:'12px 14px' }}>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={btnEdit} onClick={() => setModal(p)}>Sửa</button>
                      <button style={{ ...btnSecondary, padding:'6px 10px', fontSize:12 }}
                        onClick={() => toggleStatus(p)}>
                        {p.status === 'active' ? 'Tắt' : 'Bật'}
                      </button>
                      <button style={btnDanger} onClick={() => deletePkg(p.id)}>Xóa</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 3: INDUSTRIES
// ════════════════════════════════════════════════════════════════
const IndustriesTab = ({ isAdmin }) => {
  const [industries, setIndustries] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [editName,   setEditName]   = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setIndustries(await solutionsService.getIndustries()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (modal.id) await solutionsService.updateIndustry(modal.id, editName);
      else          await solutionsService.createIndustry(editName);
      setModal(null); fetch();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  const del = async (id) => {
    if (!window.confirm('Xóa ngành nghề này?')) return;
    try { await solutionsService.deleteIndustry(id); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'Lỗi.'); }
  };

  if (loading) return <div style={{ color:'#64748B', padding:40, textAlign:'center' }}>Đang tải…</div>;

  return (
    <div>
      {modal !== null && (
        <SimpleModal title={modal.id ? 'Sửa ngành nghề' : 'Thêm ngành nghề'}
          onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <label style={lbl}>Tên ngành nghề *</label>
            <input style={inp} required value={editName}
              onChange={e => setEditName(e.target.value)} placeholder="VD: Thời trang & May mặc" />
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" style={btnSecondary} onClick={() => setModal(null)}>Huỷ</button>
              <button type="submit" style={btnPrimary}>Lưu</button>
            </div>
          </form>
        </SimpleModal>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <span style={{ fontSize:13, color:'#64748B' }}>{industries.length} ngành nghề</span>
        {isAdmin && (
          <button style={btnPrimary} onClick={() => { setModal({}); setEditName(''); }}>+ Thêm</button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10 }}>
        {industries.map(ind => (
          <div key={ind.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'11px 14px', background:'rgba(13,20,36,0.7)',
            border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
            <span style={{ fontSize:14, color:'#E2E8F0', fontWeight:500 }}>{ind.name}</span>
            {isAdmin && (
              <div style={{ display:'flex', gap:6 }}>
                <button style={btnEdit} onClick={() => { setModal(ind); setEditName(ind.name); }}>Sửa</button>
                <button style={btnDanger} onClick={() => del(ind.id)}>Xóa</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const SolutionsPage = () => {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';
  const [tab, setTab] = useState('solutions');

  const TABS = [
    { key:'solutions',  label:'Giải pháp' },
    { key:'packages',   label:'Gói dịch vụ' },
    { key:'industries', label:'Ngành nghề' },
  ];

  const s = {
    page:  { minHeight:'100vh', background:'#080E1A', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'#F1F5F9' },
    inner: { maxWidth:1200, margin:'0 auto', padding:'32px 24px' },
    tabBar:{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.04)',
             padding:4, borderRadius:10, width:'fit-content' },
    tab: (active) => ({
      padding:'8px 20px', borderRadius:8, fontSize:14, fontWeight:600,
      border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
      background: active ? 'rgba(37,99,235,0.3)' : 'transparent',
      color:       active ? '#93C5FD' : '#64748B',
    }),
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>
      <div style={s.page}>
        <div style={s.inner}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.4px', margin:'0 0 6px' }}>
              Danh mục sản phẩm
            </h1>
            <p style={{ fontSize:14, color:'#64748B', margin:0 }}>
              Quản lý nhóm giải pháp, gói dịch vụ và ngành nghề khách hàng
            </p>
          </div>

          <div style={s.tabBar}>
            {TABS.map(t => (
              <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'solutions'  && <SolutionsTab  isAdmin={isAdmin} />}
          {tab === 'packages'   && <PackagesTab   isAdmin={isAdmin} />}
          {tab === 'industries' && <IndustriesTab isAdmin={isAdmin} />}
        </div>
      </div>
    </>
  );
};

export default SolutionsPage;