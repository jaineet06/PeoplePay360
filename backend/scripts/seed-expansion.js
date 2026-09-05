import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD = 'Password123!';

async function main() {
  console.log('--- Starting Seed Expansion ---');
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // 1. Departments
  const depts = [
    { code: 'FIN', name: 'Finance', description: 'Finance, accounting & payroll operations' },
    { code: 'ENG', name: 'Engineering', description: 'Software engineering & platform architecture' },
    { code: 'HR', name: 'Human Resources', description: 'People operations & talent acquisition' },
    { code: 'SALES', name: 'Sales & Marketing', description: 'Global enterprise sales and growth' },
    { code: 'PROD', name: 'Product Management', description: 'Product design, strategy & roadmap' },
    { code: 'OPS', name: 'Operations', description: 'IT, DevOps and internal infrastructure' },
  ];

  const deptMap = {};
  for (const d of depts) {
    const record = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description, isActive: true },
      create: d,
    });
    deptMap[d.code] = record;
  }
  console.log(`Upserted ${depts.length} departments.`);

  // 2. Job Positions
  const positions = [
    { code: 'PAY_ANALYST', title: 'Payroll Analyst' },
    { code: 'SR_BE_ENG', title: 'Senior Backend Engineer' },
    { code: 'FE_LEAD', title: 'Frontend Lead Engineer' },
    { code: 'HR_SPEC', title: 'HR Specialist' },
    { code: 'SALES_EXEC', title: 'Enterprise Account Executive' },
    { code: 'PM', title: 'Senior Product Manager' },
    { code: 'DEVOPS_ENG', title: 'DevOps & Reliability Engineer' },
    { code: 'FIN_ANALYST', title: 'Financial Analyst' },
  ];

  const posMap = {};
  for (const p of positions) {
    const record = await prisma.jobPosition.upsert({
      where: { code: p.code },
      update: { title: p.title, isActive: true },
      create: p,
    });
    posMap[p.code] = record;
  }
  console.log(`Upserted ${positions.length} job positions.`);

  // 3. Working Schedules
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
          startMinute: 540,  // 9:00 AM
          endMinute: 1080,   // 6:00 PM
          breakMinutes: 60,
        })),
      },
    },
    include: { lines: true },
  });

  // 4. Salary Structures & Rules
  const regularStructure = await prisma.salaryStructure.upsert({
    where: { code: 'REGULAR' },
    update: {},
    create: {
      code: 'REGULAR',
      name: 'Regular Salary Structure',
      netRuleCode: 'NET',
      rules: {
        create: [
          { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 10, computationMethod: 'FIXED', useContractWage: true, isActive: true },
          { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('40'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'GROSS', name: 'Gross Earnings', category: 'GROSS', sequence: 30, computationMethod: 'FORMULA', formula: 'BASIC + HRA', isActive: true },
          { code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 40, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('12'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'NET', name: 'Net Salary Payable', category: 'NET', sequence: 50, computationMethod: 'FORMULA', formula: 'GROSS - PF', isActive: true },
        ],
      },
    },
    include: { rules: true },
  });

  const execStructure = await prisma.salaryStructure.upsert({
    where: { code: 'EXEC' },
    update: {},
    create: {
      code: 'EXEC',
      name: 'Executive Leadership Structure',
      netRuleCode: 'NET',
      rules: {
        create: [
          { code: 'BASIC', name: 'Base Salary', category: 'BASIC', sequence: 10, computationMethod: 'FIXED', useContractWage: true, isActive: true },
          { code: 'HRA', name: 'Executive HRA', category: 'ALLOWANCE', sequence: 20, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('50'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'SPECIAL', name: 'Special Allowance', category: 'ALLOWANCE', sequence: 30, computationMethod: 'FIXED', amount: new Prisma.Decimal('20000'), isActive: true },
          { code: 'GROSS', name: 'Gross Salary', category: 'GROSS', sequence: 40, computationMethod: 'FORMULA', formula: 'BASIC + HRA + SPECIAL', isActive: true },
          { code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 50, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('12'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'NET', name: 'Net Compensation', category: 'NET', sequence: 60, computationMethod: 'FORMULA', formula: 'GROSS - PF', isActive: true },
        ],
      },
    },
    include: { rules: true },
  });

  // 5. Time Off Types
  const leaveTypesData = [
    { code: 'PL', name: 'Paid Annual Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, isPaid: true },
    { code: 'SL', name: 'Sick Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: false, isPaid: true },
    { code: 'CL', name: 'Casual Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, isPaid: true },
    { code: 'UL', name: 'Unpaid Leave', unit: 'DAYS', requiresAllocation: false, approvalRequired: true, affectsPayroll: true, isPaid: false },
  ];

  const leaveTypeMap = {};
  for (const lt of leaveTypesData) {
    const record = await prisma.timeOffType.upsert({
      where: { code: lt.code },
      update: { name: lt.name, requiresAllocation: lt.requiresAllocation, approvalRequired: lt.approvalRequired, isPaid: lt.isPaid, isActive: true },
      create: lt,
    });
    leaveTypeMap[lt.code] = record;
  }

  // 6. Users
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@peoplepay360.com' } });
  const hrUser = await prisma.user.findUnique({ where: { email: 'hr.manager@peoplepay360.com' } });
  const payrollManager = await prisma.user.findUnique({ where: { email: 'payroll.manager@peoplepay360.com' } });

  // 7. Employees
  const employeeDefs = [
    {
      code: 'EMP-00001',
      firstName: 'Jane',
      lastName: 'Doe',
      fullName: 'Jane Doe',
      email: 'employee@peoplepay360.com',
      workEmail: 'jane.doe@peoplepay360.com',
      status: 'ACTIVE',
      deptCode: 'FIN',
      posCode: 'PAY_ANALYST',
      wage: '65000',
      structureId: regularStructure.id,
      bankAcc: '123456789012',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
    },
    {
      code: 'EMP-00002',
      firstName: 'Alex',
      lastName: 'Morgan',
      fullName: 'Alex Morgan',
      workEmail: 'alex.morgan@peoplepay360.com',
      status: 'ACTIVE',
      deptCode: 'ENG',
      posCode: 'SR_BE_ENG',
      wage: '120000',
      structureId: execStructure.id,
      bankAcc: '987654321098',
      ifsc: 'ICIC0005678',
      bankName: 'ICICI Bank',
    },
    {
      code: 'EMP-00003',
      firstName: 'Sarah',
      lastName: 'Chen',
      fullName: 'Sarah Chen',
      workEmail: 'sarah.chen@peoplepay360.com',
      status: 'ACTIVE',
      deptCode: 'ENG',
      posCode: 'FE_LEAD',
      wage: '110000',
      structureId: execStructure.id,
      bankAcc: '456789012345',
      ifsc: 'SBIN0009876',
      bankName: 'State Bank of India',
    },
    {
      code: 'EMP-00004',
      firstName: 'Michael',
      lastName: 'Scott',
      fullName: 'Michael Scott',
      workEmail: 'michael.scott@peoplepay360.com',
      status: 'ACTIVE',
      deptCode: 'SALES',
      posCode: 'SALES_EXEC',
      wage: '85000',
      structureId: regularStructure.id,
      bankAcc: '654321098765',
      ifsc: 'AXIS0004321',
      bankName: 'Axis Bank',
    },
    {
      code: 'EMP-00005',
      firstName: 'Emily',
      lastName: 'Blunt',
      fullName: 'Emily Blunt',
      workEmail: 'emily.blunt@peoplepay360.com',
      status: 'ACTIVE',
      deptCode: 'HR',
      posCode: 'HR_SPEC',
      wage: '70000',
      structureId: regularStructure.id,
      bankAcc: '321098765432',
      ifsc: 'KKBK0008765',
      bankName: 'Kotak Mahindra Bank',
    },
    {
      code: 'EMP-00006',
      firstName: 'David',
      lastName: 'Miller',
      fullName: 'David Miller',
      workEmail: 'david.miller@peoplepay360.com',
      status: 'ONBOARDING',
      deptCode: 'OPS',
      posCode: 'DEVOPS_ENG',
      wage: '95000',
      structureId: regularStructure.id,
      bankAcc: '789012345678',
      ifsc: 'HDFC0002345',
      bankName: 'HDFC Bank',
    },
    {
      code: 'EMP-00007',
      firstName: 'Priya',
      lastName: 'Sharma',
      fullName: 'Priya Sharma',
      workEmail: 'priya.sharma@peoplepay360.com',
      status: 'ACTIVE',
      deptCode: 'PROD',
      posCode: 'PM',
      wage: '130000',
      structureId: execStructure.id,
      bankAcc: '234567890123',
      ifsc: 'ICIC0007890',
      bankName: 'ICICI Bank',
    },
    {
      code: 'EMP-00008',
      firstName: 'Robert',
      lastName: 'Taylor',
      fullName: 'Robert Taylor',
      workEmail: 'robert.taylor@peoplepay360.com',
      status: 'ON_NOTICE',
      deptCode: 'FIN',
      posCode: 'FIN_ANALYST',
      wage: '55000',
      structureId: regularStructure.id,
      bankAcc: '', // Missing bank details intentionally for payrun warning test
      ifsc: '',
      bankName: '',
    },
  ];

  const empMap = {};

  for (const ed of employeeDefs) {
    let emp = await prisma.employee.findFirst({ where: { employeeCode: ed.code } });
    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          employeeCode: ed.code,
          firstName: ed.firstName,
          lastName: ed.lastName,
          fullName: ed.fullName,
          workEmail: ed.workEmail,
          status: ed.status,
          departmentId: deptMap[ed.deptCode].id,
          jobPositionId: posMap[ed.posCode].id,
          workingScheduleId: schedule.id,
          dateOfJoining: new Date('2024-03-01'),
          bankAccountName: ed.fullName,
          bankAccountNumber: ed.bankAcc,
          bankIfscCode: ed.ifsc,
          bankName: ed.bankName,
        },
      });
    } else {
      emp = await prisma.employee.update({
        where: { id: emp.id },
        data: {
          status: ed.status,
          departmentId: deptMap[ed.deptCode].id,
          jobPositionId: posMap[ed.posCode].id,
          bankAccountName: ed.fullName,
          bankAccountNumber: ed.bankAcc,
          bankIfscCode: ed.ifsc,
          bankName: ed.bankName,
        },
      });
    }
    empMap[ed.code] = emp;

    // Link user if Jane Doe
    if (ed.code === 'EMP-00001') {
      await prisma.user.update({
        where: { email: 'employee@peoplepay360.com' },
        data: { employeeId: emp.id },
      });
    }

    // 8. Contracts
    const existingContract = await prisma.contract.findFirst({
      where: { employeeId: emp.id, status: 'ACTIVE', deletedAt: null },
    });

    if (!existingContract) {
      await prisma.contract.create({
        data: {
          reference: `CTR-2026-${ed.code.slice(-4)}`,
          employeeId: emp.id,
          status: 'ACTIVE',
          startDate: new Date('2026-01-01'),
          wage: new Prisma.Decimal(ed.wage),
          wageType: 'MONTHLY',
          currency: 'INR',
          salaryStructureId: ed.structureId,
          jobPositionId: posMap[ed.posCode].id,
          departmentNameSnapshot: deptMap[ed.deptCode].name,
          jobTitleSnapshot: posMap[ed.posCode].title,
        },
      });
    }

    // 9. Time Off Allocations
    const existingAlloc = await prisma.timeOffAllocation.findFirst({
      where: { employeeId: emp.id, timeOffTypeId: leaveTypeMap.PL.id },
    });

    if (!existingAlloc) {
      await prisma.timeOffAllocation.create({
        data: {
          employeeId: emp.id,
          timeOffTypeId: leaveTypeMap.PL.id,
          allocatedUnits: new Prisma.Decimal('20.000'),
          takenUnits: new Prisma.Decimal('2.000'),
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
          notes: 'Annual leave quota FY2026',
        },
      });

      await prisma.timeOffAllocation.create({
        data: {
          employeeId: emp.id,
          timeOffTypeId: leaveTypeMap.SL.id,
          allocatedUnits: new Prisma.Decimal('12.000'),
          takenUnits: new Prisma.Decimal('1.000'),
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
          notes: 'Sick leave quota FY2026',
        },
      });
    }
  }

  // Add expired past contract for Jane Doe to show contract history
  const jane = empMap['EMP-00001'];
  const janePastContract = await prisma.contract.findFirst({
    where: { employeeId: jane.id, status: 'EXPIRED' },
  });
  if (!janePastContract) {
    await prisma.contract.create({
      data: {
        reference: 'CTR-2025-0001',
        employeeId: jane.id,
        status: 'EXPIRED',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        wage: new Prisma.Decimal('50000'),
        wageType: 'MONTHLY',
        currency: 'INR',
        salaryStructureId: regularStructure.id,
        departmentNameSnapshot: 'Finance',
        jobTitleSnapshot: 'Junior Payroll Analyst',
      },
    });
  }

  // 10. Seed Time Off Requests
  const pastReq = await prisma.timeOffRequest.findFirst({ where: { employeeId: jane.id, status: 'APPROVED' } });
  if (!pastReq) {
    await prisma.timeOffRequest.create({
      data: {
        reference: 'TOR-2026-0001',
        employeeId: jane.id,
        timeOffTypeId: leaveTypeMap.PL.id,
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-11'),
        duration: new Prisma.Decimal('2.000'),
        unit: 'DAYS',
        status: 'APPROVED',
        reason: 'Family wedding event',
        approvedById: hrUser?.id || adminUser?.id,
        approvedAt: new Date('2026-02-05'),
      },
    });
  }

  const pendingReq = await prisma.timeOffRequest.findFirst({ where: { employeeId: jane.id, status: 'PENDING' } });
  if (!pendingReq) {
    await prisma.timeOffRequest.create({
      data: {
        reference: 'TOR-2026-0002',
        employeeId: jane.id,
        timeOffTypeId: leaveTypeMap.PL.id,
        startDate: new Date('2026-04-15'),
        endDate: new Date('2026-04-17'),
        duration: new Prisma.Decimal('3.000'),
        unit: 'DAYS',
        status: 'PENDING',
        reason: 'Annual family vacation trip',
      },
    });
  }

  const alex = empMap['EMP-00002'];
  const alexPending = await prisma.timeOffRequest.findFirst({ where: { employeeId: alex.id, status: 'PENDING' } });
  if (!alexPending) {
    await prisma.timeOffRequest.create({
      data: {
        reference: 'TOR-2026-0003',
        employeeId: alex.id,
        timeOffTypeId: leaveTypeMap.SL.id,
        startDate: new Date('2026-03-25'),
        endDate: new Date('2026-03-25'),
        duration: new Prisma.Decimal('1.000'),
        unit: 'DAYS',
        status: 'PENDING',
        reason: 'Medical health checkup',
      },
    });
  }

  // 11. Seed Attendance Records for Jane and team over past 12 days
  const today = new Date();
  const attendancesToCreate = [];

  for (let d = 1; d <= 12; d++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - d);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateOnly = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

    const checkInJane = new Date(dateOnly);
    checkInJane.setUTCHours(9, (d % 3 === 0 ? 25 : 5), 0, 0);
    const checkOutJane = new Date(dateOnly);
    checkOutJane.setUTCHours(18, (d % 4 === 0 ? 45 : 10), 0, 0);

    const statusJane = d % 3 === 0 ? 'LATE' : (d % 4 === 0 ? 'OVERTIME' : 'PRESENT');
    const workedHoursJane = new Prisma.Decimal(statusJane === 'OVERTIME' ? '9.50' : '8.00');

    attendancesToCreate.push({
      employeeId: jane.id,
      date: dateOnly,
      checkIn: checkInJane,
      checkOut: checkOutJane,
      workedHours: workedHoursJane,
      status: statusJane,
      source: 'WEB',
      isManualCorrection: d === 5,
      correctionReason: d === 5 ? 'Biometric reader timeout at entrance' : null,
      correctedById: d === 5 ? hrUser?.id : null,
    });

    const checkInAlex = new Date(dateOnly);
    checkInAlex.setUTCHours(8, 55, 0, 0);
    const checkOutAlex = new Date(dateOnly);
    checkOutAlex.setUTCHours(18, 0, 0, 0);

    attendancesToCreate.push({
      employeeId: alex.id,
      date: dateOnly,
      checkIn: checkInAlex,
      checkOut: checkOutAlex,
      workedHours: new Prisma.Decimal('8.50'),
      status: 'PRESENT',
      source: 'WEB',
    });
  }

  for (const att of attendancesToCreate) {
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: att.employeeId, date: att.date } },
    });
    if (!existing) {
      await prisma.attendance.create({ data: att });
    }
  }
  console.log('Seeded attendance records.');

  // 12. Seed Payruns & Payslips
  const payrunFeb = await prisma.payrun.upsert({
    where: { reference: 'PAY-2026-0001' },
    update: {},
    create: {
      reference: 'PAY-2026-0001',
      name: 'February 2026 Regular Payrun',
      salaryStructureId: regularStructure.id,
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-02-28'),
      periodLabel: '2026-02',
      status: 'PAID',
      currency: 'INR',
      employeeCount: 4,
      totalGross: new Prisma.Decimal('385000.00'),
      totalNet: new Prisma.Decimal('352000.00'),
      totalDeductions: new Prisma.Decimal('33000.00'),
      computedAt: new Date('2026-02-27'),
      validatedAt: new Date('2026-02-28'),
      paidAt: new Date('2026-02-28'),
      paymentDate: new Date('2026-02-28'),
      createdById: payrollManager?.id || adminUser?.id,
    },
  });

  const janeContract = await prisma.contract.findFirst({ where: { employeeId: jane.id, status: 'ACTIVE' } });
  let janePayslip = await prisma.payslip.findFirst({ where: { payrunId: payrunFeb.id, employeeId: jane.id } });
  if (!janePayslip && janeContract) {
    janePayslip = await prisma.payslip.create({
      data: {
        reference: 'PS-2026-0001',
        payrunId: payrunFeb.id,
        employeeId: jane.id,
        contractId: janeContract.id,
        salaryStructureId: regularStructure.id,
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-02-28'),
        periodLabel: '2026-02',
        status: 'PAID',
        currency: 'INR',
        workedDays: new Prisma.Decimal('28'),
        grossAmount: new Prisma.Decimal('91000.00'),
        netAmount: new Prisma.Decimal('83200.00'),
        lines: {
          create: [
            { code: 'BASIC', label: 'Basic Salary', category: 'BASIC', sequence: 10, amount: new Prisma.Decimal('65000.00') },
            { code: 'HRA', label: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, amount: new Prisma.Decimal('26000.00') },
            { code: 'GROSS', label: 'Gross Earnings', category: 'GROSS', sequence: 30, amount: new Prisma.Decimal('91000.00') },
            { code: 'PF', label: 'Provident Fund', category: 'DEDUCTION', sequence: 40, amount: new Prisma.Decimal('7800.00') },
            { code: 'NET', label: 'Net Salary Payable', category: 'NET', sequence: 50, amount: new Prisma.Decimal('83200.00') },
          ],
        },
      },
    });
  }

  const payrunMarch = await prisma.payrun.upsert({
    where: { reference: 'PAY-2026-0002' },
    update: {},
    create: {
      reference: 'PAY-2026-0002',
      name: 'March 2026 Standard Payrun',
      salaryStructureId: regularStructure.id,
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      periodLabel: '2026-03',
      status: 'VALIDATED',
      currency: 'INR',
      employeeCount: 4,
      totalGross: new Prisma.Decimal('385000.00'),
      totalNet: new Prisma.Decimal('352000.00'),
      totalDeductions: new Prisma.Decimal('33000.00'),
      computedAt: new Date('2026-03-30'),
      validatedAt: new Date('2026-03-31'),
      createdById: payrollManager?.id || adminUser?.id,
    },
  });

  let janeMarchPayslip = await prisma.payslip.findFirst({ where: { payrunId: payrunMarch.id, employeeId: jane.id } });
  if (!janeMarchPayslip && janeContract) {
    janeMarchPayslip = await prisma.payslip.create({
      data: {
        reference: 'PS-2026-0002',
        payrunId: payrunMarch.id,
        employeeId: jane.id,
        contractId: janeContract.id,
        salaryStructureId: regularStructure.id,
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-31'),
        periodLabel: '2026-03',
        status: 'VALIDATED',
        currency: 'INR',
        workedDays: new Prisma.Decimal('31'),
        grossAmount: new Prisma.Decimal('91000.00'),
        netAmount: new Prisma.Decimal('83200.00'),
        lines: {
          create: [
            { code: 'BASIC', label: 'Basic Salary', category: 'BASIC', sequence: 10, amount: new Prisma.Decimal('65000.00') },
            { code: 'HRA', label: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, amount: new Prisma.Decimal('26000.00') },
            { code: 'GROSS', label: 'Gross Earnings', category: 'GROSS', sequence: 30, amount: new Prisma.Decimal('91000.00') },
            { code: 'PF', label: 'Provident Fund', category: 'DEDUCTION', sequence: 40, amount: new Prisma.Decimal('7800.00') },
            { code: 'NET', label: 'Net Salary Payable', category: 'NET', sequence: 50, amount: new Prisma.Decimal('83200.00') },
          ],
        },
      },
    });
  }

  const payrunApril = await prisma.payrun.upsert({
    where: { reference: 'PAY-2026-0003' },
    update: {},
    create: {
      reference: 'PAY-2026-0003',
      name: 'April 2026 Draft Payrun',
      salaryStructureId: regularStructure.id,
      periodStart: new Date('2026-04-01'),
      periodEnd: new Date('2026-04-30'),
      periodLabel: '2026-04',
      status: 'DRAFT',
      currency: 'INR',
      employeeCount: 4,
      totalGross: new Prisma.Decimal('0.00'),
      totalNet: new Prisma.Decimal('0.00'),
      totalDeductions: new Prisma.Decimal('0.00'),
      createdById: payrollManager?.id || adminUser?.id,
    },
  });

  console.log('--- Seed Expansion Successfully Completed! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
