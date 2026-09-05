import ApiResponse from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export async function list(req, res) {
  const { page = 1, limit = 20, isRead } = req.query;
  const { notifications, meta } = await notificationService.listForUser(req.user.id, {
    page,
    limit,
    isRead,
  });
  return ApiResponse.paginated(res, notifications, meta);
}

export async function unreadCount(req, res) {
  const count = await notificationService.getUnreadCount(req.user.id);
  return ApiResponse.success(res, { count });
}

export async function markRead(req, res) {
  const result = await notificationService.markRead(req.params.id, req.user.id);
  return ApiResponse.success(res, result);
}

export async function markAllRead(req, res) {
  const result = await notificationService.markAllRead(req.user.id);
  return ApiResponse.success(res, result);
}
