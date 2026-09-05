import { z } from 'zod';
import { booleanQuery, idParams, isoDate, paginationQuery, uuid } from './common.validation.js';

export const SORTABLE = ['date', 'checkIn', 'checkOut', 'workedHours', 'status', 'createdAt', 'updatedAt'];

const ATTENDANCE_STATUSES = [
  'PRESENT', 'LATE', 'EARLY_LEAVE', 'HALF_DAY', 'ABSENT', 'OVERTIME',
  'MISSING_CHECKOUT', 'ON_LEAVE', 'WEEKLY_OFF', 'HOLIDAY',
];

const ATTENDANCE_SOURCES = ['WEB', 'MOBILE', 'BIOMETRIC', 'IMPORT', 'MANUAL'];

export const listQuery = paginationQuery(SORTABLE, 'date').extend({
  employeeId: uuid.optional(),
  departmentId: uuid.optional(),
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  source: z.enum(ATTENDANCE_SOURCES).optional(),
  isManualCorrection: booleanQuery,
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
}).strict();

export const createBody = z.object({
  employeeId: uuid,
  date: isoDate,
  checkIn: z.string().datetime().nullable().optional(),
  checkOut: z.string().datetime().nullable().optional(),
  source: z.enum(ATTENDANCE_SOURCES).default('MANUAL'),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict();

export const updateBody = z.object({
  checkIn: z.string().datetime().nullable().optional(),
  checkOut: z.string().datetime().nullable().optional(),
  statusOverride: z.enum(ATTENDANCE_STATUSES).optional(),
  correctionReason: z.string().trim().min(3).max(500),
  notes: z.string().trim().max(500).nullable().optional(),
}).strict();

export const checkInBody = z.object({
  notes: z.string().trim().max(500).nullable().optional(),
  source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC']).default('WEB'),
}).strict();

export const checkOutBody = z.object({
  notes: z.string().trim().max(500).nullable().optional(),
  source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC']).optional(),
}).strict();

export { idParams };
