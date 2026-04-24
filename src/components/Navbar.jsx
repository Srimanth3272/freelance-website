import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './Navbar.css';

export default function Navbar({ onNavigate, currentPage }) {
  const { t, language, setLanguage, languages, isAuthenticated, user, logout } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
      <div className="navbar__inner container">
        <button className="navbar__brand" onClick={() => onNavigate('home')} id="nav-home-btn">
          <span className="navbar__logo">
            <span className="navbar__logo-icon">🏠</span>
            <span className="navbar__logo-text">{t('appName')}</span>
          </span>
        </button>

        <div className={`navbar__links ${mobileMenuOpen ? 'navbar__links--open' : ''}`}>
          {['home', 'search', 'bookings'].map((page) => (
            <button
              key={page}
              className={`navbar__link ${currentPage === page ? 'navbar__link--active' : ''}`}
              onClick={() => { onNavigate(page); setMobileMenuOpen(false); }}
              id={`nav-${page}-btn`}
            >
              {page === 'home' && <HomeIcon />}
              {page === 'search' && <SearchIcon />}
              {page === 'bookings' && <BookingsIcon />}
              <span>{t(page)}</span>
            </button>
          ))}

          {/* Admin Link */}
          <button
            className={`navbar__link ${currentPage === 'admin' ? 'navbar__link--active' : ''}`}
            onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
            id="nav-admin-btn"
          >
            <span>🛡️</span>
            <span>Admin</span>
          </button>

          {/* Worker Portal Link */}
          <button
            className={`navbar__link ${currentPage === 'workerSignup' || currentPage === 'workerDashboard' ? 'navbar__link--active' : ''}`}
            onClick={() => { onNavigate('workerSignup'); setMobileMenuOpen(false); }}
            id="nav-worker-portal-btn"
          >
            <span>🔧</span>
            <span>Worker Portal</span>
          </button>
        </div>

        <div className="navbar__actions">
          {/* Language Selector */}
          <div className="navbar__lang-wrapper">
            <button
              className="navbar__lang-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              id="lang-selector-btn"
            >
              <GlobeIcon />
              <span>{languages.find(l => l.code === language)?.nativeName}</span>
              <ChevronDownIcon />
            </button>
            {langDropdownOpen && (
              <div className="navbar__lang-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`navbar__lang-option ${language === lang.code ? 'navbar__lang-option--active' : ''}`}
                    onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }}
                    id={`lang-${lang.code}-btn`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="navbar__lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="navbar__user">
              <button className="navbar__avatar" onClick={() => onNavigate('profile')} id="nav-profile-btn">
                <span className="navbar__avatar-initial">{user?.name?.[0] || 'U'}</span>
              </button>
            </div>
          ) : (
            <button
              className="navbar__login-btn"
              onClick={() => onNavigate('login')}
              id="nav-login-btn"
            >
              {t('login')}
            </button>
          )}

          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </nav>
  );
}

// Inline SVG icons
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BookingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
