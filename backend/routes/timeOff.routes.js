import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as timeOffController from '../controllers/timeOff.controller.js';
import {
  typeListQuery,
  typeCreateBody,
  typeUpdateBody,
  allocationListQuery,
  allocationCreateBody,
  allocationUpdateBody,
  allocationRefuseBody,
  requestListQuery,
  requestCreateBody,
  requestUpdateBody,
  requestRefuseBody,
  idParams,
} from '../validations/timeOff.validation.js';

const router = express.Router();
const HR_WRITE = [ROLES.HR_MANAGER, ROLES.ADMIN];

router.use(authenticate);

const typesRouter = express.Router();
typesRouter.get('/', authorize(...AUTH.ANY), validate({ query: typeListQuery }), asyncHandler(timeOffController.listTypes));
typesRouter.post('/', authorize(...HR_WRITE), validate({ body: typeCreateBody }), asyncHandler(timeOffController.createType));
typesRouter.get('/:id', authorize(...AUTH.ANY), validate({ params: idParams }), asyncHandler(timeOffController.getTypeById));
typesRouter.patch('/:id', authorize(...HR_WRITE), validate({ params: idParams, body: typeUpdateBody }), asyncHandler(timeOffController.updateType));
typesRouter.delete('/:id', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(timeOffController.removeType));

const allocationsRouter = express.Router();
allocationsRouter.get('/', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ query: allocationListQuery }), asyncHandler(timeOffController.listAllocations));
allocationsRouter.post('/', authorize(...HR_WRITE), validate({ body: allocationCreateBody }), asyncHandler(timeOffController.createAllocation));
allocationsRouter.get('/:id', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ params: idParams }), asyncHandler(timeOffController.getAllocationById));
allocationsRouter.patch('/:id', authorize(...HR_WRITE), validate({ params: idParams, body: allocationUpdateBody }), asyncHandler(timeOffController.updateAllocation));
allocationsRouter.post('/:id/approve', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(timeOffController.approveAllocation));
allocationsRouter.post('/:id/refuse', authorize(...HR_WRITE), validate({ params: idParams, body: allocationRefuseBody }), asyncHandler(timeOffController.refuseAllocation));
allocationsRouter.delete('/:id', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(timeOffController.removeAllocation));

const requestsRouter = express.Router();
requestsRouter.get('/', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ query: requestListQuery }), asyncHandler(timeOffController.listRequests));
requestsRouter.post('/', authorize(...AUTH.ANY), validate({ body: requestCreateBody }), asyncHandler(timeOffController.createRequest));
requestsRouter.get('/:id', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ params: idParams }), asyncHandler(timeOffController.getRequestById));
requestsRouter.patch('/:id', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ params: idParams, body: requestUpdateBody }), asyncHandler(timeOffController.updateRequest));
requestsRouter.post('/:id/approve', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(timeOffController.approveRequest));
requestsRouter.post('/:id/refuse', authorize(...HR_WRITE), validate({ params: idParams, body: requestRefuseBody }), asyncHandler(timeOffController.refuseRequest));
requestsRouter.post('/:id/cancel', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ params: idParams }), asyncHandler(timeOffController.cancelRequest));
requestsRouter.delete('/:id', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ params: idParams }), asyncHandler(timeOffController.removeRequest));

router.use('/types', typesRouter);
router.use('/allocations', allocationsRouter);
router.use('/requests', requestsRouter);

export default router;
