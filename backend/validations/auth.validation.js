'use strict';

const { z } = require('zod');

const ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

const email = z.string().trim().toLowerCase().email('Must be a valid email address.');

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(128)
  .regex(/[a-z]/, 'Must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Must contain an uppercase letter.')
  .regex(/\d/, 'Must contain a digit.')
  .regex(/[^A-Za-z0-9]/, 'Must contain a symbol.');

const registerBody = z.object({
  email,
  password,
  role: z.enum(ROLES).default('EMPLOYEE'),
  employeeId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
}).strict();

const loginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
}).strict();

const refreshBody = z.object({
  refreshToken: z.string().min(20).optional(),
}).strict();

const logoutBody = z.object({
  refreshToken: z.string().min(20).optional(),
}).strict();

module.exports = {
  ROLES,
  registerBody,
  loginBody,
  refreshBody,
  logoutBody,
};
