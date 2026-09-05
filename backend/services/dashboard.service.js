import { prisma } from '../configs/db.js';
import { cached } from '../utils/cache.js';
import { serializeModel } from '../utils/serialize.js';

const CACHE_TTL_MS = 60_000;
const PAID_STATUSES = ['VALIDATED', 'PAID', 'COMPUTED'];

function payslipWhere(query = {}) {
  const where = { status: { in: PAID_STATUSES } };
  if (query.period) where.periodLabel = query.period;
  if (query.departmentId) {
    where.employee = { departmentId: query.departmentId, deletedAt: null };
  }
  return where;
}

function attendanceWhere(query = {}) {
  const where = {};
  if (query.period) {
    const [year, month] = query.period.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    where.date = { gte: start, lte: end };
  }
  if (query.departmentId) {
    where.employee = { departmentId: query.departmentId, deletedAt: null };
  }
  return where;
}

function timeOffWhere(query = {}) {
  const where = { status: 'APPROVED' };
  if (query.period) {
    const [year, month] = query.period.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    where.startDate = { lte: end };
    where.endDate = { gte: start };
  }
  if (query.departmentId) {
    where.employee = { departmentId: query.departmentId, deletedAt: null };
  }
  return where;
}

function computeAttendanceHealth(groups) {
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count]));
  const total = groups.reduce((sum, g) => sum + g._count, 0);
  if (total === 0) return { score: 100, total: 0, breakdown: counts };

  const healthy = (counts.PRESENT ?? 0)
    + (counts.OVERTIME ?? 0)
    + (counts.HOLIDAY ?? 0)
    + (counts.WEEKLY_OFF ?? 0)
    + (counts.ON_LEAVE ?? 0);
  const score = Math.round((healthy / total) * 100);
  return { score, total, breakdown: counts };
}

export async function getSummary(query) {
  const cacheKey = `dashboard:summary:${JSON.stringify(query)}`;
  return cached(cacheKey, CACHE_TTL_MS, async () => {
    const payslipFilter = payslipWhere(query);
    const attendanceFilter = attendanceWhere(query);
    const timeOffFilter = timeOffWhere(query);

    const [payslipAgg, timeOffCount, attendanceGroups] = await Promise.all([
      prisma.payslip.aggregate({
        where: payslipFilter,
        _sum: { netAmount: true },
        _avg: { netAmount: true },
        _count: { _all: true },
      }),
      prisma.timeOffRequest.count({ where: timeOffFilter }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: attendanceFilter,
        _count: { _all: true },
      }),
    ]);

    const attendanceHealth = computeAttendanceHealth(attendanceGroups);

    return serializeModel({
      totalNetSalary: payslipAgg._sum.netAmount ?? 0,
      payslipCount: payslipAgg._count._all,
      averageSalary: payslipAgg._avg.netAmount ?? 0,
      approvedTimeOffCount: timeOffCount,
      attendanceHealth,
    });
  });
}

export async function getSalaryByDepartment(query) {
  const cacheKey = `dashboard:salary-by-dept:${JSON.stringify(query)}`;
  return cached(cacheKey, CACHE_TTL_MS, async () => {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    const payslipFilter = payslipWhere(query);
    const aggregates = await Promise.all(
      departments.map((dept) => prisma.payslip.aggregate({
        where: {
          ...payslipFilter,
          employee: { departmentId: dept.id, deletedAt: null },
        },
        _sum: { netAmount: true },
        _count: { _all: true },
      })),
    );

    const chart = departments.map((dept, i) => ({
      label: dept.name,
      departmentId: dept.id,
      departmentCode: dept.code,
      value: aggregates[i]._sum.netAmount ?? 0,
      payslipCount: aggregates[i]._count._all,
    }));

    return serializeModel({ chart });
  });
}

export async function getMonthlyTrend(query) {
  const cacheKey = `dashboard:monthly-trend:${JSON.stringify(query)}`;
  return cached(cacheKey, CACHE_TTL_MS, async () => {
    const where = {
      status: { in: PAID_STATUSES },
      ...(query.departmentId
        ? { employee: { departmentId: query.departmentId, deletedAt: null } }
        : {}),
    };

    const groups = await prisma.payslip.groupBy({
      by: ['periodLabel'],
      where,
      _sum: { netAmount: true },
      _count: { _all: true },
      orderBy: { periodLabel: 'desc' },
      take: query.months,
    });

    const chart = groups
      .slice()
      .reverse()
      .map((row) => ({
        label: row.periodLabel,
        value: row._sum.netAmount ?? 0,
        payslipCount: row._count._all,
      }));

    return serializeModel({ chart });
  });
}

export async function getAlerts() {
  return cached('dashboard:alerts', CACHE_TTL_MS, async () => {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setUTCDate(in30Days.getUTCDate() + 30);

    const [
      missingBankDetails,
      pendingTimeOff,
      expiringContracts,
      duplicateGroups,
    ] = await Promise.all([
      prisma.employee.count({
        where: {
          deletedAt: null,
          status: { in: ['ACTIVE', 'ON_NOTICE', 'ONBOARDING'] },
          OR: [
            { bankAccountNumber: null },
            { bankIfscCode: null },
            { bankName: null },
          ],
        },
      }),
      prisma.timeOffRequest.count({ where: { status: 'PENDING' } }),
      prisma.contract.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          endDate: { not: null, lte: in30Days, gte: today },
        },
      }),
      prisma.payslip.groupBy({
        by: ['employeeId', 'periodLabel'],
        _count: { id: true },
        having: { id: { _count: { gt: 1 } } },
      }),
    ]);

    const alerts = [
      { type: 'MISSING_BANK_DETAILS', count: missingBankDetails },
      { type: 'PENDING_TIME_OFF', count: pendingTimeOff },
      { type: 'CONTRACTS_EXPIRING_SOON', count: expiringContracts },
      { type: 'DUPLICATE_PAYSLIPS', count: duplicateGroups.length },
    ];

    return { alerts };
  });
}
