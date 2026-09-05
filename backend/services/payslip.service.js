import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { renderPayslipPdf } from '../utils/payslipPdf.js';
import { assertEmployeeScope } from '../utils/scope.js';
import { ROLES } from '../utils/roles.js';

const payslipInclude = {
  lines: { orderBy: { sequence: 'asc' } },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      workEmail: true,
      phone: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankName: true,
      department: { select: { id: true, code: true, name: true } },
      jobPosition: { select: { id: true, code: true, title: true } },
    },
  },
  contract: {
    select: {
      id: true, reference: true, wage: true, wageType: true, currency: true,
      startDate: true, endDate: true, status: true,
    },
  },
  salaryStructure: { select: { id: true, code: true, name: true } },
  payrun: {
    select: {
      id: true, reference: true, name: true, status: true,
      periodStart: true, periodEnd: true, periodLabel: true,
      paymentDate: true, paidAt: true,
    },
  },
};

export async function getById(id, requester) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: payslipInclude,
  });

  if (!payslip) throw ApiError.notFound('Payslip not found.');

  if (requester?.role === ROLES.EMPLOYEE) {
    assertEmployeeScope(requester, payslip.employeeId);
  }

  return payslip;
}

export async function generatePdf(id, requester) {
  const payslip = await getById(id, requester);
  const buffer = await renderPayslipPdf(payslip);
  return { payslip, buffer };
}
