import { apiClient } from './client';

export const usersApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  },
  changeRole: async (id, role) => {
    const res = await apiClient.patch(`/users/${id}/role`, { role });
    return res.data;
  },
};
