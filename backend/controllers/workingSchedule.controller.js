import ApiResponse from '../utils/ApiResponse.js';
import * as workingScheduleService from '../services/workingSchedule.service.js';

export async function list(req, res) {
  const { page, limit, sortBy, order, search, isActive } = req.query;
  const { workingSchedules, meta } = await workingScheduleService.list({
    page, limit, sortBy, order, search, isActive, skip: (page - 1) * limit,
  });
  return ApiResponse.paginated(res, workingSchedules, meta);
}

export async function getById(req, res) {
  const workingSchedule = await workingScheduleService.getById(req.params.id);
  return ApiResponse.success(res, { workingSchedule });
}

export async function create(req, res) {
  const workingSchedule = await workingScheduleService.create(req.body);
  return ApiResponse.created(res, { workingSchedule });
}

export async function update(req, res) {
  const workingSchedule = await workingScheduleService.update(req.params.id, req.body);
  return ApiResponse.success(res, { workingSchedule });
}

export async function remove(req, res) {
  const workingSchedule = await workingScheduleService.remove(req.params.id);
  return ApiResponse.success(res, { workingSchedule });
}
