'use strict';

/**
 * Maps a Prisma User record to the public API shape.
 * passwordHash is never included — strip at the service/mapper layer, not in controllers.
 */
function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employeeId,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    employee: user.employee ?? null,
  };
}

module.exports = { toPublicUser };
