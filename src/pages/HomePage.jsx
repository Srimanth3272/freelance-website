import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './HomePage.css';

export default function HomePage({ onNavigate }) {
  const { t, categories, workers, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [heroVisible, setHeroVisible] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        // Auto navigate to search
        onNavigate('search', { query: transcript });
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Voice search is not supported in your browser. Please try Chrome.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { query: searchQuery });
    }
  };

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user', content: aiInput };
    const newMessages = [...aiMessages, userMsg];
    setAiMessages(newMessages);
    setAiInput('');

    try {
      const { aiAPI } = await import('../services/api');
      const response = await aiAPI.chat(userMsg.content);
      const aiMsg = { role: 'ai', content: response.reply };
      setAiMessages([...newMessages, aiMsg]);
      
      // If AI returned workers, could trigger a nice UI visualization
    } catch (err) {
      console.error('AI chat error:', err);
      setAiMessages([...newMessages, { role: 'ai', content: 'Oops! I am having trouble connecting right now. Please try again later.'}]);
    }
  };

  const topWorkers = workers.filter(w => w.available && w.verified).sort((a, b) => b.rating - a.rating).slice(0, 4);
  const stats = [
    { value: '10,000+', label: 'Workers' },
    { value: '50,000+', label: 'Bookings' },
    { value: '4.8', label: 'Avg. Rating' },
    { value: '15+', label: 'Cities' },
  ];

  return (
    <div className="home" id="home-page">
      {/* Hero Section */}
      <section className={`hero ${heroVisible ? 'hero--visible' : ''}`} id="hero-section">
        <div className="hero__bg">
          <div className="hero__gradient-orb hero__gradient-orb--1"></div>
          <div className="hero__gradient-orb hero__gradient-orb--2"></div>
          <div className="hero__gradient-orb hero__gradient-orb--3"></div>
          <div className="hero__pattern"></div>
        </div>

        <div className="hero__content container">
          <div className="hero__text">
            <div className="hero__badge animate-fadeInDown">
              <span className="hero__badge-dot"></span>
              <span>🎉 Now serving Hyderabad, Delhi & Bangalore</span>
            </div>

            <h1 className="hero__title animate-fadeInUp">
              {t('heroTitlePrefix')} <span className="hero__title-highlight">{t('heroTitleHighlight')}</span>
              <br />{t('heroTitleMid')} <span className="hero__title-accent">{t('heroTitleAccent')}</span>
            </h1>

            <p className="hero__subtitle animate-fadeInUp stagger-1">
              {t('heroSubtitle')}
            </p>

            {/* Search Bar */}
            <form className="hero__search animate-fadeInUp stagger-2" onSubmit={handleSearch} id="hero-search-form">
              <div className="hero__search-input-wrapper">
                <svg className="hero__search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="hero__search-input"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="hero-search-input"
                />
                <button
                  type="button"
                  className={`hero__voice-btn ${isListening ? 'hero__voice-btn--active' : ''}`}
                  onClick={handleVoiceSearch}
                  title={t('voiceSearch')}
                  id="voice-search-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  {isListening && <span className="hero__voice-ripple"></span>}
                </button>
              </div>
              <button type="submit" className="hero__search-btn" id="hero-search-submit">
                {t('search')}
              </button>
            </form>

            {/* Quick Category Pills */}
            <div className="hero__quick-cats animate-fadeInUp stagger-3">
              <span className="hero__quick-label">Popular:</span>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  className="hero__quick-pill"
                  onClick={() => onNavigate('search', { category: cat.id })}
                  id={`quick-cat-${cat.id}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="hero__visual animate-fadeInUp stagger-2">
            <div className="hero__card-stack">
              {topWorkers.slice(0, 3).map((worker, idx) => (
                <div
                  key={worker.id}
                  className={`hero__worker-card hero__worker-card--${idx + 1}`}
                  style={{ animationDelay: `${idx * 200 + 600}ms` }}
                >
                  <div className="hero__worker-avatar" style={{ background: `linear-gradient(135deg, ${categories.find(c => c.id === worker.category)?.color || '#f97316'}, ${categories.find(c => c.id === worker.category)?.color || '#f97316'}dd)` }}>
                    {worker.name[0]}
                  </div>
                  <div className="hero__worker-info">
                    <div className="hero__worker-name">{worker.name}</div>
                    <div className="hero__worker-cat">
                      {categories.find(c => c.id === worker.category)?.icon} {categories.find(c => c.id === worker.category)?.name}
                    </div>
                  </div>
                  <div className="hero__worker-meta">
                    <span className="hero__worker-rating">⭐ {worker.rating}</span>
                    {worker.verified && <span className="hero__worker-verified">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="hero__stats container animate-fadeInUp stagger-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="hero__stat">
              <span className="hero__stat-value">{stat.value}</span>
              <span className="hero__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section" id="categories-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t('categories')}</h2>
              <p className="section-subtitle">Choose from our wide range of professional services</p>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                className="category-card animate-fadeInUp"
                style={{ animationDelay: `${idx * 80}ms` }}
                onClick={() => onNavigate('search', { category: cat.id })}
                id={`category-${cat.id}`}
              >
                <div className="category-card__icon" style={{ background: `${cat.color}15` }}>
                  <span>{cat.icon}</span>
                </div>
                <span className="category-card__name">{cat.name}</span>
                <span className="category-card__count">
                  {workers.filter(w => w.category === cat.id).length} workers
                </span>
                <div className="category-card__arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header section-header--center">
            <h2 className="section-title">{t('howItWorks')}</h2>
            <p className="section-subtitle">Hire a worker in 4 simple steps</p>
          </div>

          <div className="steps-grid">
            {[
              { num: '01', icon: '🔍', title: t('step1Title'), desc: t('step1Desc'), color: 'var(--primary-500)' },
              { num: '02', icon: '⚖️', title: t('step2Title'), desc: t('step2Desc'), color: 'var(--accent-500)' },
              { num: '03', icon: '📅', title: t('step3Title'), desc: t('step3Desc'), color: 'var(--success-500)' },
              { num: '04', icon: '⭐', title: t('step4Title'), desc: t('step4Desc'), color: 'var(--warning-500)' },
            ].map((step, idx) => (
              <div key={idx} className="step-card animate-fadeInUp" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="step-card__number" style={{ color: step.color }}>{step.num}</div>
                <div className="step-card__icon">{step.icon}</div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.desc}</p>
                {idx < 3 && <div className="step-card__connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Workers */}
      <section className="top-workers" id="top-workers">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t('nearbyWorkers')}</h2>
              <p className="section-subtitle">Highly rated professionals near you</p>
            </div>
            <button className="view-all-btn" onClick={() => onNavigate('search')} id="view-all-workers-btn">
              {t('viewAll')} →
            </button>
          </div>

          <div className="workers-grid">
            {topWorkers.map((worker, idx) => (
              <div
                key={worker.id}
                className="worker-card animate-fadeInUp"
                style={{ animationDelay: `${idx * 100}ms` }}
                onClick={() => onNavigate('worker', { workerId: worker.id })}
                id={`worker-card-${worker.id}`}
              >
                <div className="worker-card__header">
                  <div className="worker-card__avatar" style={{ background: `linear-gradient(135deg, ${categories.find(c => c.id === worker.category)?.color}, ${categories.find(c => c.id === worker.category)?.color}aa)` }}>
                    <span>{worker.name[0]}</span>
                  </div>
                  <div className="worker-card__badges">
                    {worker.verified && (
                      <span className="worker-card__badge worker-card__badge--verified">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {t('verified')}
                      </span>
                    )}
                    <span className={`worker-card__badge ${worker.available ? 'worker-card__badge--available' : 'worker-card__badge--busy'}`}>
                      <span className="worker-card__status-dot"></span>
                      {worker.available ? t('available') : t('unavailable')}
                    </span>
                  </div>
                </div>

                <div className="worker-card__body">
                  <h3 className="worker-card__name">{worker.name}</h3>
                  <div className="worker-card__category">
                    {categories.find(c => c.id === worker.category)?.icon} {categories.find(c => c.id === worker.category)?.name}
                  </div>

                  <div className="worker-card__stats">
                    <div className="worker-card__stat">
                      <span className="worker-card__stat-value">⭐ {worker.rating}</span>
                      <span className="worker-card__stat-label">({worker.reviews})</span>
                    </div>
                    <div className="worker-card__stat">
                      <span className="worker-card__stat-value">{worker.experience}</span>
                      <span className="worker-card__stat-label">{t('experience')}</span>
                    </div>
                    <div className="worker-card__stat">
                      <span className="worker-card__stat-value">{worker.distance} km</span>
                      <span className="worker-card__stat-label">away</span>
                    </div>
                  </div>

                  <div className="worker-card__skills">
                    {worker.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="worker-card__skill">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="worker-card__footer">
                  <div className="worker-card__price">
                    <span className="worker-card__price-value">₹{worker.priceRange.min}–{worker.priceRange.max}</span>
                    <span className="worker-card__price-unit">/{worker.priceRange.unit === 'per hour' ? 'hr' : 'day'}</span>
                  </div>
                  <button className="worker-card__book-btn" onClick={(e) => { e.stopPropagation(); onNavigate('booking', { workerId: worker.id }); }}>
                    {t('bookNow')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why KaamWala */}
      <section className="why-section" id="why-section">
        <div className="container">
          <div className="section-header section-header--center">
            <h2 className="section-title">{t('whyKaamWala')}</h2>
            <p className="section-subtitle">Built for India, designed for everyone</p>
          </div>

          <div className="benefits-grid">
            {[
              { icon: '🛡️', title: t('benefit1Title'), desc: t('benefit1Desc'), gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
              { icon: '💰', title: t('benefit2Title'), desc: t('benefit2Desc'), gradient: 'linear-gradient(135deg, #10b981, #059669)' },
              { icon: '🎤', title: t('benefit3Title'), desc: t('benefit3Desc'), gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
              { icon: '⚡', title: t('benefit4Title'), desc: t('benefit4Desc'), gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
            ].map((benefit, idx) => (
              <div key={idx} className="benefit-card animate-fadeInUp" style={{ animationDelay: `${idx * 120}ms` }}>
                <div className="benefit-card__icon-wrap" style={{ background: benefit.gradient }}>
                  <span className="benefit-card__icon">{benefit.icon}</span>
                </div>
                <h3 className="benefit-card__title">{benefit.title}</h3>
                <p className="benefit-card__desc">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-card__bg">
              <div className="cta-card__orb cta-card__orb--1"></div>
              <div className="cta-card__orb cta-card__orb--2"></div>
            </div>
            <div className="cta-card__content">
              <h2 className="cta-card__title">Ready to find the perfect worker?</h2>
              <p className="cta-card__desc">Join thousands of happy customers. Sign up free and book your first service today!</p>
              <div className="cta-card__actions">
                <button className="cta-card__btn cta-card__btn--primary" onClick={() => onNavigate('login')} id="cta-get-started-btn">
                  {t('getStarted')} →
                </button>
                <button className="cta-card__btn cta-card__btn--secondary" onClick={() => onNavigate('search')} id="cta-browse-btn">
                  Browse Workers
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Bubble */}
      <div className={`ai-chat ${aiChatOpen ? 'ai-chat--open' : ''}`} id="ai-chat-widget">
        {aiChatOpen && (
          <div className="ai-chat__window animate-scaleIn">
            <div className="ai-chat__header">
              <div className="ai-chat__header-info">
                <div className="ai-chat__header-avatar">🤖</div>
                <div>
                  <div className="ai-chat__header-name">{t('aiAssistant')}</div>
                  <div className="ai-chat__header-status">Online • Speaks Telugu, Hindi, Tamil, English</div>
                </div>
              </div>
              <button className="ai-chat__close" onClick={() => setAiChatOpen(false)} id="ai-chat-close">
                ✕
              </button>
            </div>

            <div className="ai-chat__messages">
              {aiMessages.length === 0 && (
                <div className="ai-chat__greeting">
                  <div className="ai-chat__greeting-emoji">👋</div>
                  <p>{t('aiGreeting')}</p>
                  <div className="ai-chat__suggestions">
                    {['🔧 I need a plumber', '⚡ Electric problem', '🎨 Paint my room', '💰 Price estimate'].map((sug, i) => (
                      <button key={i} className="ai-chat__suggestion" onClick={() => { setAiInput(sug.slice(2)); }}>
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`ai-chat__msg ai-chat__msg--${msg.role}`}>
                  {msg.role === 'ai' && <span className="ai-chat__msg-avatar">🤖</span>}
                  <div className="ai-chat__msg-content" dangerouslySetInnerHTML={{ __html: msg.content }}></div>
                </div>
              ))}
            </div>

            <div className="ai-chat__input-area">
              <input
                type="text"
                className="ai-chat__input"
                placeholder={t('aiPlaceholder')}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                id="ai-chat-input"
              />
              <button className="ai-chat__voice-btn" onClick={handleVoiceSearch} id="ai-voice-btn">
                🎤
              </button>
              <button className="ai-chat__send-btn" onClick={handleAiSend} id="ai-send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m22 2-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <button
          className={`ai-chat__fab ${isListening ? 'ai-chat__fab--listening' : ''}`}
          onClick={() => setAiChatOpen(!aiChatOpen)}
          id="ai-chat-fab"
        >
          {aiChatOpen ? '✕' : '🤖'}
          {!aiChatOpen && <span className="ai-chat__fab-pulse"></span>}
        </button>
      </div>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <div className="footer__logo">
                <span>🏠</span>
                <span className="footer__logo-text">KaamWala</span>
              </div>
              <p className="footer__desc">India's most trusted platform for finding verified workers near you. Voice-first, multi-language, AI-powered.</p>
              <div className="footer__social">
                <a href="#" className="footer__social-link">📘</a>
                <a href="#" className="footer__social-link">🐦</a>
                <a href="#" className="footer__social-link">📸</a>
                <a href="#" className="footer__social-link">▶️</a>
              </div>
            </div>

            <div className="footer__links-group">
              <h4 className="footer__links-title">Services</h4>
              <ul>
                {categories.slice(0, 6).map(cat => (
                  <li key={cat.id}><a href="#" className="footer__link">{cat.icon} {cat.name}</a></li>
                ))}
              </ul>
            </div>

            <div className="footer__links-group">
              <h4 className="footer__links-title">Company</h4>
              <ul>
                <li><a href="#" className="footer__link">About Us</a></li>
                <li><a href="#" className="footer__link">Careers</a></li>
                <li><a href="#" className="footer__link">Blog</a></li>
                <li><a href="#" className="footer__link">Contact</a></li>
                <li><a href="#" className="footer__link">Privacy Policy</a></li>
              </ul>
            </div>

            <div className="footer__links-group">
              <h4 className="footer__links-title">For Workers</h4>
              <ul>
                <li><a href="#" className="footer__link">Register as Worker</a></li>
                <li><a href="#" className="footer__link">Worker App</a></li>
                <li><a href="#" className="footer__link">Support</a></li>
                <li><a href="#" className="footer__link">FAQs</a></li>
              </ul>
            </div>
          </div>

          <div className="footer__bottom">
            <p>© 2026 KaamWala. All rights reserved. Made with ❤️ in India.</p>
            <div className="footer__badges">
              <span className="footer__badge">🔒 SSL Secured</span>
              <span className="footer__badge">✅ Verified Workers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
