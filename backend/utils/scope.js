import ApiError from './ApiError.js';
import { ROLES } from './roles.js';

/** Enforce self-service scope for EMPLOYEE role at the service layer. */
export function assertEmployeeScope(requester, targetEmployeeId) {
  if (requester.role === ROLES.EMPLOYEE) {
    if (!requester.employeeId) {
      throw ApiError.forbidden('Your account is not linked to an employee profile.');
    }
    if (targetEmployeeId && targetEmployeeId !== requester.employeeId) {
      throw ApiError.forbidden('You can only access your own employee data.');
    }
    return requester.employeeId;
  }
  return targetEmployeeId;
}

export function resolveEmployeeId(requester, bodyEmployeeId) {
  if (requester.role === ROLES.EMPLOYEE) {
    if (bodyEmployeeId && bodyEmployeeId !== requester.employeeId) {
      throw ApiError.forbidden('You can only act on your own employee record.');
    }
    return requester.employeeId;
  }
  if (!bodyEmployeeId) throw ApiError.badRequest('employeeId is required.');
  return bodyEmployeeId;
}
