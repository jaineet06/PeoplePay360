import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

export const uuid = z.string().uuid();
export const email = z.string().trim().toLowerCase().email();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const money = z.union([z.string(), z.number()]).transform((v) => new Prisma.Decimal(String(v)));
export const units = z.union([z.string(), z.number()]).transform((v) => new Prisma.Decimal(String(v)));

export const idParams = z.object({ id: uuid }).strict();
export const paginationQuery = (sortable, defaultSort = 'createdAt') => z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(sortable).default(defaultSort),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().min(1).max(120).optional(),
}).strict();

export const booleanQuery = z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true'));

export const password = z.string()
  .min(10).max(128)
  .regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/);
