import { useApp } from '../context/AppContext';
import './BookingsListPage.css';

export default function BookingsListPage({ onNavigate }) {
  const { t, bookings, categories, workers } = useApp();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#fffbeb', color: '#d97706', label: '⏳ Pending' };
      case 'accepted': return { bg: '#ecfdf5', color: '#059669', label: '✅ Accepted' };
      case 'in_progress': return { bg: '#eef2ff', color: '#4f46e5', label: '🔧 In Progress' };
      case 'completed': return { bg: '#f0fdf4', color: '#16a34a', label: '✓ Completed' };
      case 'cancelled': return { bg: '#fef2f2', color: '#dc2626', label: '✕ Cancelled' };
      default: return { bg: '#f5f5f5', color: '#737373', label: status };
    }
  };

  // Use real backend bookings exclusively
  const displayBookings = bookings || [];

  return (
    <div className="bookings-page" id="bookings-page">
      <div className="container">
        <div className="bookings-header animate-fadeInDown">
          <h1 className="bookings-header__title">{t('bookings')}</h1>
          <p className="bookings-header__subtitle">Track and manage your service bookings</p>
        </div>

        {/* Status Tabs */}
        <div className="bookings-tabs animate-fadeIn">
          {['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'].map(tab => (
            <button key={tab} className={`bookings-tab ${tab === 'All' ? 'bookings-tab--active' : ''}`} id={`bookings-tab-${tab.toLowerCase()}`}>
              {tab}
            </button>
          ))}
        </div>

        {displayBookings.length === 0 ? (
          <div className="bookings-empty animate-fadeInUp">
            <span className="bookings-empty__icon">📋</span>
            <h3>No bookings yet</h3>
            <p>When you book a worker, your bookings will appear here.</p>
            <button className="bookings-empty__btn" onClick={() => onNavigate('search')} id="bookings-browse-btn">
              Browse Workers →
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {displayBookings.map((booking, idx) => {
              const statusInfo = getStatusColor(booking.status);
              const worker = workers.find(w => w.id === booking.workerId);
              const category = categories.find(c => c.name === booking.category || c.id === worker?.category);

              return (
                <div
                  key={booking.id}
                  className="booking-list-card animate-fadeInUp"
                  style={{ animationDelay: `${idx * 100}ms` }}
                  id={`booking-card-${booking.id}`}
                >
                  <div className="booking-list-card__top">
                    <div className="booking-list-card__worker-info">
                      <div
                        className="booking-list-card__avatar"
                        style={{ background: `linear-gradient(135deg, ${category?.color || '#f97316'}, ${category?.color || '#f97316'}aa)` }}
                      >
                        {booking.workerName[0]}
                      </div>
                      <div>
                        <h3 className="booking-list-card__name">{booking.workerName}</h3>
                        <span className="booking-list-card__category">
                          {category?.icon} {booking.category}
                        </span>
                      </div>
                    </div>
                    <div
                      className="booking-list-card__status"
                      style={{ background: statusInfo.bg, color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="booking-list-card__details">
                    <div className="booking-list-card__detail">
                      <span className="booking-list-card__detail-icon">📅</span>
                      <span>{booking.date}</span>
                    </div>
                    <div className="booking-list-card__detail">
                      <span className="booking-list-card__detail-icon">⏰</span>
                      <span>{booking.time}</span>
                    </div>
                    <div className="booking-list-card__detail">
                      <span className="booking-list-card__detail-icon">💰</span>
                      <span>₹{booking.estimatedPrice}</span>
                    </div>
                    <div className="booking-list-card__detail">
                      <span className="booking-list-card__detail-icon">💳</span>
                      <span>{booking.paymentMethod?.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="booking-list-card__desc">
                    <span className="booking-list-card__detail-icon">📝</span>
                    <span>{booking.description}</span>
                  </div>

                  <div className="booking-list-card__address">
                    <span className="booking-list-card__detail-icon">📍</span>
                    <span>{booking.address}</span>
                  </div>

                  <div className="booking-list-card__footer">
                    <span className="booking-list-card__id">#{booking.id}</span>
                    <div className="booking-list-card__actions">
                      {booking.status === 'pending' && (
                        <button className="booking-list-card__cancel-btn">Cancel</button>
                      )}
                      {booking.status === 'accepted' && (
                        <button className="booking-list-card__chat-btn" onClick={() => onNavigate('worker', { workerId: booking.workerId })}>
                          💬 Chat
                        </button>
                      )}
                      {booking.status === 'completed' && (
                        <button className="booking-list-card__review-btn">⭐ Leave Review</button>
                      )}
                      <button
                        className="booking-list-card__view-btn"
                        onClick={() => onNavigate('worker', { workerId: booking.workerId })}
                      >
                        View Worker →
                      </button>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  {(booking.status === 'pending' || booking.status === 'accepted' || booking.status === 'in_progress') && (
                    <div className="booking-progress">
                      {['Requested', 'Accepted', 'In Progress', 'Completed'].map((stage, i) => {
                        const stageMap = { 'pending': 0, 'accepted': 1, 'in_progress': 2, 'completed': 3 };
                        const currentStage = stageMap[booking.status] || 0;
                        return (
                          <div key={i} className={`booking-progress__step ${i <= currentStage ? 'booking-progress__step--done' : ''} ${i === currentStage ? 'booking-progress__step--current' : ''}`}>
                            <div className="booking-progress__dot"></div>
                            <span>{stage}</span>
                            {i < 3 && <div className="booking-progress__line"></div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
