import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

// ... (existing interceptors and other APIs) ...

// Auth API
export const authAPI = {
  // ... existing functions
};

// Users API
export const usersAPI = {
  // ... existing functions
};

// Monitoring API
export const monitoringAPI = {
  getWebHistory: async (childId, page = 1, limit = 20, filter = null) => {
    const params = { page, limit };
    if (filter) {
      params.filter = filter;
    }
    const response = await api.get(`/api/monitoring/${childId}/web-history`, { params });
    return response.data;
  },
};

// Control API
export const controlAPI = {
  // ... existing functions
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