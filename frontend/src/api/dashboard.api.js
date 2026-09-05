import { apiClient } from './client';

export const dashboardApi = {
  getSummary: async (params = {}) => {
    const res = await apiClient.get('/dashboard/summary', { params });
    return res.data; // { success: true, data: { totalNetSalary, payslipCount, averageSalary, approvedTimeOffCount, attendanceHealth } }
  },

  getSalaryByDepartment: async (params = {}) => {
    // Backend validation accepts { period }
    const query = {};
    if (params.period) query.period = params.period;
    const res = await apiClient.get('/dashboard/salary-by-department', { params: query });
    return res.data; // { success: true, data: { chart: [ { label, departmentId, departmentCode, value, payslipCount } ] } }
  },

  getMonthlyTrend: async (params = {}) => {
    const query = { months: params.months || 12 };
    if (params.departmentId) query.departmentId = params.departmentId;
    const res = await apiClient.get('/dashboard/monthly-trend', { params: query });
    return res.data; // { success: true, data: { chart: [ { label, value, payslipCount } ] } }
  },

  getAlerts: async () => {
    const res = await apiClient.get('/dashboard/alerts');
    return res.data; // { success: true, data: { alerts: [ { type, count } ] } }
  },
};
