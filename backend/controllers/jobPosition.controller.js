import ApiResponse from '../utils/ApiResponse.js';
import * as jobPositionService from '../services/jobPosition.service.js';

export async function list(req, res) {
  const { page, limit, sortBy, order, search, isActive } = req.query;
  const { jobPositions, meta } = await jobPositionService.list({
    page, limit, sortBy, order, search, isActive, skip: (page - 1) * limit,
  });
  return ApiResponse.paginated(res, jobPositions, meta);
}

export async function getById(req, res) {
  const jobPosition = await jobPositionService.getById(req.params.id);
  return ApiResponse.success(res, { jobPosition });
}

export async function create(req, res) {
  const jobPosition = await jobPositionService.create(req.body);
  return ApiResponse.created(res, { jobPosition });
}

export async function update(req, res) {
  const jobPosition = await jobPositionService.update(req.params.id, req.body);
  return ApiResponse.success(res, { jobPosition });
}

export async function remove(req, res) {
  const jobPosition = await jobPositionService.remove(req.params.id);
  return ApiResponse.success(res, { jobPosition });
}
