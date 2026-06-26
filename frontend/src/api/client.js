import axios from 'axios';
import { useAuthStore } from '../store/useStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          setTokens(newAccess, newRefresh);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || 'Une erreur est survenue';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
  deleteAccount: (data) => api.delete('/auth/account', { data }),
  setupMFA: () => api.post('/auth/mfa/setup'),
  verifyMFA: (data) => api.post('/auth/mfa/verify', data),
  disableMFA: () => api.delete('/auth/mfa'),
};

export const platformsApi = {
  getAll: () => api.get('/platforms'),
  connect: (data) => api.post('/platforms/connect', data),
  disconnect: (platform) => api.delete(`/platforms/${platform}`),
  sync: (platform) => api.post(`/platforms/${platform}/sync`),
};

export const metricsApi = {
  getOverview: (period) => api.get('/metrics/overview', { params: { period } }),
  getPlatform: (platform, params) => api.get(`/metrics/platform/${platform}`, { params }),
  getTopPosts: (params) => api.get('/metrics/top-posts', { params }),
  getHeatmap: (params) => api.get('/metrics/heatmap', { params }),
  getComparison: (params) => api.get('/metrics/compare', { params }),
};

export const reportsApi = {
  getHistory: () => api.get('/reports'),
  generate: (data) => api.post('/reports/generate', data, { responseType: 'blob' }),
};

export const insightsApi = {
  get: () => api.get('/insights'),
};

export const paymentApi = {
  getPlans: () => api.get('/payment/plans'),
  initialize: (data) => api.post('/payment/initialize', data),
};

export default api;
