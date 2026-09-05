'use strict';

const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const userController = require('../controllers/user.controller');
const { listUsersQuery, userIdParams } = require('../validations/user.validation');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  validate({ query: listUsersQuery }),
  asyncHandler(userController.list),
);

router.get(
  '/:id',
  validate({ params: userIdParams }),
  asyncHandler(userController.getById),
);

module.exports = router;
