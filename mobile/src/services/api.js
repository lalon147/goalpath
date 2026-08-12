import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point at the hosted backend in all build modes. This must be a public URL:
// the app runs on a phone, so localhost and LAN addresses are unreachable, and
// release bundles run with __DEV__ false.
const BASE_URL = 'https://goalpath.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  // The backend sleeps when idle and can take ~30s to wake, which is longer
  // than the first request would otherwise be allowed to wait.
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  signin: (data) => api.post('/auth/signin', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  usernameAvailable: (username) => api.get('/auth/username-available', { params: { username } }),
  recover: (data) => api.post('/auth/recover', data),
  regenerateRecoveryCode: (password) => api.post('/auth/recovery-code', { password }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.post('/users/change-password', data),
};

export const goalsAPI = {
  create: (data) => api.post('/goals', data),
  getAll: (params) => api.get('/goals', { params }),
  getOne: (id) => api.get(`/goals/${id}`),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const milestonesAPI = {
  create: (goalId, data) => api.post(`/goals/${goalId}/milestones`, data),
  getAll: (goalId, params) => api.get(`/goals/${goalId}/milestones`, { params }),
  update: (goalId, id, data) => api.put(`/goals/${goalId}/milestones/${id}`, data),
  complete: (goalId, id) => api.post(`/goals/${goalId}/milestones/${id}/complete`),
  uncomplete: (goalId, id) => api.delete(`/goals/${goalId}/milestones/${id}/complete`),
  delete: (goalId, id) => api.delete(`/goals/${goalId}/milestones/${id}`),
};

export const habitsAPI = {
  create: (data) => api.post('/habits', data),
  getAll: (params) => api.get('/habits', { params }),
  getOne: (id) => api.get(`/habits/${id}`),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  log: (id, data) => api.post(`/habits/${id}/log`, data),
  getLogs: (id, params) => api.get(`/habits/${id}/logs`, { params }),
  // Whole-week grid for every habit at once, and an upsert for a single day.
  week: (start) => api.get('/habits/logs/week', { params: start ? { start } : {} }),
  setDay: (id, payload) => api.put(`/habits/${id}/logs/by-date`, payload),
};

export const suggestionsAPI = {
  generate: (data) => api.post('/suggestions', data),
};

export const friendsAPI = {
  list: () => api.get('/friends'),
  search: (q) => api.get('/friends/search', { params: { q } }),
  requests: () => api.get('/friends/requests'),
  // Takes { userId } or { username } — adding by handle needs no search first.
  sendRequest: (payload) => api.post('/friends/requests', payload),
  accept: (id) => api.post(`/friends/requests/${id}/accept`),
  decline: (id) => api.post(`/friends/requests/${id}/decline`),
  remove: (id) => api.delete(`/friends/${id}`),
};

export const goalMembersAPI = {
  invite: (goalId, payload) => api.post(`/goals/${goalId}/members`, payload),
  respond: (goalId, accept) => api.post(`/goals/${goalId}/members/respond`, { accept }),
  leaderboard: (goalId) => api.get(`/goals/${goalId}/leaderboard`),
  remove: (goalId, userId) => api.delete(`/goals/${goalId}/members/${userId}`),
  invitations: () => api.get('/goals/invitations/pending'),
};

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  goalProgress: (id) => api.get(`/analytics/goals/${id}`),
  habitStats: (id, params) => api.get(`/analytics/habits/${id}`, { params }),
};

export default api;
