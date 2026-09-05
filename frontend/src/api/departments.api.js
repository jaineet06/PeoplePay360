import { apiClient } from './client';

export const departmentsApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/departments', { params });
    return res.data; // { success: true, data: [...], meta }
  },
  getById: async (id) => {
    const res = await apiClient.get(`/departments/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/departments', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.patch(`/departments/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await apiClient.delete(`/departments/${id}`);
    return res.data;
  },
};

export const jobPositionsApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/job-positions', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/job-positions/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/job-positions', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.patch(`/job-positions/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await apiClient.delete(`/job-positions/${id}`);
    return res.data;
  },
};
