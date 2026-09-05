import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';
import { ROLE_LEVEL } from '../utils/roles.js';

const userSelect = {
  id: true, email: true, role: true, isActive: true,
  employeeId: true, lastLoginAt: true, createdAt: true, updatedAt: true,
  employee: { select: { id: true, employeeCode: true, fullName: true } },
};

export async function listUsers(query) {
  const where = {};
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.search) where.email = { contains: query.search, mode: 'insensitive' };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
    }),
  ]);
  return { users, meta: buildPaginationMeta(query.page, query.limit, total) };
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function changeUserRole(callerId, targetId, newRole) {
  // Self-change guard
  if (callerId === targetId) {
    throw ApiError.forbidden('You cannot change your own role.');
  }

  const [caller, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: callerId }, select: { id: true, role: true } }),
    prisma.user.findUnique({ where: { id: targetId }, select: { id: true, role: true } }),
  ]);

  if (!target) throw ApiError.notFound('User not found.');

  const callerLevel = ROLE_LEVEL[caller.role];
  const targetCurrentLevel = ROLE_LEVEL[target.role];
  const newRoleLevel = ROLE_LEVEL[newRole];

  // Must be strictly higher than the target's CURRENT role to act on them
  if (callerLevel <= targetCurrentLevel) {
    throw ApiError.forbidden('You can only change the role of users below your own level in the hierarchy.');
  }

  // Cannot assign a role >= own level
  if (newRoleLevel >= callerLevel) {
    throw ApiError.forbidden('You cannot assign a role equal to or higher than your own.');
  }

  // Only ADMIN can assign or revoke the ADMIN role
  if (newRole === 'ADMIN' || target.role === 'ADMIN') {
    if (caller.role !== 'ADMIN') {
      throw ApiError.forbidden('Only administrators can assign or revoke the ADMIN role.');
    }
  }

  // Last-admin guard — if the target is currently an ADMIN, ensure at least one other active admin remains
  if (target.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
    if (adminCount <= 1) {
      throw ApiError.conflict('Cannot change the role of the last remaining administrator. Promote another admin first.');
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: newRole },
    select: userSelect,
  });

  return updated;
}
