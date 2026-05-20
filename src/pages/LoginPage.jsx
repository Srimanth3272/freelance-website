import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://freelance-website-4b2g.onrender.com/api';

// ── Utility: fetch with timeout ──────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ── Wake-up: ping /api/health until it responds (Render free tier) ───────────
async function wakeUpServer(onProgress) {
  const MAX_ATTEMPTS = 8;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    onProgress(Math.round((i / MAX_ATTEMPTS) * 90));
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 8000);
      if (res.ok) { onProgress(100); return true; }
    } catch (_) { /* still sleeping */ }
    if (i < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

export default function LoginPage({ onNavigate, initialData = {} }) {
  const { t, login } = useApp();

  // step: 'login' | 'waking' | 'role' | 'admin'
  const [step, setStep] = useState(initialData.step || 'login');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Wakeup progress
  const [wakeProgress, setWakeProgress] = useState(0);
  const [wakeMsg, setWakeMsg] = useState('');
  const pendingAction = useRef(null); // function to call after server wakes

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Role
  const [role, setRole] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);

  // Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // ── Wake server then run action ──────────────────────────────────────────
  const withServer = async (action, setErr) => {
    setLoading(true);
    setLoginError('');
    setRegError('');
    // First quick probe
    try {
      const probe = await fetchWithTimeout(`${API_BASE}/health`, {}, 4000);
      if (probe.ok) {
        // Server is already awake — run immediately
        return await action();
      }
    } catch (_) {}

    // Server is sleeping — show wake-up screen
    pendingAction.current = action;
    setStep('waking');
    setWakeProgress(0);
    setWakeMsg('Starting server, please wait…');
    setLoading(false);
  };

  // Runs automatically whenever we enter 'waking' step
  useEffect(() => {
    if (step !== 'waking') return;
    let cancelled = false;
    (async () => {
      setWakeMsg('The server is waking up from sleep (Render free tier). This takes ~30–60 seconds…');
      const ok = await wakeUpServer((pct) => {
        if (!cancelled) setWakeProgress(pct);
      });
      if (cancelled) return;
      if (ok && pendingAction.current) {
        setWakeMsg('Server is ready! Logging you in…');
        setLoading(true);
        try {
          await pendingAction.current();
        } catch (err) {
          setStep('login');
          setLoginError(err.message || 'Login failed. Please try again.');
          setLoading(false);
        }
        pendingAction.current = null;
      } else {
        setWakeMsg('⚠️ Server did not respond. Using offline demo mode instead.');
        await new Promise(r => setTimeout(r, 2000));
        if (!cancelled) {
          // Offer offline fallback
          setStep('login');
          setLoginError('Server unreachable. Use the "Demo Login" button below to explore the app offline.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [step]);

  // ── Demo / Offline login (no server needed) ──────────────────────────────
  const handleDemoLogin = (demoRole) => {
    const demoUser = {
      id: 'demo_' + Date.now(),
      name: demoRole === 'admin' ? 'Demo Admin' : demoRole === 'worker' ? 'Demo Worker' : 'Demo Customer',
      email: `demo_${demoRole}@kaamwala.demo`,
      role: demoRole,
    };
    localStorage.setItem('kaamwala_user', JSON.stringify(demoUser));
    login(demoUser);
    if (demoRole === 'admin') onNavigate('admin');
    else onNavigate('home');
  };

  // ── Login handler ────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const action = async () => {
      const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, 10000);
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('kaamwala_token', data.token);
        localStorage.setItem('kaamwala_user', JSON.stringify(data.user));
        setVerifiedUser(data.user);
        setLoading(false);
        setStep('role');
      } else {
        setLoading(false);
        setStep('login');
        setLoginError(data.error || 'Invalid email or password.');
      }
    };

    await withServer(action, setLoginError);
  };

  // ── Register handler ─────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regEmail || !regPassword) {
      setRegError('All fields are required.');
      return;
    }

    const action = async () => {
      const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword }),
      }, 10000);
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('kaamwala_token', data.token);
        localStorage.setItem('kaamwala_user', JSON.stringify(data.user));
        setVerifiedUser(data.user);
        setLoading(false);
        setStep('role');
      } else {
        setLoading(false);
        setStep('login');
        setRegError(data.error || 'Registration failed. Try a different email.');
      }
    };

    await withServer(action, setRegError);
  };

  // ── Role select ──────────────────────────────────────────────────────────
  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setLoading(true);
    const userData = verifiedUser || { name: 'User', email };
    setTimeout(() => {
      login({ ...userData, role: selectedRole });
      setLoading(false);
      onNavigate('home');
    }, 800);
  };

  // ── Admin login (client-side check, no server needed) ────────────────────
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    if (adminEmail === 'sreemanthnagalakunta@gmail.com' && adminPassword === 'Srimanth@3272') {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@kaamwala.com', password: 'Admin@123' }),
        }, 6000);
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('kaamwala_token', data.token);
          localStorage.setItem('kaamwala_user', JSON.stringify({ ...data.user, name: 'Srimanth Admin', email: adminEmail }));
        }
      } catch (_) { /* non-critical: continue even if backend is down */ }
      login({ name: 'Srimanth Admin', email: adminEmail, role: 'admin' });
      setLoading(false);
      onNavigate('admin');
    } else {
      setAdminError('Invalid email or password');
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const tabBtn = (active) => ({
    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
    background: active ? '#f97316' : 'transparent',
    color: active ? '#fff' : '#64748b',
  });

  const inputWrap = { marginBottom: '14px' };
  const inputStyle = { width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="login-page" id="login-page">
      <div className="login-bg">
        <div className="login-bg__orb login-bg__orb--1"></div>
        <div className="login-bg__orb login-bg__orb--2"></div>
        <div className="login-bg__orb login-bg__orb--3"></div>
        <div className="login-bg__pattern"></div>
      </div>

      <div className="login-card animate-scaleIn">
        <div className="login-card__header">
          <button className="login-card__logo" onClick={() => onNavigate('home')}>
            <span>🏠</span>
            <span className="login-card__logo-text">{t('appName')}</span>
          </button>
        </div>

        {/* ── WAKING UP SCREEN ─────────────────────────────────────────── */}
        {step === 'waking' && (
          <div className="login-step animate-fadeInUp" style={{ textAlign: 'center' }}>
            <div className="login-step__icon">⏳</div>
            <h2 className="login-step__title">Starting Server…</h2>
            <p className="login-step__subtitle" style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
              {wakeMsg}
            </p>

            {/* Progress bar */}
            <div style={{ margin: '20px 0', background: '#f1f5f9', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
                width: `${wakeProgress}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '24px' }}>
              {wakeProgress < 100 ? `${wakeProgress}% — Please keep this tab open` : '✅ Ready!'}
            </p>

            {/* Animated dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#f97316', opacity: 0.4,
                  animation: `pulse 1.4s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>

            {/* Skip: use demo mode while waiting */}
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px' }}>
              Don't want to wait?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button
                onClick={() => handleDemoLogin('customer')}
                style={{ padding: '10px', borderRadius: '10px', border: '1.5px solid #f97316', background: 'transparent', color: '#f97316', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                🏠 Continue as Demo Customer
              </button>
              <button
                onClick={() => handleDemoLogin('worker')}
                style={{ padding: '10px', borderRadius: '10px', border: '1.5px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                🔧 Continue as Demo Worker
              </button>
            </div>

            <button className="login-back" onClick={() => { pendingAction.current = null; setStep('login'); setLoading(false); }} style={{ marginTop: '16px' }}>
              ← Cancel
            </button>
          </div>
        )}

        {/* ── LOGIN / REGISTER ─────────────────────────────────────────── */}
        {step === 'login' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">{isRegister ? '📝' : '🔐'}</div>
            <h2 className="login-step__title">{isRegister ? 'Create Account' : t('login')}</h2>
            <p className="login-step__subtitle">
              {isRegister ? 'Register to access KaamWala' : 'Sign in with your email & password'}
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
              <button style={tabBtn(!isRegister)} onClick={() => { setIsRegister(false); setLoginError(''); setRegError(''); }}>Login</button>
              <button style={tabBtn(isRegister)} onClick={() => { setIsRegister(true); setLoginError(''); setRegError(''); }}>Register</button>
            </div>

            {/* ── LOGIN FORM ── */}
            {!isRegister && (
              <form onSubmit={handleLogin} className="login-form">
                {loginError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.86rem', border: '1px solid #fca5a5', lineHeight: 1.5 }}>
                    ⚠️ {loginError}
                  </div>
                )}
                <div className="login-form__phone-input" style={{ ...inputWrap, flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                  <input type="email" placeholder="Email address" value={email}
                    onChange={e => setEmail(e.target.value)} className="login-form__input"
                    id="login-email" required autoFocus style={inputStyle} />
                </div>
                <div className="login-form__phone-input" style={{ ...inputWrap, marginBottom: '18px', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                  <input type="password" placeholder="Password" value={password}
                    onChange={e => setPassword(e.target.value)} className="login-form__input"
                    id="login-password" required style={inputStyle} />
                </div>
                <button type="submit" className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                  disabled={loading} id="login-submit-btn">
                  {loading ? <span className="login-form__spinner"></span> : '🔓 Login'}
                </button>

                {/* Demo login shortcut */}
                <div style={{ marginTop: '14px', padding: '12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: '0.78rem', color: '#92400e', margin: '0 0 8px 0', fontWeight: 600 }}>⚡ Try without server (Demo Mode)</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => handleDemoLogin('customer')}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: '7px', border: '1px solid #f97316', background: '#fff7ed', color: '#c2410c', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      🏠 Customer
                    </button>
                    <button type="button" onClick={() => handleDemoLogin('worker')}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: '7px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      🔧 Worker
                    </button>
                    <button type="button" onClick={() => handleDemoLogin('admin')}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: '7px', border: '1px solid #8b5cf6', background: '#f5f3ff', color: '#6d28d9', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      🛡️ Admin
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {isRegister && (
              <form onSubmit={handleRegister} className="login-form">
                {regError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.86rem', border: '1px solid #fca5a5', lineHeight: 1.5 }}>
                    ⚠️ {regError}
                  </div>
                )}
                <div className="login-form__phone-input" style={{ ...inputWrap, flexDirection: 'column', alignItems: 'stretch' }}>
                  <input type="text" placeholder="Full Name" value={regName}
                    onChange={e => setRegName(e.target.value)} className="login-form__input"
                    id="reg-name" required autoFocus style={inputStyle} />
                </div>
                <div className="login-form__phone-input" style={{ ...inputWrap, flexDirection: 'column', alignItems: 'stretch' }}>
                  <input type="email" placeholder="Email address" value={regEmail}
                    onChange={e => setRegEmail(e.target.value)} className="login-form__input"
                    id="reg-email" required style={inputStyle} />
                </div>
                <div className="login-form__phone-input" style={{ ...inputWrap, flexDirection: 'column', alignItems: 'stretch' }}>
                  <input type="tel" placeholder="Phone (optional)" value={regPhone} maxLength={10}
                    onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))} className="login-form__input"
                    id="reg-phone" style={inputStyle} />
                </div>
                <div className="login-form__phone-input" style={{ marginBottom: '18px', flexDirection: 'column', alignItems: 'stretch' }}>
                  <input type="password" placeholder="Create Password" value={regPassword}
                    onChange={e => setRegPassword(e.target.value)} className="login-form__input"
                    id="reg-password" required style={inputStyle} />
                </div>
                <button type="submit" className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                  disabled={loading} id="register-submit-btn">
                  {loading ? <span className="login-form__spinner"></span> : '📝 Create Account'}
                </button>
              </form>
            )}

            <div className="login-divider"><span>{t('orContinueWith')}</span></div>
            <div className="login-social">
              <button className="login-social__btn" id="admin-portal-btn" onClick={() => setStep('admin')}>
                <span>🛡️</span> Admin Portal
              </button>
            </div>
          </div>
        )}

        {/* ── ROLE SELECT ───────────────────────────────────────────────── */}
        {step === 'role' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">👤</div>
            <h2 className="login-step__title">{t('selectRole')}</h2>
            <p className="login-step__subtitle">Choose how you want to use KaamWala</p>
            <div className="role-cards">
              <button className={`role-card ${role === 'customer' ? 'role-card--active' : ''}`}
                onClick={() => handleSelectRole('customer')} disabled={loading} id="role-customer-btn">
                <span className="role-card__icon">🏠</span>
                <span className="role-card__title">{t('customer')}</span>
                <span className="role-card__desc">I need to hire workers for my home or office</span>
                {loading && role === 'customer' && <span className="login-form__spinner login-form__spinner--small"></span>}
              </button>
              <button className={`role-card ${role === 'worker' ? 'role-card--active' : ''}`}
                onClick={() => handleSelectRole('worker')} disabled={loading} id="role-worker-btn">
                <span className="role-card__icon">🔧</span>
                <span className="role-card__title">{t('worker')}</span>
                <span className="role-card__desc">I am a skilled professional looking for work</span>
                {loading && role === 'worker' && <span className="login-form__spinner login-form__spinner--small"></span>}
              </button>
            </div>
          </div>
        )}

        {/* ── ADMIN LOGIN ───────────────────────────────────────────────── */}
        {step === 'admin' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">🛡️</div>
            <h2 className="login-step__title">Admin Portal</h2>
            <p className="login-step__subtitle">Secure access for administrators only</p>
            <form onSubmit={handleAdminSubmit} className="login-form">
              {adminError && <div style={{ color: '#dc2626', marginBottom: '10px', fontSize: '0.9rem' }}>{adminError}</div>}
              <div className="login-form__phone-input" style={{ marginBottom: '14px' }}>
                <input type="email" placeholder="Admin Email" value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)} className="login-form__input"
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} required />
              </div>
              <div className="login-form__phone-input" style={{ marginBottom: '20px' }}>
                <input type="password" placeholder="Password" value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)} className="login-form__input"
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} required />
              </div>
              <button type="submit" className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`} disabled={loading}>
                {loading ? <span className="login-form__spinner"></span> : 'Login as Admin'}
              </button>
            </form>
            <button className="login-back" onClick={() => setStep('login')} style={{ marginTop: '20px' }}>
              ← Back to main login
            </button>
          </div>
        )}

        {/* Steps indicator */}
        {step !== 'waking' && (
          <div className="login-steps-indicator">
            {['login', 'role'].map((s, idx) => (
              <div key={s} className={`login-steps-dot ${step === s ? 'login-steps-dot--active' : ''} ${['login', 'role'].indexOf(step) > idx ? 'login-steps-dot--completed' : ''}`}></div>
            ))}
          </div>
        )}
      </div>

      {/* Pulse keyframes for wakeup dots */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
