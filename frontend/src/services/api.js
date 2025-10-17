import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  googleAuth: async (googleToken) => {
    const response = await api.post('/api/auth/google', { token: googleToken });
    return response.data;
  },
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  },
  getChildren: async () => {
    const response = await api.get('/api/users/children');
    return response.data;
  },
  addChild: async (childData) => {
    const response = await api.post('/api/users/children', childData);
    return response.data;
  },
  updateChild: async (childId, childData) => {
    const response = await api.put(`/api/users/children/${childId}`, childData);
    return response.data;
  },
  deleteChild: async (childId) => {
    const response = await api.delete(`/api/users/children/${childId}`);
    return response.data;
  },
};

// Monitoring API
export const monitoringAPI = {
  getCallLogs: async (childId, page = 1, limit = 20) => {
    const response = await api.get(`/api/monitoring/${childId}/calls`, { params: { page, limit } });
    return response.data;
  },
  getMessages: async (childId, page = 1, limit = 20) => {
    const response = await api.get(`/api/monitoring/${childId}/messages`, { params: { page, limit } });
    return response.data;
  },
  getLocationHistory: async (childId, page = 1, limit = 100) => {
    const response = await api.get(`/api/monitoring/${childId}/locations`, { params: { page, limit } });
    return response.data;
  },
  getAppUsage: async (childId) => {
    const response = await api.get(`/api/monitoring/${childId}/apps`);
    return response.data;
  },
  getWebHistory: async (childId, page = 1, limit = 20, filter = null) => {
    const params = { page, limit };
    if (filter) {
      params.filter = filter;
    }
    const response = await api.get(`/api/monitoring/${childId}/web-history`, { params });
    return response.data;
  },
  getAlerts: async (childId) => {
    const response = await api.get(`/api/monitoring/${childId}/alerts`);
    return response.data;
  },
  markAlertAsRead: async (childId, alertId) => {
    const response = await api.post(`/api/monitoring/${childId}/alerts/${alertId}/read`);
    return response.data;
  },
  dismissAlert: async (childId, alertId) => {
    const response = await api.delete(`/api/monitoring/${childId}/alerts/${alertId}`);
    return response.data;
  },
};

// Control API
export const controlAPI = {
  blockApp: async (childId, appData) => {
    const response = await api.post(`/api/control/${childId}/block-app', appData);
    return response.data;
  },
  blockWebsite: async (childId, websiteData) => {
    const response = await api.post(`/api/control/${childId}/block-website', websiteData);
    return response.data;
  },
  updateGeofence: async (childId, geofenceData) => {
    const response = await api.put(`/api/control/${childId}/geofence', geofenceData);
    return response.data;
  },
  getSettings: async (childId) => {
    const response = await api.get(`/api/control/${childId}/settings`);
    return response.data;
  },
  updateSettings: async (childId, settingsData) => {
    const response = await api.put(`/api/control/${childId}/settings', settingsData);
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  // ... existing functions
};

// Admin API
export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/api/admin/stats/dashboard');
    return response.data;
  },
  getRevenueAnalytics: async (timeRange) => {
    const response = await api.get('/api/admin/analytics/revenue', { params: { timeRange } });
    return response.data;
  },
  getSignupsAnalytics: async (timeRange) => {
    const response = await api.get('/api/admin/analytics/signups', { params: { timeRange } });
    return response.data;
  },
  getSubscriptionAnalytics: async (timeRange) => {
    const response = await api.get('/api/admin/analytics/subscriptions', { params: { timeRange } });
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },
  getFinancialData: async () => {
    const response = await api.get('/api/admin/financials');
    return response.data;
  },
  getSecurityLogs: async () => {
    const response = await api.get('/api/security/logs');
    return response.data;
  },
};

export default api;
