import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Adjust this to your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats/dashboard');
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  searchUsers: async (query) => {
    const response = await api.get(`/admin/users/search?query=${query}`);
    return response.data;
  },
  filterUsers: async (status, plan) => {
    const response = await api.get(`/admin/users/filter?status=${status}&plan=${plan}`);
    return response.data;
  },
  suspendUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/suspend`);
    return response.data;
  },
  unsuspendUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unsuspend`);
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  getSecurityLogs: async () => {
    const response = await api.get('/admin/security/logs');
    return response.data;
  },

};

export default api;
