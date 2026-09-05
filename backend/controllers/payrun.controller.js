import ApiResponse from '../utils/ApiResponse.js';
import * as payrunService from '../services/payrun.service.js';

export async function list(req, res) {
  const { page, limit, sortBy, order, search, status, salaryStructureId, periodLabel } = req.query;
  const result = await payrunService.list({
    page, limit, sortBy, order, search, status, salaryStructureId, periodLabel,
    skip: (page - 1) * limit,
  });
  return ApiResponse.paginated(res, result.payruns, result.meta);
}

export async function preview(req, res) {
  const result = await payrunService.preview(req.body);
  return ApiResponse.success(res, result);
}

export async function create(req, res) {
  const result = await payrunService.create(req.body, req.user.id);
  return ApiResponse.created(res, result);
}

export async function getById(req, res) {
  const payrun = await payrunService.getById(req.params.id);
  return ApiResponse.success(res, { payrun });
}

export async function compute(req, res) {
  const result = await payrunService.compute(req.params.id);
  return ApiResponse.success(res, result);
}

export async function validate(req, res) {
  const payrun = await payrunService.validate(req.params.id);
  return ApiResponse.success(res, { payrun });
}

export async function markPaid(req, res) {
  const payrun = await payrunService.markPaid(req.params.id, req.body.paymentDate);
  return ApiResponse.success(res, { payrun });
}

export async function sendEmails(req, res) {
  const result = await payrunService.sendPayslipEmails(req.params.id);
  return ApiResponse.success(res, result);
}
