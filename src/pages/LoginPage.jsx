import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://freelance-website-4b2g.onrender.com/api';

async function fetchWithTimeout(url, options = {}, ms = 12000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function wakeServer(onPct) {
  for (let i = 1; i <= 8; i++) {
    onPct(Math.round((i / 8) * 90));
    try {
      const r = await fetchWithTimeout(`${API_BASE}/health`, {}, 7000);
      if (r.ok) { onPct(100); return true; }
    } catch (_) {}
    if (i < 8) await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

export default function LoginPage({ onNavigate, initialData = {} }) {
  const { t, login } = useApp();

  const [step, setStep]         = useState(initialData.step || 'login');
  const [loading, setLoading]   = useState(false);
  const [isRegister, setIsReg]  = useState(false);

  // wakeup
  const [wakePct, setWakePct]   = useState(0);
  const [wakeMsg, setWakeMsg]   = useState('');
  const pendingFn               = useRef(null);

  // login
  const [email, setEmail]       = useState('');
  const [password, setPwd]      = useState('');
  const [loginErr, setLoginErr] = useState('');

  // register
  const [rName, setRName]       = useState('');
  const [rEmail, setREmail]     = useState('');
  const [rPhone, setRPhone]     = useState('');
  const [rPwd, setRPwd]         = useState('');
  const [regErr, setRegErr]     = useState('');

  // role
  const [role, setRole]         = useState('');
  const [verUser, setVerUser]   = useState(null);

  // admin
  const [aEmail, setAEmail]     = useState('');
  const [aPwd, setAPwd]         = useState('');
  const [aErr, setAErr]         = useState('');

  /* ── server wake-up flow ──────────────────────────────────────── */
  const runWithServer = async (fn, setErr) => {
    setLoading(true); setLoginErr(''); setRegErr('');
    try {
      const probe = await fetchWithTimeout(`${API_BASE}/health`, {}, 4000);
      if (probe.ok) return await fn();
    } catch (_) {}
    // server sleeping → show wake screen
    pendingFn.current = fn;
    setStep('waking');
    setWakePct(0);
    setWakeMsg('Server is starting up. This takes ~30–60 seconds on Render free tier…');
    setLoading(false);
  };

  useEffect(() => {
    if (step !== 'waking') return;
    let dead = false;
    (async () => {
      const ok = await wakeServer(p => { if (!dead) setWakePct(p); });
      if (dead) return;
      if (ok && pendingFn.current) {
        setWakeMsg('Server is ready! Continuing…');
        setLoading(true);
        try { await pendingFn.current(); }
        catch (e) {
          setStep('login');
          setLoginErr(e.message || 'Login failed. Please try again.');
          setLoading(false);
        }
        pendingFn.current = null;
      } else {
        setWakeMsg('Server did not respond. Please try again in a minute.');
        await new Promise(r => setTimeout(r, 2500));
        if (!dead) { setStep('login'); setLoginErr('Server is unavailable. Please try again shortly.'); setLoading(false); }
      }
    })();
    return () => { dead = true; };
  }, [step]);

  /* ── login ────────────────────────────────────────────────────── */
  const handleLogin = async e => {
    e.preventDefault(); setLoginErr('');
    await runWithServer(async () => {
      const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, 10000);
      const d = await res.json();
      if (res.ok && d.token) {
        localStorage.setItem('kaamwala_token', d.token);
        localStorage.setItem('kaamwala_user', JSON.stringify(d.user));
        setVerUser(d.user); setLoading(false); setStep('role');
      } else {
        setLoading(false); setStep('login');
        setLoginErr(d.error || 'Invalid email or password.');
      }
    }, setLoginErr);
  };

  /* ── register ─────────────────────────────────────────────────── */
  const handleRegister = async e => {
    e.preventDefault(); setRegErr('');
    if (!rName || !rEmail || !rPwd) { setRegErr('All fields are required.'); return; }
    await runWithServer(async () => {
      const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, email: rEmail, phone: rPhone, password: rPwd }),
      }, 10000);
      const d = await res.json();
      if (res.ok && d.token) {
        localStorage.setItem('kaamwala_token', d.token);
        localStorage.setItem('kaamwala_user', JSON.stringify(d.user));
        setVerUser(d.user); setLoading(false); setStep('role');
      } else {
        setLoading(false); setStep('login');
        setRegErr(d.error || 'Registration failed. Try a different email.');
      }
    }, setRegErr);
  };

  /* ── role ─────────────────────────────────────────────────────── */
  const handleRole = sel => {
    setRole(sel); setLoading(true);
    const ud = verUser || { name: 'User', email };
    setTimeout(() => { login({ ...ud, role: sel }); setLoading(false); onNavigate('home'); }, 800);
  };

  /* ── admin (client-side credential check, server optional) ────── */
  const handleAdmin = async e => {
    e.preventDefault(); setAErr('');
    if (aEmail !== 'sreemanthnagalakunta@gmail.com' || aPwd !== 'Srimanth@3272') {
      setAErr('Invalid email or password.'); return;
    }
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@kaamwala.com', password: 'Admin@123' }),
      }, 6000);
      const d = await res.json();
      if (res.ok && d.token) {
        localStorage.setItem('kaamwala_token', d.token);
        localStorage.setItem('kaamwala_user', JSON.stringify({ ...d.user, name: 'Srimanth Admin', email: aEmail }));
      }
    } catch (_) { /* non-critical — admin still logs in */ }
    login({ name: 'Srimanth Admin', email: aEmail, role: 'admin' });
    setLoading(false);
    onNavigate('admin');
  };

  /* ── shared styles ────────────────────────────────────────────── */
  const tabBtn = active => ({
    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.9rem', transition: 'all .2s',
    background: active ? '#f97316' : 'transparent', color: active ? '#fff' : '#64748b',
  });
  const fieldWrap = { marginBottom: '14px', flexDirection: 'column', alignItems: 'stretch', gap: 0 };
  const inputCss  = { width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' };
  const errBox = msg => msg && (
    <div style={{ background:'#fee2e2', color:'#dc2626', borderRadius:'8px', padding:'10px 14px',
      marginBottom:'14px', fontSize:'0.86rem', border:'1px solid #fca5a5', lineHeight:1.5 }}>
      ⚠️ {msg}
    </div>
  );

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="login-page" id="login-page">
      <div className="login-bg">
        <div className="login-bg__orb login-bg__orb--1" />
        <div className="login-bg__orb login-bg__orb--2" />
        <div className="login-bg__orb login-bg__orb--3" />
        <div className="login-bg__pattern" />
      </div>

      <div className="login-card animate-scaleIn">
        <div className="login-card__header">
          <button className="login-card__logo" onClick={() => onNavigate('home')}>
            <span>🏠</span>
            <span className="login-card__logo-text">{t('appName')}</span>
          </button>
        </div>

        {/* ── SERVER WAKING ──────────────────────────────────────── */}
        {step === 'waking' && (
          <div className="login-step animate-fadeInUp" style={{ textAlign:'center' }}>
            <div className="login-step__icon">⏳</div>
            <h2 className="login-step__title">Starting Server…</h2>
            <p className="login-step__subtitle" style={{ fontSize:'0.84rem', lineHeight:1.6, color:'#64748b' }}>
              {wakeMsg}
            </p>
            <div style={{ margin:'18px 0', background:'#f1f5f9', borderRadius:'99px', height:'10px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'99px',
                background:'linear-gradient(90deg,#f97316,#fb923c)',
                width:`${wakePct}%`, transition:'width .6s ease' }} />
            </div>
            <p style={{ fontSize:'0.78rem', color:'#94a3b8', marginBottom:'22px' }}>
              {wakePct < 100 ? `${wakePct}% — Keep this tab open` : '✅ Ready!'}
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'24px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%',
                  background:'#f97316', animation:`pulse 1.4s ${i*0.2}s ease-in-out infinite` }} />
              ))}
            </div>
            <button className="login-back"
              onClick={() => { pendingFn.current=null; setStep('login'); setLoading(false); }}>
              ← Cancel &amp; go back
            </button>
          </div>
        )}

        {/* ── LOGIN / REGISTER ───────────────────────────────────── */}
        {step === 'login' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">{isRegister ? '📝' : '🔐'}</div>
            <h2 className="login-step__title">{isRegister ? 'Create Account' : t('login')}</h2>
            <p className="login-step__subtitle">
              {isRegister ? 'Register to access KaamWala' : 'Sign in with your email & password'}
            </p>

            {/* tabs */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'18px',
              background:'#f1f5f9', borderRadius:'10px', padding:'4px' }}>
              <button style={tabBtn(!isRegister)}
                onClick={() => { setIsReg(false); setLoginErr(''); setRegErr(''); }}>Login</button>
              <button style={tabBtn(isRegister)}
                onClick={() => { setIsReg(true); setLoginErr(''); setRegErr(''); }}>Register</button>
            </div>

            {/* LOGIN */}
            {!isRegister && (
              <form onSubmit={handleLogin} className="login-form">
                {errBox(loginErr)}
                <div className="login-form__phone-input" style={fieldWrap}>
                  <input type="email" placeholder="Email address" value={email} autoFocus required
                    onChange={e => setEmail(e.target.value)} className="login-form__input"
                    id="login-email" style={inputCss} />
                </div>
                <div className="login-form__phone-input" style={{ ...fieldWrap, marginBottom:'18px' }}>
                  <input type="password" placeholder="Password" value={password} required
                    onChange={e => setPwd(e.target.value)} className="login-form__input"
                    id="login-password" style={inputCss} />
                </div>
                <button type="submit" id="login-submit-btn"
                  className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                  disabled={loading}>
                  {loading ? <span className="login-form__spinner" /> : '🔓 Login'}
                </button>
              </form>
            )}

            {/* REGISTER */}
            {isRegister && (
              <form onSubmit={handleRegister} className="login-form">
                {errBox(regErr)}
                {[
                  { ph:'Full Name', val:rName, fn:setRName, type:'text',   id:'reg-name',  req:true, autoFocus:true },
                  { ph:'Email address', val:rEmail, fn:setREmail, type:'email', id:'reg-email', req:true },
                  { ph:'Phone (optional)', val:rPhone, fn:v=>setRPhone(v.replace(/\D/g,'')), type:'tel', id:'reg-phone', max:10 },
                  { ph:'Create Password', val:rPwd,  fn:setRPwd,  type:'password', id:'reg-pwd',   req:true },
                ].map(f => (
                  <div key={f.id} className="login-form__phone-input"
                    style={{ ...fieldWrap, marginBottom: f.id==='reg-pwd'?'18px':'14px' }}>
                    <input type={f.type} placeholder={f.ph} value={f.val} required={f.req}
                      autoFocus={f.autoFocus} maxLength={f.max}
                      onChange={e => f.fn(e.target.value)} className="login-form__input"
                      id={f.id} style={inputCss} />
                  </div>
                ))}
                <button type="submit" id="register-submit-btn"
                  className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                  disabled={loading}>
                  {loading ? <span className="login-form__spinner" /> : '📝 Create Account'}
                </button>
              </form>
            )}

            <div className="login-divider"><span>{t('orContinueWith')}</span></div>
            <div className="login-social">
              <button className="login-social__btn" id="admin-portal-btn"
                onClick={() => setStep('admin')}>
                <span>🛡️</span> Admin Portal
              </button>
            </div>
          </div>
        )}

        {/* ── ROLE SELECT ────────────────────────────────────────── */}
        {step === 'role' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">👤</div>
            <h2 className="login-step__title">{t('selectRole')}</h2>
            <p className="login-step__subtitle">Choose how you want to use KaamWala</p>
            <div className="role-cards">
              {[
                { r:'customer', icon:'🏠', title:t('customer'), desc:'I need to hire workers for my home or office' },
                { r:'worker',   icon:'🔧', title:t('worker'),   desc:'I am a skilled professional looking for work' },
              ].map(({ r, icon, title, desc }) => (
                <button key={r} id={`role-${r}-btn`} disabled={loading}
                  className={`role-card ${role===r ? 'role-card--active' : ''}`}
                  onClick={() => handleRole(r)}>
                  <span className="role-card__icon">{icon}</span>
                  <span className="role-card__title">{title}</span>
                  <span className="role-card__desc">{desc}</span>
                  {loading && role===r && <span className="login-form__spinner login-form__spinner--small" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN LOGIN ────────────────────────────────────────── */}
        {step === 'admin' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">🛡️</div>
            <h2 className="login-step__title">Admin Portal</h2>
            <p className="login-step__subtitle">Secure access for administrators only</p>
            <form onSubmit={handleAdmin} className="login-form">
              {aErr && <div style={{ color:'#dc2626', marginBottom:'10px', fontSize:'0.9rem' }}>{aErr}</div>}
              <div className="login-form__phone-input" style={{ marginBottom:'14px' }}>
                <input type="email" placeholder="Admin Email" value={aEmail} required
                  onChange={e => setAEmail(e.target.value)} className="login-form__input"
                  style={{ width:'100%', border:'none', outline:'none', background:'transparent' }} />
              </div>
              <div className="login-form__phone-input" style={{ marginBottom:'20px' }}>
                <input type="password" placeholder="Password" value={aPwd} required
                  onChange={e => setAPwd(e.target.value)} className="login-form__input"
                  style={{ width:'100%', border:'none', outline:'none', background:'transparent' }} />
              </div>
              <button type="submit"
                className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                disabled={loading}>
                {loading ? <span className="login-form__spinner" /> : '🛡️ Login as Admin'}
              </button>
            </form>
            <button className="login-back" onClick={() => setStep('login')} style={{ marginTop:'20px' }}>
              ← Back to main login
            </button>
          </div>
        )}

        {step !== 'waking' && (
          <div className="login-steps-indicator">
            {['login','role'].map((s, i) => (
              <div key={s} className={`login-steps-dot
                ${step===s ? 'login-steps-dot--active' : ''}
                ${['login','role'].indexOf(step) > i ? 'login-steps-dot--completed' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}
