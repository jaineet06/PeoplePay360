import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as authController from '../controllers/auth.controller.js';
import { registerBody, loginBody, refreshBody, logoutBody } from '../validations/auth.validation.js';
import { AUTH } from '../utils/roles.js';

const router = express.Router();

router.post('/register', authLimiter, authenticate, authorize(...AUTH.ADMIN), validate({ body: registerBody }), asyncHandler(authController.register));
router.post('/login', authLimiter, validate({ body: loginBody }), asyncHandler(authController.login));
router.post('/refresh', validate({ body: refreshBody }), asyncHandler(authController.refresh));
router.post('/logout', validate({ body: logoutBody }), asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
