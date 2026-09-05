import { apiClient } from './client';

export const lookupsApi = {
  getDepartments: async (params = {}) => {
    const res = await apiClient.get('/departments', {
      params: { limit: 100, sortBy: 'name', order: 'asc', ...params },
    });
    return res.data; // { success: true, data: [...], meta }
  },

  getJobPositions: async (params = {}) => {
    const res = await apiClient.get('/job-positions', {
      params: { limit: 100, sortBy: 'title', order: 'asc', ...params },
    });
    return res.data;
  },

  getWorkingSchedules: async (params = {}) => {
    const res = await apiClient.get('/working-schedules', {
      params: { limit: 100, sortBy: 'name', order: 'asc', ...params },
    });
    return res.data;
  },

  getManagers: async (params = {}) => {
    const res = await apiClient.get('/employees', {
      params: { limit: 100, sortBy: 'fullName', order: 'asc', status: 'ACTIVE', ...params },
    });
    return res.data;
  },
};
