import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__
  ? 'https://squiggle-hertz-detention.ngrok-free.dev/api'
  : 'https://goalpath-api.herokuapp.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
};

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  goalProgress: (id) => api.get(`/analytics/goals/${id}`),
  habitStats: (id, params) => api.get(`/analytics/habits/${id}`, { params }),
};

export default api;
