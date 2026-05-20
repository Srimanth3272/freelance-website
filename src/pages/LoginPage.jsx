import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://freelance-website-4b2g.onrender.com/api';

export default function LoginPage({ onNavigate, initialData = {} }) {
  const { t, login } = useApp();
  const [step, setStep] = useState(initialData.step || 'login'); // login | role | admin
  const [loading, setLoading] = useState(false);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [isRegister, setIsRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Role selection
  const [role, setRole] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);

  // Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('kaamwala_token', data.token);
        localStorage.setItem('kaamwala_user', JSON.stringify(data.user));
        setVerifiedUser(data.user);
        setLoading(false);
        setStep('role');
      } else {
        setLoginError(data.error || 'Invalid email or password.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoginError('Cannot reach server. Please try again later.');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regEmail || !regPassword) {
      setRegError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('kaamwala_token', data.token);
        localStorage.setItem('kaamwala_user', JSON.stringify(data.user));
        setVerifiedUser(data.user);
        setLoading(false);
        setStep('role');
      } else {
        setRegError(data.error || 'Registration failed. Try a different email.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setRegError('Cannot reach server. Please try again later.');
      setLoading(false);
    }
  };

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

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    if (adminEmail === 'sreemanthnagalakunta@gmail.com' && adminPassword === 'Srimanth@3272') {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@kaamwala.com', password: 'Admin@123' }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('kaamwala_token', data.token);
          localStorage.setItem('kaamwala_user', JSON.stringify({ ...data.user, name: 'Srimanth Admin', email: adminEmail }));
        }
      } catch (err) {
        console.error('Backend admin auth failed (non-critical):', err);
      }
      login({ name: 'Srimanth Admin', email: adminEmail, role: 'admin' });
      setLoading(false);
      onNavigate('admin');
    } else {
      setAdminError('Invalid email or password');
    }
  };

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

        {/* Step: Login / Register */}
        {step === 'login' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">{isRegister ? '📝' : '🔐'}</div>
            <h2 className="login-step__title">{isRegister ? 'Create Account' : t('login')}</h2>
            <p className="login-step__subtitle">
              {isRegister ? 'Register to access KaamWala' : 'Sign in with your email & password'}
            </p>

            {/* Toggle tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
              <button
                onClick={() => { setIsRegister(false); setLoginError(''); setRegError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  background: !isRegister ? '#f97316' : 'transparent', color: !isRegister ? '#fff' : '#64748b', transition: 'all 0.2s'
                }}
              >
                Login
              </button>
              <button
                onClick={() => { setIsRegister(true); setLoginError(''); setRegError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  background: isRegister ? '#f97316' : 'transparent', color: isRegister ? '#fff' : '#64748b', transition: 'all 0.2s'
                }}
              >
                Register
              </button>
            </div>

            {/* LOGIN FORM */}
            {!isRegister && (
              <form onSubmit={handleLogin} className="login-form">
                {loginError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.88rem', border: '1px solid #fca5a5' }}>
                    ⚠️ {loginError}
                  </div>
                )}
                <div className="login-form__phone-input" style={{ marginBottom: '14px', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-form__input"
                    id="login-email"
                    required
                    autoFocus
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                </div>
                <div className="login-form__phone-input" style={{ marginBottom: '18px', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-form__input"
                    id="login-password"
                    required
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                </div>
                <button
                  type="submit"
                  className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                  disabled={loading}
                  id="login-submit-btn"
                >
                  {loading ? <span className="login-form__spinner"></span> : '🔓 Login'}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {isRegister && (
              <form onSubmit={handleRegister} className="login-form">
                {regError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.88rem', border: '1px solid #fca5a5' }}>
                    ⚠️ {regError}
                  </div>
                )}
                <div className="login-form__phone-input" style={{ marginBottom: '12px', flexDirection: 'column', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="login-form__input"
                    id="reg-name"
                    required
                    autoFocus
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                </div>
                <div className="login-form__phone-input" style={{ marginBottom: '12px', flexDirection: 'column', alignItems: 'stretch' }}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="login-form__input"
                    id="reg-email"
                    required
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                </div>
                <div className="login-form__phone-input" style={{ marginBottom: '12px', flexDirection: 'column', alignItems: 'stretch' }}>
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={regPhone}
                    maxLength={10}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    className="login-form__input"
                    id="reg-phone"
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                </div>
                <div className="login-form__phone-input" style={{ marginBottom: '18px', flexDirection: 'column', alignItems: 'stretch' }}>
                  <input
                    type="password"
                    placeholder="Create Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="login-form__input"
                    id="reg-password"
                    required
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                </div>
                <button
                  type="submit"
                  className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                  disabled={loading}
                  id="register-submit-btn"
                >
                  {loading ? <span className="login-form__spinner"></span> : '📝 Create Account'}
                </button>
              </form>
            )}

            <div className="login-divider">
              <span>{t('orContinueWith')}</span>
            </div>

            <div className="login-social">
              <button className="login-social__btn" id="google-login-btn" onClick={() => setStep('admin')}>
                <span>🛡️</span>
                Admin Portal
              </button>
            </div>
          </div>
        )}

        {/* Step: Role */}
        {step === 'role' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">👤</div>
            <h2 className="login-step__title">{t('selectRole')}</h2>
            <p className="login-step__subtitle">Choose how you want to use KaamWala</p>

            <div className="role-cards">
              <button
                className={`role-card ${role === 'customer' ? 'role-card--active' : ''}`}
                onClick={() => handleSelectRole('customer')}
                disabled={loading}
                id="role-customer-btn"
              >
                <span className="role-card__icon">🏠</span>
                <span className="role-card__title">{t('customer')}</span>
                <span className="role-card__desc">I need to hire workers for my home or office</span>
                {loading && role === 'customer' && <span className="login-form__spinner login-form__spinner--small"></span>}
              </button>

              <button
                className={`role-card ${role === 'worker' ? 'role-card--active' : ''}`}
                onClick={() => handleSelectRole('worker')}
                disabled={loading}
                id="role-worker-btn"
              >
                <span className="role-card__icon">🔧</span>
                <span className="role-card__title">{t('worker')}</span>
                <span className="role-card__desc">I am a skilled professional looking for work</span>
                {loading && role === 'worker' && <span className="login-form__spinner login-form__spinner--small"></span>}
              </button>
            </div>
          </div>
        )}

        {/* Step: Admin Login */}
        {step === 'admin' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">🛡️</div>
            <h2 className="login-step__title">Admin Portal</h2>
            <p className="login-step__subtitle">Secure access for administrators only</p>

            <form onSubmit={handleAdminSubmit} className="login-form">
              {adminError && <div className="login-error" style={{ color: 'red', marginBottom: '10px' }}>{adminError}</div>}

              <div className="login-form__phone-input" style={{ marginBottom: '15px' }}>
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="login-form__input"
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
                  required
                />
              </div>

              <div className="login-form__phone-input" style={{ marginBottom: '20px' }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="login-form__input"
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
                  required
                />
              </div>

              <button
                type="submit"
                className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                disabled={loading}
              >
                {loading ? <span className="login-form__spinner"></span> : 'Login'}
              </button>
            </form>

            <button className="login-back" onClick={() => setStep('login')} style={{ marginTop: '20px' }}>
              ← Back to main login
            </button>
          </div>
        )}

        {/* Steps indicator */}
        <div className="login-steps-indicator">
          {['login', 'role'].map((s, idx) => (
            <div key={s} className={`login-steps-dot ${step === s ? 'login-steps-dot--active' : ''} ${['login', 'role'].indexOf(step) > idx ? 'login-steps-dot--completed' : ''}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
