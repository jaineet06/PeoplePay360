import { apiClient } from './client';

export const attendanceApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/attendance', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/attendance/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/attendance', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.patch(`/attendance/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await apiClient.delete(`/attendance/${id}`);
    return res.data;
  },
  checkIn: async (data = { source: 'WEB' }) => {
    const res = await apiClient.post('/attendance/check-in', data);
    return res.data;
  },
  checkOut: async (data = { source: 'WEB' }) => {
    const res = await apiClient.post('/attendance/check-out', data);
    return res.data;
  },
};
