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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BACKEND_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

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
    const response = await api.post('/api/auth/google', {
      google_token: googleToken,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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

  removeChild: async (childId) => {
    const response = await api.delete(`/api/users/children/${childId}`);
    return response.data;
  },
};

// Monitoring API
export const monitoringAPI = {
  getCallLogs: async (childId, limit = 50) => {
    const response = await api.get(`/api/monitoring/${childId}/calls?limit=${limit}`);
    return response.data;
  },

  getMessages: async (childId, limit = 50) => {
    const response = await api.get(`/api/monitoring/${childId}/messages?limit=${limit}`);
    return response.data;
  },

  getLocations: async (childId, limit = 50) => {
    const response = await api.get(`/api/monitoring/${childId}/locations?limit=${limit}`);
    return response.data;
  },

  getAppUsage: async (childId, limit = 50) => {
    const response = await api.get(`/api/monitoring/${childId}/apps?limit=${limit}`);
    return response.data;
  },

  getWebHistory: async (childId, limit = 50) => {
    const response = await api.get(`/api/monitoring/${childId}/web?limit=${limit}`);
    return response.data;
  },

  getAlerts: async (childId, unreadOnly = false, limit = 50) => {
    const response = await api.get(`/api/monitoring/${childId}/alerts?unread_only=${unreadOnly}&limit=${limit}`);
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

  getChildSummary: async (childId) => {
    const response = await api.get(`/api/monitoring/${childId}/summary`);
    return response.data;
  },

  getGeofences: async (childId) => {
    const response = await api.get(`/api/monitoring/${childId}/geofences`);
    return response.data;
  },

  getContacts: async (childId) => {
    const response = await api.get(`/api/monitoring/${childId}/contacts`);
    return response.data;
  },
};

// Control API
export const controlAPI = {
  getControlSettings: async (childId) => {
    const response = await api.get(`/api/control/${childId}/settings`);
    return response.data;
  },

  controlApp: async (childId, appData) => {
    const response = await api.post(`/api/control/${childId}/block-app`, appData);
    return response.data;
  },

  controlWebsite: async (childId, websiteData) => {
    const response = await api.post(`/api/control/${childId}/block-website`, websiteData);
    return response.data;
  },

  createGeofence: async (childId, geofenceData) => {
    const response = await api.post(`/api/control/${childId}/geofence`, geofenceData);
    return response.data;
  },

  updateControlSettings: async (childId, settingsData) => {
    const response = await api.put(`/api/control/${childId}/settings`, settingsData);
    return response.data;
  },

  deleteGeofence: async (childId, geofenceId) => {
    const response = await api.delete(`/api/control/${childId}/geofence/${geofenceId}`);
    return response.data;
  },
};

export default api;