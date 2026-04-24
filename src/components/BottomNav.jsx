import { useApp } from '../context/AppContext';
import './BottomNav.css';

export default function BottomNav({ onNavigate, currentPage }) {
  const { t } = useApp();

  const items = [
    { id: 'home', icon: '🏠', label: t('home') },
    { id: 'search', icon: '🔍', label: t('search') },
    { id: 'bookings', icon: '📋', label: t('bookings') },
    { id: 'profile', icon: '👤', label: t('profile') },
  ];

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          className={`bottom-nav__item ${currentPage === item.id ? 'bottom-nav__item--active' : ''}`}
          onClick={() => onNavigate(item.id === 'profile' ? 'login' : item.id)}
          id={`bottom-nav-${item.id}`}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
          {currentPage === item.id && <span className="bottom-nav__indicator"></span>}
        </button>
      ))}
    </nav>
  );
}
