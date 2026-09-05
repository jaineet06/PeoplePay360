import ApiResponse from '../utils/ApiResponse.js';
import * as timeOffService from '../services/timeOff.service.js';

function paginatedParams(query) {
  const { page, limit, sortBy, order, search, ...filters } = query;
  return { page, limit, sortBy, order, search, ...filters, skip: (page - 1) * limit };
}

export async function listTypes(req, res) {
  const { timeOffTypes, meta } = await timeOffService.listTypes(paginatedParams(req.query));
  return ApiResponse.paginated(res, timeOffTypes, meta);
}

export async function getTypeById(req, res) {
  const timeOffType = await timeOffService.getTypeById(req.params.id);
  return ApiResponse.success(res, { timeOffType });
}

export async function createType(req, res) {
  const timeOffType = await timeOffService.createType(req.body);
  return ApiResponse.created(res, { timeOffType });
}

export async function updateType(req, res) {
  const timeOffType = await timeOffService.updateType(req.params.id, req.body);
  return ApiResponse.success(res, { timeOffType });
}

export async function removeType(req, res) {
  const timeOffType = await timeOffService.removeType(req.params.id);
  return ApiResponse.success(res, { timeOffType });
}

export async function listAllocations(req, res) {
  const { allocations, meta } = await timeOffService.listAllocations(paginatedParams(req.query), req.user);
  return ApiResponse.paginated(res, allocations, meta);
}

export async function getAllocationById(req, res) {
  const allocation = await timeOffService.getAllocationById(req.params.id, req.user);
  return ApiResponse.success(res, { allocation });
}

export async function createAllocation(req, res) {
  const allocation = await timeOffService.createAllocation(req.body, req.user);
  return ApiResponse.created(res, { allocation });
}

export async function updateAllocation(req, res) {
  const allocation = await timeOffService.updateAllocation(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { allocation });
}

export async function approveAllocation(req, res) {
  const allocation = await timeOffService.approveAllocation(req.params.id, req.user);
  return ApiResponse.success(res, { allocation });
}

export async function refuseAllocation(req, res) {
  const allocation = await timeOffService.refuseAllocation(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { allocation });
}

export async function removeAllocation(req, res) {
  const allocation = await timeOffService.removeAllocation(req.params.id, req.user);
  return ApiResponse.success(res, { allocation });
}

export async function listRequests(req, res) {
  const { timeOffRequests, meta } = await timeOffService.listRequests(paginatedParams(req.query), req.user);
  return ApiResponse.paginated(res, timeOffRequests, meta);
}

export async function getRequestById(req, res) {
  const timeOffRequest = await timeOffService.getRequestById(req.params.id, req.user);
  return ApiResponse.success(res, { timeOffRequest });
}

export async function createRequest(req, res) {
  const timeOffRequest = await timeOffService.createRequest(req.body, req.user);
  return ApiResponse.created(res, { timeOffRequest });
}

export async function updateRequest(req, res) {
  const timeOffRequest = await timeOffService.updateRequest(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { timeOffRequest });
}

export async function approveRequest(req, res) {
  const timeOffRequest = await timeOffService.approveRequest(req.params.id, req.user);
  return ApiResponse.success(res, { timeOffRequest });
}

export async function refuseRequest(req, res) {
  const timeOffRequest = await timeOffService.refuseRequest(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { timeOffRequest });
}

export async function cancelRequest(req, res) {
  const timeOffRequest = await timeOffService.cancelRequest(req.params.id, req.user);
  return ApiResponse.success(res, { timeOffRequest });
}

export async function removeRequest(req, res) {
  await timeOffService.removeRequest(req.params.id, req.user);
  return ApiResponse.success(res, { message: 'Time off request deleted successfully.' });
}
