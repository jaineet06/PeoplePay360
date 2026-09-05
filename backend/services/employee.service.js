import crypto from 'crypto';
import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { hashPassword } from '../services/auth.service.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';
import { assertEmployeeScope } from '../utils/scope.js';
import { nextEmployeeCode } from '../utils/reference.js';
import { serializeModel } from '../utils/serialize.js';
import { withContractFlags } from './contract.service.js';

const employeeSummarySelect = {
  id: true,
  employeeCode: true,
  fullName: true,
  workEmail: true,
  status: true,
};

const departmentSelect = { id: true, code: true, name: true, isActive: true };
const jobPositionSelect = { id: true, code: true, title: true, isActive: true };
const scheduleSelect = {
  id: true,
  code: true,
  name: true,
  timezone: true,
  hoursPerWeek: true,
  workingDaysPerWeek: true,
  isActive: true,
  lines: {
    orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
  },
};

function buildFullName(firstName, lastName, fullName) {
  return fullName?.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
}

function generateTempPassword() {
  const base = crypto.randomBytes(12).toString('base64url');
  return `${base}Aa1!`;
}

function baseWhere(query) {
  const where = {};
  if (!query.includeDeleted) where.deletedAt = null;
  if (query.status) where.status = query.status;
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.jobPositionId) where.jobPositionId = query.jobPositionId;
  if (query.managerId) where.managerId = query.managerId;
  if (query.search) {
    where.OR = [
      { employeeCode: { contains: query.search, mode: 'insensitive' } },
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { workEmail: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

const detailInclude = {
  department: { select: departmentSelect },
  jobPosition: { select: jobPositionSelect },
  workingSchedule: { select: scheduleSelect },
  manager: { select: employeeSummarySelect },
  login: { select: { id: true, email: true, role: true, isActive: true } },
};

async function findActiveContract(employeeId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const contract = await prisma.contract.findFirst({
    where: {
      employeeId,
      status: 'ACTIVE',
      deletedAt: null,
      startDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    include: {
      salaryStructure: { select: { id: true, code: true, name: true, currency: true } },
      jobPosition: { select: jobPositionSelect },
    },
    orderBy: { startDate: 'desc' },
  });
  return contract ? withContractFlags(contract) : null;
}

async function assertEmployeeExists(id, includeDeleted = false) {
  const employee = await prisma.employee.findFirst({
    where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
  });
  if (!employee) throw ApiError.notFound('Employee not found.');
  return employee;
}

async function validateReferences({ departmentId, jobPositionId, workingScheduleId, managerId, employeeId }) {
  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept?.isActive) throw ApiError.badRequest('Invalid or inactive department.');
  }
  if (jobPositionId) {
    const pos = await prisma.jobPosition.findUnique({ where: { id: jobPositionId } });
    if (!pos?.isActive) throw ApiError.badRequest('Invalid or inactive job position.');
  }
  if (workingScheduleId) {
    const schedule = await prisma.workingSchedule.findUnique({ where: { id: workingScheduleId } });
    if (!schedule?.isActive) throw ApiError.badRequest('Invalid or inactive working schedule.');
  }
  if (managerId) {
    if (managerId === employeeId) throw ApiError.badRequest('An employee cannot be their own manager.');
    const manager = await prisma.employee.findFirst({ where: { id: managerId, deletedAt: null } });
    if (!manager) throw ApiError.badRequest('Invalid manager.');
  }
}

function mapEmployeeRow(row) {
  return serializeModel(row);
}

export async function list(query) {
  if (query.groupBy) return listKanban(query);

  const where = baseWhere(query);
  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: {
        department: { select: departmentSelect },
        jobPosition: { select: jobPositionSelect },
        manager: { select: employeeSummarySelect },
      },
    }),
  ]);

  return {
    employees: rows.map(mapEmployeeRow),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function listKanban(query) {
  const where = baseWhere(query);
  const employees = await prisma.employee.findMany({
    where,
    orderBy: [{ fullName: 'asc' }],
    include: {
      department: { select: departmentSelect },
      jobPosition: { select: jobPositionSelect },
      manager: { select: employeeSummarySelect },
    },
  });

  const groups = new Map();

  if (query.groupBy === 'status') {
    for (const status of ['ONBOARDING', 'ACTIVE', 'ON_NOTICE', 'SUSPENDED', 'EXITED']) {
      groups.set(status, { key: status, label: status, employees: [], count: 0 });
    }
    for (const emp of employees) {
      const group = groups.get(emp.status);
      group.employees.push(mapEmployeeRow(emp));
      group.count += 1;
    }
  } else {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: departmentSelect,
      orderBy: { name: 'asc' },
    });
    groups.set('__unassigned__', { key: null, label: 'Unassigned', employees: [], count: 0 });
    for (const dept of departments) {
      groups.set(dept.id, { key: dept.id, label: dept.name, department: dept, employees: [], count: 0 });
    }
    for (const emp of employees) {
      const key = emp.departmentId ?? '__unassigned__';
      if (!groups.has(key)) {
        groups.set(key, {
          key: emp.departmentId,
          label: emp.department?.name ?? 'Unknown',
          department: emp.department ?? null,
          employees: [],
          count: 0,
        });
      }
      const group = groups.get(key);
      group.employees.push(mapEmployeeRow(emp));
      group.count += 1;
    }
  }

  return {
    groupBy: query.groupBy,
    groups: [...groups.values()].filter((g) => g.count > 0 || query.groupBy === 'status'),
    meta: { total: employees.length },
  };
}

export async function getById(id, requester) {
  const scopedId = assertEmployeeScope(requester, id);
  await assertEmployeeExists(scopedId);

  const employee = await prisma.employee.findUnique({
    where: { id: scopedId },
    include: detailInclude,
  });

  const activeContract = await findActiveContract(scopedId);
  return serializeModel({ ...employee, activeContract });
}

export async function getMe(requester) {
  const employeeId = assertEmployeeScope(requester, requester.employeeId);
  if (!employeeId) throw ApiError.forbidden('Your account is not linked to an employee profile.');
  return getById(employeeId, requester);
}

export async function create(data) {
  const { createUser, ...payload } = data;
  const employeeCode = payload.employeeCode ?? await nextEmployeeCode();
  const fullName = buildFullName(payload.firstName, payload.lastName, payload.fullName);

  await validateReferences(payload);

  if (await prisma.employee.findFirst({ where: { employeeCode, deletedAt: null } })) {
    throw ApiError.conflict('Employee code already exists.');
  }
  if (await prisma.employee.findFirst({ where: { workEmail: payload.workEmail, deletedAt: null } })) {
    throw ApiError.conflict('Work email already exists.');
  }

  let tempPassword;
  const userEmail = createUser?.email ?? payload.workEmail;

  const result = await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        ...payload,
        employeeCode,
        fullName,
        status: payload.status ?? 'ONBOARDING',
      },
      include: detailInclude,
    });

    let user = null;
    if (createUser) {
      if (await tx.user.findUnique({ where: { email: userEmail } })) {
        throw ApiError.conflict('A user with this email already exists.');
      }
      tempPassword = generateTempPassword();
      user = await tx.user.create({
        data: {
          email: userEmail,
          passwordHash: await hashPassword(tempPassword),
          role: createUser.role ?? 'EMPLOYEE',
          employeeId: employee.id,
        },
        select: { id: true, email: true, role: true, isActive: true },
      });
    }

    return { employee, user };
  });

  const response = { employee: serializeModel(result.employee) };
  if (result.user) {
    response.user = result.user;
    response.tempPassword = tempPassword;
    response.tempPasswordNote = 'Share this temporary password securely; it is shown only once at creation.';
  }
  return response;
}

export async function update(id, data, requester) {
  const scopedId = assertEmployeeScope(requester, id);
  const existing = await assertEmployeeExists(scopedId);

  if (data.managerId !== undefined || data.departmentId !== undefined
    || data.jobPositionId !== undefined || data.workingScheduleId !== undefined) {
    await validateReferences({
      departmentId: data.departmentId ?? existing.departmentId,
      jobPositionId: data.jobPositionId ?? existing.jobPositionId,
      workingScheduleId: data.workingScheduleId ?? existing.workingScheduleId,
      managerId: data.managerId ?? existing.managerId,
      employeeId: scopedId,
    });
  }

  if (data.employeeCode && data.employeeCode !== existing.employeeCode) {
    if (await prisma.employee.findFirst({
      where: { employeeCode: data.employeeCode, deletedAt: null, id: { not: scopedId } },
    })) {
      throw ApiError.conflict('Employee code already exists.');
    }
  }

  if (data.workEmail && data.workEmail !== existing.workEmail) {
    if (await prisma.employee.findFirst({
      where: { workEmail: data.workEmail, deletedAt: null, id: { not: scopedId } },
    })) {
      throw ApiError.conflict('Work email already exists.');
    }
  }

  const firstName = data.firstName ?? existing.firstName;
  const lastName = data.lastName ?? existing.lastName;
  const fullName = buildFullName(firstName, lastName, data.fullName ?? existing.fullName);

  const employee = await prisma.employee.update({
    where: { id: scopedId },
    data: { ...data, fullName },
    include: detailInclude,
  });

  return serializeModel(employee);
}

export async function remove(id) {
  await assertEmployeeExists(id);

  const activeContract = await prisma.contract.count({
    where: { employeeId: id, status: 'ACTIVE', deletedAt: null },
  });
  if (activeContract > 0) {
    throw ApiError.conflict('Cannot delete employee with an active contract. Terminate the contract first.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });
    return tx.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'EXITED', dateOfExit: new Date() },
    });
  });
}

export async function listContracts(employeeId, query, requester) {
  const scopedId = assertEmployeeScope(requester, employeeId);
  await assertEmployeeExists(scopedId);

  const where = { employeeId: scopedId, deletedAt: null };
  const sortField = query.sortBy === 'date' ? 'startDate' : query.sortBy;

  const [total, rows] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      orderBy: buildOrderBy(sortField, query.order),
      skip: query.skip,
      take: query.limit,
      include: {
        salaryStructure: { select: { id: true, code: true, name: true } },
        jobPosition: { select: jobPositionSelect },
      },
    }),
  ]);

  return {
    contracts: rows.map(withContractFlags).map(serializeModel),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function listAttendance(employeeId, query, requester) {
  const scopedId = assertEmployeeScope(requester, employeeId);
  await assertEmployeeExists(scopedId);

  const where = { employeeId: scopedId };
  const sortField = query.sortBy === 'date' ? 'date' : query.sortBy;

  const [total, rows] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      orderBy: buildOrderBy(sortField, query.order),
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    attendances: rows.map(serializeModel),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function listTimeOffRequests(employeeId, query, requester) {
  const scopedId = assertEmployeeScope(requester, employeeId);
  await assertEmployeeExists(scopedId);

  const where = { employeeId: scopedId };
  const [total, rows] = await Promise.all([
    prisma.timeOffRequest.count({ where }),
    prisma.timeOffRequest.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: {
        timeOffType: { select: { id: true, code: true, name: true, unit: true } },
        allocation: { select: { id: true, validFrom: true, validTo: true, status: true } },
      },
    }),
  ]);

  return {
    timeOffRequests: rows.map(serializeModel),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function listAllocations(employeeId, query, requester) {
  const scopedId = assertEmployeeScope(requester, employeeId);
  await assertEmployeeExists(scopedId);

  const where = { employeeId: scopedId };
  const [total, rows] = await Promise.all([
    prisma.timeOffAllocation.count({ where }),
    prisma.timeOffAllocation.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: {
        timeOffType: { select: { id: true, code: true, name: true, unit: true } },
      },
    }),
  ]);

  return {
    allocations: rows.map((row) => serializeModel({
      ...row,
      remainingUnits: row.allocatedUnits.minus(row.takenUnits),
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}
