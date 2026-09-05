import { create, all } from 'mathjs';
import { Prisma } from '@prisma/client';

// Restricted mathjs instance — no import/createUnit; evaluate only with explicit scope
const math = create(all, {});

function toNum(v) {
  if (v instanceof Prisma.Decimal) return v.toNumber();
  return Number(v) || 0;
}

function evaluateExpression(expr, scope) {
  if (!expr?.trim()) return 0;
  try {
    const normalized = expr.toUpperCase().replace(/\s+/g, ' ').trim();
    const result = math.evaluate(normalized, scope);
    if (typeof result !== 'number' || !Number.isFinite(result)) return 0;
    return result;
  } catch (err) {
    throw new Error(`Formula evaluation failed: ${expr} (${err.message})`);
  }
}

/**
 * Run salary rules in sequence order. Returns lines + gross/net totals.
 */
export function computeSalaryRules(rules, context) {
  const sorted = [...rules].filter((r) => r.isActive).sort((a, b) => a.sequence - b.sequence);
  const results = {};
  const scope = {
    PERIOD_DAYS: toNum(context.periodDays ?? 30),
    WORKED_DAYS: toNum(context.workedDays ?? context.periodDays ?? 30),
    CONTRACT_WAGE: toNum(context.contractWage ?? 0),
    UNPAID_LEAVE_DAYS: toNum(context.unpaidLeaveDays ?? 0),
  };

  const lines = [];

  for (const rule of sorted) {
    let amount = 0;

    if (rule.computationMethod === 'FIXED') {
      amount = rule.useContractWage ? scope.CONTRACT_WAGE : toNum(rule.amount);
    } else if (rule.computationMethod === 'PERCENTAGE') {
      const base = results[rule.percentageOfCode] ?? 0;
      amount = base * (toNum(rule.percentage) / 100);
    } else if (rule.computationMethod === 'FORMULA') {
      const formulaScope = { ...scope, ...results };
      amount = evaluateExpression(rule.formula, formulaScope);
    }

    if (rule.category === 'DEDUCTION') {
      amount = Math.abs(amount);
    }

    results[rule.code] = amount;
    scope[rule.code] = amount;

    lines.push({
      code: rule.code,
      name: rule.name,
      label: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      salaryRuleId: rule.id,
    });
  }

  const netRule = sorted.find((r) => r.category === 'NET');
  const netCode = netRule?.code ?? sorted[sorted.length - 1]?.code;
  const netAmount = results[netCode] ?? 0;

  const grossLine = lines.find((l) => l.code === 'GROSS');
  const grossAmount = grossLine
    ? toNum(grossLine.amount)
    : lines.filter((l) => ['BASIC', 'ALLOWANCE'].includes(l.category)).reduce((s, l) => s + toNum(l.amount), 0);

  return {
    lines,
    grossAmount: new Prisma.Decimal(grossAmount.toFixed(2)),
    netAmount: new Prisma.Decimal(netAmount.toFixed(2)),
    results,
  };
}

export { evaluateExpression };
