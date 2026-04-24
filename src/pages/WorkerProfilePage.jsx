import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './WorkerProfilePage.css';

export default function WorkerProfilePage({ onNavigate, initialData }) {
  const { t, workers, categories } = useApp();
  const worker = workers.find(w => w.id === initialData?.workerId) || workers[0];
  const category = categories.find(c => c.id === worker.category);
  const [activeTab, setActiveTab] = useState('about');

  const mockReviews = [
    { id: 1, name: 'Srinivas', rating: 5, date: '2 days ago', text: 'Excellent work! Fixed the leaking pipe within 30 minutes. Very professional and punctual.' },
    { id: 2, name: 'Padma', rating: 4, date: '1 week ago', text: 'Good service. Cleaned up after the work was done. Fair pricing.' },
    { id: 3, name: 'Raju', rating: 5, date: '2 weeks ago', text: 'Best plumber in the area! Have hired 3 times now. Always reliable.' },
  ];

  return (
    <div className="profile-page" id="worker-profile-page">
      <div className="container">
        {/* Back Button */}
        <button className="back-btn animate-fadeIn" onClick={() => onNavigate('search')} id="profile-back-btn">
          ← Back to search
        </button>

        {/* Profile Header */}
        <div className="profile-header animate-fadeInUp">
          <div className="profile-header__left">
            <div className="profile-header__avatar" style={{ background: `linear-gradient(135deg, ${category?.color}, ${category?.color}aa)` }}>
              <span>{worker.name[0]}</span>
            </div>
            <div className="profile-header__info">
              <div className="profile-header__name-row">
                <h1 className="profile-header__name">{worker.name}</h1>
                {worker.verified && (
                  <span className="profile-header__verified">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Verified
                  </span>
                )}
              </div>
              <div className="profile-header__category">
                {category?.icon} {category?.name} • {worker.location.area}, {worker.location.city}
              </div>
              <div className="profile-header__meta">
                <span className="profile-header__rating">⭐ {worker.rating} ({worker.reviews} reviews)</span>
                <span>📍 {worker.distance} km away</span>
                <span>💼 {worker.experience} years exp</span>
                <span>✅ {worker.completedJobs} jobs done</span>
              </div>
              <div className="profile-header__langs">
                🗣️ {worker.languages.join(', ')}
              </div>
            </div>
          </div>

          <div className="profile-header__right">
            <div className="profile-header__price">
              <span className="profile-header__price-label">Price Range</span>
              <span className="profile-header__price-value">₹{worker.priceRange.min} – ₹{worker.priceRange.max}</span>
              <span className="profile-header__price-unit">{worker.priceRange.unit}</span>
            </div>
            <div className={`profile-header__status ${worker.available ? 'profile-header__status--available' : ''}`}>
              <span className="profile-header__status-dot"></span>
              {worker.available ? 'Available Now' : 'Currently Busy'}
            </div>
            <div className="profile-header__actions">
              <button
                className="profile-header__book-btn"
                onClick={() => onNavigate('booking', { workerId: worker.id })}
                id="profile-book-btn"
              >
                {t('bookNow')} →
              </button>
              <a href={`tel:${worker.phone}`} className="profile-header__call-btn" id="profile-call-btn" style={{textDecoration:'none', textAlign:'center'}}>
                📞 Call: {worker.phone}
              </a>
              <a href={`sms:${worker.phone}`} className="profile-header__msg-btn" id="profile-msg-btn" style={{textDecoration:'none', textAlign:'center'}}>
                💬 {t('messageNow')}
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs animate-fadeInUp stagger-1">
          {['about', 'reviews', 'portfolio'].map(tab => (
            <button
              key={tab}
              className={`profile-tab ${activeTab === tab ? 'profile-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
              id={`profile-tab-${tab}`}
            >
              {tab === 'about' ? '📋 About' : tab === 'reviews' ? '⭐ Reviews' : '📸 Portfolio'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-content animate-fadeInUp stagger-2">
          {activeTab === 'about' && (
            <div className="profile-about">
              <div className="profile-section">
                <h2 className="profile-section__title">{t('aboutMe')}</h2>
                <p className="profile-section__text">{worker.bio}</p>
              </div>

              <div className="profile-section">
                <h2 className="profile-section__title">{t('skills')}</h2>
                <div className="profile-skills">
                  {worker.skills.map((skill, i) => (
                    <span key={i} className="profile-skill">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section__title">{t('estimatedPrice')}</h2>
                <div className="price-estimate-card">
                  <div className="price-estimate__header">
                    <span>🤖 AI Price Estimate</span>
                  </div>
                  <div className="price-estimate__body">
                    <div className="price-estimate__bar">
                      <div className="price-estimate__range" style={{ left: '20%', width: '60%' }}>
                        <span className="price-estimate__min">₹{worker.priceRange.min}</span>
                        <span className="price-estimate__max">₹{worker.priceRange.max}</span>
                      </div>
                    </div>
                    <div className="price-estimate__labels">
                      <span>Low</span>
                      <span>Market Average</span>
                      <span>High</span>
                    </div>
                    <p className="price-estimate__note">
                      💡 Based on market data, {category?.name} services in {worker.location.area} typically cost ₹{worker.priceRange.min}–₹{worker.priceRange.max} {worker.priceRange.unit}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section__title">Quick Stats</h2>
                <div className="profile-stats-grid">
                  <div className="profile-stat-card">
                    <span className="profile-stat-card__value">{worker.completedJobs}</span>
                    <span className="profile-stat-card__label">Jobs Completed</span>
                  </div>
                  <div className="profile-stat-card">
                    <span className="profile-stat-card__value">{worker.experience} yrs</span>
                    <span className="profile-stat-card__label">Experience</span>
                  </div>
                  <div className="profile-stat-card">
                    <span className="profile-stat-card__value">{worker.rating}</span>
                    <span className="profile-stat-card__label">Avg. Rating</span>
                  </div>
                  <div className="profile-stat-card">
                    <span className="profile-stat-card__value">98%</span>
                    <span className="profile-stat-card__label">On-time</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="profile-reviews">
              <div className="reviews-summary">
                <div className="reviews-summary__big">
                  <span className="reviews-summary__number">{worker.rating}</span>
                  <span className="reviews-summary__stars">⭐⭐⭐⭐⭐</span>
                  <span className="reviews-summary__count">{worker.reviews} {t('reviews')}</span>
                </div>
                <div className="reviews-summary__bars">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="reviews-bar">
                      <span>{star}★</span>
                      <div className="reviews-bar__track">
                        <div className="reviews-bar__fill" style={{ width: `${star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : 2}%` }}></div>
                      </div>
                      <span className="reviews-bar__pct">{star === 5 ? '72%' : star === 4 ? '20%' : star === 3 ? '5%' : '2%'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reviews-list">
                {mockReviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-card__header">
                      <div className="review-card__avatar">{review.name[0]}</div>
                      <div>
                        <div className="review-card__name">{review.name}</div>
                        <div className="review-card__date">{review.date}</div>
                      </div>
                      <div className="review-card__rating">{'⭐'.repeat(review.rating)}</div>
                    </div>
                    <p className="review-card__text">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="profile-portfolio">
              <div className="portfolio-empty">
                <span className="portfolio-empty__icon">📸</span>
                <h3>Portfolio Coming Soon</h3>
                <p>This worker hasn't uploaded any portfolio images yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
