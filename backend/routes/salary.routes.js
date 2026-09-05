import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH } from '../utils/roles.js';
import * as salaryController from '../controllers/salary.controller.js';
import {
  listStructuresQuery,
  structureIdParams,
  structureRuleParams,
  createStructureBody,
  updateStructureBody,
  createRuleBody,
  updateRuleBody,
  reorderRulesBody,
  simulateBody,
} from '../validations/salary.validation.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize(...AUTH.PAYROLL_READ),
  validate({ query: listStructuresQuery }),
  asyncHandler(salaryController.listStructures),
);

router.post(
  '/',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ body: createStructureBody }),
  asyncHandler(salaryController.createStructure),
);

router.get(
  '/:id',
  authorize(...AUTH.PAYROLL_READ),
  validate({ params: structureIdParams }),
  asyncHandler(salaryController.getStructure),
);

router.patch(
  '/:id',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: structureIdParams, body: updateStructureBody }),
  asyncHandler(salaryController.updateStructure),
);

router.delete(
  '/:id',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: structureIdParams }),
  asyncHandler(salaryController.removeStructure),
);

router.get(
  '/:id/rules',
  authorize(...AUTH.PAYROLL_READ),
  validate({ params: structureIdParams }),
  asyncHandler(salaryController.listRules),
);

router.post(
  '/:id/rules',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: structureIdParams, body: createRuleBody }),
  asyncHandler(salaryController.createRule),
);

router.post(
  '/:id/rules/reorder',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: structureIdParams, body: reorderRulesBody }),
  asyncHandler(salaryController.reorderRules),
);

router.post(
  '/:id/simulate',
  authorize(...AUTH.PAYROLL_READ),
  validate({ params: structureIdParams, body: simulateBody }),
  asyncHandler(salaryController.simulate),
);

router.get(
  '/:id/rules/:ruleId',
  authorize(...AUTH.PAYROLL_READ),
  validate({ params: structureRuleParams }),
  asyncHandler(salaryController.getRule),
);

router.patch(
  '/:id/rules/:ruleId',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: structureRuleParams, body: updateRuleBody }),
  asyncHandler(salaryController.updateRule),
);

router.delete(
  '/:id/rules/:ruleId',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: structureRuleParams }),
  asyncHandler(salaryController.removeRule),
);

export default router;
