import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as ctrl from '../controllers/notification.controller.js';

const router = express.Router();

// All notification endpoints require authentication; scoped to the requesting user
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));
router.get('/unread-count', asyncHandler(ctrl.unreadCount));
router.patch('/read-all', asyncHandler(ctrl.markAllRead));
router.patch('/:id/read', asyncHandler(ctrl.markRead));

export default router;
