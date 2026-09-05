import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';

export async function list(query) {
  const where = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [total, data] = await Promise.all([
    prisma.jobPosition.count({ where }),
    prisma.jobPosition.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: { _count: { select: { employees: { where: { deletedAt: null } } } } },
    }),
  ]);
  return {
    jobPositions: data.map((p) => ({ ...p, employeeCount: p._count.employees, _count: undefined })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getById(id) {
  const pos = await prisma.jobPosition.findUnique({ where: { id } });
  if (!pos) throw ApiError.notFound('Job position not found.');
  return pos;
}

export async function create(data) {
  return prisma.jobPosition.create({ data });
}

export async function update(id, data) {
  await getById(id);
  return prisma.jobPosition.update({ where: { id }, data });
}

export async function remove(id) {
  const activeCount = await prisma.employee.count({
    where: { jobPositionId: id, deletedAt: null, status: { in: ['ACTIVE', 'ON_NOTICE', 'ONBOARDING'] } },
  });
  if (activeCount > 0) {
    throw ApiError.conflict(`Cannot delete job position: ${activeCount} active employee(s) are assigned.`);
  }
  return prisma.jobPosition.update({ where: { id }, data: { isActive: false } });
}
