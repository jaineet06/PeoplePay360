import ApiResponse from '../utils/ApiResponse.js';
import * as departmentService from '../services/department.service.js';

export async function list(req, res) {
  const { page, limit, sortBy, order, search, isActive } = req.query;
  const { departments, meta } = await departmentService.list({
    page, limit, sortBy, order, search, isActive, skip: (page - 1) * limit,
  });
  return ApiResponse.paginated(res, departments, meta);
}

export async function getById(req, res) {
  const department = await departmentService.getById(req.params.id);
  return ApiResponse.success(res, { department });
}

export async function create(req, res) {
  const department = await departmentService.create(req.body);
  return ApiResponse.created(res, { department });
}

export async function update(req, res) {
  const department = await departmentService.update(req.params.id, req.body);
  return ApiResponse.success(res, { department });
}

export async function remove(req, res) {
  const department = await departmentService.remove(req.params.id);
  return ApiResponse.success(res, { department });
}
