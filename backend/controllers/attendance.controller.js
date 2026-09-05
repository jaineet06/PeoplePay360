import ApiResponse from '../utils/ApiResponse.js';
import * as attendanceService from '../services/attendance.service.js';

function listParams(query) {
  const {
    page, limit, sortBy, order, search, employeeId, departmentId,
    status, source, isManualCorrection, dateFrom, dateTo,
  } = query;
  return {
    page, limit, sortBy, order, search, employeeId, departmentId,
    status, source, isManualCorrection, dateFrom, dateTo,
    skip: (page - 1) * limit,
  };
}

export async function list(req, res) {
  const { attendances, meta } = await attendanceService.list(listParams(req.query), req.user);
  return ApiResponse.paginated(res, attendances, meta);
}

export async function getById(req, res) {
  const attendance = await attendanceService.getById(req.params.id, req.user);
  return ApiResponse.success(res, { attendance });
}

export async function create(req, res) {
  const attendance = await attendanceService.create(req.body, req.user);
  return ApiResponse.created(res, { attendance });
}

export async function update(req, res) {
  const attendance = await attendanceService.update(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { attendance });
}

export async function remove(req, res) {
  await attendanceService.remove(req.params.id, req.user);
  return ApiResponse.success(res, { message: 'Attendance record deleted successfully.' });
}

export async function checkIn(req, res) {
  const attendance = await attendanceService.checkIn(req.user, req.body);
  return ApiResponse.created(res, { attendance });
}

export async function checkOut(req, res) {
  const attendance = await attendanceService.checkOut(req.user, req.body);
  return ApiResponse.success(res, { attendance });
}
