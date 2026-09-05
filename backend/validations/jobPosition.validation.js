import { z } from 'zod';
import { booleanQuery, idParams, paginationQuery } from './common.validation.js';

export const SORTABLE = ['title', 'code', 'isActive', 'createdAt', 'updatedAt'];

export const listQuery = paginationQuery(SORTABLE).extend({
  isActive: booleanQuery,
}).strict();

export const createBody = z.object({
  code: z.string().trim().min(1).max(32),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
}).strict();

export const updateBody = createBody.partial().strict();

export { idParams };
