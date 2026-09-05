import { z } from 'zod';
import {
  booleanQuery,
  idParams,
  isoDate,
  paginationQuery,
  units,
  uuid,
} from './common.validation.js';

const TIME_OFF_UNITS = ['DAYS', 'HOURS'];
const ALLOCATION_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'EXPIRED', 'CANCELLED'];
const REQUEST_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'CANCELLED'];

export const typeSortable = ['name', 'code', 'unit', 'createdAt', 'updatedAt'];
export const allocationSortable = ['validFrom', 'validTo', 'allocatedUnits', 'takenUnits', 'status', 'createdAt', 'updatedAt'];
export const requestSortable = ['startDate', 'endDate', 'duration', 'status', 'createdAt', 'updatedAt'];

export const typeListQuery = paginationQuery(typeSortable).extend({
  isActive: booleanQuery,
  unit: z.enum(TIME_OFF_UNITS).optional(),
  requiresAllocation: booleanQuery,
  approvalRequired: booleanQuery,
  affectsPayroll: booleanQuery,
}).strict();

export const typeCreateBody = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(120),
  unit: z.enum(TIME_OFF_UNITS).default('DAYS'),
  requiresAllocation: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  affectsPayroll: z.boolean().default(false),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
}).strict();

export const typeUpdateBody = typeCreateBody.partial().strict();

export const allocationListQuery = paginationQuery(allocationSortable, 'validFrom').extend({
  employeeId: uuid.optional(),
  timeOffTypeId: uuid.optional(),
  status: z.enum(ALLOCATION_STATUSES).optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
}).strict();

export const allocationCreateBody = z.object({
  employeeId: uuid,
  timeOffTypeId: uuid,
  allocatedUnits: units,
  validFrom: isoDate,
  validTo: isoDate,
  status: z.enum(ALLOCATION_STATUSES).default('PENDING'),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict().refine((data) => data.validFrom <= data.validTo, {
  message: 'validFrom must be on or before validTo.',
  path: ['validTo'],
});

export const allocationUpdateBody = z.object({
  allocatedUnits: units.optional(),
  validFrom: isoDate.optional(),
  validTo: isoDate.optional(),
  status: z.enum(ALLOCATION_STATUSES).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict();

export const allocationRefuseBody = z.object({
  refusalReason: z.string().trim().min(3).max(500),
}).strict();

export const requestListQuery = paginationQuery(requestSortable, 'startDate').extend({
  employeeId: uuid.optional(),
  timeOffTypeId: uuid.optional(),
  status: z.enum(REQUEST_STATUSES).optional(),
  departmentId: uuid.optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
}).strict();

export const requestCreateBody = z.object({
  employeeId: uuid.optional(),
  timeOffTypeId: uuid,
  allocationId: uuid.optional(),
  startDate: isoDate,
  endDate: isoDate,
  duration: units,
  unit: z.enum(TIME_OFF_UNITS),
  reason: z.string().trim().max(500).nullable().optional(),
}).strict().refine((data) => data.startDate <= data.endDate, {
  message: 'startDate must be on or before endDate.',
  path: ['endDate'],
});

export const requestUpdateBody = z.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  duration: units.optional(),
  unit: z.enum(TIME_OFF_UNITS).optional(),
  reason: z.string().trim().max(500).nullable().optional(),
  allocationId: uuid.nullable().optional(),
}).strict();

export const requestRefuseBody = z.object({
  refusalReason: z.string().trim().min(3).max(500),
}).strict();

export { idParams };
