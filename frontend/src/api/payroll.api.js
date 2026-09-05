import { apiClient } from './client';

export const payrollApi = {
  // Salary Structures
  listStructures: async (params = {}) => {
    const res = await apiClient.get('/salary-structures', { params });
    return res.data;
  },
  getStructure: async (id) => {
    const res = await apiClient.get(`/salary-structures/${id}`);
    return res.data;
  },
  createStructure: async (data) => {
    const res = await apiClient.post('/salary-structures', data);
    return res.data;
  },
  updateStructure: async (id, data) => {
    const res = await apiClient.patch(`/salary-structures/${id}`, data);
    return res.data;
  },
  removeStructure: async (id) => {
    const res = await apiClient.delete(`/salary-structures/${id}`);
    return res.data;
  },

  // Salary Rules
  listRules: async (structureId) => {
    const res = await apiClient.get(`/salary-structures/${structureId}/rules`);
    return res.data;
  },
  createRule: async (structureId, data) => {
    const res = await apiClient.post(`/salary-structures/${structureId}/rules`, data);
    return res.data;
  },
  updateRule: async (structureId, ruleId, data) => {
    const res = await apiClient.patch(`/salary-structures/${structureId}/rules/${ruleId}`, data);
    return res.data;
  },
  removeRule: async (structureId, ruleId) => {
    const res = await apiClient.delete(`/salary-structures/${structureId}/rules/${ruleId}`);
    return res.data;
  },
  reorderRules: async (structureId, rules) => {
    const res = await apiClient.post(`/salary-structures/${structureId}/rules/reorder`, { rules });
    return res.data;
  },
  simulate: async (structureId, data) => {
    const res = await apiClient.post(`/salary-structures/${structureId}/simulate`, data);
    return res.data;
  },

  // Payruns
  listPayruns: async (params = {}) => {
    const res = await apiClient.get('/payruns', { params });
    return res.data;
  },
  previewPayrun: async (data) => {
    const res = await apiClient.post('/payruns/preview', data);
    return res.data;
  },
  createPayrun: async (data) => {
    const res = await apiClient.post('/payruns', data);
    return res.data;
  },
  getPayrun: async (id) => {
    const res = await apiClient.get(`/payruns/${id}`);
    return res.data;
  },
  computePayrun: async (id) => {
    const res = await apiClient.post(`/payruns/${id}/compute`);
    return res.data;
  },
  validatePayrun: async (id) => {
    const res = await apiClient.post(`/payruns/${id}/validate`);
    return res.data;
  },
  markPaid: async (id, data = {}) => {
    const res = await apiClient.post(`/payruns/${id}/mark-paid`, data);
    return res.data;
  },
  sendEmails: async (id) => {
    const res = await apiClient.post(`/payruns/${id}/send`);
    return res.data;
  },
};
