import { z } from 'zod';
import { ROLES, paginationQuery } from './common.validation.js';

export const SORTABLE = ['email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'];
export const listQuery = paginationQuery(SORTABLE).extend({
  role: z.enum(ROLES).optional(),
  isActive: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
}).strict();

export const userIdParams = z.object({ id: z.string().uuid() }).strict();

export const changeRoleBody = z.object({
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Invalid role value.' }) }),
}).strict();
