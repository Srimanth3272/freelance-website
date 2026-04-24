import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './AdminDashboard.css';

export default function AdminDashboard({ onNavigate }) {
  const {
    user, isAuthenticated, workers, categories, bookings, addWorker, updateWorker, deleteWorker,
    workerApplications, approveWorkerApplication, rejectWorkerApplication
  } = useApp();

  const [activeTab, setActiveTab] = useState('workers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // New Worker Form State
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'plumber',
    skills: '',
    experience: '',
    bio: '',
    area: '',
    city: 'Hyderabad',
    priceMin: '',
    priceMax: '',
    priceUnit: 'per hour',
    languages: [],
    photoUrl: '',
  });

  const handleAddWorker = (e) => {
    e.preventDefault();
    const workerData = {
      name: newWorker.name,
      phone: newWorker.phone,
      email: newWorker.email,
      category: newWorker.category,
      skills: newWorker.skills.split(',').map(s => s.trim()).filter(Boolean),
      experience: parseInt(newWorker.experience) || 0,
      bio: newWorker.bio,
      priceRange: {
        min: parseInt(newWorker.priceMin) || 300,
        max: parseInt(newWorker.priceMax) || 800,
        unit: newWorker.priceUnit,
      },
      location: {
        lat: 17.3850,
        lng: 78.4867,
        area: newWorker.area,
        city: newWorker.city,
      },
      languages: newWorker.languages.length > 0 ? newWorker.languages : ['English'],
      avatar: newWorker.photoUrl || null,
    };
    addWorker(workerData);
    setShowAddModal(false);
    setNewWorker({
      name: '', phone: '', email: '', category: 'plumber', skills: '',
      experience: '', bio: '', area: '', city: 'Hyderabad',
      priceMin: '', priceMax: '', priceUnit: 'per hour', languages: [], photoUrl: '',
    });
    setFormSuccess('Worker added successfully!');
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const handleEditWorker = (e) => {
    e.preventDefault();
    updateWorker(editingWorker.id, {
      name: editingWorker.name,
      phone: editingWorker.phone,
      email: editingWorker.email,
      category: editingWorker.category,
      skills: typeof editingWorker.skills === 'string'
        ? editingWorker.skills.split(',').map(s => s.trim()).filter(Boolean)
        : editingWorker.skills,
      experience: parseInt(editingWorker.experience) || 0,
      bio: editingWorker.bio,
      available: editingWorker.available,
      verified: editingWorker.verified,
    });
    setShowEditModal(false);
    setEditingWorker(null);
    setFormSuccess('Worker updated successfully!');
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const handleDeleteWorker = (workerId, workerName) => {
    if (confirm(`Are you sure you want to delete ${workerName}?`)) {
      deleteWorker(workerId);
      setFormSuccess('Worker removed successfully!');
      setTimeout(() => setFormSuccess(''), 3000);
    }
  };

  const handleApprove = (appId) => {
    approveWorkerApplication(appId);
    setFormSuccess('Worker application approved! Worker has been added.');
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const handleReject = (appId) => {
    rejectWorkerApplication(appId, rejectReason);
    setRejectModal(null);
    setRejectReason('');
    setFormSuccess('Application rejected.');
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const openEdit = (worker) => {
    setEditingWorker({
      ...worker,
      skills: Array.isArray(worker.skills) ? worker.skills.join(', ') : worker.skills,
    });
    setShowEditModal(true);
  };

  const toggleLang = (lang, isNew = true) => {
    if (isNew) {
      setNewWorker(prev => ({
        ...prev,
        languages: prev.languages.includes(lang)
          ? prev.languages.filter(l => l !== lang)
          : [...prev.languages, lang],
      }));
    }
  };

  const filteredWorkers = workers.filter(w =>
    !searchQuery ||
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingApplications = workerApplications.filter(a => a.status === 'pending');
  const totalBookings = bookings.length;

  if (!isAuthenticated) {
     // Wait for state or just redirect
     setTimeout(() => onNavigate('login', { step: 'admin' }), 0);
     return null;
  }

  if (user?.role !== 'admin') {
     return (
       <div style={{textAlign: "center", padding: "100px 20px"}}>
         <h1>🚫 Access Denied</h1>
         <p>You must be an administrator to view this page.</p>
         <button onClick={() => onNavigate('home')} className="admin-header__add-btn" style={{marginTop:'20px'}}>Go Home</button>
       </div>
     );
  }

  const stats = [
    { label: 'Total Workers', value: workers.length, icon: '👷', color: '#3b82f6' },
    { label: 'Verified', value: workers.filter(w => w.verified).length, icon: '✅', color: '#10b981' },
    { label: 'Pending Apps', value: pendingApplications.length, icon: '📋', color: '#f59e0b' },
    { label: 'Total Bookings', value: totalBookings, icon: '📅', color: '#8b5cf6' },
  ];

  return (
    <div className="admin-page" id="admin-dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header animate-fadeInDown">
          <div className="admin-header__left">
            <h1 className="admin-header__title">🛡️ Admin Dashboard</h1>
            <p className="admin-header__subtitle">Manage workers, applications, and bookings</p>
          </div>
          <button
            className="admin-header__add-btn"
            onClick={() => setShowAddModal(true)}
            id="admin-add-worker-btn"
          >
            <span>+</span> Add Worker
          </button>
        </div>

        {/* Success Alert */}
        {formSuccess && (
          <div className="admin-alert admin-alert--success animate-fadeInDown">
            ✅ {formSuccess}
          </div>
        )}

        {/* Stats Cards */}
        <div className="admin-stats animate-fadeInUp">
          {stats.map((stat, idx) => (
            <div key={idx} className="admin-stat-card" style={{ borderTopColor: stat.color }}>
              <div className="admin-stat-card__icon">{stat.icon}</div>
              <div className="admin-stat-card__value">{stat.value}</div>
              <div className="admin-stat-card__label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-tabs animate-fadeIn">
          {[
            { id: 'workers', label: '👷 Workers', count: workers.length },
            { id: 'applications', label: '📋 Applications', count: pendingApplications.length },
            { id: 'bookings', label: '📅 Bookings', count: totalBookings },
            { id: 'categories', label: '📂 Categories', count: categories.length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
            >
              {tab.label}
              {tab.count > 0 && <span className="admin-tab__count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="admin-content">
          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div className="admin-workers animate-fadeInUp">
              <div className="admin-toolbar">
                <div className="admin-search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    type="text"
                    placeholder="Search workers by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-search__input"
                    id="admin-search-input"
                  />
                </div>
                <span className="admin-toolbar__count">{filteredWorkers.length} workers</span>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table" id="admin-workers-table">
                  <thead>
                    <tr>
                      <th>Worker</th>
                      <th>Category</th>
                      <th>Experience</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker, idx) => {
                      const cat = categories.find(c => c.id === worker.category);
                      return (
                        <tr key={worker.id} className="animate-fadeInUp" style={{ animationDelay: `${idx * 50}ms` }}>
                          <td>
                            <div className="admin-worker-cell">
                              <div
                                className="admin-worker-cell__avatar"
                                style={{ background: `linear-gradient(135deg, ${cat?.color || '#f97316'}, ${cat?.color || '#f97316'}aa)` }}
                              >
                                {worker.avatar ? (
                                  <img src={worker.avatar} alt={worker.name} />
                                ) : (
                                  <span>{worker.name[0]}</span>
                                )}
                              </div>
                              <div>
                                <div className="admin-worker-cell__name">{worker.name}</div>
                                <div className="admin-worker-cell__phone">{worker.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="admin-cat-badge" style={{ background: `${cat?.color}15`, color: cat?.color }}>
                              {cat?.icon} {cat?.name}
                            </span>
                          </td>
                          <td>{worker.experience} yrs</td>
                          <td>
                            <span className="admin-rating">⭐ {worker.rating}</span>
                          </td>
                          <td>
                            <span className={`admin-status-badge ${worker.available ? 'admin-status-badge--available' : 'admin-status-badge--busy'}`}>
                              {worker.available ? '● Available' : '○ Busy'}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-verified-badge ${worker.verified ? 'admin-verified-badge--yes' : ''}`}>
                              {worker.verified ? '✓ Yes' : '✕ No'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-action-btn admin-action-btn--view"
                                onClick={() => onNavigate('worker', { workerId: worker.id })}
                                title="View Profile"
                              >
                                👁️
                              </button>
                              <button
                                className="admin-action-btn admin-action-btn--edit"
                                onClick={() => openEdit(worker)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="admin-action-btn admin-action-btn--delete"
                                onClick={() => handleDeleteWorker(worker.id, worker.name)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="admin-applications animate-fadeInUp">
              {workerApplications.length === 0 ? (
                <div className="admin-empty">
                  <span className="admin-empty__icon">📋</span>
                  <h3>No applications yet</h3>
                  <p>Worker registration applications will appear here when workers sign up.</p>
                </div>
              ) : (
                <div className="admin-app-list">
                  {workerApplications.map((app, idx) => (
                    <div
                      key={app.id}
                      className={`admin-app-card animate-fadeInUp ${app.status !== 'pending' ? 'admin-app-card--processed' : ''}`}
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className="admin-app-card__header">
                        <div className="admin-app-card__avatar">
                          {app.photoUrl ? (
                            <img src={app.photoUrl} alt={app.name} />
                          ) : (
                            <span>{app.name?.[0] || '?'}</span>
                          )}
                        </div>
                        <div className="admin-app-card__info">
                          <h3>{app.name}</h3>
                          <p>{app.email} • {app.phone}</p>
                        </div>
                        <span className={`admin-app-status admin-app-status--${app.status}`}>
                          {app.status === 'pending' ? '⏳ Pending' : app.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                      </div>

                      <div className="admin-app-card__details">
                        <div className="admin-app-card__detail">
                          <span className="admin-app-card__label">Category:</span>
                          <span>{categories.find(c => c.id === app.category)?.icon} {categories.find(c => c.id === app.category)?.name || app.category}</span>
                        </div>
                        <div className="admin-app-card__detail">
                          <span className="admin-app-card__label">Experience:</span>
                          <span>{app.experience} years</span>
                        </div>
                        <div className="admin-app-card__detail">
                          <span className="admin-app-card__label">ID Proof:</span>
                          <span>{app.idProofType} — {app.idProofNumber}</span>
                        </div>
                        <div className="admin-app-card__detail">
                          <span className="admin-app-card__label">Skills:</span>
                          <span>{app.skills?.join(', ') || 'N/A'}</span>
                        </div>
                        <div className="admin-app-card__detail">
                          <span className="admin-app-card__label">Location:</span>
                          <span>{app.area}, {app.city}</span>
                        </div>
                        {app.bio && (
                          <div className="admin-app-card__detail admin-app-card__detail--full">
                            <span className="admin-app-card__label">Bio:</span>
                            <span>{app.bio}</span>
                          </div>
                        )}
                      </div>

                      {app.status === 'pending' && (
                        <div className="admin-app-card__actions">
                          <button
                            className="admin-app-card__approve"
                            onClick={() => handleApprove(app.id)}
                          >
                            ✅ Approve & Add Worker
                          </button>
                          <button
                            className="admin-app-card__reject"
                            onClick={() => setRejectModal(app.id)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                      {app.status === 'rejected' && app.rejectionReason && (
                        <div className="admin-app-card__rejection">
                          <strong>Rejection Reason:</strong> {app.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="admin-bookings animate-fadeInUp">
              <div className="admin-empty">
                <span className="admin-empty__icon">📅</span>
                <h3>Bookings Management</h3>
                <p>All customer bookings and their statuses will be tracked here. Disputes can be handled from this panel.</p>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="admin-categories animate-fadeInUp">
              <div className="admin-cat-grid">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="admin-cat-card animate-fadeInUp" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="admin-cat-card__icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className="admin-cat-card__info">
                      <h3>{cat.name}</h3>
                      <p>{workers.filter(w => w.category === cat.id).length} workers</p>
                    </div>
                    <div className="admin-cat-card__color" style={{ background: cat.color }}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal animate-scaleIn" onClick={(e) => e.stopPropagation()} id="add-worker-modal">
            <div className="admin-modal__header">
              <h2>➕ Add New Worker</h2>
              <button className="admin-modal__close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddWorker} className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>📸 Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewWorker({ ...newWorker, photoUrl: URL.createObjectURL(file) });
                      }
                    }}
                    className="admin-form-input"
                    style={{ padding: '8px' }}
                  />
                  {newWorker.photoUrl && (
                    <img src={newWorker.photoUrl} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', marginTop: '10px', objectFit: 'cover' }} />
                  )}
                </div>

                <div className="admin-form-group">
                  <label>👤 Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter worker's full name"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>📱 Phone *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>✉️ Email</label>
                  <input
                    type="email"
                    placeholder="worker@email.com"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>🔧 Category *</label>
                  <select
                    value={newWorker.category}
                    onChange={(e) => setNewWorker({ ...newWorker, category: e.target.value })}
                    className="admin-form-select"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>💼 Experience (years) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 5"
                    value={newWorker.experience}
                    onChange={(e) => setNewWorker({ ...newWorker, experience: e.target.value })}
                    className="admin-form-input"
                    required
                    min="0"
                  />
                </div>

                <div className="admin-form-group admin-form-group--full">
                  <label>🛠️ Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., Pipe Fitting, Leak Repair, Bathroom Fitting"
                    value={newWorker.skills}
                    onChange={(e) => setNewWorker({ ...newWorker, skills: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>💰 Min Price (₹)</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={newWorker.priceMin}
                    onChange={(e) => setNewWorker({ ...newWorker, priceMin: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>💰 Max Price (₹)</label>
                  <input
                    type="number"
                    placeholder="800"
                    value={newWorker.priceMax}
                    onChange={(e) => setNewWorker({ ...newWorker, priceMax: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>📍 Area</label>
                  <input
                    type="text"
                    placeholder="e.g., Secunderabad"
                    value={newWorker.area}
                    onChange={(e) => setNewWorker({ ...newWorker, area: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>🏙️ City</label>
                  <input
                    type="text"
                    placeholder="Hyderabad"
                    value={newWorker.city}
                    onChange={(e) => setNewWorker({ ...newWorker, city: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group admin-form-group--full">
                  <label>🗣️ Languages</label>
                  <div className="admin-form-langs">
                    {['Telugu', 'Hindi', 'English', 'Tamil'].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        className={`admin-form-lang ${newWorker.languages.includes(lang) ? 'admin-form-lang--active' : ''}`}
                        onClick={() => toggleLang(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-form-group admin-form-group--full">
                  <label>📝 Bio / Description</label>
                  <textarea
                    placeholder="Brief description of the worker's expertise..."
                    value={newWorker.bio}
                    onChange={(e) => setNewWorker({ ...newWorker, bio: e.target.value })}
                    className="admin-form-textarea"
                    rows={3}
                  ></textarea>
                </div>
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="admin-modal__cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="admin-modal__submit" id="admin-submit-worker">
                  ✅ Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {showEditModal && editingWorker && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal animate-scaleIn" onClick={(e) => e.stopPropagation()} id="edit-worker-modal">
            <div className="admin-modal__header">
              <h2>✏️ Edit Worker: {editingWorker.name}</h2>
              <button className="admin-modal__close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleEditWorker} className="admin-modal__body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>👤 Full Name</label>
                  <input
                    type="text"
                    value={editingWorker.name}
                    onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                    className="admin-form-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>📱 Phone</label>
                  <input
                    type="tel"
                    value={editingWorker.phone}
                    onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>🔧 Category</label>
                  <select
                    value={editingWorker.category}
                    onChange={(e) => setEditingWorker({ ...editingWorker, category: e.target.value })}
                    className="admin-form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>💼 Experience (years)</label>
                  <input
                    type="number"
                    value={editingWorker.experience}
                    onChange={(e) => setEditingWorker({ ...editingWorker, experience: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group admin-form-group--full">
                  <label>🛠️ Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editingWorker.skills}
                    onChange={(e) => setEditingWorker({ ...editingWorker, skills: e.target.value })}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group admin-form-group--full">
                  <label>📝 Bio</label>
                  <textarea
                    value={editingWorker.bio}
                    onChange={(e) => setEditingWorker({ ...editingWorker, bio: e.target.value })}
                    className="admin-form-textarea"
                    rows={3}
                  ></textarea>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-toggle-label">
                    <input
                      type="checkbox"
                      checked={editingWorker.available}
                      onChange={(e) => setEditingWorker({ ...editingWorker, available: e.target.checked })}
                    />
                    <span className="admin-form-toggle-switch"></span>
                    Available
                  </label>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-toggle-label">
                    <input
                      type="checkbox"
                      checked={editingWorker.verified}
                      onChange={(e) => setEditingWorker({ ...editingWorker, verified: e.target.checked })}
                    />
                    <span className="admin-form-toggle-switch"></span>
                    Verified
                  </label>
                </div>
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="admin-modal__cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="admin-modal__submit">
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="admin-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="admin-modal admin-modal--small animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>❌ Reject Application</h2>
              <button className="admin-modal__close" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label>Reason for rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="admin-form-textarea"
                  placeholder="Please provide a reason..."
                  rows={3}
                ></textarea>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-modal__cancel" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="admin-modal__submit admin-modal__submit--danger" onClick={() => handleReject(rejectModal)}>
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
