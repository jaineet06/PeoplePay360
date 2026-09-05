import { z } from 'zod';
import { uuid } from './common.validation.js';

export const summaryQuery = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM').optional(),
  departmentId: uuid.optional(),
}).strict();

export const salaryByDepartmentQuery = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM').optional(),
}).strict();

export const monthlyTrendQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
  departmentId: uuid.optional(),
}).strict();
