import ApiResponse from '../utils/ApiResponse.js';
import * as payslipService from '../services/payslip.service.js';

export async function getById(req, res) {
  const payslip = await payslipService.getById(req.params.id, req.user);
  return ApiResponse.success(res, { payslip });
}

export async function list(req, res) {
  const { page = 1, limit = 20, sortBy, order, search, employeeId, payrunId, status, periodLabel } = req.query;
  const result = await payslipService.list({
    page: Number(page),
    limit: Number(limit),
    sortBy,
    order,
    search,
    employeeId,
    payrunId,
    status,
    periodLabel,
    skip: (Number(page) - 1) * Number(limit),
  }, req.user);
  return ApiResponse.paginated(res, result.payslips, result.meta);
}

export async function downloadPdf(req, res) {
  const { payslip, buffer } = await payslipService.generatePdf(req.params.id, req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${payslip.reference}.pdf"`);
  return res.send(buffer);
}

