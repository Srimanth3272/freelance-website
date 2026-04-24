import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './SearchPage.css';

export default function SearchPage({ onNavigate, initialData }) {
  const { t, workers, categories } = useApp();
  const [searchQuery, setSearchQuery] = useState(initialData?.query || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
  const [maxDistance, setMaxDistance] = useState(50);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const filteredWorkers = useMemo(() => {
    let result = [...workers];

    if (selectedCategory) {
      result = result.filter(w => w.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.skills.some(s => s.toLowerCase().includes(q)) ||
        w.location.area.toLowerCase().includes(q) ||
        categories.find(c => c.id === w.category)?.name.toLowerCase().includes(q)
      );
    }

    if (maxDistance < 50) {
      result = result.filter(w => w.distance <= maxDistance);
    }

    if (minRating > 0) {
      result = result.filter(w => w.rating >= minRating);
    }

    if (showAvailableOnly) {
      result = result.filter(w => w.available);
    }

    switch (sortBy) {
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'distance': result.sort((a, b) => a.distance - b.distance); break;
      case 'price_low': result.sort((a, b) => a.priceRange.min - b.priceRange.min); break;
      case 'price_high': result.sort((a, b) => b.priceRange.max - a.priceRange.max); break;
      case 'experience': result.sort((a, b) => b.experience - a.experience); break;
    }

    return result;
  }, [workers, selectedCategory, searchQuery, maxDistance, minRating, sortBy, showAvailableOnly, categories]);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      setIsListening(true);
      recognition.onresult = (event) => {
        setSearchQuery(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  return (
    <div className="search-page" id="search-page">
      <div className="container">
        {/* Search Header */}
        <div className="search-header animate-fadeInDown">
          <h1 className="search-header__title">Find Workers</h1>
          <div className="search-bar">
            <div className="search-bar__input-wrap">
              <svg className="search-bar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="search-bar__input"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-input"
              />
              <button
                className={`search-bar__voice ${isListening ? 'search-bar__voice--active' : ''}`}
                onClick={handleVoiceSearch}
                id="search-voice-btn"
              >
                🎤
              </button>
            </div>
          </div>
        </div>

        <div className="search-layout">
          {/* Filters Sidebar */}
          <aside className="filters animate-fadeInUp">
            {/* Category Filter */}
            <div className="filter-group">
              <h3 className="filter-group__title">{t('categories')}</h3>
              <div className="filter-cats">
                <button
                  className={`filter-cat ${selectedCategory === '' ? 'filter-cat--active' : ''}`}
                  onClick={() => setSelectedCategory('')}
                  id="filter-cat-all"
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`filter-cat ${selectedCategory === cat.id ? 'filter-cat--active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    id={`filter-cat-${cat.id}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Filter */}
            <div className="filter-group">
              <h3 className="filter-group__title">{t('filterDistance')}</h3>
              <div className="filter-range">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="filter-range__input"
                  id="filter-distance-range"
                />
                <span className="filter-range__value">{maxDistance < 50 ? `${maxDistance} km` : 'Any'}</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="filter-group">
              <h3 className="filter-group__title">{t('filterRating')}</h3>
              <div className="filter-rating-options">
                {[0, 4, 4.5, 4.8].map(rating => (
                  <button
                    key={rating}
                    className={`filter-rating-btn ${minRating === rating ? 'filter-rating-btn--active' : ''}`}
                    onClick={() => setMinRating(rating)}
                    id={`filter-rating-${rating}`}
                  >
                    {rating === 0 ? 'All' : `${rating}+ ⭐`}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="filter-group">
              <label className="filter-toggle" id="filter-availability">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                />
                <span className="filter-toggle__switch"></span>
                <span className="filter-toggle__label">{t('available')} Only</span>
              </label>
            </div>
          </aside>

          {/* Results */}
          <main className="search-results">
            <div className="search-results__header animate-fadeIn">
              <span className="search-results__count">{filteredWorkers.length} {t('results')}</span>
              <div className="search-results__sort">
                <label>{t('sortBy')}:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="sort-select">
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                  <option value="price_low">Price: Low → High</option>
                  <option value="price_high">Price: High → Low</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="search-results__empty animate-fadeInUp">
                <span className="search-results__empty-icon">🔍</span>
                <h3>{t('noResults')}</h3>
                <p>{t('tryAgain')}</p>
              </div>
            ) : (
              <div className="search-results__grid">
                {filteredWorkers.map((worker, idx) => (
                  <div
                    key={worker.id}
                    className="result-card animate-fadeInUp"
                    style={{ animationDelay: `${idx * 80}ms` }}
                    onClick={() => onNavigate('worker', { workerId: worker.id })}
                    id={`result-card-${worker.id}`}
                  >
                    <div className="result-card__left">
                      <div className="result-card__avatar" style={{ background: `linear-gradient(135deg, ${categories.find(c => c.id === worker.category)?.color}, ${categories.find(c => c.id === worker.category)?.color}bb)` }}>
                        <span>{worker.name[0]}</span>
                      </div>
                      <div className="result-card__badges-col">
                        {worker.verified && <span className="result-card__verified-badge">✓</span>}
                        <span className={`result-card__availability ${worker.available ? 'result-card__availability--yes' : ''}`}>
                          {worker.available ? '●' : '○'}
                        </span>
                      </div>
                    </div>

                    <div className="result-card__center">
                      <div className="result-card__top">
                        <h3 className="result-card__name">{worker.name}</h3>
                        <div className="result-card__cat">
                          {categories.find(c => c.id === worker.category)?.icon} {categories.find(c => c.id === worker.category)?.name}
                        </div>
                      </div>

                      <div className="result-card__meta">
                        <span>⭐ {worker.rating} ({worker.reviews})</span>
                        <span>📍 {worker.distance} km</span>
                        <span>💼 {worker.experience} yrs</span>
                        <span>✅ {worker.completedJobs} jobs</span>
                      </div>

                      <div className="result-card__skills">
                        {worker.skills.map((skill, i) => (
                          <span key={i} className="result-card__skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="result-card__right">
                      <div className="result-card__price">
                        <span className="result-card__price-amount">₹{worker.priceRange.min}–{worker.priceRange.max}</span>
                        <span className="result-card__price-unit">/{worker.priceRange.unit === 'per hour' ? 'hr' : 'day'}</span>
                      </div>
                      <button
                        className="result-card__book"
                        onClick={(e) => { e.stopPropagation(); onNavigate('booking', { workerId: worker.id }); }}
                      >
                        {t('bookNow')} →
                      </button>
                      <button
                        className="result-card__profile"
                        onClick={(e) => { e.stopPropagation(); onNavigate('worker', { workerId: worker.id }); }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
