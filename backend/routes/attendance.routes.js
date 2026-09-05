import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as attendanceController from '../controllers/attendance.controller.js';
import {
  listQuery,
  createBody,
  updateBody,
  checkInBody,
  checkOutBody,
  idParams,
} from '../validations/attendance.validation.js';

const router = express.Router();
const HR_WRITE = [ROLES.HR_MANAGER, ROLES.ADMIN];

router.use(authenticate);

router.post('/check-in', authorize(...AUTH.ANY), validate({ body: checkInBody }), asyncHandler(attendanceController.checkIn));
router.post('/check-out', authorize(...AUTH.ANY), validate({ body: checkOutBody }), asyncHandler(attendanceController.checkOut));

router.get('/', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ query: listQuery }), asyncHandler(attendanceController.list));
router.post('/', authorize(...HR_WRITE), validate({ body: createBody }), asyncHandler(attendanceController.create));
router.get('/:id', authorize(...AUTH.HR, ROLES.EMPLOYEE), validate({ params: idParams }), asyncHandler(attendanceController.getById));
router.patch('/:id', authorize(...HR_WRITE), validate({ params: idParams, body: updateBody }), asyncHandler(attendanceController.update));
router.delete('/:id', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(attendanceController.remove));

export default router;
