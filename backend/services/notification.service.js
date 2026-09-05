/**
 * Notification Service
 * Handles creation, listing, and marking-as-read for in-app notifications.
 */
import { prisma } from '../configs/db.js';
import { buildPaginationMeta } from '../utils/pagination.js';

/**
 * Create a single notification for one user.
 */
export async function createNotification(userId, type, title, message, link = null) {
  if (!userId) return null;
  try {
    return await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  } catch (err) {
    // Never throw from notification side-effects — log and swallow
    console.error('[notification] createNotification error:', err.message);
    return null;
  }
}

/**
 * Find all active users with any of the given roles and notify each one.
 */
export async function notifyUsersWithRoles(roles, type, title, message, link = null) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: { id: true },
    });
    if (users.length === 0) return;
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type, title, message, link })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error('[notification] notifyUsersWithRoles error:', err.message);
  }
}

/**
 * Find the userId linked to an employee (for employee-facing notifications).
 */
export async function getUserIdByEmployeeId(employeeId) {
  if (!employeeId) return null;
  const user = await prisma.user.findFirst({
    where: { employeeId },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * List notifications for the requesting user (paginated).
 */
export async function listForUser(userId, { page = 1, limit = 20, isRead } = {}) {
  const where = { userId };
  if (isRead === 'true' || isRead === true) where.isRead = true;
  if (isRead === 'false' || isRead === false) where.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [total, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    notifications: items,
    meta: buildPaginationMeta(Number(page), Number(limit), total),
  };
}

/**
 * Return the count of unread notifications for a user.
 */
export async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * Mark one notification as read (scoped to the requesting user).
 */
export async function markRead(id, userId) {
  // Use updateMany so we don't 404 if already read or wrong user
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  return { id, isRead: true };
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllRead(userId) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { markedRead: count };
}
