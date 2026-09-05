import { apiClient } from './client';
import { getStoredRefreshToken } from '@/features/auth/authStore';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data; // { success: true, data: { accessToken, refreshToken, expiresIn, user } }
  },

  refresh: async (tokenOverride = null) => {
    const refreshToken = tokenOverride || getStoredRefreshToken();
    const res = await apiClient.post('/auth/refresh', refreshToken ? { refreshToken } : {});
    return res.data; // { success: true, data: { accessToken, refreshToken, expiresIn, user } }
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
