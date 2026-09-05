import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AUTH } from '../utils/roles.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import {
  summaryQuery,
  salaryByDepartmentQuery,
  monthlyTrendQuery,
} from '../validations/dashboard.validation.js';

const router = express.Router();

router.use(authenticate, authorize(...AUTH.HR));

router.get('/summary', validate({ query: summaryQuery }), asyncHandler(dashboardController.summary));
router.get('/salary-by-department', validate({ query: salaryByDepartmentQuery }), asyncHandler(dashboardController.salaryByDepartment));
router.get('/monthly-trend', validate({ query: monthlyTrendQuery }), asyncHandler(dashboardController.monthlyTrend));
router.get('/alerts', asyncHandler(dashboardController.alerts));

export default router;
