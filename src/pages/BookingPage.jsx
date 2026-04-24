import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './BookingPage.css';

export default function BookingPage({ onNavigate, initialData }) {
  const { t, workers, categories, addBooking, isAuthenticated } = useApp();
  const worker = workers.find(w => w.id === initialData?.workerId) || workers[0];
  const category = categories.find(c => c.id === worker.category);

  const [step, setStep] = useState(1); // 1: details, 2: payment, 3: confirm
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    description: '',
    address: '',
    paymentMethod: 'upi',
  });
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  const estimatedPrice = Math.round((worker.priceRange.min + worker.priceRange.max) / 2);

  const handleSubmit = () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }

    if (bookingData.paymentMethod !== 'cash') {
      // Simulate Razorpay Gateway
      setLoading(true);
      setTimeout(() => {
        const confirmed = window.confirm("Razorpay Test Sandbox:\n\nAmount: ₹" + estimatedPrice + "\n\nClick 'OK' to simulate successful payment.");
        if (confirmed) {
          executeBooking();
        } else {
          setLoading(false);
          alert("Payment cancelled.");
        }
      }, 500);
    } else {
      executeBooking();
    }
  };

  const executeBooking = () => {
    setLoading(true);
    setTimeout(() => {
      addBooking({
        workerId: worker.id,
        workerName: worker.name,
        category: category?.name,
        ...bookingData,
        estimatedPrice,
        paymentStatus: bookingData.paymentMethod !== 'cash' ? 'Paid (Razorpay)' : 'Pending (Cash)'
      });
      setLoading(false);
      setBooked(true);
    }, 1000);
  };

  if (booked) {
    return (
      <div className="booking-page" id="booking-page">
        <div className="container">
          <div className="booking-success animate-bounceIn">
            <div className="booking-success__icon">✅</div>
            <h2 className="booking-success__title">Booking Confirmed!</h2>
            <p className="booking-success__text">
              Your booking with <strong>{worker.name}</strong> has been submitted successfully.
              They will confirm shortly.
            </p>
            <div className="booking-success__details">
              <div className="booking-success__detail">
                <span>📅</span>
                <span>{bookingData.date || 'Not specified'}</span>
              </div>
              <div className="booking-success__detail">
                <span>⏰</span>
                <span>{bookingData.time || 'Not specified'}</span>
              </div>
              <div className="booking-success__detail">
                <span>💰</span>
                <span>₹{estimatedPrice} (estimated)</span>
              </div>
              <div className="booking-success__detail">
                <span>📍</span>
                <span>Status: <strong>Worker En Route / Confirmed</strong></span>
              </div>
            </div>
            
            {/* Live Tracking Mockup */}
            <div style={{marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
               <h4 style={{marginBottom: '10px', display:'flex', alignItems:'center', gap:'8px'}}>
                 <span className="live-pulse" style={{display:'inline-block', width:'10px', height:'10px', background:'green', borderRadius:'50%', animation:'pulse 1.5s infinite'}}></span>
                 Live Location Tracking
               </h4>
               <div style={{height: '150px', background: '#cbd5e1', borderRadius: '8px', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
                 <div style={{position:'absolute', display:'flex', flexDirection:'column', alignItems:'center', color:'#475569'}}>
                   <span style={{fontSize:'32px'}}>🗺️</span>
                   <span style={{fontSize:'12px', fontWeight:'bold', marginTop:'5px'}}>Worker is 1.2km away (Est. 5 mins)</span>
                 </div>
               </div>
            </div>

            <div className="booking-success__actions" style={{marginTop:'20px'}}>
              <button className="booking-success__btn--primary" onClick={() => onNavigate('bookings')}>
                View My Bookings
              </button>
              <button className="booking-success__btn--secondary" onClick={() => onNavigate('home')}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page" id="booking-page">
      <div className="container">
        <button className="back-btn animate-fadeIn" onClick={() => onNavigate('worker', { workerId: worker.id })}>
          ← Back to profile
        </button>

        <div className="booking-layout">
          {/* Main Form */}
          <div className="booking-form animate-fadeInUp">
            <h1 className="booking-form__title">{t('bookingDetails')}</h1>

            {/* Step Indicators */}
            <div className="booking-steps">
              {[1, 2, 3].map(s => (
                <div key={s} className={`booking-step-indicator ${step >= s ? 'booking-step-indicator--active' : ''}`}>
                  <div className="booking-step-indicator__num">{s}</div>
                  <span>{s === 1 ? 'Details' : s === 2 ? 'Payment' : 'Confirm'}</span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="booking-step-content animate-fadeInUp">
                <div className="form-group">
                  <label className="form-label">📅 {t('selectDate')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    id="booking-date"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">⏰ {t('selectTime')}</label>
                  <div className="time-slots">
                    {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map(time => (
                      <button
                        key={time}
                        className={`time-slot ${bookingData.time === time ? 'time-slot--active' : ''}`}
                        onClick={() => setBookingData({ ...bookingData, time })}
                        id={`time-${time.replace(/[: ]/g, '')}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">📝 {t('describeIssue')}</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe what you need help with..."
                    rows={4}
                    value={bookingData.description}
                    onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                    id="booking-description"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">📍 Service Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your address..."
                    value={bookingData.address}
                    onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                    id="booking-address"
                  />
                </div>

                <button className="booking-next-btn" onClick={() => setStep(2)} id="booking-next-1">
                  Continue to Payment →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="booking-step-content animate-fadeInUp">
                <div className="form-group">
                  <label className="form-label">💳 {t('paymentMethod')}</label>
                  <div className="payment-options">
                    {[
                      { id: 'upi', icon: '📱', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                      { id: 'cash', icon: '💵', name: 'Cash', desc: 'Pay after service completion' },
                      { id: 'card', icon: '💳', name: 'Card', desc: 'Credit/Debit card' },
                    ].map(method => (
                      <button
                        key={method.id}
                        className={`payment-option ${bookingData.paymentMethod === method.id ? 'payment-option--active' : ''}`}
                        onClick={() => setBookingData({ ...bookingData, paymentMethod: method.id })}
                        id={`payment-${method.id}`}
                      >
                        <span className="payment-option__icon">{method.icon}</span>
                        <div className="payment-option__info">
                          <span className="payment-option__name">{method.name}</span>
                          <span className="payment-option__desc">{method.desc}</span>
                        </div>
                        <div className={`payment-option__radio ${bookingData.paymentMethod === method.id ? 'payment-option__radio--active' : ''}`}></div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="booking-nav-buttons">
                  <button className="booking-back-btn" onClick={() => setStep(1)} id="booking-back-2">
                    ← Back
                  </button>
                  <button className="booking-next-btn" onClick={() => setStep(3)} id="booking-next-2">
                    Review Booking →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="booking-step-content animate-fadeInUp">
                <div className="booking-review">
                  <h3 className="booking-review__title">Review Your Booking</h3>

                  <div className="booking-review__items">
                    <div className="booking-review__item">
                      <span className="booking-review__label">Worker</span>
                      <span className="booking-review__value">{worker.name}</span>
                    </div>
                    <div className="booking-review__item">
                      <span className="booking-review__label">Service</span>
                      <span className="booking-review__value">{category?.icon} {category?.name}</span>
                    </div>
                    <div className="booking-review__item">
                      <span className="booking-review__label">Date</span>
                      <span className="booking-review__value">{bookingData.date || 'Not set'}</span>
                    </div>
                    <div className="booking-review__item">
                      <span className="booking-review__label">Time</span>
                      <span className="booking-review__value">{bookingData.time || 'Not set'}</span>
                    </div>
                    <div className="booking-review__item">
                      <span className="booking-review__label">Address</span>
                      <span className="booking-review__value">{bookingData.address || 'Not set'}</span>
                    </div>
                    <div className="booking-review__item">
                      <span className="booking-review__label">Payment</span>
                      <span className="booking-review__value">{bookingData.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="booking-review__item booking-review__item--total">
                      <span className="booking-review__label">Estimated Total</span>
                      <span className="booking-review__value booking-review__value--price">₹{estimatedPrice}</span>
                    </div>
                  </div>

                  <div className="booking-review__note">
                    💡 Final price may vary based on the actual work required. The worker will confirm the exact price before starting.
                  </div>
                </div>

                <div className="booking-nav-buttons">
                  <button className="booking-back-btn" onClick={() => setStep(2)} id="booking-back-3">
                    ← Back
                  </button>
                  <button
                    className={`booking-confirm-btn ${loading ? 'booking-confirm-btn--loading' : ''}`}
                    onClick={handleSubmit}
                    disabled={loading}
                    id="booking-confirm"
                  >
                    {loading ? (
                      <>
                        <span className="booking-spinner"></span>
                        Booking...
                      </>
                    ) : (
                      <>{t('confirmBooking')} ✓</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <aside className="booking-sidebar animate-fadeInUp stagger-1">
            <div className="booking-summary">
              <h3 className="booking-summary__title">Booking Summary</h3>

              <div className="booking-summary__worker">
                <div className="booking-summary__avatar" style={{ background: `linear-gradient(135deg, ${category?.color}, ${category?.color}aa)` }}>
                  {worker.name[0]}
                </div>
                <div>
                  <div className="booking-summary__name">{worker.name}</div>
                  <div className="booking-summary__cat">{category?.icon} {category?.name}</div>
                  <div className="booking-summary__rating">⭐ {worker.rating} ({worker.reviews} reviews)</div>
                </div>
              </div>

              <div className="booking-summary__price-card">
                <div className="booking-summary__price-header">🤖 AI Price Estimate</div>
                <div className="booking-summary__price-range">
                  <div className="booking-summary__price-min">
                    <span>Min</span>
                    <span>₹{worker.priceRange.min}</span>
                  </div>
                  <div className="booking-summary__price-avg">
                    <span>Estimated</span>
                    <span>₹{estimatedPrice}</span>
                  </div>
                  <div className="booking-summary__price-max">
                    <span>Max</span>
                    <span>₹{worker.priceRange.max}</span>
                  </div>
                </div>
              </div>

              <div className="booking-summary__trust">
                <div className="booking-summary__trust-item">✓ Price locked before booking</div>
                <div className="booking-summary__trust-item">✓ Verified worker</div>
                <div className="booking-summary__trust-item">✓ Money-back guarantee</div>
                <div className="booking-summary__trust-item">✓ 24/7 Support</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
