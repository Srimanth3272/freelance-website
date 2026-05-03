const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://freelance-website-4b2g.onrender.com/api';

// Helper to get stored auth token
function getToken() {
  return localStorage.getItem('kaamwala_token');
}

function setToken(token) {
  localStorage.setItem('kaamwala_token', token);
}

function removeToken() {
  localStorage.removeItem('kaamwala_token');
}

function getStoredUser() {
  const raw = localStorage.getItem('kaamwala_user');
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user) {
  localStorage.setItem('kaamwala_user', JSON.stringify(user));
}

function removeStoredUser() {
  localStorage.removeItem('kaamwala_user');
}

// Base fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }
  return data;
}

// ============ AUTH ============
export const authAPI = {
  async register(name, email, phone, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async loginPhone(phone, otp) {
    const data = await apiFetch('/auth/login/phone', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    if (data.token) {
      setToken(data.token);
      setStoredUser(data.user);
    }
    return data;
  },

  async getProfile() {
    return apiFetch('/auth/me');
  },

  async updateProfile(updates) {
    return apiFetch('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  logout() {
    removeToken();
    removeStoredUser();
  },

  isLoggedIn() {
    return !!getToken();
  },

  getUser() {
    return getStoredUser();
  },
};

// ============ WORKERS ============
export const workersAPI = {
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/workers${query ? `?${query}` : ''}`);
  },

  async get(id) {
    return apiFetch(`/workers/${id}`);
  },

  async update(id, updates) {
    return apiFetch(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async apply(applicationData) {
    return apiFetch('/workers/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },
};

// ============ BOOKINGS ============
export const bookingsAPI = {
  async create(bookingData) {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/bookings${query ? `?${query}` : ''}`);
  },

  async get(id) {
    return apiFetch(`/bookings/${id}`);
  },

  async updateStatus(id, status) {
    return apiFetch(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async addReview(id, rating, text) {
    return apiFetch(`/bookings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, text }),
    });
  },
};

// ============ ADMIN ============
export const adminAPI = {
  async getStats() {
    return apiFetch('/admin/stats');
  },

  async listWorkers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/workers${query ? `?${query}` : ''}`);
  },

  async addWorker(workerData) {
    return apiFetch('/admin/workers', {
      method: 'POST',
      body: JSON.stringify(workerData),
    });
  },

  async updateWorker(id, updates) {
    return apiFetch(`/admin/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteWorker(id) {
    return apiFetch(`/admin/workers/${id}`, { method: 'DELETE' });
  },

  async listApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/applications${query ? `?${query}` : ''}`);
  },

  async approveApplication(id) {
    return apiFetch(`/admin/applications/${id}/approve`, { method: 'PUT' });
  },

  async rejectApplication(id, reason) {
    return apiFetch(`/admin/applications/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async listBookings() {
    return apiFetch('/admin/bookings');
  },
};

// ============ CATEGORIES ============
export const categoriesAPI = {
  async list() {
    return apiFetch('/categories');
  },
};

// ============ UPLOADS ============
export const uploadAPI = {
  async uploadFile(file, type = 'file') {
    const formData = new FormData();
    formData.append(type === 'photo' ? 'photo' : type === 'idproof' ? 'idproof' : 'file', file);

    const token = getToken();
    const res = await fetch(`${API_BASE}/upload/${type}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};

// ============ AI ============
export const aiAPI = {
  async chat(message) {
    return apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};
