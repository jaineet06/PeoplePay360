import { z } from 'zod';
import { ROLES, email, password } from './common.validation.js';

export const registerBody = z.object({
  email, password,
  role: z.enum(ROLES).default('EMPLOYEE'),
  employeeId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
}).strict();

export const loginBody = z.object({ email, password: z.string().min(1) }).strict();
export const refreshBody = z.object({ refreshToken: z.string().min(20).optional() }).strict();
export const logoutBody = z.object({ refreshToken: z.string().min(20).optional() }).strict();
