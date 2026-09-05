import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as payslipController from '../controllers/payslip.controller.js';
import { payslipIdParams } from '../validations/payrun.validation.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.EMPLOYEE, ...AUTH.PAYROLL_READ),
  asyncHandler(payslipController.list),
);

router.get(
  '/:id',
  authorize(ROLES.EMPLOYEE, ...AUTH.PAYROLL_READ),
  validate({ params: payslipIdParams }),
  asyncHandler(payslipController.getById),
);

router.get(
  '/:id/pdf',
  authorize(ROLES.EMPLOYEE, ...AUTH.PAYROLL_READ),
  validate({ params: payslipIdParams }),
  asyncHandler(payslipController.downloadPdf),
);

export default router;
