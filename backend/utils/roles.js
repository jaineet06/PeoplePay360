export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  ADMIN: 'ADMIN',
};

/** Cumulative permission groups used in authorize() */
export const AUTH = {
  ANY: [ROLES.EMPLOYEE, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN],
  HR: [ROLES.HR_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN],
  PAYROLL_READ: [ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN],
  PAYROLL_WRITE: [ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN],
  ADMIN: [ROLES.ADMIN],
};

/** Numeric hierarchy — higher number = more privileged. Used for promote/demote guard. */
export const ROLE_LEVEL = {
  [ROLES.EMPLOYEE]: 0,
  [ROLES.HR_MANAGER]: 1,
  [ROLES.HR_PAYROLL_USER]: 2,
  [ROLES.HR_PAYROLL_MANAGER]: 3,
  [ROLES.ADMIN]: 4,
};

export function hasRole(user, ...allowed) {
  return allowed.includes(user?.role);
}
