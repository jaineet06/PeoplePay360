import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { notificationsApi } from '@/api/notifications.api';

/** Cache key factory — scoped to userId so cache is naturally isolated per login session */
function notifKeys(userId) {
  return {
    all: ['notifications', userId],
    list: (params) => ['notifications', userId, 'list', params],
    unreadCount: ['notifications', userId, 'unread-count'],
  };
}

/** Unread badge count — polled every 30 s */
export function useUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: notifKeys(userId).unreadCount,
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count ?? 0),
    enabled: !!userId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/** Paginated notification list */
export function useNotifications(params = {}) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: notifKeys(userId).list(params),
    queryFn: () => notificationsApi.list(params).then((r) => r),
    enabled: !!userId,
    staleTime: 10_000,
  });
}

/** Mark one as read — invalidates count + list */
export function useMarkRead() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const keys = notifKeys(userId);
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.unreadCount });
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });
}

/** Mark all as read — invalidates count + list */
export function useMarkAllRead() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const keys = notifKeys(userId);
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.unreadCount });
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });
}
