import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as employeeController from '../controllers/employee.controller.js';
import {
  createBody,
  updateBody,
  listQuery,
  employeeIdParams,
  nestedListQuery,
} from '../validations/employee.validation.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/me',
  authorize(ROLES.EMPLOYEE),
  asyncHandler(employeeController.getMe),
);

router.get(
  '/',
  authorize(...AUTH.HR),
  validate({ query: listQuery }),
  asyncHandler(employeeController.list),
);

router.post(
  '/',
  authorize(...AUTH.HR),
  validate({ body: createBody }),
  asyncHandler(employeeController.create),
);

router.get(
  '/:id',
  authorize(...AUTH.HR),
  validate({ params: employeeIdParams }),
  asyncHandler(employeeController.getById),
);

router.patch(
  '/:id',
  authorize(...AUTH.HR),
  validate({ params: employeeIdParams, body: updateBody }),
  asyncHandler(employeeController.update),
);

router.delete(
  '/:id',
  authorize(...AUTH.HR),
  validate({ params: employeeIdParams }),
  asyncHandler(employeeController.remove),
);

router.get(
  '/:id/contracts',
  authorize(...AUTH.HR, ROLES.EMPLOYEE),
  validate({ params: employeeIdParams, query: nestedListQuery }),
  asyncHandler(employeeController.listContracts),
);

router.get(
  '/:id/attendance',
  authorize(...AUTH.HR, ROLES.EMPLOYEE),
  validate({ params: employeeIdParams, query: nestedListQuery }),
  asyncHandler(employeeController.listAttendance),
);

router.get(
  '/:id/time-off',
  authorize(...AUTH.HR, ROLES.EMPLOYEE),
  validate({ params: employeeIdParams, query: nestedListQuery }),
  asyncHandler(employeeController.listTimeOffRequests),
);

router.get(
  '/:id/allocations',
  authorize(...AUTH.HR, ROLES.EMPLOYEE),
  validate({ params: employeeIdParams, query: nestedListQuery }),
  asyncHandler(employeeController.listAllocations),
);

export default router;
