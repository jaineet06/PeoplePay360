import { apiClient } from './client';

export const schedulesApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/working-schedules', { params });
    return res.data; // { success: true, data: [...], meta }
  },

  getById: async (id) => {
    const res = await apiClient.get(`/working-schedules/${id}`);
    return res.data; // { success: true, data: { ... } }
  },

  create: async (data) => {
    const res = await apiClient.post('/working-schedules', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.patch(`/working-schedules/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/working-schedules/${id}`);
    return res.data;
  },
};
