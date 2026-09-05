import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as userController from '../controllers/user.controller.js';
import { listQuery, userIdParams, changeRoleBody } from '../validations/user.validation.js';
import { AUTH } from '../utils/roles.js';

const router = express.Router();

// All non-EMPLOYEE roles can reach the users module (HR.HR includes HR_MANAGER through ADMIN)
router.use(authenticate, authorize(...AUTH.HR));

router.get('/', validate({ query: listQuery }), asyncHandler(userController.list));
router.get('/:id', validate({ params: userIdParams }), asyncHandler(userController.getById));

// Promote / Demote — any non-EMPLOYEE caller; hierarchy checks are enforced in the service
router.patch(
  '/:id/role',
  validate({ params: userIdParams, body: changeRoleBody }),
  asyncHandler(userController.changeRole),
);

export default router;
