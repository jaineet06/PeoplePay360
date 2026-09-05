import ApiResponse from '../utils/ApiResponse.js';
import * as dashboardService from '../services/dashboard.service.js';

export async function summary(req, res) {
  const data = await dashboardService.getSummary(req.query);
  return ApiResponse.success(res, data);
}

export async function salaryByDepartment(req, res) {
  const data = await dashboardService.getSalaryByDepartment(req.query);
  return ApiResponse.success(res, data);
}

export async function monthlyTrend(req, res) {
  const data = await dashboardService.getMonthlyTrend(req.query);
  return ApiResponse.success(res, data);
}

export async function alerts(req, res) {
  const data = await dashboardService.getAlerts();
  return ApiResponse.success(res, data);
}
