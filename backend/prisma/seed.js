import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { computeSalaryRules } from '../utils/salaryEngine.js';

const prisma = new PrismaClient();
const PASSWORD = 'Password123!';

async function cleanDatabase() {
  console.log('--- Cleaning previous test & seed data ---');
  await prisma.payslipLine.deleteMany({});
  await prisma.payslip.deleteMany({});
  await prisma.payrun.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.timeOffRequest.deleteMany({});
  await prisma.timeOffAllocation.deleteMany({});
  await prisma.contract.deleteMany({});

  // Break self-referencing and 1-to-1 foreign keys before deleting employees
  await prisma.user.updateMany({ data: { employeeId: null } });
  await prisma.employee.updateMany({ data: { managerId: null } });
  await prisma.employee.deleteMany({});

  await prisma.salaryRule.deleteMany({});
  await prisma.salaryStructure.deleteMany({});
  await prisma.timeOffType.deleteMany({});
  await prisma.workingScheduleLine.deleteMany({});
  await prisma.workingSchedule.deleteMany({});
  await prisma.jobPosition.deleteMany({});
  await prisma.department.deleteMany({});
  console.log('Database cleaned successfully.');
}

async function main() {
  console.log('=== Starting Master Database Seeding for PeoplePay360 ===');
  const startTime = Date.now();

  await cleanDatabase();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1. SYSTEM USERS
  console.log('\n1. Seeding User Accounts...');
  const USERS_DATA = [
    { email: 'admin@peoplepay360.com', role: 'ADMIN' },
    { email: 'hr.manager@peoplepay360.com', role: 'HR_MANAGER' },
    { email: 'payroll.manager@peoplepay360.com', role: 'HR_PAYROLL_MANAGER' },
    { email: 'payroll.user@peoplepay360.com', role: 'HR_PAYROLL_USER' },
    { email: 'employee@peoplepay360.com', role: 'EMPLOYEE' },
    { email: 'alex.morgan@peoplepay360.com', role: 'EMPLOYEE' },
    { email: 'sarah.chen@peoplepay360.com', role: 'EMPLOYEE' },
    { email: 'michael.scott@peoplepay360.com', role: 'EMPLOYEE' },
    { email: 'priya.sharma@peoplepay360.com', role: 'EMPLOYEE' },
    { email: 'david.miller@peoplepay360.com', role: 'EMPLOYEE' },
  ];

  const userMap = {};
  for (const u of USERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isActive: true, passwordHash },
      create: { email: u.email, role: u.role, isActive: true, passwordHash },
    });
    userMap[u.email] = user;
  }
  const adminUser = userMap['admin@peoplepay360.com'];
  const hrManagerUser = userMap['hr.manager@peoplepay360.com'];
  const payrollManagerUser = userMap['payroll.manager@peoplepay360.com'];
  console.log(`Created ${Object.keys(userMap).length} users.`);

  // 2. DEPARTMENTS
  console.log('\n2. Seeding Departments...');
  const DEPARTMENTS = [
    { code: 'ENG', name: 'Engineering', description: 'Software engineering, platform architecture & QA' },
    { code: 'PROD', name: 'Product Management', description: 'Product strategy, UX/UI design & roadmaps' },
    { code: 'HR', name: 'Human Resources', description: 'Talent acquisition, culture & people operations' },
    { code: 'FIN', name: 'Finance & Payroll', description: 'Corporate accounting, financial planning & payroll' },
    { code: 'SALES', name: 'Sales & BD', description: 'Global enterprise sales & customer growth' },
    { code: 'MKTG', name: 'Marketing & Brand', description: 'Brand strategy, content & growth marketing' },
    { code: 'OPS', name: 'Operations & IT', description: 'Cloud infrastructure, DevOps & internal IT' },
    { code: 'CS', name: 'Customer Success', description: 'Enterprise client support & customer satisfaction' },
  ];

  const deptMap = {};
  for (const d of DEPARTMENTS) {
    deptMap[d.code] = await prisma.department.create({ data: d });
  }
  console.log(`Created ${DEPARTMENTS.length} departments.`);

  // 3. JOB POSITIONS
  console.log('\n3. Seeding Job Positions...');
  const POSITIONS = [
    { code: 'VP_ENG', title: 'VP of Engineering' },
    { code: 'SR_BE_ENG', title: 'Senior Backend Engineer' },
    { code: 'FE_LEAD', title: 'Frontend Lead Engineer' },
    { code: 'FS_ENG', title: 'Fullstack Engineer' },
    { code: 'QA_ENG', title: 'QA Automation Specialist' },
    { code: 'SR_PM', title: 'Senior Product Manager' },
    { code: 'UIUX_LEAD', title: 'UI/UX Design Lead' },
    { code: 'CPO', title: 'Chief People Officer' },
    { code: 'HR_SPEC', title: 'HR Operations Specialist' },
    { code: 'TALENT_LEAD', title: 'Talent Acquisition Lead' },
    { code: 'CFO', title: 'Chief Financial Officer' },
    { code: 'FIN_CTRL', title: 'Financial Controller' },
    { code: 'PAY_ANALYST', title: 'Payroll Analyst' },
    { code: 'VP_SALES', title: 'VP of Global Sales' },
    { code: 'SALES_EXEC', title: 'Enterprise Account Executive' },
    { code: 'DEVOPS_ENG', title: 'DevOps & Reliability Engineer' },
    { code: 'CS_LEAD', title: 'Customer Success Lead' },
  ];

  const posMap = {};
  for (const p of POSITIONS) {
    posMap[p.code] = await prisma.jobPosition.create({ data: p });
  }
  console.log(`Created ${POSITIONS.length} job positions.`);

  // 4. WORKING SCHEDULES
  console.log('\n4. Seeding Working Schedules...');
  const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const scheduleStd = await prisma.workingSchedule.create({
    data: {
      code: 'STD40',
      name: 'Standard 40 Hours',
      timezone: 'Asia/Kolkata',
      hoursPerWeek: new Prisma.Decimal('40.00'),
      workingDaysPerWeek: 5,
      lines: {
        create: weekdays.map((day) => ({
          dayOfWeek: day,
          startMinute: 540,  // 09:00 AM
          endMinute: 1080,   // 06:00 PM
          breakMinutes: 60,
        })),
      },
    },
  });

  const scheduleFlex = await prisma.workingSchedule.create({
    data: {
      code: 'FLEX40',
      name: 'Flexible Tech 40 Hours',
      timezone: 'Asia/Kolkata',
      hoursPerWeek: new Prisma.Decimal('40.00'),
      workingDaysPerWeek: 5,
      lines: {
        create: weekdays.map((day) => ({
          dayOfWeek: day,
          startMinute: 600,  // 10:00 AM
          endMinute: 1140,   // 07:00 PM
          breakMinutes: 60,
        })),
      },
    },
  });

  const scheduleOps = await prisma.workingSchedule.create({
    data: {
      code: 'OPS45',
      name: 'Operations 45 Hours',
      timezone: 'Asia/Kolkata',
      hoursPerWeek: new Prisma.Decimal('45.00'),
      workingDaysPerWeek: 5,
      lines: {
        create: weekdays.map((day) => ({
          dayOfWeek: day,
          startMinute: 510,  // 08:30 AM
          endMinute: 1080,   // 06:00 PM
          breakMinutes: 30,
        })),
      },
    },
  });
  console.log('Created 3 working schedules.');

  // 5. SALARY STRUCTURES & RULES
  console.log('\n5. Seeding Salary Structures & Computation Rules...');
  const regularStructure = await prisma.salaryStructure.create({
    data: {
      code: 'REGULAR',
      name: 'Standard Corporate Structure',
      currency: 'INR',
      netRuleCode: 'NET',
      rules: {
        create: [
          { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 10, computationMethod: 'FIXED', useContractWage: true, isActive: true },
          { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('40.00'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'SPECIAL', name: 'Special Allowance', category: 'ALLOWANCE', sequence: 30, computationMethod: 'FIXED', amount: new Prisma.Decimal('5000.00'), isActive: true },
          { code: 'CONVEYANCE', name: 'Conveyance Allowance', category: 'ALLOWANCE', sequence: 40, computationMethod: 'FIXED', amount: new Prisma.Decimal('3000.00'), isActive: true },
          { code: 'GROSS', name: 'Gross Salary', category: 'GROSS', sequence: 50, computationMethod: 'FORMULA', formula: 'BASIC + HRA + SPECIAL + CONVEYANCE', isActive: true },
          { code: 'PF', name: 'Provident Fund (PF)', category: 'DEDUCTION', sequence: 60, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('12.00'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'TDS', name: 'Income Tax (TDS)', category: 'DEDUCTION', sequence: 70, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('10.00'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'NET', name: 'Net Salary Payable', category: 'NET', sequence: 80, computationMethod: 'FORMULA', formula: 'GROSS - PF - TDS', isActive: true },
        ],
      },
    },
    include: { rules: true },
  });

  const execStructure = await prisma.salaryStructure.create({
    data: {
      code: 'EXEC',
      name: 'Executive Leadership Structure',
      currency: 'INR',
      netRuleCode: 'NET',
      rules: {
        create: [
          { code: 'BASIC', name: 'Base Compensation', category: 'BASIC', sequence: 10, computationMethod: 'FIXED', useContractWage: true, isActive: true },
          { code: 'HRA', name: 'Executive HRA', category: 'ALLOWANCE', sequence: 20, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('50.00'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'SPECIAL', name: 'Leadership Allowance', category: 'ALLOWANCE', sequence: 30, computationMethod: 'FIXED', amount: new Prisma.Decimal('25000.00'), isActive: true },
          { code: 'PERF_BONUS', name: 'Performance Incentive', category: 'ALLOWANCE', sequence: 40, computationMethod: 'FIXED', amount: new Prisma.Decimal('15000.00'), isActive: true },
          { code: 'GROSS', name: 'Gross Compensation', category: 'GROSS', sequence: 50, computationMethod: 'FORMULA', formula: 'BASIC + HRA + SPECIAL + PERF_BONUS', isActive: true },
          { code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', sequence: 60, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('12.00'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'TDS', name: 'Tax Deducted at Source', category: 'DEDUCTION', sequence: 70, computationMethod: 'PERCENTAGE', percentage: new Prisma.Decimal('15.00'), percentageOfCode: 'BASIC', isActive: true },
          { code: 'NET', name: 'Net Take-Home', category: 'NET', sequence: 80, computationMethod: 'FORMULA', formula: 'GROSS - PF - TDS', isActive: true },
        ],
      },
    },
    include: { rules: true },
  });

  const internStructure = await prisma.salaryStructure.create({
    data: {
      code: 'INTERN_CONTRACT',
      name: 'Trainee & Stipend Structure',
      currency: 'INR',
      netRuleCode: 'NET',
      rules: {
        create: [
          { code: 'STIPEND', name: 'Monthly Stipend', category: 'BASIC', sequence: 10, computationMethod: 'FIXED', useContractWage: true, isActive: true },
          { code: 'COMMUTE', name: 'Commute Allowance', category: 'ALLOWANCE', sequence: 20, computationMethod: 'FIXED', amount: new Prisma.Decimal('2000.00'), isActive: true },
          { code: 'GROSS', name: 'Total Stipend', category: 'GROSS', sequence: 30, computationMethod: 'FORMULA', formula: 'STIPEND + COMMUTE', isActive: true },
          { code: 'PROF_TAX', name: 'Professional Tax', category: 'DEDUCTION', sequence: 40, computationMethod: 'FIXED', amount: new Prisma.Decimal('200.00'), isActive: true },
          { code: 'NET', name: 'Net Stipend', category: 'NET', sequence: 50, computationMethod: 'FORMULA', formula: 'GROSS - PROF_TAX', isActive: true },
        ],
      },
    },
    include: { rules: true },
  });
  console.log('Created 3 salary structures with 21 mathematical computation rules.');

  // 6. TIME OFF TYPES
  console.log('\n6. Seeding Time Off Types...');
  const TIME_OFF_TYPES = [
    { code: 'PL', name: 'Paid Annual Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, isPaid: true, affectsPayroll: false },
    { code: 'SL', name: 'Sick & Medical Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: false, isPaid: true, affectsPayroll: false },
    { code: 'CL', name: 'Casual Leave', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, isPaid: true, affectsPayroll: false },
    { code: 'WFH', name: 'Remote Work / WFH', unit: 'DAYS', requiresAllocation: true, approvalRequired: true, isPaid: true, affectsPayroll: false },
    { code: 'UL', name: 'Unpaid Leave (LOP)', unit: 'DAYS', requiresAllocation: false, approvalRequired: true, isPaid: false, affectsPayroll: true },
  ];

  const leaveTypeMap = {};
  for (const lt of TIME_OFF_TYPES) {
    leaveTypeMap[lt.code] = await prisma.timeOffType.create({ data: lt });
  }
  console.log(`Created ${TIME_OFF_TYPES.length} time-off types.`);

  // 7. EMPLOYEES
  console.log('\n7. Seeding Employees across all 5 Statuses & Reporting Hierarchy...');
  const EMPLOYEES_DATA = [
    // --- Leadership ---
    {
      code: 'EMP-00002', firstName: 'Alex', lastName: 'Morgan',
      workEmail: 'alex.morgan@peoplepay360.com', phone: '+91 98201 11223',
      deptCode: 'ENG', posCode: 'VP_ENG', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2023-01-15'), status: 'ACTIVE',
      bankName: 'HDFC Bank', bankAccountName: 'Alex Morgan', bankAccountNumber: '50100456789012', bankIfscCode: 'HDFC0000060',
      wage: '220000.00', structureId: execStructure.id,
      managerCode: null,
    },
    {
      code: 'EMP-00009', firstName: 'Marcus', lastName: 'Vance',
      workEmail: 'marcus.vance@peoplepay360.com', phone: '+91 98202 22334',
      deptCode: 'FIN', posCode: 'CFO', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2022-11-01'), status: 'ACTIVE',
      bankName: 'ICICI Bank', bankAccountName: 'Marcus Vance', bankAccountNumber: '000405012345', bankIfscCode: 'ICIC0000004',
      wage: '250000.00', structureId: execStructure.id,
      managerCode: null,
    },
    {
      code: 'EMP-00010', firstName: 'Emily', lastName: 'Blunt',
      workEmail: 'emily.blunt@peoplepay360.com', phone: '+91 98203 33445',
      deptCode: 'HR', posCode: 'CPO', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2023-03-01'), status: 'ACTIVE',
      bankName: 'Kotak Mahindra Bank', bankAccountName: 'Emily Blunt', bankAccountNumber: '671234890123', bankIfscCode: 'KKBK0000958',
      wage: '210000.00', structureId: execStructure.id,
      managerCode: null,
    },
    {
      code: 'EMP-00004', firstName: 'Michael', lastName: 'Scott',
      workEmail: 'michael.scott@peoplepay360.com', phone: '+91 98204 44556',
      deptCode: 'SALES', posCode: 'VP_SALES', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2023-02-01'), status: 'ACTIVE',
      bankName: 'Axis Bank', bankAccountName: 'Michael Scott', bankAccountNumber: '912010034567890', bankIfscCode: 'UTIB0000005',
      wage: '200000.00', structureId: execStructure.id,
      managerCode: null,
    },

    // --- Engineering & Product Managers / Leads ---
    {
      code: 'EMP-00003', firstName: 'Sarah', lastName: 'Chen',
      workEmail: 'sarah.chen@peoplepay360.com', phone: '+91 98205 55667',
      deptCode: 'ENG', posCode: 'FE_LEAD', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2023-06-01'), status: 'ACTIVE',
      bankName: 'State Bank of India', bankAccountName: 'Sarah Chen', bankAccountNumber: '30456789012', bankIfscCode: 'SBIN0000691',
      wage: '140000.00', structureId: execStructure.id,
      managerCode: 'EMP-00002',
    },
    {
      code: 'EMP-00006', firstName: 'David', lastName: 'Miller',
      workEmail: 'david.miller@peoplepay360.com', phone: '+91 98206 66778',
      deptCode: 'OPS', posCode: 'DEVOPS_ENG', scheduleId: scheduleOps.id,
      dateOfJoining: new Date('2023-08-15'), status: 'ACTIVE',
      bankName: 'HDFC Bank', bankAccountName: 'David Miller', bankAccountNumber: '50100789012345', bankIfscCode: 'HDFC0000123',
      wage: '130000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00002',
    },
    {
      code: 'EMP-00007', firstName: 'Priya', lastName: 'Sharma',
      workEmail: 'priya.sharma@peoplepay360.com', phone: '+91 98207 77889',
      deptCode: 'PROD', posCode: 'SR_PM', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2023-04-10'), status: 'ACTIVE',
      bankName: 'ICICI Bank', bankAccountName: 'Priya Sharma', bankAccountNumber: '000505123456', bankIfscCode: 'ICIC0000005',
      wage: '150000.00', structureId: execStructure.id,
      managerCode: 'EMP-00002',
    },

    // --- Finance & HR Managers ---
    {
      code: 'EMP-00011', firstName: 'Anita', lastName: 'Deshmukh',
      workEmail: 'anita.deshmukh@peoplepay360.com', phone: '+91 98208 88990',
      deptCode: 'FIN', posCode: 'FIN_CTRL', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2023-05-01'), status: 'ACTIVE',
      bankName: 'HDFC Bank', bankAccountName: 'Anita Deshmukh', bankAccountNumber: '50100987654321', bankIfscCode: 'HDFC0000060',
      wage: '110000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00009',
    },
    {
      code: 'EMP-00012', firstName: 'Liam', lastName: 'O\'Connor',
      workEmail: 'liam.oconnor@peoplepay360.com', phone: '+91 98209 99001',
      deptCode: 'CS', posCode: 'CS_LEAD', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2023-09-01'), status: 'ACTIVE',
      bankName: 'Axis Bank', bankAccountName: 'Liam O\'Connor', bankAccountNumber: '912010078901234', bankIfscCode: 'UTIB0000005',
      wage: '105000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00004',
    },
    {
      code: 'EMP-00013', firstName: 'Lisa', lastName: 'Kudrow',
      workEmail: 'lisa.kudrow@peoplepay360.com', phone: '+91 98210 10112',
      deptCode: 'HR', posCode: 'HR_SPEC', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-01-15'), status: 'ACTIVE',
      bankName: 'Kotak Mahindra Bank', bankAccountName: 'Lisa Kudrow', bankAccountNumber: '671234123456', bankIfscCode: 'KKBK0000958',
      wage: '80000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00010',
    },

    // --- Individual Contributors ---
    {
      code: 'EMP-00001', firstName: 'Jane', lastName: 'Doe',
      workEmail: 'jane.doe@peoplepay360.com', phone: '+91 98211 11223',
      deptCode: 'FIN', posCode: 'PAY_ANALYST', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-01-01'), status: 'ACTIVE',
      bankName: 'HDFC Bank', bankAccountName: 'Jane Doe', bankAccountNumber: '123456789012', bankIfscCode: 'HDFC0001234',
      wage: '70000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00011',
    },
    {
      code: 'EMP-00014', firstName: 'Ethan', lastName: 'Hunt',
      workEmail: 'ethan.hunt@peoplepay360.com', phone: '+91 98212 12334',
      deptCode: 'ENG', posCode: 'SR_BE_ENG', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2024-02-01'), status: 'ACTIVE',
      bankName: 'ICICI Bank', bankAccountName: 'Ethan Hunt', bankAccountNumber: '000605234567', bankIfscCode: 'ICIC0000006',
      wage: '125000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00002',
    },
    {
      code: 'EMP-00015', firstName: 'Daniel', lastName: 'Craig',
      workEmail: 'daniel.craig@peoplepay360.com', phone: '+91 98213 13445',
      deptCode: 'ENG', posCode: 'SR_BE_ENG', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2024-03-01'), status: 'ACTIVE',
      bankName: 'State Bank of India', bankAccountName: 'Daniel Craig', bankAccountNumber: '30567890123', bankIfscCode: 'SBIN0000691',
      wage: '120000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00002',
    },
    {
      code: 'EMP-00016', firstName: 'Rachel', lastName: 'Green',
      workEmail: 'rachel.green@peoplepay360.com', phone: '+91 98214 14556',
      deptCode: 'ENG', posCode: 'QA_ENG', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2024-04-15'), status: 'ACTIVE',
      bankName: 'HDFC Bank', bankAccountName: 'Rachel Green', bankAccountNumber: '50100123456789', bankIfscCode: 'HDFC0000123',
      wage: '85000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00003',
    },
    {
      code: 'EMP-00017', firstName: 'Carlos', lastName: 'Santana',
      workEmail: 'carlos.santana@peoplepay360.com', phone: '+91 98215 15667',
      deptCode: 'PROD', posCode: 'UIUX_LEAD', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2024-05-01'), status: 'ACTIVE',
      bankName: 'Axis Bank', bankAccountName: 'Carlos Santana', bankAccountNumber: '912010045678901', bankIfscCode: 'UTIB0000005',
      wage: '115000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00007',
    },
    {
      code: 'EMP-00018', firstName: 'Jim', lastName: 'Halpert',
      workEmail: 'jim.halpert@peoplepay360.com', phone: '+91 98216 16778',
      deptCode: 'SALES', posCode: 'SALES_EXEC', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-01-10'), status: 'ACTIVE',
      bankName: 'Kotak Mahindra Bank', bankAccountName: 'Jim Halpert', bankAccountNumber: '671234567890', bankIfscCode: 'KKBK0000958',
      wage: '95000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00004',
    },
    {
      code: 'EMP-00019', firstName: 'Dwight', lastName: 'Schrute',
      workEmail: 'dwight.schrute@peoplepay360.com', phone: '+91 98217 17889',
      deptCode: 'SALES', posCode: 'SALES_EXEC', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-01-10'), status: 'ACTIVE',
      bankName: 'State Bank of India', bankAccountName: 'Dwight Schrute', bankAccountNumber: '30678901234', bankIfscCode: 'SBIN0000691',
      wage: '98000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00004',
    },

    // --- Onboarding Status ---
    {
      code: 'EMP-00020', firstName: 'Vikram', lastName: 'Rao',
      workEmail: 'vikram.rao@peoplepay360.com', phone: '+91 98218 18990',
      deptCode: 'ENG', posCode: 'FS_ENG', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2026-08-15'), status: 'ONBOARDING',
      bankName: 'HDFC Bank', bankAccountName: 'Vikram Rao', bankAccountNumber: '50100654321098', bankIfscCode: 'HDFC0000060',
      wage: '90000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00003',
    },
    {
      code: 'EMP-00021', firstName: 'Maya', lastName: 'Lin',
      workEmail: 'maya.lin@peoplepay360.com', phone: '+91 98219 19001',
      deptCode: 'PROD', posCode: 'SR_PM', scheduleId: scheduleFlex.id,
      dateOfJoining: new Date('2026-08-20'), status: 'ONBOARDING',
      bankName: 'ICICI Bank', bankAccountName: 'Maya Lin', bankAccountNumber: '000705345678', bankIfscCode: 'ICIC0000004',
      wage: '75000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00007',
    },

    // --- On Notice Status ---
    {
      code: 'EMP-00008', firstName: 'Robert', lastName: 'Taylor',
      workEmail: 'robert.taylor@peoplepay360.com', phone: '+91 98220 20112',
      deptCode: 'FIN', posCode: 'PAY_ANALYST', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-03-01'), status: 'ON_NOTICE',
      // Intentionally missing bank details to trigger MISSING_BANK_DETAILS dashboard alert!
      bankName: null, bankAccountName: null, bankAccountNumber: null, bankIfscCode: null,
      wage: '65000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00011',
    },
    {
      code: 'EMP-00022', firstName: 'Stanley', lastName: 'Hudson',
      workEmail: 'stanley.hudson@peoplepay360.com', phone: '+91 98221 21223',
      deptCode: 'SALES', posCode: 'SALES_EXEC', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-02-15'), status: 'ON_NOTICE',
      bankName: 'HDFC Bank', bankAccountName: 'Stanley Hudson', bankAccountNumber: '50100765432109', bankIfscCode: 'HDFC0000060',
      wage: '75000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00004',
      contractExpiringSoon: true,
    },

    // --- Suspended Status ---
    {
      code: 'EMP-00023', firstName: 'Toby', lastName: 'Flenderson',
      workEmail: 'toby.flenderson@peoplepay360.com', phone: '+91 98222 22334',
      deptCode: 'HR', posCode: 'HR_SPEC', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-06-01'), status: 'SUSPENDED',
      bankName: 'Axis Bank', bankAccountName: 'Toby Flenderson', bankAccountNumber: '912010098765432', bankIfscCode: 'UTIB0000005',
      wage: '60000.00', structureId: regularStructure.id,
      managerCode: 'EMP-00010',
    },

    // --- Exited Status ---
    {
      code: 'EMP-00024', firstName: 'Ryan', lastName: 'Howard',
      workEmail: 'ryan.howard@peoplepay360.com', phone: '+91 98223 23445',
      deptCode: 'SALES', posCode: 'SALES_EXEC', scheduleId: scheduleStd.id,
      dateOfJoining: new Date('2024-01-01'), dateOfExit: new Date('2025-12-31'), status: 'EXITED',
      bankName: 'ICICI Bank', bankAccountName: 'Ryan Howard', bankAccountNumber: '000805456789', bankIfscCode: 'ICIC0000004',
      wage: '45000.00', structureId: internStructure.id,
      managerCode: 'EMP-00004',
    },
  ];

  // Pass 1: Create all employees without manager relations
  const empMap = {};
  for (const ed of EMPLOYEES_DATA) {
    const fullName = `${ed.firstName} ${ed.lastName}`;
    const emp = await prisma.employee.create({
      data: {
        employeeCode: ed.code,
        firstName: ed.firstName,
        lastName: ed.lastName,
        fullName,
        workEmail: ed.workEmail,
        phone: ed.phone,
        status: ed.status,
        departmentId: deptMap[ed.deptCode].id,
        jobPositionId: posMap[ed.posCode].id,
        workingScheduleId: ed.scheduleId,
        dateOfJoining: ed.dateOfJoining,
        dateOfExit: ed.dateOfExit || null,
        bankAccountName: ed.bankAccountName,
        bankAccountNumber: ed.bankAccountNumber,
        bankIfscCode: ed.bankIfscCode,
        bankName: ed.bankName,
      },
    });
    empMap[ed.code] = emp;
  }

  // Pass 2: Connect Manager-Report hierarchy
  for (const ed of EMPLOYEES_DATA) {
    if (ed.managerCode && empMap[ed.managerCode]) {
      await prisma.employee.update({
        where: { id: empMap[ed.code].id },
        data: { managerId: empMap[ed.managerCode].id },
      });
    }
  }

  // Link User logins to their Employee records
  await prisma.user.update({
    where: { email: 'employee@peoplepay360.com' },
    data: { employeeId: empMap['EMP-00001'].id },
  });
  await prisma.user.update({
    where: { email: 'alex.morgan@peoplepay360.com' },
    data: { employeeId: empMap['EMP-00002'].id },
  });
  await prisma.user.update({
    where: { email: 'sarah.chen@peoplepay360.com' },
    data: { employeeId: empMap['EMP-00003'].id },
  });
  await prisma.user.update({
    where: { email: 'michael.scott@peoplepay360.com' },
    data: { employeeId: empMap['EMP-00004'].id },
  });
  await prisma.user.update({
    where: { email: 'david.miller@peoplepay360.com' },
    data: { employeeId: empMap['EMP-00006'].id },
  });
  await prisma.user.update({
    where: { email: 'priya.sharma@peoplepay360.com' },
    data: { employeeId: empMap['EMP-00007'].id },
  });

  console.log(`Created ${EMPLOYEES_DATA.length} employees across all 5 statuses with complete hierarchy.`);

  // 8. CONTRACTS
  console.log('\n8. Seeding Active, Historical & Expiring Contracts...');
  const contractsCreated = [];

  // Active Contracts for active and notice staff
  for (const ed of EMPLOYEES_DATA) {
    if (ed.status === 'EXITED') continue; // Exited will have an expired contract below

    const emp = empMap[ed.code];
    const isNoticeExpiring = Boolean(ed.contractExpiringSoon);
    const in18Days = new Date();
    in18Days.setDate(in18Days.getDate() + 18);

    const contract = await prisma.contract.create({
      data: {
        reference: `CTR-2026-${ed.code.slice(-4)}`,
        employeeId: emp.id,
        status: ed.status === 'ONBOARDING' && ed.code === 'EMP-00021' ? 'DRAFT' : 'ACTIVE',
        startDate: new Date('2026-01-01'),
        endDate: isNoticeExpiring ? in18Days : null, // Triggers CONTRACTS_EXPIRING_SOON alert
        wage: new Prisma.Decimal(ed.wage),
        wageType: 'MONTHLY',
        currency: 'INR',
        salaryStructureId: ed.structureId,
        jobPositionId: posMap[ed.posCode].id,
        departmentNameSnapshot: deptMap[ed.deptCode].name,
        jobTitleSnapshot: posMap[ed.posCode].title,
      },
    });
    contractsCreated.push(contract);
  }

  // Historical expired contracts for senior team members to show contract progression
  const historicalContracts = [
    {
      code: 'EMP-00001', ref: 'CTR-2024-0001', start: '2024-01-01', end: '2024-12-31',
      wage: '50000.00', title: 'Junior Payroll Analyst', structId: regularStructure.id, dept: 'Finance & Payroll',
    },
    {
      code: 'EMP-00001', ref: 'CTR-2025-0001', start: '2025-01-01', end: '2025-12-31',
      wage: '60000.00', title: 'Associate Payroll Analyst', structId: regularStructure.id, dept: 'Finance & Payroll',
    },
    {
      code: 'EMP-00002', ref: 'CTR-2023-0002', start: '2023-01-15', end: '2024-12-31',
      wage: '180000.00', title: 'Director of Engineering', structId: execStructure.id, dept: 'Engineering',
    },
    {
      code: 'EMP-00003', ref: 'CTR-2024-0003', start: '2024-01-01', end: '2025-12-31',
      wage: '115000.00', title: 'Senior Frontend Engineer', structId: regularStructure.id, dept: 'Engineering',
    },
    {
      code: 'EMP-00024', ref: 'CTR-2024-0024', start: '2024-01-01', end: '2025-12-31',
      wage: '45000.00', title: 'Sales Intern', structId: internStructure.id, dept: 'Sales & BD',
    },
  ];

  for (const hc of historicalContracts) {
    const emp = empMap[hc.code];
    await prisma.contract.create({
      data: {
        reference: hc.ref,
        employeeId: emp.id,
        status: 'EXPIRED',
        startDate: new Date(hc.start),
        endDate: new Date(hc.end),
        wage: new Prisma.Decimal(hc.wage),
        wageType: 'MONTHLY',
        currency: 'INR',
        salaryStructureId: hc.structId,
        departmentNameSnapshot: hc.dept,
        jobTitleSnapshot: hc.title,
      },
    });
  }
  console.log(`Created ${contractsCreated.length + historicalContracts.length} contracts.`);

  // 9. TIME OFF ALLOCATIONS
  console.log('\n9. Seeding Annual Leave Allocations for FY2026...');
  let allocCount = 0;
  const allocMap = {}; // key: `${empId}_${typeCode}`

  for (const ed of EMPLOYEES_DATA) {
    if (ed.status === 'EXITED') continue;
    const emp = empMap[ed.code];

    const allocations = [
      { type: 'PL', units: '20.000', taken: '3.000', notes: 'Standard annual privilege leave' },
      { type: 'SL', units: '12.000', taken: '1.000', notes: 'Medical & sick leave quota' },
      { type: 'CL', units: '8.000', taken: '2.000', notes: 'Casual emergency quota' },
      { type: 'WFH', units: '24.000', taken: '6.000', notes: 'Remote work allocation FY2026' },
    ];

    for (const al of allocations) {
      const record = await prisma.timeOffAllocation.create({
        data: {
          employeeId: emp.id,
          timeOffTypeId: leaveTypeMap[al.type].id,
          allocatedUnits: new Prisma.Decimal(al.units),
          takenUnits: new Prisma.Decimal(al.taken),
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'APPROVED',
          notes: al.notes,
        },
      });
      allocMap[`${emp.id}_${al.type}`] = record;
      allocCount++;
    }
  }
  console.log(`Created ${allocCount} leave allocations across all active personnel.`);

  // 10. TIME OFF REQUESTS
  console.log('\n10. Seeding Time Off Requests (Approved, Pending & Refused)...');
  const jane = empMap['EMP-00001'];
  const alex = empMap['EMP-00002'];
  const sarah = empMap['EMP-00003'];
  const michael = empMap['EMP-00004'];
  const carlos = empMap['EMP-00017'];
  const jim = empMap['EMP-00018'];
  const dwight = empMap['EMP-00019'];

  const REQUESTS_DATA = [
    // Approved Historical Requests
    {
      ref: 'TOR-2026-0001', emp: jane, type: 'PL', start: '2026-02-10', end: '2026-02-12',
      duration: '3.000', status: 'APPROVED', reason: 'Family wedding ceremony',
      approvedBy: hrManagerUser.id, approvedAt: '2026-02-05',
    },
    {
      ref: 'TOR-2026-0002', emp: alex, type: 'WFH', start: '2026-03-05', end: '2026-03-06',
      duration: '2.000', status: 'APPROVED', reason: 'Home broadband infrastructure upgrade',
      approvedBy: hrManagerUser.id, approvedAt: '2026-03-02',
    },
    {
      ref: 'TOR-2026-0003', emp: sarah, type: 'SL', start: '2026-04-14', end: '2026-04-14',
      duration: '1.000', status: 'APPROVED', reason: 'Seasonal viral fever & recovery',
      approvedBy: hrManagerUser.id, approvedAt: '2026-04-14',
    },
    {
      ref: 'TOR-2026-0004', emp: jim, type: 'CL', start: '2026-05-18', end: '2026-05-19',
      duration: '2.000', status: 'APPROVED', reason: 'Personal errands & bank documentation',
      approvedBy: hrManagerUser.id, approvedAt: '2026-05-15',
    },
    {
      ref: 'TOR-2026-0005', emp: carlos, type: 'PL', start: '2026-06-22', end: '2026-06-26',
      duration: '5.000', status: 'APPROVED', reason: 'Annual summer vacation trip',
      approvedBy: hrManagerUser.id, approvedAt: '2026-06-10',
    },
    {
      ref: 'TOR-2026-0006', emp: dwight, type: 'WFH', start: '2026-07-08', end: '2026-07-09',
      duration: '2.000', status: 'APPROVED', reason: 'Beet harvest inspection & remote calls',
      approvedBy: hrManagerUser.id, approvedAt: '2026-07-06',
    },

    // Pending Requests (Evaluators can approve or refuse these!)
    {
      ref: 'TOR-2026-0007', emp: jane, type: 'PL', start: '2026-09-15', end: '2026-09-17',
      duration: '3.000', status: 'PENDING', reason: 'Attending financial summit in Bangalore',
    },
    {
      ref: 'TOR-2026-0008', emp: alex, type: 'PL', start: '2026-09-22', end: '2026-09-25',
      duration: '4.000', status: 'PENDING', reason: 'Personal holiday & family trip',
    },
    {
      ref: 'TOR-2026-0009', emp: sarah, type: 'WFH', start: '2026-09-11', end: '2026-09-11',
      duration: '1.000', status: 'PENDING', reason: 'Plumbing repair at residence',
    },
    {
      ref: 'TOR-2026-0010', emp: jim, type: 'SL', start: '2026-09-10', end: '2026-09-10',
      duration: '1.000', status: 'PENDING', reason: 'Dental appointment & wisdom tooth surgery',
    },
    {
      ref: 'TOR-2026-0011', emp: carlos, type: 'CL', start: '2026-09-18', end: '2026-09-18',
      duration: '1.000', status: 'PENDING', reason: 'Family function in hometown',
    },
    {
      ref: 'TOR-2026-0012', emp: dwight, type: 'PL', start: '2026-10-01', end: '2026-10-05',
      duration: '4.000', status: 'PENDING', reason: 'Annual regional agro convention',
    },

    // Refused Requests
    {
      ref: 'TOR-2026-0013', emp: jane, type: 'PL', start: '2026-03-29', end: '2026-03-31',
      duration: '3.000', status: 'REFUSED', reason: 'Month-end payroll freeze period',
      refusalReason: 'Critical payrun validation cycle requires all payroll analysts onsite.',
      approvedBy: hrManagerUser.id, approvedAt: '2026-03-25',
    },
    {
      ref: 'TOR-2026-0014', emp: jim, type: 'PL', start: '2026-06-29', end: '2026-06-30',
      duration: '2.000', status: 'REFUSED', reason: 'Mid-year long weekend',
      refusalReason: 'Quarter-end enterprise deal closing deadline requires full sales coverage.',
      approvedBy: hrManagerUser.id, approvedAt: '2026-06-25',
    },
  ];

  for (const req of REQUESTS_DATA) {
    const alloc = allocMap[`${req.emp.id}_${req.type}`];
    await prisma.timeOffRequest.create({
      data: {
        reference: req.ref,
        employeeId: req.emp.id,
        timeOffTypeId: leaveTypeMap[req.type].id,
        allocationId: alloc?.id || null,
        startDate: new Date(req.start),
        endDate: new Date(req.end),
        duration: new Prisma.Decimal(req.duration),
        unit: 'DAYS',
        status: req.status,
        reason: req.reason,
        approvedById: req.approvedBy || null,
        approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
        refusalReason: req.refusalReason || null,
      },
    });
  }
  console.log(`Created ${REQUESTS_DATA.length} leave requests (6 pending review).`);

  // 11. ATTENDANCE RECORDS (Past 45 business days across team)
  console.log('\n11. Seeding Daily Attendance Logs across past 45 business days...');
  const attendanceEmployees = [
    empMap['EMP-00001'], empMap['EMP-00002'], empMap['EMP-00003'],
    empMap['EMP-00004'], empMap['EMP-00006'], empMap['EMP-00007'],
    empMap['EMP-00011'], empMap['EMP-00013'], empMap['EMP-00014'],
    empMap['EMP-00016'], empMap['EMP-00018'], empMap['EMP-00019'],
  ];

  const now = new Date();
  const attendancesToInsert = [];
  let businessDaysCount = 0;
  let dayOffset = 1;

  while (businessDaysCount < 45 && dayOffset < 75) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOffset);
    dayOffset++;

    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Saturday & Sunday
    businessDaysCount++;

    const dateOnly = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    for (let i = 0; i < attendanceEmployees.length; i++) {
      const emp = attendanceEmployees[i];
      const seedVal = (businessDaysCount * 7 + i * 13) % 100;

      let status = 'PRESENT';
      let checkInHour = 8;
      let checkInMinute = 55 + (seedVal % 15);
      let checkOutHour = 18;
      let checkOutMinute = 5 + (seedVal % 20);
      let workedHours = new Prisma.Decimal('8.50');
      let isManualCorrection = false;
      let correctionReason = null;
      let correctedById = null;

      if (seedVal < 6) {
        // Late arrival
        status = 'LATE';
        checkInHour = 9;
        checkInMinute = 35 + (seedVal % 25);
        workedHours = new Prisma.Decimal('7.50');
      } else if (seedVal < 10) {
        // Overtime day
        status = 'OVERTIME';
        checkOutHour = 20;
        checkOutMinute = 30;
        workedHours = new Prisma.Decimal('10.50');
      } else if (seedVal < 13) {
        // Early leave
        status = 'EARLY_LEAVE';
        checkOutHour = 15;
        checkOutMinute = 30;
        workedHours = new Prisma.Decimal('6.00');
      } else if (seedVal < 15) {
        // Half day
        status = 'HALF_DAY';
        checkOutHour = 13;
        checkOutMinute = 0;
        workedHours = new Prisma.Decimal('4.00');
      } else if (seedVal === 16) {
        // Absent
        status = 'ABSENT';
        workedHours = new Prisma.Decimal('0.00');
      }

      // Manual biometric correction simulation on occasional records
      if (seedVal === 5 || seedVal === 8) {
        isManualCorrection = true;
        correctionReason = seedVal === 5 ? 'Biometric turnstile timeout at Tower A' : 'Client onsite morning meeting in Gurgaon';
        correctedById = hrManagerUser.id;
      }

      const checkInDate = status !== 'ABSENT' ? new Date(dateOnly) : null;
      if (checkInDate) checkInDate.setUTCHours(checkInHour, checkInMinute, 0, 0);

      const checkOutDate = status !== 'ABSENT' ? new Date(dateOnly) : null;
      if (checkOutDate) checkOutDate.setUTCHours(checkOutHour, checkOutMinute, 0, 0);

      attendancesToInsert.push({
        employeeId: emp.id,
        date: dateOnly,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workedHours,
        status,
        source: 'WEB',
        isManualCorrection,
        correctionReason,
        correctedById,
      });
    }
  }

  // Batch insert attendances
  await prisma.attendance.createMany({ data: attendancesToInsert });
  console.log(`Created ${attendancesToInsert.length} daily attendance logs across ${businessDaysCount} working days.`);

  // 12. PAYRUN CYCLES & DETAILED PAYSLIPS
  console.log('\n12. Seeding 9 Monthly Payruns (Jan–Sep 2026) with Itemized Payslips...');

  const PAYRUN_PERIODS = [
    { label: '2026-01', start: '2026-01-01', end: '2026-01-31', status: 'PAID', paidDate: '2026-01-31', name: 'January 2026 Regular Payrun' },
    { label: '2026-02', start: '2026-02-01', end: '2026-02-28', status: 'PAID', paidDate: '2026-02-28', name: 'February 2026 Regular Payrun' },
    { label: '2026-03', start: '2026-03-01', end: '2026-03-31', status: 'PAID', paidDate: '2026-03-31', name: 'March 2026 Regular Payrun' },
    { label: '2026-04', start: '2026-04-01', end: '2026-04-30', status: 'PAID', paidDate: '2026-04-30', name: 'April 2026 Regular Payrun' },
    { label: '2026-05', start: '2026-05-01', end: '2026-05-31', status: 'PAID', paidDate: '2026-05-31', name: 'May 2026 Regular Payrun' },
    { label: '2026-06', start: '2026-06-01', end: '2026-06-30', status: 'PAID', paidDate: '2026-06-30', name: 'June 2026 Regular Payrun' },
    { label: '2026-07', start: '2026-07-01', end: '2026-07-31', status: 'PAID', paidDate: '2026-07-31', name: 'July 2026 Regular Payrun' },
    { label: '2026-08', start: '2026-08-01', end: '2026-08-31', status: 'VALIDATED', paidDate: null, name: 'August 2026 Regular Payrun' },
    { label: '2026-09', start: '2026-09-01', end: '2026-09-30', status: 'COMPUTED', paidDate: null, name: 'September 2026 Active Payrun' },
  ];

  // Map salary structures by ID for rules lookup
  const structureRulesMap = {
    [regularStructure.id]: regularStructure.rules,
    [execStructure.id]: execStructure.rules,
    [internStructure.id]: internStructure.rules,
  };

  // Eligible contracted employees
  const eligibleContracts = contractsCreated.filter((c) => c.status === 'ACTIVE');

  let totalPayslipsCreated = 0;
  let totalLinesCreated = 0;

  for (let pIdx = 0; pIdx < PAYRUN_PERIODS.length; pIdx++) {
    const prDef = PAYRUN_PERIODS[pIdx];
    const runRef = `PR-2026-${String(pIdx + 1).padStart(4, '0')}`;
    const pStart = new Date(prDef.start);
    const pEnd = new Date(prDef.end);

    const payrun = await prisma.payrun.create({
      data: {
        reference: runRef,
        name: prDef.name,
        salaryStructureId: regularStructure.id,
        periodStart: pStart,
        periodEnd: pEnd,
        periodLabel: prDef.label,
        status: prDef.status,
        currency: 'INR',
        employeeCount: eligibleContracts.length,
        paymentDate: prDef.paidDate ? new Date(prDef.paidDate) : null,
        computedAt: new Date(pEnd.getTime() - 86400000),
        validatedAt: prDef.status !== 'DRAFT' && prDef.status !== 'COMPUTED' ? pEnd : null,
        paidAt: prDef.paidDate ? new Date(prDef.paidDate) : null,
        createdById: payrollManagerUser.id,
      },
    });

    let runGross = 0;
    let runNet = 0;
    let runDeductions = 0;

    for (let cIdx = 0; cIdx < eligibleContracts.length; cIdx++) {
      const contract = eligibleContracts[cIdx];
      const emp = Object.values(empMap).find((e) => e.id === contract.employeeId);
      if (!emp) continue;

      const rules = structureRulesMap[contract.salaryStructureId] || regularStructure.rules;
      const workedDays = pEnd.getDate(); // full month days

      const computation = computeSalaryRules(rules, {
        contractWage: contract.wage,
        periodDays: workedDays,
        workedDays,
        unpaidLeaveDays: 0,
      });

      const psRef = `PS-2026-${String(pIdx + 1).padStart(2, '0')}${String(cIdx + 1).padStart(2, '0')}`;
      const payslip = await prisma.payslip.create({
        data: {
          reference: psRef,
          payrunId: payrun.id,
          employeeId: emp.id,
          contractId: contract.id,
          salaryStructureId: contract.salaryStructureId,
          periodStart: pStart,
          periodEnd: pEnd,
          periodLabel: prDef.label,
          status: prDef.status,
          currency: 'INR',
          workedDays: new Prisma.Decimal(String(workedDays)),
          grossAmount: computation.grossAmount,
          netAmount: computation.netAmount,
        },
      });

      // Create payslip lines
      await prisma.payslipLine.createMany({
        data: computation.lines.map((l) => ({
          payslipId: payslip.id,
          salaryRuleId: l.salaryRuleId,
          label: l.name,
          code: l.code,
          category: l.category,
          sequence: l.sequence,
          amount: l.amount,
        })),
      });

      const grossNum = Number(computation.grossAmount);
      const netNum = Number(computation.netAmount);
      const dedNum = grossNum - netNum;

      runGross += grossNum;
      runNet += netNum;
      runDeductions += dedNum;

      totalPayslipsCreated++;
      totalLinesCreated += computation.lines.length;
    }

    // Update aggregated totals on Payrun
    await prisma.payrun.update({
      where: { id: payrun.id },
      data: {
        totalGross: new Prisma.Decimal(runGross.toFixed(2)),
        totalNet: new Prisma.Decimal(runNet.toFixed(2)),
        totalDeductions: new Prisma.Decimal(runDeductions.toFixed(2)),
      },
    });
  }

  console.log(`Created ${PAYRUN_PERIODS.length} payruns with ${totalPayslipsCreated} payslips and ${totalLinesCreated} itemized lines.`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`=== MASTER SEEDING COMPLETE IN ${elapsed}s ===`);
  console.log(`======================================================`);
  console.log(`Users: ${Object.keys(userMap).length}`);
  console.log(`Departments: ${DEPARTMENTS.length}`);
  console.log(`Job Positions: ${POSITIONS.length}`);
  console.log(`Working Schedules: 3`);
  console.log(`Salary Structures: 3 (with 21 calculation rules)`);
  console.log(`Employees: ${EMPLOYEES_DATA.length} (Active: 17, Onboarding: 2, Notice: 2, Suspended: 1, Exited: 1)`);
  console.log(`Contracts: ${contractsCreated.length + historicalContracts.length}`);
  console.log(`Leave Types: ${TIME_OFF_TYPES.length}`);
  console.log(`Leave Allocations: ${allocCount}`);
  console.log(`Leave Requests: ${REQUESTS_DATA.length} (6 pending approval)`);
  console.log(`Attendance Records: ${attendancesToInsert.length}`);
  console.log(`Payruns: ${PAYRUN_PERIODS.length} (Jan–Sep 2026)`);
  console.log(`Payslips: ${totalPayslipsCreated}`);
  console.log(`Payslip Lines: ${totalLinesCreated}`);
  console.log(`======================================================`);
  console.log(`HACKATHON EVALUATOR LOGINS (Password: ${PASSWORD}):`);
  console.log(`- Admin:            admin@peoplepay360.com`);
  console.log(`- HR Manager:       hr.manager@peoplepay360.com`);
  console.log(`- Payroll Manager:  payroll.manager@peoplepay360.com`);
  console.log(`- Payroll User:     payroll.user@peoplepay360.com`);
  console.log(`- Employee (Jane):  employee@peoplepay360.com`);
  console.log(`- VP Engineering:   alex.morgan@peoplepay360.com`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error('Fatal seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
