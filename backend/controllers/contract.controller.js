import ApiResponse from '../utils/ApiResponse.js';
import * as contractService from '../services/contract.service.js';

function listParams(query) {
  const { page, limit, sortBy, order, search, employeeId, status, includeDeleted } = query;
  return {
    page, limit, sortBy, order, search, employeeId, status, includeDeleted,
    skip: (page - 1) * limit,
  };
}

export async function list(req, res) {
  const { contracts, meta } = await contractService.list(listParams(req.query));
  return ApiResponse.paginated(res, contracts, meta);
}

export async function getById(req, res) {
  const contract = await contractService.getById(req.params.id);
  return ApiResponse.success(res, { contract });
}

export async function create(req, res) {
  const contract = await contractService.create(req.body);
  return ApiResponse.created(res, { contract });
}

export async function update(req, res) {
  const contract = await contractService.update(req.params.id, req.body);
  return ApiResponse.success(res, { contract });
}

export async function remove(req, res) {
  await contractService.remove(req.params.id);
  return ApiResponse.success(res, { message: 'Contract deleted successfully.' });
}

export async function resolve(req, res) {
  const contract = await contractService.resolveForPeriod(req.query);
  return ApiResponse.success(res, { contract });
}
