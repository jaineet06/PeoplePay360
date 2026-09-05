import { Prisma } from '@prisma/client';

export function decimalToString(value) {
  if (value == null) return null;
  if (value instanceof Prisma.Decimal) return value.toFixed(2);
  return String(value);
}

export function serializeModel(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(serializeModel);
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof Prisma.Decimal) return obj.toFixed(2);
  if (typeof obj !== 'object') return obj;

  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    out[key] = serializeModel(val);
  }
  return out;
}
