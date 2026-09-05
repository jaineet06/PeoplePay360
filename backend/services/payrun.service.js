import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { getActiveContractForPeriod } from './contract.service.js';
import { computeSalaryRules } from '../utils/salaryEngine.js';
import { nextPayrunRef, nextPayslipRef, periodLabel } from '../utils/reference.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';
import { renderPayslipPdf } from '../utils/payslipPdf.js';
import nodemailer from 'nodemailer';
import env from '../configs/env.js';
import { Prisma } from '@prisma/client';
import {
  createNotification,
  notifyUsersWithRoles,
  getUserIdByEmployeeId,
} from './notification.service.js';

const WORKED_STATUSES = ['PRESENT', 'LATE', 'EARLY_LEAVE', 'HALF_DAY', 'OVERTIME'];

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
}

function periodDaysBetween(start, end) {
  const ms = toDate(end).getTime() - toDate(start).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

function hasBankDetails(employee) {
  return Boolean(
    employee.bankAccountNumber?.trim()
    && employee.bankIfscCode?.trim()
    && employee.bankName?.trim(),
  );
}

async function getWorkedDays(employeeId, periodStart, periodEnd) {
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: toDate(periodStart), lte: toDate(periodEnd) },
      status: { in: WORKED_STATUSES },
    },
    select: { status: true },
  });

  return attendances.reduce(
    (sum, row) => sum + (row.status === 'HALF_DAY' ? 0.5 : 1),
    0,
  );
}

async function getUnpaidLeaveDays(employeeId, periodStart, periodEnd) {
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      startDate: { lte: toDate(periodEnd) },
      endDate: { gte: toDate(periodStart) },
      timeOffType: { isPaid: false },
    },
    select: { duration: true },
  });

  return requests.reduce((sum, row) => sum + Number(row.duration), 0);
}

async function resolveEligibility({ salaryStructureId, periodStart, periodEnd, employeeIds }) {
  const start = toDate(periodStart);
  const end = toDate(periodEnd);

  const structure = await prisma.salaryStructure.findUnique({ where: { id: salaryStructureId } });
  if (!structure) throw ApiError.notFound('Salary structure not found.');
  if (!structure.isActive) throw ApiError.unprocessable('Salary structure is inactive.');

  const employeeWhere = {
    deletedAt: null,
    status: { not: 'EXITED' },
    ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
  };

  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      workEmail: true,
      status: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankName: true,
    },
  });

  const eligible = [];
  const skipped = [];

  for (const employee of employees) {
    const contract = await getActiveContractForPeriod(employee.id, start, end);

    if (!contract) {
      skipped.push({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        reason: 'NO_ACTIVE_CONTRACT',
        message: 'No active contract covers this pay period.',
      });
      continue;
    }

    if (contract.salaryStructureId !== salaryStructureId) {
      skipped.push({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        reason: 'STRUCTURE_MISMATCH',
        message: 'Active contract uses a different salary structure.',
      });
      continue;
    }

    eligible.push({ employee, contract });
  }

  if (employeeIds?.length) {
    const foundIds = new Set(employees.map((e) => e.id));
    for (const id of employeeIds) {
      if (!foundIds.has(id)) {
        skipped.push({
          employeeId: id,
          reason: 'EMPLOYEE_NOT_FOUND',
          message: 'Employee not found or is ineligible.',
        });
      }
    }
  }

  return { structure, eligible, skipped, periodStart: start, periodEnd: end };
}

export async function preview(data) {
  const result = await resolveEligibility(data);
  return {
    salaryStructureId: data.salaryStructureId,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
    periodLabel: periodLabel(result.periodStart),
    eligible: result.eligible.map(({ employee, contract }) => ({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      contractId: contract.id,
      contractReference: contract.reference,
      wage: contract.wage,
      hasBankDetails: hasBankDetails(employee),
    })),
    skipped: result.skipped,
  };
}

export async function list(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.salaryStructureId) where.salaryStructureId = query.salaryStructureId;
  if (query.periodLabel) where.periodLabel = query.periodLabel;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { reference: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.payrun.count({ where }),
    prisma.payrun.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: {
        salaryStructure: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        _count: { select: { payslips: true } },
      },
    }),
  ]);

  return {
    payruns: data.map(({ _count, ...p }) => ({ ...p, payslipCount: _count.payslips })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getById(id) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      salaryStructure: { select: { id: true, code: true, name: true, currency: true } },
      createdBy: { select: { id: true, email: true } },
      payslips: {
        orderBy: { createdAt: 'asc' },
        include: {
          employee: {
            select: {
              id: true, employeeCode: true, fullName: true, workEmail: true, status: true,
            },
          },
        },
      },
    },
  });
  if (!payrun) throw ApiError.notFound('Payrun not found.');
  return payrun;
}

export async function create(data, createdById) {
  const { eligible, skipped, structure, periodStart, periodEnd } = await resolveEligibility(data);

  if (eligible.length === 0) {
    throw ApiError.unprocessable('No eligible employees for this payrun.');
  }

  const label = periodLabel(periodStart);
  const reference = await nextPayrunRef();
  const payslipRefs = [];
  for (let i = 0; i < eligible.length; i += 1) {
    payslipRefs.push(await nextPayslipRef());
  }

  const payrun = await prisma.$transaction(async (tx) => {
    const run = await tx.payrun.create({
      data: {
        reference,
        name: data.name,
        salaryStructureId: data.salaryStructureId,
        periodStart,
        periodEnd,
        periodLabel: label,
        status: 'DRAFT',
        currency: structure.currency,
        createdById,
      },
    });

    for (let i = 0; i < eligible.length; i += 1) {
      const { employee, contract } = eligible[i];
      await tx.payslip.create({
        data: {
          reference: payslipRefs[i],
          payrunId: run.id,
          employeeId: employee.id,
          contractId: contract.id,
          salaryStructureId: data.salaryStructureId,
          periodStart,
          periodEnd,
          periodLabel: label,
          status: 'DRAFT',
          currency: structure.currency,
        },
      });
    }

    return tx.payrun.update({
      where: { id: run.id },
      data: { employeeCount: eligible.length },
    });
  });

  return { payrun: await getById(payrun.id), skipped };
}

export async function compute(id) {
  const payrun = await getById(id);

  if (!['DRAFT', 'COMPUTED'].includes(payrun.status)) {
    throw ApiError.conflict(`Cannot compute payrun in status ${payrun.status}.`);
  }

  const rules = await prisma.salaryRule.findMany({
    where: { salaryStructureId: payrun.salaryStructureId, isActive: true },
    orderBy: { sequence: 'asc' },
  });

  if (rules.length === 0) {
    throw ApiError.unprocessable('Salary structure has no active rules.');
  }

  const warnings = [];
  const periodDayCount = periodDaysBetween(payrun.periodStart, payrun.periodEnd);
  let computedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const payslip of payrun.payslips) {
      const employee = await tx.employee.findUnique({
        where: { id: payslip.employeeId },
        select: {
          id: true, employeeCode: true, fullName: true,
          bankAccountNumber: true, bankIfscCode: true, bankName: true,
        },
      });

      if (!hasBankDetails(employee)) {
        warnings.push({
          type: 'MISSING_BANK_DETAILS',
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          payslipId: payslip.id,
          message: 'Bank details are incomplete.',
        });
      }

      const duplicate = await tx.payslip.findFirst({
        where: {
          employeeId: payslip.employeeId,
          periodLabel: payrun.periodLabel,
          id: { not: payslip.id },
          status: { not: 'CANCELLED' },
        },
        select: { id: true, reference: true, payrunId: true },
      });

      if (duplicate) {
        warnings.push({
          type: 'DUPLICATE_PAYSLIP',
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          payslipId: payslip.id,
          existingPayslipId: duplicate.id,
          existingReference: duplicate.reference,
          message: 'Employee already has a payslip for this period.',
        });
      }

      const contract = await getActiveContractForPeriod(
        payslip.employeeId,
        payrun.periodStart,
        payrun.periodEnd,
      );

      if (!contract) {
        warnings.push({
          type: 'MISSING_CONTRACT',
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          payslipId: payslip.id,
          message: 'No active contract found for this period.',
        });
        continue;
      }

      const workedDays = await getWorkedDays(payslip.employeeId, payrun.periodStart, payrun.periodEnd);
      const unpaidLeaveDays = await getUnpaidLeaveDays(payslip.employeeId, payrun.periodStart, payrun.periodEnd);

      const result = computeSalaryRules(rules, {
        contractWage: contract.wage,
        periodDays: periodDayCount,
        workedDays: workedDays || periodDayCount,
        unpaidLeaveDays,
      });

      await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });

      if (result.lines.length > 0) {
        await tx.payslipLine.createMany({
          data: result.lines.map((line) => ({
            payslipId: payslip.id,
            salaryRuleId: line.salaryRuleId,
            label: line.label,
            code: line.code,
            category: line.category,
            sequence: line.sequence,
            amount: line.amount,
          })),
        });
      }

      await tx.payslip.update({
        where: { id: payslip.id },
        data: {
          contractId: contract.id,
          workedDays: new Prisma.Decimal(String(workedDays)),
          grossAmount: result.grossAmount,
          netAmount: result.netAmount,
          status: 'COMPUTED',
        },
      });

      computedCount += 1;
    }

    const aggregates = await tx.payslip.aggregate({
      where: { payrunId: id, status: 'COMPUTED' },
      _sum: { grossAmount: true, netAmount: true },
      _count: true,
    });

    const totalGross = aggregates._sum.grossAmount ?? new Prisma.Decimal(0);
    const totalNet = aggregates._sum.netAmount ?? new Prisma.Decimal(0);

    await tx.payrun.update({
      where: { id },
      data: {
        status: 'COMPUTED',
        computedAt: new Date(),
        employeeCount: aggregates._count,
        totalGross,
        totalNet,
        totalDeductions: totalGross.minus(totalNet),
      },
    });
  });

  const result = {
    payrun: await getById(id),
    computedCount,
    warnings,
  };

  // Notify payroll roles that the payrun has been computed
  notifyUsersWithRoles(
    ['HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN'],
    'PAYRUN_COMPUTED',
    'Payrun Computed',
    `Payrun ${result.payrun.reference} (${result.payrun.periodLabel}) has been computed. ${computedCount} payslip(s) ready for review.`,
    '/payroll'
  );

  return result;
}

export async function validate(id) {
  const payrun = await getById(id);
  if (payrun.status !== 'COMPUTED') {
    throw ApiError.conflict('Payrun must be COMPUTED before validation.');
  }

  const uncomputed = payrun.payslips.filter((p) => p.status !== 'COMPUTED');
  if (uncomputed.length > 0) {
    throw ApiError.unprocessable(`${uncomputed.length} payslip(s) are not computed.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId: id, status: 'COMPUTED' },
      data: { status: 'VALIDATED' },
    });
    await tx.payrun.update({
      where: { id },
      data: { status: 'VALIDATED', validatedAt: new Date() },
    });
  });

  const validated = await getById(id);

  // Notify payroll managers that payrun is validated and ready to pay
  notifyUsersWithRoles(
    ['HR_PAYROLL_MANAGER', 'ADMIN'],
    'PAYRUN_VALIDATED',
    'Payrun Validated',
    `Payrun ${validated.reference} (${validated.periodLabel}) has been validated and is ready for payment.`,
    '/payroll'
  );

  return validated;
}

export async function markPaid(id, paymentDate) {
  const payrun = await getById(id);
  if (payrun.status !== 'VALIDATED') {
    throw ApiError.conflict('Payrun must be VALIDATED before marking paid.');
  }

  const paidOn = paymentDate ? toDate(paymentDate) : new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId: id, status: 'VALIDATED' },
      data: { status: 'PAID' },
    });
    await tx.payrun.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paymentDate: paidOn },
    });
  });

  const paidPayrun = await getById(id);

  // Notify payroll roles of payment
  notifyUsersWithRoles(
    ['HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'ADMIN'],
    'PAYRUN_PAID',
    'Payrun Marked as Paid',
    `Payrun ${paidPayrun.reference} (${paidPayrun.periodLabel}) has been marked as paid.`,
    '/payroll'
  );

  // Notify each employee individually that their payslip is ready
  const paidPayslips = await prisma.payslip.findMany({
    where: { payrunId: id, status: 'PAID' },
    select: { id: true, employeeId: true, reference: true, periodLabel: true },
  });
  for (const payslip of paidPayslips) {
    const empUserId = await getUserIdByEmployeeId(payslip.employeeId);
    if (empUserId) {
      createNotification(
        empUserId,
        'PAYSLIP_READY',
        'Your Payslip is Ready',
        `Your payslip for ${payslip.periodLabel} (${payslip.reference}) is now available.`,
        '/my-payslips'
      );
    }
  }

  return paidPayrun;
}

function getMailTransporter() {
  if (!env.hasSmtp) {
    throw ApiError.unprocessable('SMTP is not configured. Set SMTP_HOST and SMTP_USER.');
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export async function sendPayslipEmails(id) {
  const payrun = await getById(id);
  if (!['VALIDATED', 'PAID'].includes(payrun.status)) {
    throw ApiError.conflict('Payrun must be VALIDATED or PAID before sending payslips.');
  }

  const transporter = getMailTransporter();
  const sent = [];
  const failed = [];

  const payslips = await prisma.payslip.findMany({
    where: { payrunId: id, status: { in: ['VALIDATED', 'PAID'] } },
    include: {
      lines: { orderBy: { sequence: 'asc' } },
      employee: {
        select: {
          id: true, fullName: true, workEmail: true, employeeCode: true,
          bankAccountNumber: true, bankAccountName: true, bankIfscCode: true, bankName: true,
        },
      },
      payrun: { select: { id: true, name: true, reference: true } },
    },
  });

  for (const payslip of payslips) {
    try {
      const pdfBuffer = await renderPayslipPdf(payslip);
      await transporter.sendMail({
        from: env.MAIL_FROM,
        to: payslip.employee.workEmail,
        subject: `Payslip ${payslip.periodLabel} — ${payslip.reference}`,
        text: `Dear ${payslip.employee.fullName},\n\nPlease find attached your payslip for ${payslip.periodLabel}.\n\nRegards,\nPeoplePay360 Payroll`,
        attachments: [{
          filename: `${payslip.reference}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
      });
      sent.push({
        employeeId: payslip.employeeId,
        email: payslip.employee.workEmail,
        payslipId: payslip.id,
        reference: payslip.reference,
      });
    } catch (err) {
      failed.push({
        employeeId: payslip.employeeId,
        email: payslip.employee.workEmail,
        payslipId: payslip.id,
        reference: payslip.reference,
        error: err.message ?? 'Email delivery failed.',
      });
    }
  }

  return { payrunId: id, sent, failed };
}
