import { z } from 'zod';
import {
  paginationQuery, booleanQuery, money, uuid,
} from './common.validation.js';

const RULE_CATEGORIES = ['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET'];
const COMPUTATION_METHODS = ['FIXED', 'PERCENTAGE', 'FORMULA'];

export const listStructuresQuery = paginationQuery(
  ['code', 'name', 'createdAt', 'isActive'],
  'createdAt',
).extend({
  isActive: booleanQuery,
}).strict();

export const structureIdParams = z.object({ id: uuid }).strict();

export const structureRuleParams = z.object({
  id: uuid,
  ruleId: uuid,
}).strict();

export const createStructureBody = z.object({
  code: z.string().trim().min(2).max(32).regex(/^[A-Z0-9_]+$/i),
  name: z.string().trim().min(2).max(120),
  currency: z.string().length(3).default('INR'),
  netRuleCode: z.string().trim().min(1).max(32).optional(),
  isActive: z.boolean().default(true),
}).strict();

export const updateStructureBody = createStructureBody.partial().strict();

const ruleBase = {
  code: z.string().trim().min(1).max(32).regex(/^[A-Z0-9_]+$/i),
  name: z.string().trim().min(1).max(120),
  category: z.enum(RULE_CATEGORIES),
  sequence: z.number().int().min(1).optional(),
  computationMethod: z.enum(COMPUTATION_METHODS),
  amount: money.optional(),
  percentage: z.union([z.string(), z.number()]).optional(),
  percentageOfCode: z.string().trim().min(1).max(32).optional(),
  formula: z.string().trim().max(500).optional(),
  useContractWage: z.boolean().default(false),
  isActive: z.boolean().default(true),
};

export const createRuleBody = z.object(ruleBase).strict().superRefine((data, ctx) => {
  if (data.computationMethod === 'FIXED' && !data.useContractWage && data.amount == null) {
    ctx.addIssue({ code: 'custom', message: 'amount is required for FIXED rules unless useContractWage is true.', path: ['amount'] });
  }
  if (data.computationMethod === 'PERCENTAGE') {
    if (data.percentage == null) ctx.addIssue({ code: 'custom', message: 'percentage is required.', path: ['percentage'] });
    if (!data.percentageOfCode) ctx.addIssue({ code: 'custom', message: 'percentageOfCode is required.', path: ['percentageOfCode'] });
  }
  if (data.computationMethod === 'FORMULA' && !data.formula) {
    ctx.addIssue({ code: 'custom', message: 'formula is required.', path: ['formula'] });
  }
});

export const updateRuleBody = z.object(ruleBase).partial().strict();

export const reorderRulesBody = z.object({
  rules: z.array(z.object({
    id: uuid,
    sequence: z.number().int().min(1),
  })).min(1),
}).strict();

export const simulateBody = z.object({
  contractWage: z.union([z.string(), z.number()]).default(0),
  periodDays: z.number().positive().default(30),
  workedDays: z.number().nonnegative().optional(),
  unpaidLeaveDays: z.number().nonnegative().default(0),
}).strict();
