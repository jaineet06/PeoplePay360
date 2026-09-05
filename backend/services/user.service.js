'use strict';

const { prisma } = require('../configs/db');
const { buildOrderBy, buildPaginationMeta } = require('../utils/pagination');

const userSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  employeeId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

async function listUsers(query) {
  const where = {};

  if (query.role) {
    where.role = query.role;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search) {
    where.email = { contains: query.search, mode: 'insensitive' };
  }

  const orderBy = buildOrderBy(query.sortBy, query.order);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy,
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    users,
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      employee: {
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          workEmail: true,
          status: true,
        },
      },
    },
  });
}

module.exports = {
  listUsers,
  getUserById,
};
