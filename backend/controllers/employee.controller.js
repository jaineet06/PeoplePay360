import ApiResponse from '../utils/ApiResponse.js';
import * as employeeService from '../services/employee.service.js';

function listParams(query) {
  const { page, limit, sortBy, order, search, status, departmentId, jobPositionId, managerId, groupBy, includeDeleted } = query;
  return {
    page, limit, sortBy, order, search, status, departmentId, jobPositionId, managerId, groupBy, includeDeleted,
    skip: (page - 1) * limit,
  };
}

function nestedParams(query) {
  const { page, limit, sortBy, order } = query;
  return { page, limit, sortBy, order, skip: (page - 1) * limit };
}

export async function list(req, res) {
  const result = await employeeService.list(listParams(req.query));
  if (result.groups) return ApiResponse.success(res, result);
  return ApiResponse.paginated(res, result.employees, result.meta);
}

export async function getById(req, res) {
  const employee = await employeeService.getById(req.params.id, req.user);
  return ApiResponse.success(res, { employee });
}

export async function getMe(req, res) {
  const employee = await employeeService.getMe(req.user);
  return ApiResponse.success(res, { employee });
}

export async function create(req, res) {
  const result = await employeeService.create(req.body);
  return ApiResponse.created(res, result);
}

export async function update(req, res) {
  const employee = await employeeService.update(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { employee });
}

export async function remove(req, res) {
  await employeeService.remove(req.params.id);
  return ApiResponse.success(res, { message: 'Employee deleted successfully.' });
}

export async function listContracts(req, res) {
  const { contracts, meta } = await employeeService.listContracts(req.params.id, nestedParams(req.query), req.user);
  return ApiResponse.paginated(res, contracts, meta);
}

export async function listAttendance(req, res) {
  const { attendances, meta } = await employeeService.listAttendance(req.params.id, nestedParams(req.query), req.user);
  return ApiResponse.paginated(res, attendances, meta);
}

export async function listTimeOffRequests(req, res) {
  const { timeOffRequests, meta } = await employeeService.listTimeOffRequests(req.params.id, nestedParams(req.query), req.user);
  return ApiResponse.paginated(res, timeOffRequests, meta);
}

export async function listAllocations(req, res) {
  const { allocations, meta } = await employeeService.listAllocations(req.params.id, nestedParams(req.query), req.user);
  return ApiResponse.paginated(res, allocations, meta);
}
