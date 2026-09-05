import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';

export async function list(query) {
  const where = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [total, data] = await Promise.all([
    prisma.department.count({ where }),
    prisma.department.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: { _count: { select: { employees: { where: { deletedAt: null, status: { not: 'EXITED' } } } } } },
    }),
  ]);
  return {
    departments: data.map((d) => ({ ...d, employeeCount: d._count.employees, _count: undefined })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getById(id) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });
  if (!dept) throw ApiError.notFound('Department not found.');
  return { ...dept, employeeCount: dept._count.employees, _count: undefined };
}

export async function create(data) {
  return prisma.department.create({ data });
}

export async function update(id, data) {
  await getById(id);
  return prisma.department.update({ where: { id }, data });
}

export async function remove(id) {
  const activeCount = await prisma.employee.count({
    where: { departmentId: id, deletedAt: null, status: { in: ['ACTIVE', 'ON_NOTICE', 'ONBOARDING'] } },
  });
  if (activeCount > 0) {
    throw ApiError.conflict(`Cannot delete department: ${activeCount} active employee(s) are assigned.`);
  }
  return prisma.department.update({ where: { id }, data: { isActive: false } });
}
