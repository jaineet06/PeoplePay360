import { apiClient } from './client';

export const contractsApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/contracts', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/contracts/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/contracts', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.patch(`/contracts/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await apiClient.delete(`/contracts/${id}`);
    return res.data;
  },
  resolve: async (params) => {
    const res = await apiClient.get('/contracts/resolve', { params });
    return res.data;
  },
};
