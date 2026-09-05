import { Prisma } from '@prisma/client';
import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';

function lineHours(line) {
  const minutes = line.endMinute - line.startMinute - line.breakMinutes;
  return Math.max(0, minutes) / 60;
}

export function computeWeeklyStats(lines) {
  const hours = lines.reduce((sum, line) => sum + lineHours(line), 0);
  const workingDaysPerWeek = new Set(lines.map((l) => l.dayOfWeek)).size;
  return {
    hoursPerWeek: new Prisma.Decimal(hours.toFixed(2)),
    workingDaysPerWeek,
  };
}

export function assertNoOverlappingLines(lines) {
  const byDay = new Map();
  for (const line of lines) {
    if (!byDay.has(line.dayOfWeek)) byDay.set(line.dayOfWeek, []);
    byDay.get(line.dayOfWeek).push(line);
  }

  for (const [day, dayLines] of byDay) {
    const sorted = [...dayLines].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.startMinute < prev.endMinute) {
        throw ApiError.badRequest(
          `Overlapping schedule lines on ${day}: ${prev.startMinute}-${prev.endMinute} overlaps ${curr.startMinute}-${curr.endMinute}.`,
        );
      }
    }
  }
}

const scheduleInclude = {
  lines: { orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }] },
  _count: { select: { employees: { where: { deletedAt: null } } } },
};

function mapSchedule(schedule) {
  return {
    ...schedule,
    employeeCount: schedule._count?.employees ?? 0,
    _count: undefined,
  };
}

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
    prisma.workingSchedule.count({ where }),
    prisma.workingSchedule.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: scheduleInclude,
    }),
  ]);

  return {
    workingSchedules: data.map(mapSchedule),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getById(id) {
  const schedule = await prisma.workingSchedule.findUnique({
    where: { id },
    include: scheduleInclude,
  });
  if (!schedule) throw ApiError.notFound('Working schedule not found.');
  return mapSchedule(schedule);
}

export async function create(data) {
  const { lines, ...scheduleData } = data;
  assertNoOverlappingLines(lines);
  const stats = computeWeeklyStats(lines);

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.workingSchedule.create({
      data: {
        ...scheduleData,
        ...stats,
        lines: { create: lines },
      },
      include: scheduleInclude,
    });
    return mapSchedule(schedule);
  });
}

export async function update(id, data) {
  await getById(id);
  const { lines, ...scheduleData } = data;

  if (lines) assertNoOverlappingLines(lines);
  const stats = lines ? computeWeeklyStats(lines) : {};

  return prisma.$transaction(async (tx) => {
    if (lines) {
      await tx.workingScheduleLine.deleteMany({ where: { workingScheduleId: id } });
    }

    const schedule = await tx.workingSchedule.update({
      where: { id },
      data: {
        ...scheduleData,
        ...stats,
        ...(lines ? { lines: { create: lines } } : {}),
      },
      include: scheduleInclude,
    });
    return mapSchedule(schedule);
  });
}

export async function remove(id) {
  await getById(id);
  const activeCount = await prisma.employee.count({
    where: { workingScheduleId: id, deletedAt: null, status: { in: ['ACTIVE', 'ON_NOTICE', 'ONBOARDING'] } },
  });
  if (activeCount > 0) {
    throw ApiError.conflict(`Cannot delete working schedule: ${activeCount} active employee(s) are assigned.`);
  }
  const schedule = await prisma.workingSchedule.update({
    where: { id },
    data: { isActive: false },
    include: scheduleInclude,
  });
  return mapSchedule(schedule);
}
