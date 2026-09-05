import { apiClient } from './client';

export const employeeApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/employees', { params });
    return res.data; // { success: true, data: [...], meta: { page, limit, total, totalPages } } or kanban { groupBy, groups, meta }
  },

  getById: async (id) => {
    const res = await apiClient.get(`/employees/${id}`);
    return res.data; // { success: true, data: { employee } }
  },

  getMe: async () => {
    const res = await apiClient.get('/employees/me');
    return res.data; // { success: true, data: { employee } }
  },

  create: async (payload) => {
    const res = await apiClient.post('/employees', payload);
    return res.data; // { success: true, data: { employee, user?, tempPassword? } }
  },

  update: async (id, payload) => {
    const res = await apiClient.patch(`/employees/${id}`, payload);
    return res.data; // { success: true, data: { employee } }
  },

  remove: async (id) => {
    const res = await apiClient.delete(`/employees/${id}`);
    return res.data; // { success: true, message: '...' }
  },

  listContracts: async (id, params = {}) => {
    const res = await apiClient.get(`/employees/${id}/contracts`, { params });
    return res.data; // { success: true, data: [...], meta }
  },

  listAttendance: async (id, params = {}) => {
    const res = await apiClient.get(`/employees/${id}/attendance`, { params });
    return res.data; // { success: true, data: [...], meta }
  },

  listTimeOffRequests: async (id, params = {}) => {
    const res = await apiClient.get(`/employees/${id}/time-off`, { params });
    return res.data; // { success: true, data: [...], meta }
  },

  listAllocations: async (id, params = {}) => {
    const res = await apiClient.get(`/employees/${id}/allocations`, { params });
    return res.data; // { success: true, data: [...], meta }
  },
};
