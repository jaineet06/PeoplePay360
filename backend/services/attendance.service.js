import { Prisma } from '@prisma/client';
import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';
import { assertEmployeeScope, resolveEmployeeId } from '../utils/scope.js';
import { ROLES } from '../utils/roles.js';
import { serializeModel } from '../utils/serialize.js';

const LATE_GRACE_MINUTES = 15;

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const attendanceInclude = {
  employee: {
    select: { id: true, employeeCode: true, fullName: true, departmentId: true },
  },
  correctedBy: {
    select: { id: true, email: true, role: true },
  },
};

function parseDateOnly(value) {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw ApiError.badRequest('Invalid date.');
  return d;
}

function toDateOnly(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getWeekday(date) {
  return WEEKDAYS[date.getUTCDay()];
}

function getMinutesFromMidnight(dt) {
  return dt.getUTCHours() * 60 + dt.getUTCMinutes();
}

export function computeWorkedHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return new Prisma.Decimal('0.00');
  const ms = checkOut.getTime() - checkIn.getTime();
  if (ms <= 0) return new Prisma.Decimal('0.00');
  return new Prisma.Decimal((ms / (1000 * 60 * 60)).toFixed(2));
}

function getExpectedHoursForDay(scheduleLines) {
  if (!scheduleLines?.length) return 0;
  const minutes = scheduleLines.reduce(
    (sum, line) => sum + Math.max(0, line.endMinute - line.startMinute - line.breakMinutes),
    0,
  );
  return minutes / 60;
}

function getScheduleStartMinute(scheduleLines) {
  if (!scheduleLines?.length) return null;
  return Math.min(...scheduleLines.map((line) => line.startMinute));
}

export function classifyStatus({ checkIn, checkOut, scheduleLines, statusOverride }) {
  if (statusOverride) return statusOverride;
  if (!checkIn && !checkOut) return 'ABSENT';
  if (checkIn && !checkOut) return 'MISSING_CHECKOUT';

  const workedHours = Number(computeWorkedHours(checkIn, checkOut));
  const expectedHours = getExpectedHoursForDay(scheduleLines);
  const checkInMinute = getMinutesFromMidnight(checkIn);
  const startMinute = getScheduleStartMinute(scheduleLines);

  if (expectedHours > 0 && workedHours > expectedHours) return 'OVERTIME';
  if (startMinute != null && checkInMinute > startMinute + LATE_GRACE_MINUTES) return 'LATE';
  return 'PRESENT';
}

async function getScheduleLinesForDate(employeeId, date) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: {
      workingSchedule: {
        select: {
          lines: {
            where: { dayOfWeek: getWeekday(date) },
            orderBy: { startMinute: 'asc' },
          },
        },
      },
    },
  });
  return employee?.workingSchedule?.lines ?? [];
}

async function deriveAttendanceFields(employeeId, date, checkIn, checkOut, statusOverride) {
  const scheduleLines = await getScheduleLinesForDate(employeeId, date);
  return {
    workedHours: computeWorkedHours(checkIn, checkOut),
    status: classifyStatus({ checkIn, checkOut, scheduleLines, statusOverride }),
  };
}

function mapAttendance(row) {
  return serializeModel(row);
}

function buildListWhere(query, requester) {
  const where = {};

  const scopedEmployeeId = assertEmployeeScope(requester, query.employeeId);
  if (scopedEmployeeId) where.employeeId = scopedEmployeeId;

  if (query.departmentId) {
    where.employee = { departmentId: query.departmentId, deletedAt: null };
  }

  if (query.status) where.status = query.status;
  if (query.source) where.source = query.source;
  if (query.isManualCorrection !== undefined) where.isManualCorrection = query.isManualCorrection;

  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) where.date.gte = parseDateOnly(query.dateFrom);
    if (query.dateTo) where.date.lte = parseDateOnly(query.dateTo);
  }

  return where;
}

async function assertAttendanceExists(id) {
  const row = await prisma.attendance.findUnique({
    where: { id },
    include: attendanceInclude,
  });
  if (!row) throw ApiError.notFound('Attendance record not found.');
  return row;
}

async function assertEmployeeActive(employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
  });
  if (!employee) throw ApiError.badRequest('Invalid or deleted employee.');
  return employee;
}

export async function list(query, requester) {
  const where = buildListWhere(query, requester);
  const sortField = query.sortBy === 'date' ? 'date' : query.sortBy;

  const [total, rows] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: attendanceInclude,
      orderBy: buildOrderBy(sortField, query.order),
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    attendances: rows.map(mapAttendance),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getById(id, requester) {
  const row = await assertAttendanceExists(id);
  assertEmployeeScope(requester, row.employeeId);
  return mapAttendance(row);
}

export async function create(data, requester) {
  const employeeId = resolveEmployeeId(requester, data.employeeId);
  await assertEmployeeActive(employeeId);

  const date = parseDateOnly(data.date);
  const checkIn = data.checkIn ? new Date(data.checkIn) : null;
  const checkOut = data.checkOut ? new Date(data.checkOut) : null;
  const derived = await deriveAttendanceFields(employeeId, date, checkIn, checkOut);

  try {
    const row = await prisma.attendance.create({
      data: {
        employeeId,
        date,
        checkIn,
        checkOut,
        workedHours: derived.workedHours,
        status: derived.status,
        source: data.source,
        notes: data.notes ?? null,
      },
      include: attendanceInclude,
    });
    return mapAttendance(row);
  } catch (err) {
    if (err.code === 'P2002') {
      throw ApiError.conflict('An attendance record already exists for this employee on this date.');
    }
    throw err;
  }
}

export async function update(id, data, requester) {
  if (![ROLES.HR_MANAGER, ROLES.ADMIN].includes(requester.role)) {
    throw ApiError.forbidden('Only HR managers can manually correct attendance.');
  }

  const existing = await assertAttendanceExists(id);
  const date = existing.date;
  const checkIn = data.checkIn !== undefined ? (data.checkIn ? new Date(data.checkIn) : null) : existing.checkIn;
  const checkOut = data.checkOut !== undefined ? (data.checkOut ? new Date(data.checkOut) : null) : existing.checkOut;
  const derived = await deriveAttendanceFields(
    existing.employeeId,
    date,
    checkIn,
    checkOut,
    data.statusOverride,
  );

  const row = await prisma.attendance.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      workedHours: derived.workedHours,
      status: derived.status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      isManualCorrection: true,
      correctionReason: data.correctionReason,
      correctedById: requester.id,
    },
    include: attendanceInclude,
  });

  return mapAttendance(row);
}

export async function remove(id, requester) {
  if (![ROLES.HR_MANAGER, ROLES.ADMIN].includes(requester.role)) {
    throw ApiError.forbidden('Only HR managers can delete attendance records.');
  }
  await assertAttendanceExists(id);
  await prisma.attendance.delete({ where: { id } });
}

export async function checkIn(requester, data) {
  if (!requester.employeeId) {
    throw ApiError.badRequest('Your account is not linked to an employee profile.');
  }

  const now = new Date();
  const date = toDateOnly(now);
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: requester.employeeId, date } },
  });

  if (existing?.checkIn) {
    throw ApiError.conflict('You have already checked in for today.');
  }

  const derived = await deriveAttendanceFields(requester.employeeId, date, now, null);

  const row = existing
    ? await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkIn: now,
        checkOut: null,
        workedHours: derived.workedHours,
        status: derived.status,
        source: data.source,
        notes: data.notes ?? existing.notes,
      },
      include: attendanceInclude,
    })
    : await prisma.attendance.create({
      data: {
        employeeId: requester.employeeId,
        date,
        checkIn: now,
        workedHours: derived.workedHours,
        status: derived.status,
        source: data.source,
        notes: data.notes ?? null,
      },
      include: attendanceInclude,
    });

  return mapAttendance(row);
}

export async function checkOut(requester, data) {
  if (!requester.employeeId) {
    throw ApiError.badRequest('Your account is not linked to an employee profile.');
  }

  const now = new Date();
  const date = toDateOnly(now);
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: requester.employeeId, date } },
  });

  if (!existing?.checkIn) {
    throw ApiError.badRequest('You must check in before checking out.');
  }
  if (existing.checkOut) {
    throw ApiError.conflict('You have already checked out for today.');
  }

  const derived = await deriveAttendanceFields(
    requester.employeeId,
    date,
    existing.checkIn,
    now,
  );

  const row = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      workedHours: derived.workedHours,
      status: derived.status,
      notes: data.notes ?? existing.notes,
    },
    include: attendanceInclude,
  });

  return mapAttendance(row);
}
