import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as contractController from '../controllers/contract.controller.js';
import {
  createBody,
  updateBody,
  listQuery,
  contractIdParams,
  resolveQuery,
} from '../validations/contract.validation.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/resolve',
  authorize(...AUTH.PAYROLL_READ, ROLES.HR_MANAGER),
  validate({ query: resolveQuery }),
  asyncHandler(contractController.resolve),
);

router.get(
  '/',
  authorize(...AUTH.HR),
  validate({ query: listQuery }),
  asyncHandler(contractController.list),
);

router.post(
  '/',
  authorize(...AUTH.HR),
  validate({ body: createBody }),
  asyncHandler(contractController.create),
);

router.get(
  '/:id',
  authorize(...AUTH.HR),
  validate({ params: contractIdParams }),
  asyncHandler(contractController.getById),
);

router.patch(
  '/:id',
  authorize(...AUTH.HR),
  validate({ params: contractIdParams, body: updateBody }),
  asyncHandler(contractController.update),
);

router.delete(
  '/:id',
  authorize(...AUTH.HR),
  validate({ params: contractIdParams }),
  asyncHandler(contractController.remove),
);

export default router;
