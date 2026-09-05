import { apiClient } from './client';

export const payslipsApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/payslips', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/payslips/${id}`);
    return res.data;
  },
  downloadPdf: async (id, filename = 'payslip.pdf') => {
    const res = await apiClient.get(`/payslips/${id}/pdf`, {
      responseType: 'blob',
    });
    // Create blob link and trigger download in browser
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },
};
