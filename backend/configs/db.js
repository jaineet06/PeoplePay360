import { PrismaClient } from '@prisma/client';
import env from './env.js';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.isDev ? ['warn', 'error'] : ['error'],
});

if (env.isDev) globalForPrisma.prisma = prisma;

export async function disconnectDb() {
  await prisma.$disconnect();
}

export { prisma };
