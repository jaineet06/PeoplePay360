import { apiClient } from './client';

export const timeOffApi = {
  // Types
  listTypes: async (params = {}) => {
    const res = await apiClient.get('/time-off/types', { params });
    return res.data;
  },
  getTypeById: async (id) => {
    const res = await apiClient.get(`/time-off/types/${id}`);
    return res.data;
  },
  createType: async (data) => {
    const res = await apiClient.post('/time-off/types', data);
    return res.data;
  },
  updateType: async (id, data) => {
    const res = await apiClient.patch(`/time-off/types/${id}`, data);
    return res.data;
  },
  removeType: async (id) => {
    const res = await apiClient.delete(`/time-off/types/${id}`);
    return res.data;
  },

  // Allocations
  listAllocations: async (params = {}) => {
    const res = await apiClient.get('/time-off/allocations', { params });
    return res.data;
  },
  getAllocationById: async (id) => {
    const res = await apiClient.get(`/time-off/allocations/${id}`);
    return res.data;
  },
  createAllocation: async (data) => {
    const res = await apiClient.post('/time-off/allocations', data);
    return res.data;
  },
  updateAllocation: async (id, data) => {
    const res = await apiClient.patch(`/time-off/allocations/${id}`, data);
    return res.data;
  },
  approveAllocation: async (id) => {
    const res = await apiClient.post(`/time-off/allocations/${id}/approve`);
    return res.data;
  },
  refuseAllocation: async (id, data) => {
    const res = await apiClient.post(`/time-off/allocations/${id}/refuse`, data);
    return res.data;
  },
  removeAllocation: async (id) => {
    const res = await apiClient.delete(`/time-off/allocations/${id}`);
    return res.data;
  },

  // Requests
  listRequests: async (params = {}) => {
    const res = await apiClient.get('/time-off/requests', { params });
    return res.data;
  },
  getRequestById: async (id) => {
    const res = await apiClient.get(`/time-off/requests/${id}`);
    return res.data;
  },
  createRequest: async (data) => {
    const res = await apiClient.post('/time-off/requests', data);
    return res.data;
  },
  updateRequest: async (id, data) => {
    const res = await apiClient.patch(`/time-off/requests/${id}`, data);
    return res.data;
  },
  approveRequest: async (id) => {
    const res = await apiClient.post(`/time-off/requests/${id}/approve`);
    return res.data;
  },
  refuseRequest: async (id, data) => {
    const res = await apiClient.post(`/time-off/requests/${id}/refuse`, data);
    return res.data;
  },
  cancelRequest: async (id) => {
    const res = await apiClient.post(`/time-off/requests/${id}/cancel`);
    return res.data;
  },
  removeRequest: async (id) => {
    const res = await apiClient.delete(`/time-off/requests/${id}`);
    return res.data;
  },
};
