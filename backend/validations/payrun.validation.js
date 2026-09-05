import { z } from 'zod';
import { paginationQuery, booleanQuery, isoDate, uuid } from './common.validation.js';

export const listPayrunsQuery = paginationQuery(
  ['name', 'periodStart', 'periodEnd', 'periodLabel', 'status', 'createdAt'],
  'createdAt',
).extend({
  status: z.enum(['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED']).optional(),
  salaryStructureId: uuid.optional(),
  periodLabel: z.string().regex(/^\d{4}-\d{2}$/).optional(),
}).strict();

export const payrunIdParams = z.object({ id: uuid }).strict();

const payrunPeriodBody = z.object({
  salaryStructureId: uuid,
  periodStart: isoDate,
  periodEnd: isoDate,
  employeeIds: z.array(uuid).optional(),
}).strict().refine(
  (d) => new Date(d.periodEnd) >= new Date(d.periodStart),
  { message: 'periodEnd must be on or after periodStart.', path: ['periodEnd'] },
);

export const previewPayrunBody = payrunPeriodBody;

export const createPayrunBody = z.object({
  salaryStructureId: uuid,
  periodStart: isoDate,
  periodEnd: isoDate,
  employeeIds: z.array(uuid).optional(),
  name: z.string().trim().min(2).max(120),
}).strict().refine(
  (d) => new Date(d.periodEnd) >= new Date(d.periodStart),
  { message: 'periodEnd must be on or after periodStart.', path: ['periodEnd'] },
);

export const markPaidBody = z.object({
  paymentDate: isoDate.optional(),
}).strict();

export const payslipIdParams = z.object({ id: uuid }).strict();
