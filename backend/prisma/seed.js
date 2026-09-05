'use strict';

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';

const SEED_USERS = [
  { email: 'admin@peoplepay360.com', role: 'ADMIN' },
  { email: 'payroll.manager@peoplepay360.com', role: 'HR_PAYROLL_MANAGER' },
  { email: 'payroll.user@peoplepay360.com', role: 'HR_PAYROLL_USER' },
  { email: 'hr.manager@peoplepay360.com', role: 'HR_MANAGER' },
  { email: 'employee@peoplepay360.com', role: 'EMPLOYEE' },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const entry of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: entry.email },
      update: {
        role: entry.role,
        isActive: true,
        passwordHash,
      },
      create: {
        email: entry.email,
        role: entry.role,
        isActive: true,
        passwordHash,
      },
    });
  }

  console.log('Seed complete. Test users (password for all):', DEFAULT_PASSWORD);
  SEED_USERS.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
