import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const PASSWORD = 'Password123!';

const USERS = [
  { email: 'admin@peoplepay360.com', role: 'ADMIN' },
  { email: 'payroll.manager@peoplepay360.com', role: 'HR_PAYROLL_MANAGER' },
  { email: 'payroll.user@peoplepay360.com', role: 'HR_PAYROLL_USER' },
  { email: 'hr.manager@peoplepay360.com', role: 'HR_MANAGER' },
  { email: 'employee@peoplepay360.com', role: 'EMPLOYEE' },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isActive: true, passwordHash },
      create: { email: u.email, role: u.role, isActive: true, passwordHash },
    });
  }

  const dept = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { code: 'FIN', name: 'Finance', description: 'Finance & Payroll' },
  });

  const position = await prisma.jobPosition.upsert({
    where: { code: 'PAY_ANALYST' },
    update: {},
    create: { code: 'PAY_ANALYST', title: 'Payroll Analyst' },
  });

  const schedule = await prisma.workingSchedule.upsert({
    where: { code: 'STD40' },
    update: {},
    create: {
      code: 'STD40',
      name: 'Standard 40 Hours',
      hoursPerWeek: new Prisma.Decimal('40.00'),
      workingDaysPerWeek: 5,
      lines: {
        create: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => ({
          dayOfWeek: day,
          startMinute: 540,
          endMinute: 1080,
          breakMinutes: 60,
        })),
      },
    },
    include: { lines: true },
  });

  const structure = await prisma.salaryStructure.upsert({
    where: { code: 'REGULAR' },
    update: {},
    create: {
      code: 'REGULAR',
      name: 'Regular Salary',
      netRuleCode: 'NET',
      rules: {
        create: [
          { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 10, computationMethod: 'FIXED', useContractWage: true, isActive: true },
          { code: 'HRA', name: 'HRA', category: 'ALLOWANCE', sequence: 20, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('40'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'GROSS', name: 'Gross', category: 'GROSS', sequence: 30, computationMethod: 'FORMULA', formula: 'BASIC + HRA', isActive: true },
          { code: 'PF', name: 'PF', category: 'DEDUCTION', sequence: 40, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('12'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'NET', name: 'Net Salary', category: 'NET', sequence: 50, computationMethod: 'FORMULA', formula: 'GROSS - PF', isActive: true },
        ],
      },
    },
    include: { rules: true },
  });

  const leaveType = await prisma.timeOffType.upsert({
    where: { code: 'PL' },
    update: {},
    create: { code: 'PL', name: 'Paid Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true },
  });

  let employee = await prisma.employee.findUnique({ where: { workEmail: 'jane.doe@peoplepay360.com' } });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        employeeCode: 'EMP-00001',
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        workEmail: 'jane.doe@peoplepay360.com',
        status: 'ACTIVE',
        departmentId: dept.id,
        jobPositionId: position.id,
        workingScheduleId: schedule.id,
        dateOfJoining: new Date('2024-01-01'),
        bankAccountName: 'Jane Doe',
        bankAccountNumber: '1234567890',
        bankIfscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
      },
    });
  }

  await prisma.user.update({
    where: { email: 'employee@peoplepay360.com' },
    data: { employeeId: employee.id },
  });

  const existingContract = await prisma.contract.findFirst({
    where: { employeeId: employee.id, status: 'ACTIVE', deletedAt: null },
  });

  if (!existingContract) {
    await prisma.contract.create({
      data: {
        reference: 'CTR-2026-0001',
        employeeId: employee.id,
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        wage: new Prisma.Decimal('60000'),
        wageType: 'MONTHLY',
        salaryStructureId: structure.id,
        jobPositionId: position.id,
        departmentNameSnapshot: dept.name,
        jobTitleSnapshot: position.title,
      },
    });
  }

  const existingAlloc = await prisma.timeOffAllocation.findFirst({
    where: { employeeId: employee.id, timeOffTypeId: leaveType.id },
  });

  if (!existingAlloc) {
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: employee.id,
        timeOffTypeId: leaveType.id,
        allocatedUnits: new Prisma.Decimal('18'),
        takenUnits: new Prisma.Decimal('0'),
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        status: 'APPROVED',
      },
    });
  }

  console.log('Seed complete.');
  console.log('Login: admin@peoplepay360.com /', PASSWORD);
  console.log('Employee login: employee@peoplepay360.com /', PASSWORD);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
