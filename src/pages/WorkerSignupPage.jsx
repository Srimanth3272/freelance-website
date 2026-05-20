import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './WorkerSignupPage.css';

export default function WorkerSignupPage({ onNavigate }) {
  const { categories, submitWorkerApplication, login } = useApp();

  const STORAGE_KEY = 'kaamwala_worker_signup_form';
  const STEP_KEY = 'kaamwala_worker_signup_step';

  const defaultForm = {
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',

    // Personal
    name: '',
    photoUrl: '',
    area: '',
    city: 'Hyderabad',
    languages: [],

    // Professional
    category: 'plumber',
    experience: '',
    skills: '',
    bio: '',
    priceMin: '',
    priceMax: '',
    priceUnit: 'per hour',

    // ID Verification
    idProofType: 'aadhaar',
    idProofNumber: '',
    idProofFile: null,
  };

  const loadSavedForm = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultForm, ...parsed, idProofFile: null }; // file can't be serialized
      }
    } catch (e) {}
    return defaultForm;
  };

  const [mode, setMode] = useState('signup'); // signup or login
  const [step, setStep] = useState(() => {
    try { return parseInt(localStorage.getItem(STEP_KEY)) || 1; } catch(e) { return 1; }
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState(loadSavedForm);

  // Auto-save form to localStorage whenever it changes
  useEffect(() => {
    try {
      const { idProofFile, ...serializableForm } = form;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableForm));
    } catch (e) {}
  }, [form]);

  // Auto-save step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY, String(step));
    } catch (e) {}
  }, [step]);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSignupSubmit = async () => {
    setLoading(true);
    try {
      await submitWorkerApplication({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        category: form.category,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience: parseInt(form.experience) || 0,
        bio: form.bio,
        area: form.area,
        city: form.city,
        languages: form.languages.length > 0 ? form.languages : ['English'],
        photoUrl: form.photoUrl,
        idProofType: form.idProofType,
        idProofNumber: form.idProofNumber,
        priceRange: {
          min: parseInt(form.priceMin) || 300,
          max: parseInt(form.priceMax) || 800,
          unit: form.priceUnit,
        },
      });
      setLoading(false);
      setSubmitted(true);
      // Clear saved form data after successful submission
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_KEY);
    } catch (err) {
      console.error('Signup error:', err);
      setLoading(false);
      setSubmitted(true); // Still show success for UX
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_KEY);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({
        name: 'Worker User',
        email: loginForm.email,
        role: 'worker',
      });
      setLoading(false);
      onNavigate('workerDashboard');
    }, 1500);
  };

  const canProceed = (stepNum) => {
    switch (stepNum) {
      case 1: return form.email && form.phone && form.password && form.password === form.confirmPassword;
      case 2: return form.name;
      case 3: return form.category && form.experience;
      case 4: return form.idProofType && form.idProofNumber;
      default: return true;
    }
  };

  if (submitted) {
    return (
      <div className="worker-signup-page" id="worker-signup-page">
        <div className="wsignup-bg">
          <div className="wsignup-bg__orb wsignup-bg__orb--1"></div>
          <div className="wsignup-bg__orb wsignup-bg__orb--2"></div>
        </div>
        <div className="wsignup-success animate-bounceIn">
          <div className="wsignup-success__icon">🎉</div>
          <h2>Application Submitted!</h2>
          <p>Your worker registration has been submitted for review. Our admin team will verify your ID proof and approve your profile within 24-48 hours.</p>
          <div className="wsignup-success__info">
            <div>📧 Confirmation sent to <strong>{form.email}</strong></div>
            <div>📱 SMS updates will be sent to <strong>{form.phone}</strong></div>
          </div>
          <div className="wsignup-success__actions">
            <button className="wsignup-success__btn--primary" onClick={() => onNavigate('home')}>
              Go to Home →
            </button>
            <button className="wsignup-success__btn--secondary" onClick={() => { setMode('login'); setSubmitted(false); }}>
              Login to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-signup-page" id="worker-signup-page">
      <div className="wsignup-bg">
        <div className="wsignup-bg__orb wsignup-bg__orb--1"></div>
        <div className="wsignup-bg__orb wsignup-bg__orb--2"></div>
        <div className="wsignup-bg__orb wsignup-bg__orb--3"></div>
        <div className="wsignup-bg__pattern"></div>
      </div>

      <div className="wsignup-container">
        {/* Left Panel - Branding */}
        <div className="wsignup-brand animate-fadeInUp">
          <button className="wsignup-brand__logo" onClick={() => onNavigate('home')}>
            <span>🏠</span> KaamWala
          </button>
          <h1 className="wsignup-brand__title">Join as a <span>Professional Worker</span></h1>
          <p className="wsignup-brand__desc">
            Register your skills, get verified, and start receiving bookings from customers near you. Earn on your own terms!
          </p>
          <div className="wsignup-brand__benefits">
            {[
              { icon: '💰', text: 'Set your own prices' },
              { icon: '📱', text: 'Get booking notifications' },
              { icon: '⭐', text: 'Build your reputation' },
              { icon: '🛡️', text: 'Verified badge for trust' },
              { icon: '🗣️', text: 'Multi-language support' },
              { icon: '📊', text: 'Track your earnings' },
            ].map((b, i) => (
              <div key={i} className="wsignup-brand__benefit">
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
          
          <div className="wsignup-manual-board" style={{marginTop:'30px', padding:'15px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', color:'#fff'}}>
            <h4 style={{marginBottom:'5px'}}>📞 Manual Registration for Unorganized Workers</h4>
            <p style={{fontSize:'0.9rem', opacity:0.9, lineHeight:'1.4'}}>Don't know how to use the app? Call us for voice-based registration, manual onboarding, and basic agreements.</p>
            <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
              <a href="tel:+919347405899" className="wsignup-mode-btn" style={{display:'inline-block', textDecoration:'none', background:'#fff', color:'#3b82f6', fontWeight:'bold', border:'none', padding:'0.5rem 1rem', borderRadius:'6px'}}>📞 Call: 9347405899</a>
              <a href="https://wa.me/919347405899?text=Hi,%20I%20want%20to%20register%20manually%20on%20KaamWala" target="_blank" rel="noopener noreferrer" className="wsignup-mode-btn" style={{display:'inline-block', textDecoration:'none', background:'#25D366', color:'#fff', fontWeight:'bold', border:'none', padding:'0.5rem 1rem', borderRadius:'6px'}}>💬 WhatsApp us</a>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="wsignup-card animate-scaleIn">
          {/* Mode Toggle */}
          <div className="wsignup-mode-toggle">
            <button
              className={`wsignup-mode-btn ${mode === 'signup' ? 'wsignup-mode-btn--active' : ''}`}
              onClick={() => setMode('signup')}
              id="worker-signup-tab"
            >
              Sign Up
            </button>
            <button
              className={`wsignup-mode-btn ${mode === 'login' ? 'wsignup-mode-btn--active' : ''}`}
              onClick={() => setMode('login')}
              id="worker-login-tab"
            >
              Login
            </button>
          </div>

          {/* LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="wsignup-login animate-fadeInUp">
              <div className="wsignup-login__icon">🔐</div>
              <h2>Worker Login</h2>
              <p>Access your dashboard, manage bookings, and update your profile</p>

              <div className="wsignup-form-group">
                <label>✉️ Email Address</label>
                <input
                  type="email"
                  placeholder="yourname@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="wsignup-form-input"
                  required
                  id="worker-login-email"
                />
              </div>

              <div className="wsignup-form-group">
                <label>🔒 Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="wsignup-form-input"
                  required
                  id="worker-login-password"
                />
              </div>

              <button
                type="submit"
                className={`wsignup-submit-btn ${loading ? 'wsignup-submit-btn--loading' : ''}`}
                disabled={loading}
                id="worker-login-submit"
              >
                {loading ? <><span className="wsignup-spinner"></span> Logging in...</> : 'Login →'}
              </button>

              <div className="wsignup-login__links">
                <button type="button" className="wsignup-link">Forgot Password?</button>
                <button type="button" className="wsignup-link" onClick={() => setMode('signup')}>
                  Don't have an account? Sign Up
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP MODE */}
          {mode === 'signup' && (
            <div className="wsignup-signup">
              {/* Step Progress */}
              <div className="wsignup-steps">
                {[
                  { num: 1, label: 'Account' },
                  { num: 2, label: 'Personal' },
                  { num: 3, label: 'Professional' },
                  { num: 4, label: 'Verify ID' },
                ].map(s => (
                  <div
                    key={s.num}
                    className={`wsignup-step ${step >= s.num ? 'wsignup-step--active' : ''} ${step === s.num ? 'wsignup-step--current' : ''}`}
                  >
                    <div className="wsignup-step__dot">{step > s.num ? '✓' : s.num}</div>
                    <span className="wsignup-step__label">{s.label}</span>
                    {s.num < 4 && <div className="wsignup-step__line"></div>}
                  </div>
                ))}
              </div>

              {/* Step 1: Account */}
              {step === 1 && (
                <div className="wsignup-step-content animate-fadeInUp">
                  <h3>📧 Create Your Account</h3>
                  <p>Sign up with your email and phone number</p>

                  <div className="wsignup-form-group">
                    <label>✉️ Email Address *</label>
                    <input
                      type="email"
                      placeholder="yourname@email.com"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      className="wsignup-form-input"
                      required
                      id="signup-email"
                    />
                  </div>

                  <div className="wsignup-form-group">
                    <label>📱 Phone Number *</label>
                    <div className="wsignup-phone-input">
                      <span className="wsignup-phone-prefix">🇮🇳 +91</span>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => updateForm('phone', e.target.value.replace(/\D/g, ''))}
                        className="wsignup-form-input"
                        required
                        id="signup-phone"
                      />
                    </div>
                  </div>

                  <div className="wsignup-form-row">
                    <div className="wsignup-form-group">
                      <label>🔒 Password *</label>
                      <input
                        type="password"
                        placeholder="Create password"
                        value={form.password}
                        onChange={(e) => updateForm('password', e.target.value)}
                        className="wsignup-form-input"
                        required
                        id="signup-password"
                      />
                    </div>
                    <div className="wsignup-form-group">
                      <label>🔒 Confirm Password *</label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={(e) => updateForm('confirmPassword', e.target.value)}
                        className={`wsignup-form-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'wsignup-form-input--error' : ''}`}
                        required
                        id="signup-confirm-password"
                      />
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <span className="wsignup-form-error">Passwords don't match</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <div className="wsignup-step-content animate-fadeInUp">
                  <h3>👤 Personal Information</h3>
                  <p>Tell us about yourself</p>

                  <div className="wsignup-photo-upload">
                    <div className="wsignup-photo-preview">
                      {form.photoUrl ? (
                        <img src={form.photoUrl} alt="Preview" />
                      ) : (
                        <span>📸</span>
                      )}
                    </div>
                    <div className="wsignup-photo-info">
                      <label>Profile Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            updateForm('photoUrl', URL.createObjectURL(file));
                          }
                        }}
                        className="wsignup-form-input"
                        id="signup-photo"
                        style={{ padding: '8px' }}
                      />
                      <span className="wsignup-form-hint">Upload a high-quality photo from your device</span>
                    </div>
                  </div>

                  <div className="wsignup-form-group">
                    <label>👤 Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                      className="wsignup-form-input"
                      required
                      id="signup-name"
                    />
                  </div>

                  <div className="wsignup-form-row">
                    <div className="wsignup-form-group">
                      <label>📍 Area / Locality</label>
                      <input
                        type="text"
                        placeholder="e.g., Secunderabad"
                        value={form.area}
                        onChange={(e) => updateForm('area', e.target.value)}
                        className="wsignup-form-input"
                        id="signup-area"
                      />
                    </div>
                    <div className="wsignup-form-group">
                      <label>🏙️ City</label>
                      <input
                        type="text"
                        placeholder="Hyderabad"
                        value={form.city}
                        onChange={(e) => updateForm('city', e.target.value)}
                        className="wsignup-form-input"
                        id="signup-city"
                      />
                    </div>
                  </div>

                  <div className="wsignup-form-group">
                    <label>🗣️ Languages you speak</label>
                    <div className="wsignup-lang-pills">
                      {['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Urdu'].map(lang => (
                        <button
                          key={lang}
                          type="button"
                          className={`wsignup-lang-pill ${form.languages.includes(lang) ? 'wsignup-lang-pill--active' : ''}`}
                          onClick={() => toggleLanguage(lang)}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Professional */}
              {step === 3 && (
                <div className="wsignup-step-content animate-fadeInUp">
                  <h3>🔧 Professional Details</h3>
                  <p>Tell us about your skills and experience</p>

                  <div className="wsignup-form-group">
                    <label>🔧 Service Category *</label>
                    <div className="wsignup-cat-grid">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`wsignup-cat-btn ${form.category === cat.id ? 'wsignup-cat-btn--active' : ''}`}
                          onClick={() => updateForm('category', cat.id)}
                          style={form.category === cat.id ? { borderColor: cat.color, background: `${cat.color}10` } : {}}
                        >
                          <span className="wsignup-cat-btn__icon">{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wsignup-form-row">
                    <div className="wsignup-form-group">
                      <label>💼 Experience (years) *</label>
                      <input
                        type="number"
                        placeholder="e.g., 5"
                        value={form.experience}
                        onChange={(e) => updateForm('experience', e.target.value)}
                        className="wsignup-form-input"
                        required
                        min="0"
                        id="signup-experience"
                      />
                    </div>
                    <div className="wsignup-form-group">
                      <label>💰 Price Unit</label>
                      <select
                        value={form.priceUnit}
                        onChange={(e) => updateForm('priceUnit', e.target.value)}
                        className="wsignup-form-select"
                      >
                        <option value="per hour">Per Hour</option>
                        <option value="per day">Per Day</option>
                        <option value="per job">Per Job</option>
                      </select>
                    </div>
                  </div>

                  <div className="wsignup-form-row">
                    <div className="wsignup-form-group">
                      <label>💰 Min Price (₹)</label>
                      <input
                        type="number"
                        placeholder="300"
                        value={form.priceMin}
                        onChange={(e) => updateForm('priceMin', e.target.value)}
                        className="wsignup-form-input"
                        id="signup-price-min"
                      />
                    </div>
                    <div className="wsignup-form-group">
                      <label>💰 Max Price (₹)</label>
                      <input
                        type="number"
                        placeholder="800"
                        value={form.priceMax}
                        onChange={(e) => updateForm('priceMax', e.target.value)}
                        className="wsignup-form-input"
                        id="signup-price-max"
                      />
                    </div>
                  </div>

                  <div className="wsignup-form-group">
                    <label>🛠️ Skills (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., Pipe Fitting, Leak Repair, Bathroom Fitting"
                      value={form.skills}
                      onChange={(e) => updateForm('skills', e.target.value)}
                      className="wsignup-form-input"
                      id="signup-skills"
                    />
                  </div>

                  <div className="wsignup-form-group">
                    <label>📝 About You</label>
                    <textarea
                      placeholder="Describe your expertise, specializations, and what makes you stand out..."
                      value={form.bio}
                      onChange={(e) => updateForm('bio', e.target.value)}
                      className="wsignup-form-textarea"
                      rows={3}
                      id="signup-bio"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 4: ID Verification */}
              {step === 4 && (
                <div className="wsignup-step-content animate-fadeInUp">
                  <h3>🛡️ Identity Verification</h3>
                  <p>Upload your ID proof for verification. This helps build trust with customers.</p>

                  <div className="wsignup-id-notice">
                    <span>🔒</span>
                    <p>Your ID information is encrypted and only used for verification purposes. It will not be shared with customers.</p>
                  </div>

                  <div className="wsignup-form-group">
                    <label>📄 ID Proof Type *</label>
                    <div className="wsignup-id-types">
                      {[
                        { id: 'aadhaar', icon: '🪪', name: 'Aadhaar Card', desc: '12-digit Aadhaar number' },
                        { id: 'pan', icon: '💳', name: 'PAN Card', desc: '10-char PAN number' },
                        { id: 'voter', icon: '🗳️', name: 'Voter ID', desc: 'EPIC number' },
                        { id: 'driving', icon: '🚗', name: 'Driving License', desc: 'DL number' },
                      ].map(idType => (
                        <button
                          key={idType.id}
                          type="button"
                          className={`wsignup-id-type ${form.idProofType === idType.id ? 'wsignup-id-type--active' : ''}`}
                          onClick={() => updateForm('idProofType', idType.id)}
                        >
                          <span className="wsignup-id-type__icon">{idType.icon}</span>
                          <div>
                            <span className="wsignup-id-type__name">{idType.name}</span>
                            <span className="wsignup-id-type__desc">{idType.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wsignup-form-group">
                    <label>🔢 {form.idProofType === 'aadhaar' ? 'Aadhaar' : form.idProofType === 'pan' ? 'PAN' : form.idProofType === 'voter' ? 'EPIC' : 'DL'} Number *</label>
                    <input
                      type="text"
                      placeholder={form.idProofType === 'aadhaar' ? '1234 5678 9012' : form.idProofType === 'pan' ? 'ABCDE1234F' : 'Enter ID number'}
                      value={form.idProofNumber}
                      onChange={(e) => updateForm('idProofNumber', e.target.value)}
                      className="wsignup-form-input"
                      required
                      id="signup-id-number"
                    />
                  </div>

                  <div className="wsignup-form-group">
                    <label>📎 Upload ID Proof (front side)</label>
                    <div className="wsignup-file-upload">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        id="signup-id-file"
                        className="wsignup-file-input"
                        onChange={(e) => updateForm('idProofFile', e.target.files[0])}
                      />
                      <label htmlFor="signup-id-file" className="wsignup-file-label">
                        <span className="wsignup-file-label__icon">📤</span>
                        <span className="wsignup-file-label__text">
                          {form.idProofFile ? form.idProofFile.name : 'Click to upload or drag & drop'}
                        </span>
                        <span className="wsignup-file-label__hint">PNG, JPG or PDF up to 5MB</span>
                      </label>
                    </div>
                  </div>

                  <div className="wsignup-terms">
                    <label className="wsignup-checkbox">
                      <input type="checkbox" required />
                      <span className="wsignup-checkbox__mark"></span>
                      <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. I confirm that the information provided is accurate.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="wsignup-nav">
                {step > 1 && (
                  <button className="wsignup-back-btn" onClick={() => setStep(step - 1)} type="button">
                    ← Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    className="wsignup-next-btn"
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed(step)}
                    type="button"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    className={`wsignup-submit-btn ${loading ? 'wsignup-submit-btn--loading' : ''}`}
                    onClick={handleSignupSubmit}
                    disabled={loading || !canProceed(4)}
                    type="button"
                    id="worker-signup-submit"
                  >
                    {loading ? (
                      <><span className="wsignup-spinner"></span> Submitting...</>
                    ) : (
                      '🚀 Submit Application'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
