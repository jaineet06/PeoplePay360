import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';
import { assertEmployeeScope, resolveEmployeeId } from '../utils/scope.js';
import { ROLES } from '../utils/roles.js';
import { nextTimeOffRequestRef } from '../utils/reference.js';
import { serializeModel } from '../utils/serialize.js';

const employeeSelect = { id: true, employeeCode: true, fullName: true, departmentId: true };
const typeSelect = { id: true, code: true, name: true, unit: true, requiresAllocation: true, approvalRequired: true };
const approverSelect = { id: true, email: true, role: true };

function parseDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapAllocation(row) {
  return serializeModel({
    ...row,
    remainingUnits: row.allocatedUnits.minus(row.takenUnits),
  });
}

function mapRequest(row) {
  return serializeModel(row);
}

function assertHrWrite(requester) {
  if (![ROLES.HR_MANAGER, ROLES.ADMIN].includes(requester.role)) {
    throw ApiError.forbidden('Only HR managers can perform this action.');
  }
}

async function assertTypeExists(id) {
  const type = await prisma.timeOffType.findUnique({ where: { id } });
  if (!type) throw ApiError.notFound('Time off type not found.');
  return type;
}

async function assertAllocationExists(id) {
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: { id },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
    },
  });
  if (!allocation) throw ApiError.notFound('Time off allocation not found.');
  return allocation;
}

async function assertRequestExists(id) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
      allocation: true,
      approvedBy: { select: approverSelect },
    },
  });
  if (!request) throw ApiError.notFound('Time off request not found.');
  return request;
}

async function assertEmployeeActive(employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
  });
  if (!employee) throw ApiError.badRequest('Invalid or deleted employee.');
  return employee;
}

async function assertAllocationWindowOverlap(employeeId, timeOffTypeId, validFrom, validTo, excludeId) {
  const overlapping = await prisma.timeOffAllocation.findFirst({
    where: {
      employeeId,
      timeOffTypeId,
      status: { in: ['PENDING', 'APPROVED'] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      validFrom: { lte: validTo },
      validTo: { gte: validFrom },
    },
  });

  if (overlapping) {
    throw ApiError.conflict('An overlapping allocation already exists for this employee and time off type.');
  }
}

async function assertApprovedRequestOverlap(employeeId, startDate, endDate, excludeId) {
  const overlapping = await prisma.timeOffRequest.findFirst({
    where: {
      employeeId,
      status: 'APPROVED',
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  if (overlapping) {
    throw ApiError.conflict('An approved time off request already overlaps this date range.');
  }
}

async function resolveSpendableAllocation(employeeId, timeOffTypeId, startDate, endDate, allocationId) {
  if (allocationId) {
    const allocation = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });
    if (!allocation || allocation.employeeId !== employeeId || allocation.timeOffTypeId !== timeOffTypeId) {
      throw ApiError.badRequest('Invalid allocation for this employee and time off type.');
    }
    if (allocation.status !== 'APPROVED') {
      throw ApiError.badRequest('Allocation must be approved before use.');
    }
    if (allocation.validFrom > startDate || allocation.validTo < endDate) {
      throw ApiError.badRequest('Allocation validity does not cover the requested dates.');
    }
    return allocation;
  }

  const allocation = await prisma.timeOffAllocation.findFirst({
    where: {
      employeeId,
      timeOffTypeId,
      status: 'APPROVED',
      validFrom: { lte: startDate },
      validTo: { gte: endDate },
    },
    orderBy: { validFrom: 'desc' },
  });

  if (!allocation) {
    throw ApiError.badRequest('No approved allocation covers the requested period.');
  }

  return allocation;
}

function assertAllocationBalance(allocation, duration) {
  const remaining = allocation.allocatedUnits.minus(allocation.takenUnits);
  if (remaining.lessThan(duration)) {
    throw ApiError.badRequest(`Insufficient allocation balance. Remaining: ${remaining.toFixed(3)}, requested: ${duration.toFixed(3)}.`);
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export async function listTypes(query) {
  const where = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.unit) where.unit = query.unit;
  if (query.requiresAllocation !== undefined) where.requiresAllocation = query.requiresAllocation;
  if (query.approvalRequired !== undefined) where.approvalRequired = query.approvalRequired;
  if (query.affectsPayroll !== undefined) where.affectsPayroll = query.affectsPayroll;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.timeOffType.count({ where }),
    prisma.timeOffType.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    timeOffTypes: rows.map(serializeModel),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getTypeById(id) {
  const type = await assertTypeExists(id);
  return serializeModel(type);
}

export async function createType(data) {
  try {
    const type = await prisma.timeOffType.create({ data });
    return serializeModel(type);
  } catch (err) {
    if (err.code === 'P2002') throw ApiError.conflict('A time off type with this code or name already exists.');
    throw err;
  }
}

export async function updateType(id, data) {
  await assertTypeExists(id);
  try {
    const type = await prisma.timeOffType.update({ where: { id }, data });
    return serializeModel(type);
  } catch (err) {
    if (err.code === 'P2002') throw ApiError.conflict('A time off type with this code or name already exists.');
    throw err;
  }
}

export async function removeType(id) {
  await assertTypeExists(id);
  const type = await prisma.timeOffType.update({
    where: { id },
    data: { isActive: false },
  });
  return serializeModel(type);
}

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------

function buildAllocationWhere(query, requester) {
  const where = {};
  const scopedEmployeeId = assertEmployeeScope(requester, query.employeeId);
  if (scopedEmployeeId) where.employeeId = scopedEmployeeId;
  if (query.timeOffTypeId) where.timeOffTypeId = query.timeOffTypeId;
  if (query.status) where.status = query.status;
  if (query.dateFrom || query.dateTo) {
    if (query.dateFrom) where.validTo = { ...(where.validTo ?? {}), gte: parseDateOnly(query.dateFrom) };
    if (query.dateTo) where.validFrom = { ...(where.validFrom ?? {}), lte: parseDateOnly(query.dateTo) };
  }
  return where;
}

export async function listAllocations(query, requester) {
  const where = buildAllocationWhere(query, requester);
  const [total, rows] = await Promise.all([
    prisma.timeOffAllocation.count({ where }),
    prisma.timeOffAllocation.findMany({
      where,
      include: {
        employee: { select: employeeSelect },
        timeOffType: { select: typeSelect },
      },
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    allocations: rows.map(mapAllocation),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getAllocationById(id, requester) {
  const allocation = await assertAllocationExists(id);
  assertEmployeeScope(requester, allocation.employeeId);
  return mapAllocation(allocation);
}

export async function createAllocation(data, requester) {
  assertHrWrite(requester);
  await assertEmployeeActive(data.employeeId);
  const type = await assertTypeExists(data.timeOffTypeId);
  if (!type.isActive) throw ApiError.badRequest('Time off type is inactive.');

  const validFrom = parseDateOnly(data.validFrom);
  const validTo = parseDateOnly(data.validTo);
  await assertAllocationWindowOverlap(data.employeeId, data.timeOffTypeId, validFrom, validTo);

  try {
    const allocation = await prisma.timeOffAllocation.create({
      data: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        allocatedUnits: data.allocatedUnits,
        validFrom,
        validTo,
        status: data.status,
        notes: data.notes ?? null,
      },
      include: {
        employee: { select: employeeSelect },
        timeOffType: { select: typeSelect },
      },
    });
    return mapAllocation(allocation);
  } catch (err) {
    if (err.code === 'P2002') {
      throw ApiError.conflict('An allocation with the same employee, type, and validFrom already exists.');
    }
    throw err;
  }
}

export async function updateAllocation(id, data, requester) {
  assertHrWrite(requester);
  const existing = await assertAllocationExists(id);

  const validFrom = data.validFrom ? parseDateOnly(data.validFrom) : existing.validFrom;
  const validTo = data.validTo ? parseDateOnly(data.validTo) : existing.validTo;
  if (validFrom > validTo) throw ApiError.badRequest('validFrom must be on or before validTo.');

  if (data.validFrom || data.validTo || data.status === 'APPROVED' || data.status === 'PENDING') {
    await assertAllocationWindowOverlap(
      existing.employeeId,
      existing.timeOffTypeId,
      validFrom,
      validTo,
      id,
    );
  }

  const allocation = await prisma.timeOffAllocation.update({
    where: { id },
    data: {
      ...(data.allocatedUnits !== undefined ? { allocatedUnits: data.allocatedUnits } : {}),
      ...(data.validFrom ? { validFrom } : {}),
      ...(data.validTo ? { validTo } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
    },
  });

  return mapAllocation(allocation);
}

export async function approveAllocation(id, requester) {
  assertHrWrite(requester);
  const existing = await assertAllocationExists(id);
  if (existing.status === 'APPROVED') return mapAllocation(existing);
  if (['REFUSED', 'CANCELLED', 'EXPIRED'].includes(existing.status)) {
    throw ApiError.badRequest(`Cannot approve an allocation in ${existing.status} status.`);
  }

  await assertAllocationWindowOverlap(
    existing.employeeId,
    existing.timeOffTypeId,
    existing.validFrom,
    existing.validTo,
    id,
  );

  const allocation = await prisma.timeOffAllocation.update({
    where: { id },
    data: { status: 'APPROVED' },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
    },
  });

  return mapAllocation(allocation);
}

export async function refuseAllocation(id, data, requester) {
  assertHrWrite(requester);
  const existing = await assertAllocationExists(id);
  if (existing.status === 'APPROVED' && existing.takenUnits.greaterThan(0)) {
    throw ApiError.conflict('Cannot refuse an allocation that already has taken units.');
  }

  const allocation = await prisma.timeOffAllocation.update({
    where: { id },
    data: {
      status: 'REFUSED',
      notes: data.refusalReason,
    },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
    },
  });

  return mapAllocation(allocation);
}

export async function removeAllocation(id, requester) {
  assertHrWrite(requester);
  const existing = await assertAllocationExists(id);
  if (existing.takenUnits.greaterThan(0)) {
    throw ApiError.conflict('Cannot cancel an allocation with taken units.');
  }

  const allocation = await prisma.timeOffAllocation.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
    },
  });

  return mapAllocation(allocation);
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

function buildRequestWhere(query, requester) {
  const where = {};
  const scopedEmployeeId = assertEmployeeScope(requester, query.employeeId);
  if (scopedEmployeeId) where.employeeId = scopedEmployeeId;
  if (query.timeOffTypeId) where.timeOffTypeId = query.timeOffTypeId;
  if (query.status) where.status = query.status;
  if (query.departmentId) {
    where.employee = { departmentId: query.departmentId, deletedAt: null };
  }
  if (query.dateFrom || query.dateTo) {
    if (query.dateFrom) where.endDate = { ...(where.endDate ?? {}), gte: parseDateOnly(query.dateFrom) };
    if (query.dateTo) where.startDate = { ...(where.startDate ?? {}), lte: parseDateOnly(query.dateTo) };
  }
  return where;
}

export async function listRequests(query, requester) {
  const where = buildRequestWhere(query, requester);
  const [total, rows] = await Promise.all([
    prisma.timeOffRequest.count({ where }),
    prisma.timeOffRequest.findMany({
      where,
      include: {
        employee: { select: employeeSelect },
        timeOffType: { select: typeSelect },
        allocation: true,
        approvedBy: { select: approverSelect },
      },
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    timeOffRequests: rows.map(mapRequest),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getRequestById(id, requester) {
  const request = await assertRequestExists(id);
  assertEmployeeScope(requester, request.employeeId);
  return mapRequest(request);
}

export async function createRequest(data, requester) {
  const employeeId = resolveEmployeeId(requester, data.employeeId);
  await assertEmployeeActive(employeeId);

  const type = await assertTypeExists(data.timeOffTypeId);
  if (!type.isActive) throw ApiError.badRequest('Time off type is inactive.');
  if (type.unit !== data.unit) {
    throw ApiError.badRequest(`Unit must match time off type unit (${type.unit}).`);
  }

  const startDate = parseDateOnly(data.startDate);
  const endDate = parseDateOnly(data.endDate);
  await assertApprovedRequestOverlap(employeeId, startDate, endDate);

  if (type.requiresAllocation) {
    const allocation = await resolveSpendableAllocation(
      employeeId,
      data.timeOffTypeId,
      startDate,
      endDate,
      data.allocationId,
    );
    assertAllocationBalance(allocation, data.duration);
  }

  const reference = await nextTimeOffRequestRef();
  const status = type.approvalRequired ? 'PENDING' : 'APPROVED';

  if (status === 'APPROVED') {
    return prisma.$transaction(async (tx) => {
      let allocationId = data.allocationId ?? null;

      if (type.requiresAllocation) {
        const allocation = await resolveSpendableAllocation(
          employeeId,
          data.timeOffTypeId,
          startDate,
          endDate,
          data.allocationId,
        );
        assertAllocationBalance(allocation, data.duration);
        allocationId = allocation.id;

        await tx.timeOffAllocation.update({
          where: { id: allocation.id },
          data: { takenUnits: allocation.takenUnits.plus(data.duration) },
        });
      }

      const request = await tx.timeOffRequest.create({
        data: {
          reference,
          employeeId,
          timeOffTypeId: data.timeOffTypeId,
          allocationId,
          startDate,
          endDate,
          duration: data.duration,
          unit: data.unit,
          status: 'APPROVED',
          reason: data.reason ?? null,
          approvedById: requester.id,
          approvedAt: new Date(),
        },
        include: {
          employee: { select: employeeSelect },
          timeOffType: { select: typeSelect },
          allocation: true,
          approvedBy: { select: approverSelect },
        },
      });

      return mapRequest(request);
    });
  }

  const request = await prisma.timeOffRequest.create({
    data: {
      reference,
      employeeId,
      timeOffTypeId: data.timeOffTypeId,
      allocationId: data.allocationId ?? null,
      startDate,
      endDate,
      duration: data.duration,
      unit: data.unit,
      status: 'PENDING',
      reason: data.reason ?? null,
    },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
      allocation: true,
      approvedBy: { select: approverSelect },
    },
  });

  return mapRequest(request);
}

export async function updateRequest(id, data, requester) {
  const existing = await assertRequestExists(id);
  assertEmployeeScope(requester, existing.employeeId);

  const isOwner = requester.role === ROLES.EMPLOYEE;
  if (isOwner && existing.status !== 'DRAFT' && existing.status !== 'PENDING') {
    throw ApiError.badRequest('You can only update draft or pending requests.');
  }
  if (!isOwner) assertHrWrite(requester);

  const startDate = data.startDate ? parseDateOnly(data.startDate) : existing.startDate;
  const endDate = data.endDate ? parseDateOnly(data.endDate) : existing.endDate;
  if (startDate > endDate) throw ApiError.badRequest('startDate must be on or before endDate.');

  if (existing.status === 'APPROVED') {
    throw ApiError.badRequest('Approved requests cannot be edited.');
  }

  await assertApprovedRequestOverlap(existing.employeeId, startDate, endDate, id);

  const request = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      ...(data.startDate ? { startDate } : {}),
      ...(data.endDate ? { endDate } : {}),
      ...(data.duration !== undefined ? { duration: data.duration } : {}),
      ...(data.unit ? { unit: data.unit } : {}),
      ...(data.reason !== undefined ? { reason: data.reason } : {}),
      ...(data.allocationId !== undefined ? { allocationId: data.allocationId } : {}),
    },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
      allocation: true,
      approvedBy: { select: approverSelect },
    },
  });

  return mapRequest(request);
}

export async function approveRequest(id, requester) {
  assertHrWrite(requester);

  const existing = await assertRequestExists(id);
  if (existing.status === 'APPROVED') return mapRequest(existing);
  if (!['PENDING', 'DRAFT'].includes(existing.status)) {
    throw ApiError.badRequest(`Cannot approve a request in ${existing.status} status.`);
  }

  const type = await assertTypeExists(existing.timeOffTypeId);
  await assertApprovedRequestOverlap(existing.employeeId, existing.startDate, existing.endDate, id);

  return prisma.$transaction(async (tx) => {
    let allocationId = existing.allocationId;

    if (type.requiresAllocation) {
      const allocation = await resolveSpendableAllocation(
        existing.employeeId,
        existing.timeOffTypeId,
        existing.startDate,
        existing.endDate,
        existing.allocationId,
      );
      assertAllocationBalance(allocation, existing.duration);
      allocationId = allocation.id;

      await tx.timeOffAllocation.update({
        where: { id: allocation.id },
        data: { takenUnits: allocation.takenUnits.plus(existing.duration) },
      });
    }

    const request = await tx.timeOffRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        allocationId,
        approvedById: requester.id,
        approvedAt: new Date(),
        refusalReason: null,
      },
      include: {
        employee: { select: employeeSelect },
        timeOffType: { select: typeSelect },
        allocation: true,
        approvedBy: { select: approverSelect },
      },
    });

    return mapRequest(request);
  });
}

export async function refuseRequest(id, data, requester) {
  assertHrWrite(requester);

  const existing = await assertRequestExists(id);
  if (existing.status === 'APPROVED') {
    throw ApiError.badRequest('Approved requests must be cancelled, not refused.');
  }
  if (['REFUSED', 'CANCELLED'].includes(existing.status)) {
    return mapRequest(existing);
  }

  const request = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: 'REFUSED',
      refusalReason: data.refusalReason,
    },
    include: {
      employee: { select: employeeSelect },
      timeOffType: { select: typeSelect },
      allocation: true,
      approvedBy: { select: approverSelect },
    },
  });

  return mapRequest(request);
}

export async function cancelRequest(id, requester) {
  const existing = await assertRequestExists(id);
  assertEmployeeScope(requester, existing.employeeId);

  if (requester.role === ROLES.EMPLOYEE && !['DRAFT', 'PENDING'].includes(existing.status)) {
    throw ApiError.badRequest('You can only cancel draft or pending requests.');
  }
  if (![ROLES.HR_MANAGER, ROLES.ADMIN].includes(requester.role) && requester.role !== ROLES.EMPLOYEE) {
    assertHrWrite(requester);
  }

  return prisma.$transaction(async (tx) => {
    if (existing.status === 'APPROVED' && existing.allocationId) {
      const allocation = await tx.timeOffAllocation.findUnique({ where: { id: existing.allocationId } });
      if (allocation) {
        await tx.timeOffAllocation.update({
          where: { id: allocation.id },
          data: { takenUnits: allocation.takenUnits.minus(existing.duration) },
        });
      }
    }

    const request = await tx.timeOffRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        employee: { select: employeeSelect },
        timeOffType: { select: typeSelect },
        allocation: true,
        approvedBy: { select: approverSelect },
      },
    });

    return mapRequest(request);
  });
}

export async function removeRequest(id, requester) {
  const existing = await assertRequestExists(id);
  assertEmployeeScope(requester, existing.employeeId);

  if (existing.status !== 'DRAFT') {
    throw ApiError.badRequest('Only draft requests can be deleted.');
  }
  if (requester.role === ROLES.EMPLOYEE && existing.employeeId !== requester.employeeId) {
    throw ApiError.forbidden();
  }

  await prisma.timeOffRequest.delete({ where: { id } });
}
