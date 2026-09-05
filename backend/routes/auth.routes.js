'use strict';

const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/auth.controller');
const {
  registerBody,
  loginBody,
  refreshBody,
  logoutBody,
} = require('../validations/auth.validation');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  authenticate,
  authorize('ADMIN'),
  validate({ body: registerBody }),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginBody }),
  asyncHandler(authController.login),
);

router.post(
  '/refresh',
  validate({ body: refreshBody }),
  asyncHandler(authController.refresh),
);

router.post(
  '/logout',
  validate({ body: logoutBody }),
  asyncHandler(authController.logout),
);

router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
