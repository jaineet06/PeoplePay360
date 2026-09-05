import { apiClient } from './client';

export const notificationsApi = {
  /** List notifications for the current user */
  list: (params = {}) =>
    apiClient.get('/notifications', { params }).then((r) => r.data),

  /** Get unread count for the current user */
  unreadCount: () =>
    apiClient.get('/notifications/unread-count').then((r) => r.data),

  /** Mark a single notification as read */
  markRead: (id) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  /** Mark all notifications as read */
  markAllRead: () =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),
};
