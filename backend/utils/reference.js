import { prisma } from '../configs/db.js';

export async function nextReferenceBatch(prefix, model, count = 1, field = 'reference') {
  if (count <= 0) return [];
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  const existing = await model.findMany({
    where: { [field]: { startsWith: pattern } },
    select: { [field]: true },
  });

  const existingSet = new Set(existing.map((r) => r[field]));
  let maxSeq = 0;
  for (const ref of existingSet) {
    const part = ref.split('-').pop();
    const num = parseInt(part, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  let currentSeq = maxSeq + 1;
  const refs = [];
  while (refs.length < count) {
    const candidate = `${pattern}${String(currentSeq).padStart(4, '0')}`;
    if (!existingSet.has(candidate)) {
      refs.push(candidate);
      existingSet.add(candidate);
    }
    currentSeq += 1;
  }

  return refs;
}

export async function nextReference(prefix, model, field = 'reference') {
  const [ref] = await nextReferenceBatch(prefix, model, 1, field);
  return ref;
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

export async function nextPayslipRefs(count) {
  return nextReferenceBatch('PS', prisma.payslip, count);
}

export async function nextTimeOffRequestRef() {
  return nextReference('TOR', prisma.timeOffRequest);
}

export function periodLabel(startDate) {
  const d = new Date(startDate);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
