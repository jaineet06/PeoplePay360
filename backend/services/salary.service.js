import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { computeSalaryRules } from '../utils/salaryEngine.js';
import { buildPaginationMeta, buildOrderBy } from '../utils/pagination.js';

const structureInclude = {
  rules: { orderBy: { sequence: 'asc' } },
  _count: { select: { contracts: true, payruns: true } },
};

export async function listStructures(query) {
  const where = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.salaryStructure.count({ where }),
    prisma.salaryStructure.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: query.skip,
      take: query.limit,
      include: { _count: { select: { rules: true, contracts: true } } },
    }),
  ]);

  return {
    salaryStructures: data.map(({ _count, ...s }) => ({
      ...s,
      ruleCount: _count.rules,
      contractCount: _count.contracts,
    })),
    meta: buildPaginationMeta(query.page, query.limit, total),
  };
}

/** Lightweight lookup — only id/name/code for active structures. Accessible to HR_MANAGER. */
export async function listStructureOptions() {
  return prisma.salaryStructure.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
}

export async function getStructureById(id, { includeRules = true } = {}) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: includeRules ? structureInclude : { _count: { select: { rules: true } } },
  });
  if (!structure) throw ApiError.notFound('Salary structure not found.');
  return structure;
}

export async function createStructure(data) {
  return prisma.salaryStructure.create({ data });
}

export async function updateStructure(id, data) {
  await getStructureById(id, { includeRules: false });
  return prisma.salaryStructure.update({ where: { id }, data });
}

export async function removeStructure(id) {
  const structure = await getStructureById(id, { includeRules: false });
  const activeContracts = await prisma.contract.count({
    where: { salaryStructureId: id, deletedAt: null, status: 'ACTIVE' },
  });
  if (activeContracts > 0) {
    throw ApiError.conflict(`Cannot deactivate structure: ${activeContracts} active contract(s) use it.`);
  }
  if (structure.isActive === false) return structure;
  return prisma.salaryStructure.update({ where: { id }, data: { isActive: false } });
}

export async function listRules(structureId) {
  await getStructureById(structureId, { includeRules: false });
  return prisma.salaryRule.findMany({
    where: { salaryStructureId: structureId },
    orderBy: { sequence: 'asc' },
  });
}

export async function getRule(structureId, ruleId) {
  const rule = await prisma.salaryRule.findFirst({
    where: { id: ruleId, salaryStructureId: structureId },
  });
  if (!rule) throw ApiError.notFound('Salary rule not found.');
  return rule;
}

export async function createRule(structureId, data) {
  await getStructureById(structureId, { includeRules: false });

  if (data.sequence == null) {
    const max = await prisma.salaryRule.aggregate({
      where: { salaryStructureId: structureId },
      _max: { sequence: true },
    });
    data.sequence = (max._max.sequence ?? 0) + 1;
  }

  return prisma.salaryRule.create({
    data: { ...data, salaryStructureId: structureId },
  });
}

export async function updateRule(structureId, ruleId, data) {
  await getRule(structureId, ruleId);
  return prisma.salaryRule.update({ where: { id: ruleId }, data });
}

export async function removeRule(structureId, ruleId) {
  await getRule(structureId, ruleId);
  return prisma.salaryRule.update({ where: { id: ruleId }, data: { isActive: false } });
}

export async function reorderRules(structureId, items) {
  await getStructureById(structureId, { includeRules: false });

  const existing = await prisma.salaryRule.findMany({
    where: { salaryStructureId: structureId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((r) => r.id));
  const incomingIds = new Set(items.map((i) => i.id));

  if (incomingIds.size !== items.length) {
    throw ApiError.badRequest('Duplicate rule ids in reorder payload.');
  }
  for (const item of items) {
    if (!existingIds.has(item.id)) {
      throw ApiError.badRequest(`Rule ${item.id} does not belong to this structure.`);
    }
  }
  const sequences = items.map((i) => i.sequence);
  if (new Set(sequences).size !== sequences.length) {
    throw ApiError.badRequest('Sequence values must be unique.');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.salaryRule.update({
        where: { id: item.id },
        data: { sequence: -item.sequence },
      });
    }
    for (const item of items) {
      await tx.salaryRule.update({
        where: { id: item.id },
        data: { sequence: item.sequence },
      });
    }
  });

  return listRules(structureId);
}

export async function simulate(structureId, input) {
  const structure = await getStructureById(structureId);
  const rules = structure.rules.filter((r) => r.isActive);
  if (rules.length === 0) throw ApiError.unprocessable('Structure has no active rules to simulate.');

  const result = computeSalaryRules(rules, {
    contractWage: input.contractWage,
    periodDays: input.periodDays,
    workedDays: input.workedDays ?? input.periodDays,
    unpaidLeaveDays: input.unpaidLeaveDays,
  });

  return {
    structureId,
    structureCode: structure.code,
    input,
    lines: result.lines,
    grossAmount: result.grossAmount,
    netAmount: result.netAmount,
  };
}
