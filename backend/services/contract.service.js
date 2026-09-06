import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';
import { nextContractRef } from '../utils/reference.js';

function toDate(d) {
  return d instanceof Date ? d : new Date(`${String(d).slice(0, 10)}T00:00:00.000Z`);
}

export function isCurrentlyActive(contract, asOf = new Date()) {
  if (contract.deletedAt || contract.status !== 'ACTIVE') return false;
  const day = toDate(asOf);
  const start = toDate(contract.startDate);
  const end = contract.endDate ? toDate(contract.endDate) : null;
  return start <= day && (!end || end >= day);
}

function decorate(contract, asOf = new Date()) {
  return { ...contract, isCurrentlyActive: isCurrentlyActive(contract, asOf) };
}

export const withContractFlags = decorate;

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const aEndVal = aEnd ?? new Date('9999-12-31');
  const bEndVal = bEnd ?? new Date('9999-12-31');
  return aStart <= bEndVal && bStart <= aEndVal;
}

async function assertNoActiveOverlap(tx, employeeId, startDate, endDate, excludeId = null) {
  const active = await tx.contract.findMany({
    where: {
      employeeId,
      deletedAt: null,
      status: 'ACTIVE',
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  for (const c of active) {
    if (rangesOverlap(startDate, endDate ?? null, c.startDate, c.endDate)) {
      throw ApiError.conflict(
        `Overlaps active contract ${c.reference} (${c.startDate.toISOString().slice(0, 10)} → ${c.endDate ? c.endDate.toISOString().slice(0, 10) : 'open'})`,
      );
    }
  }
}

export async function getActiveContractForPeriod(employeeId, periodStart, periodEnd) {
  const start = toDate(periodStart);
  const end = toDate(periodEnd);
  return prisma.contract.findFirst({
    where: {
      employeeId,
      deletedAt: null,
      status: { in: ['ACTIVE', 'EXPIRED', 'TERMINATED'] },
      startDate: { lte: end },
      OR: [{ endDate: null }, { endDate: { gte: start } }],
    },
    include: {
      salaryStructure: { include: { rules: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } },
      jobPosition: { select: { id: true, code: true, title: true } },
    },
    orderBy: { startDate: 'desc' },
  });
}

export async function resolveForPeriod({ employeeId, periodStart, periodEnd }) {
  const contract = await getActiveContractForPeriod(employeeId, periodStart, periodEnd);
  if (!contract) throw ApiError.notFound('No contract found for this employee and period.');
  return decorate(contract);
}

export async function list(query) {
  const where = { deletedAt: query.includeDeleted ? undefined : null };
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { reference: { contains: query.search, mode: 'insensitive' } },
      { jobTitleSnapshot: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true } },
        salaryStructure: { select: { id: true, code: true, name: true } },
      },
    }),
  ]);

  return {
    contracts: rows.map((c) => decorate(c)),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getById(id) {
  const contract = await prisma.contract.findFirst({
    where: { id, deletedAt: null },
    include: {
      employee: { select: { id: true, employeeCode: true, fullName: true, workEmail: true } },
      salaryStructure: { select: { id: true, code: true, name: true } },
      jobPosition: { select: { id: true, code: true, title: true } },
    },
  });
  if (!contract) throw ApiError.notFound('Contract not found.');
  return decorate(contract);
}

export async function create(data) {
  if (data.reference) {
    const existing = await prisma.contract.findFirst({
      where: { reference: data.reference },
      select: { id: true },
    });
    if (existing) {
      throw ApiError.conflict(`Contract reference '${data.reference}' already exists.`);
    }
  }

  const reference = data.reference ?? await nextContractRef();
  const status = data.status ?? 'DRAFT';
  const startDate = toDate(data.startDate);
  const endDate = data.endDate ? toDate(data.endDate) : null;

  return prisma.$transaction(async (tx) => {
    if (status === 'ACTIVE') {
      await assertNoActiveOverlap(tx, data.employeeId, startDate, endDate);
    }
    const contract = await tx.contract.create({
      data: {
        ...data,
        reference,
        status,
        startDate,
        endDate,
      },
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true } },
        salaryStructure: { select: { id: true, code: true, name: true } },
      },
    });
    return decorate(contract);
  });
}

export async function update(id, data) {
  const existing = await getById(id);
  const nextStatus = data.status ?? existing.status;
  const nextStart = data.startDate ? toDate(data.startDate) : existing.startDate;
  const nextEnd = data.endDate !== undefined ? (data.endDate ? toDate(data.endDate) : null) : existing.endDate;

  if (data.reference && data.reference !== existing.reference) {
    const duplicate = await prisma.contract.findFirst({
      where: { reference: data.reference, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) {
      throw ApiError.conflict(`Contract reference '${data.reference}' already exists.`);
    }
  }

  return prisma.$transaction(async (tx) => {
    if (nextStatus === 'ACTIVE') {
      await assertNoActiveOverlap(tx, existing.employeeId, nextStart, nextEnd, id);
    }
    const contract = await tx.contract.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate ? { startDate: nextStart } : {}),
        ...(data.endDate !== undefined ? { endDate: nextEnd } : {}),
      },
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true } },
        salaryStructure: { select: { id: true, code: true, name: true } },
      },
    });
    return decorate(contract);
  });
}

export async function remove(id) {
  await getById(id);
  return prisma.contract.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'CANCELLED' },
  });
}
