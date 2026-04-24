import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './WorkerDashboardPage.css';

export default function WorkerDashboardPage({ onNavigate }) {
  const { user, categories, logout } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Worker User',
    email: user?.email || 'worker@example.com',
    phone: '+91 98765 43210',
    category: 'plumber',
    experience: 5,
    skills: 'Pipe Fitting, Leak Repair, Bathroom Fitting',
    bio: 'Experienced worker providing quality service.',
    area: 'Secunderabad',
    city: 'Hyderabad',
    available: true,
    photoUrl: '',
    priceMin: 300,
    priceMax: 800,
  });

  const mockBookings = [
    { id: 1, customer: 'Rajesh K.', service: 'Pipe repair', date: '2026-04-18', time: '10:00 AM', status: 'pending', amount: 500 },
    { id: 2, customer: 'Meena S.', service: 'Bathroom fitting', date: '2026-04-17', time: '02:00 PM', status: 'accepted', amount: 1200 },
    { id: 3, customer: 'Anil R.', service: 'Leak fixing', date: '2026-04-15', time: '11:00 AM', status: 'completed', amount: 450 },
  ];

  const mockEarnings = {
    today: 1200,
    thisWeek: 5600,
    thisMonth: 22400,
    total: 148000,
  };

  const handleSaveProfile = () => {
    setEditMode(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const category = categories.find(c => c.id === profile.category);

  return (
    <div className="wdash-page" id="worker-dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="wdash-header animate-fadeInDown">
          <div className="wdash-header__left">
            <div className="wdash-header__avatar" style={{ background: `linear-gradient(135deg, ${category?.color || '#f97316'}, ${category?.color || '#f97316'}aa)` }}>
              {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : <span>{profile.name[0]}</span>}
            </div>
            <div>
              <h1 className="wdash-header__name">Welcome, {profile.name}!</h1>
              <p className="wdash-header__role">{category?.icon} {category?.name} • {profile.area}, {profile.city}</p>
              <span className={`wdash-header__status ${profile.available ? 'wdash-header__status--online' : ''}`}>
                {profile.available ? '● Available' : '○ Offline'}
              </span>
            </div>
          </div>
          <div className="wdash-header__actions">
            <label className="wdash-availability-toggle">
              <input type="checkbox" checked={profile.available} onChange={(e) => setProfile({ ...profile, available: e.target.checked })} />
              <span className="wdash-toggle-switch"></span>
              <span>{profile.available ? 'Available' : 'Offline'}</span>
            </label>
            <button className="wdash-logout-btn" onClick={handleLogout} id="worker-logout-btn">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="wdash-stats animate-fadeInUp">
          {[
            { label: 'Today', value: `₹${mockEarnings.today}`, icon: '💰', color: '#10b981' },
            { label: 'This Week', value: `₹${mockEarnings.thisWeek}`, icon: '📈', color: '#3b82f6' },
            { label: 'This Month', value: `₹${mockEarnings.thisMonth}`, icon: '📊', color: '#8b5cf6' },
            { label: 'Total Earned', value: `₹${mockEarnings.total.toLocaleString()}`, icon: '🏆', color: '#f59e0b' },
          ].map((stat, idx) => (
            <div key={idx} className="wdash-stat-card" style={{ borderLeftColor: stat.color }}>
              <span className="wdash-stat-card__icon">{stat.icon}</span>
              <div>
                <div className="wdash-stat-card__value">{stat.value}</div>
                <div className="wdash-stat-card__label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="wdash-tabs animate-fadeIn">
          {[
            { id: 'profile', label: '👤 My Profile' },
            { id: 'bookings', label: '📅 Bookings' },
            { id: 'earnings', label: '💰 Earnings' },
            { id: 'reviews', label: '⭐ Reviews' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`wdash-tab ${activeTab === tab.id ? 'wdash-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`wdash-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="wdash-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="wdash-profile animate-fadeInUp">
              <div className="wdash-profile__header">
                <h2>My Profile</h2>
                {!editMode ? (
                  <button className="wdash-edit-btn" onClick={() => setEditMode(true)} id="wdash-edit-profile">
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="wdash-edit-actions">
                    <button className="wdash-cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                    <button className="wdash-save-btn" onClick={handleSaveProfile} id="wdash-save-profile">
                      💾 Save
                    </button>
                  </div>
                )}
              </div>

              <div className="wdash-profile__grid">
                <div className="wdash-profile__photo-section">
                  <div className="wdash-profile__photo" style={{ background: `linear-gradient(135deg, ${category?.color || '#f97316'}, ${category?.color || '#f97316'}88)` }}>
                    {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : <span>{profile.name[0]}</span>}
                  </div>
                  {editMode && (
                    <div className="wdash-profile__photo-edit">
                      <input
                        type="url"
                        placeholder="Photo URL"
                        value={profile.photoUrl}
                        onChange={(e) => setProfile({ ...profile, photoUrl: e.target.value })}
                        className="wdash-form-input wdash-form-input--small"
                      />
                    </div>
                  )}
                </div>

                <div className="wdash-profile__fields">
                  <div className="wdash-field">
                    <label>Full Name</label>
                    {editMode ? (
                      <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="wdash-form-input" />
                    ) : (
                      <span>{profile.name}</span>
                    )}
                  </div>

                  <div className="wdash-field">
                    <label>Email</label>
                    <span>{profile.email}</span>
                  </div>

                  <div className="wdash-field">
                    <label>Phone</label>
                    <span>{profile.phone}</span>
                  </div>

                  <div className="wdash-field">
                    <label>Category</label>
                    {editMode ? (
                      <select value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value })} className="wdash-form-select">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    ) : (
                      <span>{category?.icon} {category?.name}</span>
                    )}
                  </div>

                  <div className="wdash-field">
                    <label>Experience</label>
                    {editMode ? (
                      <input type="number" value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} className="wdash-form-input" />
                    ) : (
                      <span>{profile.experience} years</span>
                    )}
                  </div>

                  <div className="wdash-field">
                    <label>Location</label>
                    {editMode ? (
                      <input type="text" value={`${profile.area}, ${profile.city}`} onChange={(e) => {
                        const [area, city] = e.target.value.split(',').map(s => s.trim());
                        setProfile({ ...profile, area: area || '', city: city || profile.city });
                      }} className="wdash-form-input" />
                    ) : (
                      <span>📍 {profile.area}, {profile.city}</span>
                    )}
                  </div>

                  <div className="wdash-field wdash-field--full">
                    <label>Skills</label>
                    {editMode ? (
                      <input type="text" value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} className="wdash-form-input" />
                    ) : (
                      <div className="wdash-field__skills">
                        {profile.skills.split(',').map((s, i) => <span key={i} className="wdash-skill-tag">{s.trim()}</span>)}
                      </div>
                    )}
                  </div>

                  <div className="wdash-field wdash-field--full">
                    <label>Price Range</label>
                    {editMode ? (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="number" placeholder="Min" value={profile.priceMin} onChange={(e) => setProfile({ ...profile, priceMin: e.target.value })} className="wdash-form-input" style={{ width: '120px' }} />
                        <span>to</span>
                        <input type="number" placeholder="Max" value={profile.priceMax} onChange={(e) => setProfile({ ...profile, priceMax: e.target.value })} className="wdash-form-input" style={{ width: '120px' }} />
                        <span>/hr</span>
                      </div>
                    ) : (
                      <span>₹{profile.priceMin} – ₹{profile.priceMax} per hour</span>
                    )}
                  </div>

                  <div className="wdash-field wdash-field--full">
                    <label>Bio</label>
                    {editMode ? (
                      <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="wdash-form-textarea" rows={3}></textarea>
                    ) : (
                      <p className="wdash-field__bio">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="wdash-bookings animate-fadeInUp">
              <h2>My Bookings</h2>
              <div className="wdash-bookings__list">
                {mockBookings.map((booking, idx) => (
                  <div key={booking.id} className="wdash-booking-card animate-fadeInUp" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="wdash-booking-card__top">
                      <div>
                        <h3>{booking.customer}</h3>
                        <p>{booking.service}</p>
                      </div>
                      <span className={`wdash-booking-status wdash-booking-status--${booking.status}`}>
                        {booking.status === 'pending' ? '⏳ Pending' : booking.status === 'accepted' ? '✅ Accepted' : '✓ Completed'}
                      </span>
                    </div>
                    <div className="wdash-booking-card__details">
                      <span>📅 {booking.date}</span>
                      <span>⏰ {booking.time}</span>
                      <span>💰 ₹{booking.amount}</span>
                    </div>
                    {booking.status === 'pending' && (
                      <div className="wdash-booking-card__actions">
                        <button className="wdash-accept-btn">✅ Accept</button>
                        <button className="wdash-reject-btn">❌ Decline</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="wdash-earnings animate-fadeInUp">
              <h2>Earnings Overview</h2>
              <div className="wdash-earnings__summary">
                <div className="wdash-earning-card wdash-earning-card--big">
                  <span className="wdash-earning-card__icon">🏆</span>
                  <span className="wdash-earning-card__value">₹{mockEarnings.total.toLocaleString()}</span>
                  <span className="wdash-earning-card__label">Total Lifetime Earnings</span>
                </div>
              </div>
              <div className="wdash-recent-payments">
                <h3>Recent Payments</h3>
                {mockBookings.filter(b => b.status === 'completed').map(b => (
                  <div key={b.id} className="wdash-payment-row">
                    <div>
                      <strong>{b.customer}</strong>
                      <span>{b.service}</span>
                    </div>
                    <span className="wdash-payment-amount">+₹{b.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="wdash-reviews animate-fadeInUp">
              <h2>Customer Reviews</h2>
              <div className="wdash-reviews__summary">
                <div className="wdash-reviews__big-rating">
                  <span>4.8</span>
                  <div>⭐⭐⭐⭐⭐</div>
                  <p>Based on 156 reviews</p>
                </div>
              </div>
              <div className="wdash-reviews__list">
                {[
                  { name: 'Srinivas K.', rating: 5, text: 'Excellent work! Very professional and punctual.', date: '2 days ago' },
                  { name: 'Padma R.', rating: 4, text: 'Good service. Fair pricing. Cleaned up after work.', date: '1 week ago' },
                ].map((review, i) => (
                  <div key={i} className="wdash-review-card">
                    <div className="wdash-review-card__header">
                      <div className="wdash-review-card__avatar">{review.name[0]}</div>
                      <div>
                        <strong>{review.name}</strong>
                        <span>{review.date}</span>
                      </div>
                      <span>{'⭐'.repeat(review.rating)}</span>
                    </div>
                    <p>{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
