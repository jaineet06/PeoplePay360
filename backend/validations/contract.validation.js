import { z } from 'zod';
import { uuid, isoDate, money, paginationQuery } from './common.validation.js';

export const CONTRACT_STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED'];
export const WAGE_TYPES = ['MONTHLY', 'ANNUAL', 'DAILY', 'HOURLY'];
export const SORTABLE = ['reference', 'status', 'startDate', 'endDate', 'wage', 'createdAt', 'updatedAt'];

const contractCore = {
  reference: z.string().trim().min(1).max(32).optional(),
  employeeId: uuid,
  status: z.enum(CONTRACT_STATUSES).optional(),
  startDate: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)),
  endDate: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)).optional().nullable(),
  wage: money,
  wageType: z.enum(WAGE_TYPES).optional(),
  currency: z.string().length(3).default('INR'),
  salaryStructureId: uuid.optional().nullable(),
  jobPositionId: uuid.optional().nullable(),
  departmentNameSnapshot: z.string().trim().min(1).max(160).optional().nullable(),
  jobTitleSnapshot: z.string().trim().min(1).max(160).optional().nullable(),
};

export const createBody = z.object(contractCore).strict()
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: 'endDate must be on or after startDate.',
    path: ['endDate'],
  });

export const updateBody = z.object({
  reference: z.string().trim().min(1).max(32).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  startDate: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)).optional(),
  endDate: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)).optional().nullable(),
  wage: money.optional(),
  wageType: z.enum(WAGE_TYPES).optional(),
  currency: z.string().length(3).optional(),
  salaryStructureId: uuid.optional().nullable(),
  jobPositionId: uuid.optional().nullable(),
  departmentNameSnapshot: z.string().trim().min(1).max(160).optional().nullable(),
  jobTitleSnapshot: z.string().trim().min(1).max(160).optional().nullable(),
}).strict();

export const listQuery = paginationQuery(SORTABLE).extend({
  employeeId: uuid.optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  includeDeleted: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
}).strict();

export const contractIdParams = z.object({ id: uuid }).strict();

export const resolveQuery = z.object({
  employeeId: uuid,
  periodStart: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)),
  periodEnd: isoDate.transform((v) => new Date(`${v}T00:00:00.000Z`)),
}).strict().refine((d) => d.periodEnd >= d.periodStart, {
  message: 'periodEnd must be on or after periodStart.',
  path: ['periodEnd'],
});
