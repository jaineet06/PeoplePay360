import { prisma } from '../configs/db.js';

export async function nextReference(prefix, model, field = 'reference') {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;
  const latest = await model.findFirst({
    where: { [field]: { startsWith: pattern } },
    orderBy: { [field]: 'desc' },
    select: { [field]: true },
  });
  const seq = latest ? Number(latest[field].split('-').pop()) + 1 : 1;
  return `${pattern}${String(seq).padStart(4, '0')}`;
}

export async function nextEmployeeCode() {
  return nextReference('EMP', prisma.employee, 'employeeCode');
}

export async function nextContractRef() {
  return nextReference('CTR', prisma.contract);
}

export async function nextPayrunRef() {
  return nextReference('PR', prisma.payrun);
}

export async function nextPayslipRef() {
  return nextReference('PS', prisma.payslip);
}

export async function nextTimeOffRequestRef() {
  return nextReference('TOR', prisma.timeOffRequest);
}

export function periodLabel(startDate) {
  const d = new Date(startDate);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
