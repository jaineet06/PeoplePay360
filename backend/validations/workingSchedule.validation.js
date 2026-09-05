import { z } from 'zod';
import { booleanQuery, idParams, paginationQuery } from './common.validation.js';

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const SORTABLE = ['name', 'code', 'isActive', 'hoursPerWeek', 'workingDaysPerWeek', 'createdAt', 'updatedAt'];

const scheduleLine = z.object({
  dayOfWeek: z.enum(WEEKDAYS),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  breakMinutes: z.number().int().min(0).max(720).default(0),
}).strict().refine((l) => l.endMinute > l.startMinute, {
  message: 'endMinute must be after startMinute.',
  path: ['endMinute'],
}).refine((l) => l.breakMinutes < l.endMinute - l.startMinute, {
  message: 'breakMinutes cannot exceed shift length.',
  path: ['breakMinutes'],
});

export const listQuery = paginationQuery(SORTABLE).extend({
  isActive: booleanQuery,
}).strict();

export const createBody = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(32),
  timezone: z.string().trim().min(1).max(64).default('Asia/Kolkata'),
  isActive: z.boolean().default(true),
  lines: z.array(scheduleLine).min(1).max(14),
}).strict();

export const updateBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  code: z.string().trim().min(1).max(32).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  isActive: z.boolean().optional(),
  lines: z.array(scheduleLine).min(1).max(14).optional(),
}).strict();

export { idParams };
