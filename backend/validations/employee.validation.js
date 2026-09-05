import { z } from 'zod';
import { uuid, email, isoDate, paginationQuery } from './common.validation.js';

export const EMPLOYEE_STATUSES = ['ONBOARDING', 'ACTIVE', 'ON_NOTICE', 'SUSPENDED', 'EXITED'];
export const SORTABLE = [
  'employeeCode', 'firstName', 'lastName', 'fullName', 'workEmail', 'status',
  'dateOfJoining', 'createdAt', 'updatedAt',
];

const bankFields = {
  bankAccountName: z.string().trim().min(1).max(120).optional().nullable(),
  bankAccountNumber: z.string().trim().min(1).max(34).optional().nullable(),
  bankIfscCode: z.string().trim().min(1).max(11).optional().nullable(),
  bankName: z.string().trim().min(1).max(120).optional().nullable(),
};

const employeeCore = {
  employeeCode: z.string().trim().min(1).max(32).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  fullName: z.string().trim().min(1).max(160).optional(),
  workEmail: email,
  phone: z.string().trim().min(6).max(20).optional().nullable(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  departmentId: uuid.optional().nullable(),
  jobPositionId: uuid.optional().nullable(),
  workingScheduleId: uuid.optional().nullable(),
  managerId: uuid.optional().nullable(),
  dateOfJoining: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)),
  dateOfExit: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)).optional().nullable(),
  ...bankFields,
};

const createUserOption = z.object({
  email: email.optional(),
  role: z.enum(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']).default('EMPLOYEE'),
}).strict().optional();

export const createBody = z.object({
  ...employeeCore,
  createUser: createUserOption,
}).strict();

export const updateBody = z.object({
  employeeCode: z.string().trim().min(1).max(32).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  fullName: z.string().trim().min(1).max(160).optional(),
  workEmail: email.optional(),
  phone: z.string().trim().min(6).max(20).optional().nullable(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  departmentId: uuid.optional().nullable(),
  jobPositionId: uuid.optional().nullable(),
  workingScheduleId: uuid.optional().nullable(),
  managerId: uuid.optional().nullable(),
  dateOfJoining: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)).optional(),
  dateOfExit: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)).optional().nullable(),
  ...bankFields,
}).strict();

export const listQuery = paginationQuery(SORTABLE).extend({
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  departmentId: uuid.optional(),
  jobPositionId: uuid.optional(),
  managerId: uuid.optional(),
  groupBy: z.enum(['status', 'department']).optional(),
  includeDeleted: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
}).strict();

export const employeeIdParams = z.object({ id: uuid }).strict();

export const nestedListQuery = paginationQuery(
  ['date', 'createdAt', 'updatedAt', 'startDate', 'validFrom', 'reference', 'status'],
  'createdAt',
).strict();
