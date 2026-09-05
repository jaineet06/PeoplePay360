import ApiResponse from '../utils/ApiResponse.js';
import * as payslipService from '../services/payslip.service.js';

export async function getById(req, res) {
  const payslip = await payslipService.getById(req.params.id, req.user);
  return ApiResponse.success(res, { payslip });
}

export async function downloadPdf(req, res) {
  const { payslip, buffer } = await payslipService.generatePdf(req.params.id, req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${payslip.reference}.pdf"`);
  return res.send(buffer);
}
