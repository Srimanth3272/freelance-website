import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

export default function LoginPage({ onNavigate, initialData = {} }) {
  const { t, login } = useApp();
  const [step, setStep] = useState(initialData.step || 'phone'); // phone → otp → role → admin
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const [otpError, setOtpError] = useState('');
  const [demoSms, setDemoSms] = useState(null);

  // Store server OTP for auto-fill, and verified user data for persistence
  const serverOtpRef = useRef(null);
  const verifiedDataRef = useRef(null);

  const handleSendOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (phone.length >= 10) {
      setLoading(true);
      setOtpError('');
      setOtp(['', '', '', '', '', '']);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE}/auth/login/phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (res.ok) {
          setLoading(false);
          setStep('otp');
          
          // Store OTP for auto-fill and display the simulated SMS notification
          if(data.mockOtpMessage) {
            serverOtpRef.current = data.mockOtpMessage;
            setDemoSms(data.mockOtpMessage);
            setTimeout(() => setDemoSms(null), 10000);

            // Auto-fill the OTP after 1.5s to simulate SMS auto-read
            setTimeout(() => {
              const otpDigits = data.mockOtpMessage.split('');
              setOtp(otpDigits);
              // Auto-verify after auto-fill
              setTimeout(() => {
                autoVerifyOtp(otpDigits.join(''));
              }, 500);
            }, 1500);
          }
        } else {
          setLoading(false);
          alert('Failed to send OTP. Is the backend running?');
        }
      } catch (err) {
        setLoading(false);
        console.error(err);
        alert('Server error while sending OTP.');
      }
    }
  };

  // Auto-verify OTP without going through handleOtpChange
  const autoVerifyOtp = async (otpString) => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/auth/login/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString })
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.verified) {
        // Store token and user data for persistence
        if (data.token) {
          localStorage.setItem('kaamwala_token', data.token);
          localStorage.setItem('kaamwala_user', JSON.stringify(data.user));
        }
        verifiedDataRef.current = data;
        setStep('role');
      } else {
        setOtpError(data.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-input-0')?.focus();
      }
    } catch(err) {
      setLoading(false);
      setOtpError('Failed to verify OTP with server.');
    }
  };

  const handleOtpChange = async (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
    if (newOtp.every(d => d !== '')) {
      const enteredOtp = newOtp.join('');
      await autoVerifyOtp(enteredOtp);
    }
  };

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setLoading(true);

    // Use verified data from OTP step if available
    const userData = verifiedDataRef.current?.user || { name: 'User', phone };

    setTimeout(() => {
      login({
        ...userData,
        name: userData.name || 'User',
        phone: userData.phone || phone,
        role: selectedRole,
      });
      setLoading(false);
      onNavigate('home');
    }, 1000);
  };

  const handleAdminGoogleLogin = () => {
    setStep('admin');
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    if (adminEmail === 'sreemanthnagalakunta@gmail.com' && adminPassword === 'Srimanth@3272') {
      setLoading(true);
      try {
        // Authenticate with backend using the server's admin credentials to get JWT token
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@kaamwala.com', password: 'Admin@123' })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('kaamwala_token', data.token);
          localStorage.setItem('kaamwala_user', JSON.stringify({
            ...data.user,
            name: 'Srimanth Admin',
            email: adminEmail,
          }));
        }
      } catch (err) {
        console.error('Backend admin auth failed (non-critical):', err);
      }
      login({
        name: 'Srimanth Admin',
        email: adminEmail,
        role: 'admin',
      });
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

      {/* Simulated SMS Dropdown Notification */}
      {demoSms && (
        <div className="demo-sms-notification animate-fadeInDown" style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          width: '90%', maxWidth: '350px', background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)', color: '#fff', borderRadius: '12px',
          padding: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 9999,
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'default'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{background: '#3b82f6', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}>
              💬
            </div>
            <div>
              <h4 style={{margin: '0 0 4px 0', fontSize: '0.95rem', color: '#e2e8f0'}}>Messages • Now</h4>
              <p style={{margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.3'}}>
                Your KaamWala verification OTP is <strong>{demoSms}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="login-card animate-scaleIn">
        <div className="login-card__header">
          <button className="login-card__logo" onClick={() => onNavigate('home')}>
            <span>🏠</span>
            <span className="login-card__logo-text">{t('appName')}</span>
          </button>
        </div>

        {/* Step: Phone */}
        {step === 'phone' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">📱</div>
            <h2 className="login-step__title">{t('login')}</h2>
            <p className="login-step__subtitle">{t('enterMobile')}</p>

            <form onSubmit={handleSendOTP} className="login-form">
              <div className="login-form__phone-input">
                <span className="login-form__country">🇮🇳 +91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="login-form__input"
                  id="phone-input"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className={`login-form__btn ${loading ? 'login-form__btn--loading' : ''}`}
                disabled={phone.length < 10 || loading}
                id="send-otp-btn"
              >
                {loading ? (
                  <span className="login-form__spinner"></span>
                ) : (
                  t('sendOTP')
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>{t('orContinueWith')}</span>
            </div>

            <div className="login-social">
              <button className="login-social__btn" id="google-login-btn" onClick={handleAdminGoogleLogin}>
                <span>🛡️</span>
                Admin Portal
              </button>
            </div>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div className="login-step animate-fadeInUp">
            <div className="login-step__icon">🔐</div>
            <h2 className="login-step__title">{t('enterOTP')}</h2>
            <p className="login-step__subtitle">We sent a 6-digit code to +91 {phone}</p>

            <div className="otp-inputs">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && idx > 0) {
                      document.getElementById(`otp-input-${idx - 1}`)?.focus();
                    }
                  }}
                  className={`otp-input ${otpError ? 'otp-input--error' : ''}`}
                  style={otpError ? { borderColor: 'red' } : {}}
                  id={`otp-input-${idx}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {otpError && <div style={{ color: 'red', marginTop: '10px', textAlign: 'center', fontSize: '0.9rem' }}>{otpError}</div>}

            {loading && (
              <div className="login-loading">
                <span className="login-form__spinner"></span>
                <span>Verifying...</span>
              </div>
            )}

            <button className="login-resend" id="resend-otp-btn" onClick={handleSendOTP} disabled={loading}>
              Didn't receive? <strong>Resend OTP</strong>
            </button>

            <button className="login-back" onClick={() => setStep('phone')} id="back-to-phone-btn">
              ← Change number
            </button>
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
              {adminError && <div className="login-error" style={{color: 'red', marginBottom: '10px'}}>{adminError}</div>}
              
              <div className="login-form__phone-input" style={{marginBottom: '15px'}}>
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="login-form__input"
                  style={{width: '100%', border: 'none', outline: 'none', background: 'transparent'}}
                  required
                />
              </div>

              <div className="login-form__phone-input" style={{marginBottom: '20px'}}>
                <input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="login-form__input"
                  style={{width: '100%', border: 'none', outline: 'none', background: 'transparent'}}
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

            <button className="login-back" onClick={() => setStep('phone')} style={{marginTop: '20px'}}>
              ← Back to main login
            </button>
          </div>
        )}

        {/* Steps indicator */}
        <div className="login-steps-indicator">
          {['phone', 'otp', 'role'].map((s, idx) => (
            <div key={s} className={`login-steps-dot ${step === s ? 'login-steps-dot--active' : ''} ${['phone','otp','role'].indexOf(step) > idx ? 'login-steps-dot--completed' : ''}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
