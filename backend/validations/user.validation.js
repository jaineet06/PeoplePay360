'use strict';

const { z } = require('zod');
const { ROLES } = require('./auth.validation');

const SORTABLE_USER_FIELDS = ['email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'];

const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(SORTABLE_USER_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().min(1).max(120).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
}).strict();

const userIdParams = z.object({
  id: z.string().uuid(),
}).strict();

module.exports = {
  SORTABLE_USER_FIELDS,
  listUsersQuery,
  userIdParams,
};
