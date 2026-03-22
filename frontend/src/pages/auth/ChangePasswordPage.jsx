/**
 * @file     frontend/src/pages/auth/ChangePasswordPage.jsx
 * @location frontend/src/pages/auth/
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang đổi mật khẩu cá nhân.
 *   - Form: mật khẩu hiện tại + mật khẩu mới + xác nhận
 *   - Validation client: độ dài, pattern, xác nhận khớp
 *   - Gọi useChangePassword hook
 *   - Sau thành công: hiển thị countdown → redirect /login
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import useChangePassword from '../../hooks/useChangePassword';

// ── Icons ─────────────────────────────────────────────────────────
const EyeIcon = ({ open }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

// ── Password strength ─────────────────────────────────────────────
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[a-z]/.test(pw))        score++;
  if (/\d/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–5
};

const STRENGTH_LABELS = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
const STRENGTH_COLORS = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'];

const StrengthBar = ({ password }) => {
  if (!password) return null;
  const s = getStrength(password);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 4,
            background: i <= s ? STRENGTH_COLORS[s] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: STRENGTH_COLORS[s], fontWeight: 600 }}>
        {STRENGTH_LABELS[s]}
      </span>
    </div>
  );
};

// ── Requirement check ─────────────────────────────────────────────
const Req = ({ ok, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
    <div style={{
      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: ok ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
      border: `1.5px solid ${ok ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.12)'}`,
      transition: 'all 0.2s',
    }}>
      {ok && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
    </div>
    <span style={{ fontSize: 12.5, color: ok ? '#6EE7B7' : '#64748B', transition: 'color 0.2s' }}>
      {text}
    </span>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────
const ChangePasswordPage = () => {
  const { user } = useAuth();
  const { loading, error, success, submit } = useChangePassword();

  const [oldPw,     setOldPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show,      setShow]      = useState({ old: false, new: false, confirm: false });
  const [focused,   setFocused]   = useState('');
  const [clientErr, setClientErr] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Countdown sau success
  useEffect(() => {
    if (!success) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [success]);

  const toggleShow = (field) => setShow(p => ({ ...p, [field]: !p[field] }));

  const validate = () => {
    if (!oldPw) return 'Vui lòng nhập mật khẩu hiện tại.';
    if (newPw.length < 8) return 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(newPw)) return 'Mật khẩu mới phải có chữ hoa, chữ thường và số.';
    if (newPw === oldPw) return 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
    if (newPw !== confirmPw) return 'Xác nhận mật khẩu không khớp.';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setClientErr(err); return; }
    setClientErr('');
    submit(oldPw, newPw);
  };

  const reqs = {
    len:    newPw.length >= 8,
    upper:  /[A-Z]/.test(newPw),
    lower:  /[a-z]/.test(newPw),
    digit:  /\d/.test(newPw),
    diff:   newPw !== oldPw && newPw.length > 0,
  };

  const s = {
    page: {
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 40% 30%, rgba(37,99,235,0.07) 0%, transparent 70%), #080E1A',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column',
    },
    topBar: {
      padding: '16px 24px',
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    backBtn: {
      display: 'flex', alignItems: 'center', gap: 8,
      color: '#64748B', textDecoration: 'none', fontSize: 14, fontWeight: 500,
      transition: 'color 0.15s',
    },
    main: {
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    },
    card: {
      width: '100%', maxWidth: 480,
      background: 'rgba(13,20,36,0.9)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, backdropFilter: 'blur(24px)',
      padding: '44px 40px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
    },
    avatar: {
      width: 52, height: 52, borderRadius: 14,
      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 24,
      boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
    },
    heading: { fontSize: 24, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.4px', marginBottom: 6 },
    sub: { fontSize: 14, color: '#64748B', marginBottom: 32, lineHeight: 1.5 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 8, letterSpacing: '0.02em' },
    fieldWrap: { marginBottom: 20 },
    inputWrap: { position: 'relative' },
    input: (f) => ({
      width: '100%', boxSizing: 'border-box',
      padding: '12px 44px 12px 14px',
      background: focused === f ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${focused === f ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10, color: '#F1F5F9', fontSize: 15, outline: 'none',
      transition: 'all 0.2s', fontFamily: 'inherit',
      boxShadow: focused === f ? '0 0 0 4px rgba(37,99,235,0.12)' : 'none',
    }),
    eyeBtn: {
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
      display: 'flex', padding: 4, transition: 'color 0.15s',
    },
    errorBox: {
      padding: '11px 14px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 10, marginBottom: 20,
      fontSize: 13.5, color: '#FCA5A5', lineHeight: 1.5,
    },
    reqsBox: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, padding: '14px 16px', marginTop: 12,
    },
    reqTitle: { fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' },
    btn: {
      width: '100%', padding: '13px',
      background: loading ? 'rgba(37,99,235,0.6)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      border: 'none', borderRadius: 10, color: '#fff',
      fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
      fontFamily: 'inherit', letterSpacing: '-0.2px', marginTop: 8,
    },
    spinner: {
      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid #fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    },
    successBox: {
      textAlign: 'center', padding: '32px 16px',
    },
    successIcon: {
      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
      background: 'rgba(16,185,129,0.15)',
      border: '2px solid rgba(16,185,129,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  };

  if (success) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.page}>
          <div style={s.topBar} />
          <div style={s.main}>
            <div style={s.card}>
              <div style={s.successBox}>
                <div style={s.successIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>Đổi mật khẩu thành công!</div>
                <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                  Phiên đăng nhập đã bị thu hồi để bảo mật.<br />
                  Bạn sẽ được chuyển về trang đăng nhập sau <strong style={{ color: '#10B981' }}>{countdown}s</strong>.
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #10B981, #059669)',
                    width: `${(countdown / 3) * 100}%`,
                    transition: 'width 1s linear',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px rgba(13,20,36,0.95) inset !important;
          -webkit-text-fill-color: #F1F5F9 !important;
        }
      `}</style>

      <div style={s.page}>
        <div style={s.topBar}>
          <Link to="/dashboard" style={s.backBtn}
            onMouseEnter={e => e.currentTarget.style.color='#94A3B8'}
            onMouseLeave={e => e.currentTarget.style.color='#64748B'}
          >
            <ArrowLeftIcon />
            Quay lại Dashboard
          </Link>
        </div>

        <div style={s.main}>
          <div style={s.card}>
            <div style={s.avatar}>
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <h1 style={s.heading}>Đổi mật khẩu</h1>
            <p style={s.sub}>
              Tài khoản: <strong style={{ color: '#94A3B8' }}>{user?.email}</strong>
            </p>

            {(error || clientErr) && (
              <div style={s.errorBox}>{clientErr || error}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Old password */}
              <div style={s.fieldWrap}>
                <label style={s.label} htmlFor="oldPw">Mật khẩu hiện tại</label>
                <div style={s.inputWrap}>
                  <input
                    id="oldPw" type={show.old ? 'text' : 'password'}
                    value={oldPw} onChange={e => setOldPw(e.target.value)}
                    onFocus={() => setFocused('old')} onBlur={() => setFocused('')}
                    style={s.input('old')} placeholder="Mật khẩu đang dùng" disabled={loading}
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => toggleShow('old')} tabIndex={-1}>
                    <EyeIcon open={show.old} />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div style={s.fieldWrap}>
                <label style={s.label} htmlFor="newPw">Mật khẩu mới</label>
                <div style={s.inputWrap}>
                  <input
                    id="newPw" type={show.new ? 'text' : 'password'}
                    value={newPw} onChange={e => setNewPw(e.target.value)}
                    onFocus={() => setFocused('new')} onBlur={() => setFocused('')}
                    style={s.input('new')} placeholder="Ít nhất 8 ký tự" disabled={loading}
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => toggleShow('new')} tabIndex={-1}>
                    <EyeIcon open={show.new} />
                  </button>
                </div>

                {newPw && <StrengthBar password={newPw} />}

                {newPw && (
                  <div style={s.reqsBox}>
                    <div style={s.reqTitle}>Yêu cầu mật khẩu</div>
                    <Req ok={reqs.len}   text="Ít nhất 8 ký tự" />
                    <Req ok={reqs.upper} text="Ít nhất 1 chữ hoa (A-Z)" />
                    <Req ok={reqs.lower} text="Ít nhất 1 chữ thường (a-z)" />
                    <Req ok={reqs.digit} text="Ít nhất 1 chữ số (0-9)" />
                    <Req ok={reqs.diff}  text="Khác với mật khẩu hiện tại" />
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div style={s.fieldWrap}>
                <label style={s.label} htmlFor="confirmPw">Xác nhận mật khẩu mới</label>
                <div style={s.inputWrap}>
                  <input
                    id="confirmPw" type={show.confirm ? 'text' : 'password'}
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')}
                    style={{
                      ...s.input('confirm'),
                      border: `1.5px solid ${
                        confirmPw && confirmPw !== newPw
                          ? 'rgba(239,68,68,0.5)'
                          : confirmPw && confirmPw === newPw
                          ? 'rgba(16,185,129,0.5)'
                          : focused === 'confirm' ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.08)'
                      }`,
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={loading}
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => toggleShow('confirm')} tabIndex={-1}>
                    <EyeIcon open={show.confirm} />
                  </button>
                </div>
                {confirmPw && confirmPw !== newPw && (
                  <div style={{ fontSize: 12.5, color: '#EF4444', marginTop: 6 }}>
                    Mật khẩu xác nhận chưa khớp
                  </div>
                )}
              </div>

              <button type="submit" style={s.btn} disabled={loading}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {loading ? <><div style={s.spinner}/>Đang cập nhật…</> : 'Đổi mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordPage;