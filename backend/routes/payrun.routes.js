import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH } from '../utils/roles.js';
import * as payrunController from '../controllers/payrun.controller.js';
import {
  listPayrunsQuery,
  payrunIdParams,
  previewPayrunBody,
  createPayrunBody,
  markPaidBody,
} from '../validations/payrun.validation.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorize(...AUTH.PAYROLL_READ),
  validate({ query: listPayrunsQuery }),
  asyncHandler(payrunController.list),
);

router.post(
  '/preview',
  authorize(...AUTH.PAYROLL_READ),
  validate({ body: previewPayrunBody }),
  asyncHandler(payrunController.preview),
);

router.post(
  '/',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ body: createPayrunBody }),
  asyncHandler(payrunController.create),
);

router.get(
  '/:id',
  authorize(...AUTH.PAYROLL_READ),
  validate({ params: payrunIdParams }),
  asyncHandler(payrunController.getById),
);

router.post(
  '/:id/compute',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: payrunIdParams }),
  asyncHandler(payrunController.compute),
);

router.post(
  '/:id/validate',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: payrunIdParams }),
  asyncHandler(payrunController.validate),
);

router.post(
  '/:id/mark-paid',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: payrunIdParams, body: markPaidBody }),
  asyncHandler(payrunController.markPaid),
);

router.post(
  '/:id/send',
  authorize(...AUTH.PAYROLL_WRITE),
  validate({ params: payrunIdParams }),
  asyncHandler(payrunController.sendEmails),
);

export default router;
