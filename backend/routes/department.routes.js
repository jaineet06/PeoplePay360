import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH, ROLES } from '../utils/roles.js';
import * as departmentController from '../controllers/department.controller.js';
import {
  listQuery,
  createBody,
  updateBody,
  idParams,
} from '../validations/department.validation.js';

const router = express.Router();
const HR_WRITE = [ROLES.HR_MANAGER, ROLES.ADMIN];

router.use(authenticate);

router.get('/', authorize(...AUTH.HR), validate({ query: listQuery }), asyncHandler(departmentController.list));
router.get('/:id', authorize(...AUTH.HR), validate({ params: idParams }), asyncHandler(departmentController.getById));
router.post('/', authorize(...HR_WRITE), validate({ body: createBody }), asyncHandler(departmentController.create));
router.patch('/:id', authorize(...HR_WRITE), validate({ params: idParams, body: updateBody }), asyncHandler(departmentController.update));
router.delete('/:id', authorize(...HR_WRITE), validate({ params: idParams }), asyncHandler(departmentController.remove));

export default router;
