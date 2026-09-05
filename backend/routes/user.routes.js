import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as userController from '../controllers/user.controller.js';
import { listQuery, userIdParams } from '../validations/user.validation.js';
import { AUTH } from '../utils/roles.js';

const router = express.Router();

router.use(authenticate, authorize(...AUTH.ADMIN));

router.get('/', validate({ query: listQuery }), asyncHandler(userController.list));
router.get('/:id', validate({ params: userIdParams }), asyncHandler(userController.getById));

export default router;
