import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as workingScheduleController from '../controllers/workingSchedule.controller.js';
import {
  listQuery,
  createBody,
  updateBody,
  idParams,
} from '../validations/workingSchedule.validation.js';

const router = express.Router();
const HR_WRITE = [ROLES.HR_MANAGER, ROLES.ADMIN];

router.use(authenticate);

router.get('/', authorize(...AUTH.HR), validate({ query: listQuery }), asyncHandler(workingScheduleController.list));
router.get('/:id', authorize(...AUTH.HR), validate({ params: idParams }), asyncHandler(workingScheduleController.getById));
router.post('/', authorize(...HR_WRITE), validate({ body: createBody }), asyncHandler(workingScheduleController.create));
router.patch('/:id', authorize(...HR_WRITE), validate({ params: idParams, body: updateBody }), asyncHandler(workingScheduleController.update));
router.delete('/:id', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(workingScheduleController.remove));

export default router;
