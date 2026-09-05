import { apiClient } from './client';
import { getStoredRefreshToken } from '@/features/auth/authStore';
import { refreshAccessToken } from '@/api/refreshSession';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data; // { success: true, data: { accessToken, refreshToken, expiresIn, user } }
  },

  refresh: async () => {
    const data = await refreshAccessToken();
    return { success: true, data: { ...data, expiresIn: 900 } };
  },

  logout: async () => {
    const refreshToken = getStoredRefreshToken();
    const res = await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data; // { success: true, data: { user } }
  },
};
