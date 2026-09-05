import { apiClient } from './client';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data; // { success: true, data: { accessToken, expiresIn, user } }
  },

  refresh: async () => {
    const res = await apiClient.post('/auth/refresh');
    return res.data; // { success: true, data: { accessToken, expiresIn, user } }
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data; // { success: true, data: { user } }
  },
};
