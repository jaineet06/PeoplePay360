/**
 * PeoplePay360 — Large Data Expansion Seed
 * =========================================
 * Adds ~80 employees + all related records (contracts, leave allocations,
 * leave requests, attendance, payslips) on top of the base seed.js data.
 *
 * IMPORTANT: Run base seed.js FIRST, then this script.
 * This script does NOT wipe any existing data.
 *
 * Run: node scripts/seed-large.js
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { computeSalaryRules } from '../utils/salaryEngine.js';

const prisma = new PrismaClient();
const PASSWORD = 'Password123!';

// ---------------------------------------------------------------------------
// 80 realistic Indian-origin employee profiles
// ---------------------------------------------------------------------------
const EXTRA_EMPLOYEES = [
  // Engineering (deptCode: ENG) — 20 employees
  { firstName: 'Arjun', lastName: 'Mehta', posCode: 'SR_BE_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '118000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00002', joining: '2024-04-01' },
  { firstName: 'Neha', lastName: 'Joshi', posCode: 'FE_LEAD', deptCode: 'ENG', schedule: 'FLEX40', wage: '132000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2024-05-15' },
  { firstName: 'Rohan', lastName: 'Patil', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '95000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2024-06-01' },
  { firstName: 'Siddharth', lastName: 'Kulkarni', posCode: 'QA_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '82000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2024-07-10' },
  { firstName: 'Pooja', lastName: 'Nair', posCode: 'SR_BE_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '122000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00002', joining: '2024-03-20' },
  { firstName: 'Amit', lastName: 'Chaudhary', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '90000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2024-08-01' },
  { firstName: 'Kavya', lastName: 'Reddy', posCode: 'QA_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '78000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2024-09-01' },
  { firstName: 'Vikram', lastName: 'Singh', posCode: 'SR_BE_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '116000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00002', joining: '2025-01-10' },
  { firstName: 'Ananya', lastName: 'Iyer', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '88000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-02-01' },
  { firstName: 'Rahul', lastName: 'Gupta', posCode: 'QA_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '80000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-03-01' },
  { firstName: 'Meera', lastName: 'Pillai', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '92000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-04-15' },
  { firstName: 'Karan', lastName: 'Malhotra', posCode: 'SR_BE_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '120000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00002', joining: '2025-05-01' },
  { firstName: 'Divya', lastName: 'Rao', posCode: 'QA_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '76000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-06-01' },
  { firstName: 'Suresh', lastName: 'Babu', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '86000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-07-10' },
  { firstName: 'Preethi', lastName: 'Kumar', posCode: 'QA_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '74000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-08-01' },
  { firstName: 'Aditya', lastName: 'Verma', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '94000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-09-01' },
  { firstName: 'Lakshmi', lastName: 'Menon', posCode: 'SR_BE_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '114000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00002', joining: '2025-10-01' },
  { firstName: 'Nikhil', lastName: 'Sharma', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '89000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00003', joining: '2025-11-01' },
  { firstName: 'Shreya', lastName: 'Bose', posCode: 'QA_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '77000.00', structure: 'REGULAR', status: 'ONBOARDING', managerCode: 'EMP-00003', joining: '2026-08-25' },
  { firstName: 'Ravi', lastName: 'Krishnamurthy', posCode: 'FS_ENG', deptCode: 'ENG', schedule: 'FLEX40', wage: '91000.00', structure: 'REGULAR', status: 'ONBOARDING', managerCode: 'EMP-00003', joining: '2026-09-01' },

  // Product Management (deptCode: PROD) — 8 employees
  { firstName: 'Nandini', lastName: 'Agarwal', posCode: 'SR_PM', deptCode: 'PROD', schedule: 'FLEX40', wage: '145000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2024-04-01' },
  { firstName: 'Gaurav', lastName: 'Saxena', posCode: 'UIUX_LEAD', deptCode: 'PROD', schedule: 'FLEX40', wage: '112000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2024-06-15' },
  { firstName: 'Tanvi', lastName: 'Desai', posCode: 'SR_PM', deptCode: 'PROD', schedule: 'FLEX40', wage: '138000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2024-09-01' },
  { firstName: 'Mohit', lastName: 'Bansal', posCode: 'UIUX_LEAD', deptCode: 'PROD', schedule: 'FLEX40', wage: '108000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2025-01-15' },
  { firstName: 'Isha', lastName: 'Choudhary', posCode: 'SR_PM', deptCode: 'PROD', schedule: 'FLEX40', wage: '130000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2025-05-01' },
  { firstName: 'Varun', lastName: 'Patel', posCode: 'UIUX_LEAD', deptCode: 'PROD', schedule: 'FLEX40', wage: '105000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2025-08-01' },
  { firstName: 'Riya', lastName: 'Shah', posCode: 'SR_PM', deptCode: 'PROD', schedule: 'FLEX40', wage: '128000.00', structure: 'REGULAR', status: 'ON_NOTICE', managerCode: 'EMP-00007', joining: '2024-07-01' },
  { firstName: 'Akshat', lastName: 'Tiwari', posCode: 'UIUX_LEAD', deptCode: 'PROD', schedule: 'FLEX40', wage: '103000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00007', joining: '2026-01-10' },

  // Human Resources (deptCode: HR) — 8 employees
  { firstName: 'Swati', lastName: 'Pandey', posCode: 'HR_SPEC', deptCode: 'HR', schedule: 'STD40', wage: '72000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2024-05-01' },
  { firstName: 'Deepak', lastName: 'Mishra', posCode: 'TALENT_LEAD', deptCode: 'HR', schedule: 'STD40', wage: '92000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2024-06-15' },
  { firstName: 'Namita', lastName: 'Jain', posCode: 'HR_SPEC', deptCode: 'HR', schedule: 'STD40', wage: '68000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2024-10-01' },
  { firstName: 'Rajesh', lastName: 'Tripathi', posCode: 'TALENT_LEAD', deptCode: 'HR', schedule: 'STD40', wage: '88000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2025-02-01' },
  { firstName: 'Sunita', lastName: 'Bhatt', posCode: 'HR_SPEC', deptCode: 'HR', schedule: 'STD40', wage: '70000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2025-06-01' },
  { firstName: 'Harish', lastName: 'Kapoor', posCode: 'TALENT_LEAD', deptCode: 'HR', schedule: 'STD40', wage: '85000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2025-09-01' },
  { firstName: 'Madhuri', lastName: 'Goel', posCode: 'HR_SPEC', deptCode: 'HR', schedule: 'STD40', wage: '66000.00', structure: 'REGULAR', status: 'SUSPENDED', managerCode: 'EMP-00010', joining: '2024-03-01' },
  { firstName: 'Tushar', lastName: 'Rastogi', posCode: 'HR_SPEC', deptCode: 'HR', schedule: 'STD40', wage: '64000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00010', joining: '2026-02-01' },

  // Finance & Payroll (deptCode: FIN) — 8 employees
  { firstName: 'Archana', lastName: 'Srivastava', posCode: 'PAY_ANALYST', deptCode: 'FIN', schedule: 'STD40', wage: '68000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00011', joining: '2024-04-01' },
  { firstName: 'Manish', lastName: 'Agrawal', posCode: 'FIN_CTRL', deptCode: 'FIN', schedule: 'STD40', wage: '105000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00009', joining: '2024-07-01' },
  { firstName: 'Seema', lastName: 'Dubey', posCode: 'PAY_ANALYST', deptCode: 'FIN', schedule: 'STD40', wage: '65000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00011', joining: '2024-10-01' },
  { firstName: 'Piyush', lastName: 'Tomar', posCode: 'PAY_ANALYST', deptCode: 'FIN', schedule: 'STD40', wage: '62000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00011', joining: '2025-01-15' },
  { firstName: 'Rekha', lastName: 'Yadav', posCode: 'FIN_CTRL', deptCode: 'FIN', schedule: 'STD40', wage: '102000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00009', joining: '2025-04-01' },
  { firstName: 'Vinod', lastName: 'Pillai', posCode: 'PAY_ANALYST', deptCode: 'FIN', schedule: 'STD40', wage: '63000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00011', joining: '2025-07-01' },
  { firstName: 'Shalini', lastName: 'Thakur', posCode: 'PAY_ANALYST', deptCode: 'FIN', schedule: 'STD40', wage: '60000.00', structure: 'REGULAR', status: 'ON_NOTICE', managerCode: 'EMP-00011', joining: '2024-06-01' },
  { firstName: 'Prasad', lastName: 'Hegde', posCode: 'FIN_CTRL', deptCode: 'FIN', schedule: 'STD40', wage: '100000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00009', joining: '2026-03-01' },

  // Sales & BD (deptCode: SALES) — 10 employees
  { firstName: 'Arun', lastName: 'Nayak', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '88000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-03-01' },
  { firstName: 'Pallavi', lastName: 'Shetty', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '85000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-05-01' },
  { firstName: 'Mayur', lastName: 'Kadam', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '90000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-08-01' },
  { firstName: 'Priyanka', lastName: 'Deshpande', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '82000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-11-01' },
  { firstName: 'Yogesh', lastName: 'Mane', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '87000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-02-01' },
  { firstName: 'Shweta', lastName: 'Gaikwad', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '84000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-04-01' },
  { firstName: 'Akash', lastName: 'Jadhav', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '86000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-07-01' },
  { firstName: 'Sneha', lastName: 'Kulkarni', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '83000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-10-01' },
  { firstName: 'Omkar', lastName: 'Pawar', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '81000.00', structure: 'REGULAR', status: 'EXITED', managerCode: 'EMP-00004', joining: '2024-01-15', exit: '2025-11-30' },
  { firstName: 'Ashwini', lastName: 'Bhosale', posCode: 'SALES_EXEC', deptCode: 'SALES', schedule: 'STD40', wage: '79000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2026-04-01' },

  // Marketing & Brand (deptCode: MKTG) — 8 employees
  { firstName: 'Sarika', lastName: 'Wagh', posCode: 'SR_PM', deptCode: 'MKTG', schedule: 'STD40', wage: '110000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-04-01' },
  { firstName: 'Nitin', lastName: 'More', posCode: 'UIUX_LEAD', deptCode: 'MKTG', schedule: 'STD40', wage: '95000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-06-01' },
  { firstName: 'Gauri', lastName: 'Chavan', posCode: 'HR_SPEC', deptCode: 'MKTG', schedule: 'STD40', wage: '72000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2024-09-01' },
  { firstName: 'Sameer', lastName: 'Gadkari', posCode: 'SR_PM', deptCode: 'MKTG', schedule: 'STD40', wage: '108000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-01-01' },
  { firstName: 'Rucha', lastName: 'Joshi', posCode: 'UIUX_LEAD', deptCode: 'MKTG', schedule: 'STD40', wage: '92000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-04-01' },
  { firstName: 'Nilesh', lastName: 'Shirke', posCode: 'HR_SPEC', deptCode: 'MKTG', schedule: 'STD40', wage: '68000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-08-01' },
  { firstName: 'Prachi', lastName: 'Kale', posCode: 'SR_PM', deptCode: 'MKTG', schedule: 'STD40', wage: '105000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2025-11-01' },
  { firstName: 'Aniket', lastName: 'Sawant', posCode: 'UIUX_LEAD', deptCode: 'MKTG', schedule: 'STD40', wage: '90000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00004', joining: '2026-02-01' },

  // Operations & IT (deptCode: OPS) — 8 employees
  { firstName: 'Kedar', lastName: 'Lele', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '120000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2024-04-01' },
  { firstName: 'Tejashri', lastName: 'Ghosh', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '115000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2024-08-01' },
  { firstName: 'Abhijit', lastName: 'Mukherjee', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '112000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2024-11-01' },
  { firstName: 'Varsha', lastName: 'Chatterjee', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '108000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2025-03-01' },
  { firstName: 'Sachin', lastName: 'Banerjee', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '110000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2025-06-01' },
  { firstName: 'Ketaki', lastName: 'Sen', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '106000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2025-09-01' },
  { firstName: 'Prasanna', lastName: 'Das', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '104000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00006', joining: '2025-12-01' },
  { firstName: 'Chaitali', lastName: 'Roy', posCode: 'DEVOPS_ENG', deptCode: 'OPS', schedule: 'OPS45', wage: '102000.00', structure: 'REGULAR', status: 'ONBOARDING', managerCode: 'EMP-00006', joining: '2026-08-20' },

  // Customer Success (deptCode: CS) — 10 employees
  { firstName: 'Harshada', lastName: 'Mhatre', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '98000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2024-04-01' },
  { firstName: 'Shantanu', lastName: 'Naik', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '95000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2024-07-01' },
  { firstName: 'Rutuja', lastName: 'Rane', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '92000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2024-10-01' },
  { firstName: 'Pranav', lastName: 'Karmarkar', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '90000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2025-01-15' },
  { firstName: 'Smita', lastName: 'Khandare', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '88000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2025-04-01' },
  { firstName: 'Amol', lastName: 'Salunke', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '86000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2025-07-01' },
  { firstName: 'Ashwini', lastName: 'Dhamne', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '84000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2025-10-01' },
  { firstName: 'Rahul', lastName: 'Shinde', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '82000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2026-01-15' },
  { firstName: 'Shraddha', lastName: 'Phulse', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '80000.00', structure: 'REGULAR', status: 'ACTIVE', managerCode: 'EMP-00012', joining: '2026-04-01' },
  { firstName: 'Gaurav', lastName: 'Sutar', posCode: 'CS_LEAD', deptCode: 'CS', schedule: 'STD40', wage: '78000.00', structure: 'REGULAR', status: 'EXITED', managerCode: 'EMP-00012', joining: '2024-02-01', exit: '2025-10-31' },
];

// ---------------------------------------------------------------------------
// Bank details pool — rotated by index
// ---------------------------------------------------------------------------
const BANKS = [
  { name: 'HDFC Bank', ifsc: 'HDFC0001234' },
  { name: 'ICICI Bank', ifsc: 'ICIC0000456' },
  { name: 'State Bank of India', ifsc: 'SBIN0001234' },
  { name: 'Axis Bank', ifsc: 'UTIB0001234' },
  { name: 'Kotak Mahindra Bank', ifsc: 'KKBK0001234' },
  { name: 'Yes Bank', ifsc: 'YESB0001234' },
  { name: 'Punjab National Bank', ifsc: 'PUNB0001234' },
  { name: 'Bank of Baroda', ifsc: 'BARB0001234' },
];

function bankFor(idx) {
  const b = BANKS[idx % BANKS.length];
  const acct = String(100000000000 + idx * 7 + 31337).slice(0, 12);
  return { bankName: b.name, bankIfscCode: b.ifsc, bankAccountNumber: acct };
}

// ---------------------------------------------------------------------------
// Time-off request generator helpers
// ---------------------------------------------------------------------------
const LEAVE_REASONS = {
  PL: [
    'Annual family vacation trip',
    'Attending cousin\'s wedding ceremony',
    'Personal health check-up and rest',
    'Religious festival travel',
    'Visit to hometown parents',
    'Pre-planned international trip',
  ],
  SL: [
    'Viral fever and doctor visit',
    'Migraine episode requiring rest',
    'Dental appointment and recovery',
    'COVID booster side effects',
    'Back pain and physiotherapy session',
    'Seasonal allergic reaction',
  ],
  CL: [
    'Bank documentation and account work',
    'Passport renewal at passport office',
    'House maintenance and repair work',
    'Children\'s school admission process',
    'Government office paperwork',
    'Vehicle service and insurance renewal',
  ],
  WFH: [
    'Plumbing repair at residence',
    'Home broadband upgrade appointment',
    'Parcel delivery requiring presence',
    'AC servicing at home',
    'Parent visiting from hometown',
    'Remote team collaboration sprint',
  ],
};

function pickReason(type, idx) {
  const arr = LEAVE_REASONS[type];
  return arr[idx % arr.length];
}

// ---------------------------------------------------------------------------
// Main expansion seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== PeoplePay360 — Large Data Expansion Seed ===');
  const startTime = Date.now();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // -------------------------------------------------------------------------
  // Load existing lookup records from DB (created by base seed)
  // -------------------------------------------------------------------------
  console.log('\n[1/9] Loading existing lookups from database...');

  const depts = await prisma.department.findMany();
  const deptMap = Object.fromEntries(depts.map((d) => [d.code, d]));

  const positions = await prisma.jobPosition.findMany();
  const posMap = Object.fromEntries(positions.map((p) => [p.code, p]));

  const schedules = await prisma.workingSchedule.findMany();
  const scheduleMap = Object.fromEntries(schedules.map((s) => [s.code, s]));

  const structures = await prisma.salaryStructure.findMany({ include: { rules: true } });
  const structureMap = {
    REGULAR: structures.find((s) => s.code === 'REGULAR'),
    EXEC: structures.find((s) => s.code === 'EXEC'),
    INTERN_CONTRACT: structures.find((s) => s.code === 'INTERN_CONTRACT'),
  };

  const leaveTypes = await prisma.timeOffType.findMany();
  const leaveTypeMap = Object.fromEntries(leaveTypes.map((lt) => [lt.code, lt]));

  // Load existing employees for manager resolution
  const existingEmployees = await prisma.employee.findMany();
  const existingEmpByCode = Object.fromEntries(existingEmployees.map((e) => [e.employeeCode, e]));

  // Load HR manager user for approvals
  const hrManagerUser = await prisma.user.findFirst({ where: { email: 'hr.manager@peoplepay360.com' } });
  const payrollManagerUser = await prisma.user.findFirst({ where: { email: 'payroll.manager@peoplepay360.com' } });

  // Find existing payruns to add new payslips into
  const existingPayruns = await prisma.payrun.findMany({ orderBy: { periodLabel: 'asc' } });

  // Highest existing employee code number
  const existingCodes = existingEmployees.map((e) => {
    const match = e.employeeCode.match(/EMP-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  let nextEmpNum = Math.max(...existingCodes) + 1;

  console.log(`  Loaded: ${depts.length} depts, ${positions.length} positions, ${schedules.length} schedules`);
  console.log(`  Loaded: ${structures.length} salary structures, ${leaveTypes.length} leave types`);
  console.log(`  Existing employees: ${existingEmployees.length} (next code: EMP-${String(nextEmpNum).padStart(5, '0')})`);
  console.log(`  Existing payruns: ${existingPayruns.length}`);

  // -------------------------------------------------------------------------
  // [2/9] Create 80 new employees
  // -------------------------------------------------------------------------
  console.log('\n[2/9] Creating 80 new employees...');
  const newEmpMap = {}; // firstName+lastName → employee record
  let empCreatedCount = 0;

  for (let i = 0; i < EXTRA_EMPLOYEES.length; i++) {
    const ed = EXTRA_EMPLOYEES[i];
    const code = `EMP-${String(nextEmpNum).padStart(5, '0')}`;
    nextEmpNum++;

    const fullName = `${ed.firstName} ${ed.lastName}`;
    const workEmail = `${ed.firstName.toLowerCase()}.${ed.lastName.toLowerCase().replace(/[' ]/g, '')}.x@peoplepay360.com`;

    const bank = bankFor(i + 100);
    const dept = deptMap[ed.deptCode];
    const pos = posMap[ed.posCode];
    const schedule = scheduleMap[ed.schedule];

    const emp = await prisma.employee.create({
      data: {
        employeeCode: code,
        firstName: ed.firstName,
        lastName: ed.lastName,
        fullName,
        workEmail,
        phone: `+91 9${String(8000000000 + i * 1234567 % 1000000000).slice(0, 9)}`,
        status: ed.status,
        departmentId: dept.id,
        jobPositionId: pos.id,
        workingScheduleId: schedule.id,
        dateOfJoining: new Date(ed.joining),
        dateOfExit: ed.exit ? new Date(ed.exit) : null,
        bankAccountName: fullName,
        bankAccountNumber: bank.bankAccountNumber,
        bankIfscCode: bank.bankIfscCode,
        bankName: bank.bankName,
      },
    });

    newEmpMap[`${ed.firstName}_${ed.lastName}`] = { emp, ed, code };
    empCreatedCount++;
  }

  // Pass 2: Set manager relations
  for (const key of Object.keys(newEmpMap)) {
    const { emp, ed } = newEmpMap[key];
    if (ed.managerCode) {
      const mgr = existingEmpByCode[ed.managerCode];
      if (mgr) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { managerId: mgr.id },
        });
      }
    }
  }

  console.log(`  ✓ Created ${empCreatedCount} employees.`);

  // Flat array of new employee records for further processing
  const newEmps = Object.values(newEmpMap).map(({ emp, ed }) => ({ emp, ed }));

  // -------------------------------------------------------------------------
  // [3/9] Create contracts for new employees
  // -------------------------------------------------------------------------
  console.log('\n[3/9] Creating contracts for new employees...');
  const newActiveContracts = []; // { contract, emp, ed } — only ACTIVE ones for payroll
  let contractCount = 0;

  for (let i = 0; i < newEmps.length; i++) {
    const { emp, ed } = newEmps[i];
    const structure = structureMap[ed.structure] || structureMap.REGULAR;
    const pos = posMap[ed.posCode];
    const dept = deptMap[ed.deptCode];

    const isExited = ed.status === 'EXITED';
    const isOnboarding = ed.status === 'ONBOARDING';

    // Active / current contract
    const activeContract = await prisma.contract.create({
      data: {
        reference: `CTR-EXP-${String(i + 1).padStart(4, '0')}`,
        employeeId: emp.id,
        status: isOnboarding ? 'DRAFT' : isExited ? 'EXPIRED' : 'ACTIVE',
        startDate: isExited ? new Date(ed.joining) : new Date('2026-01-01'),
        endDate: isExited && ed.exit ? new Date(ed.exit) : null,
        wage: new Prisma.Decimal(ed.wage),
        wageType: 'MONTHLY',
        currency: 'INR',
        salaryStructureId: structure.id,
        jobPositionId: pos.id,
        departmentNameSnapshot: dept.name,
        jobTitleSnapshot: pos.title,
      },
    });
    contractCount++;

    if (activeContract.status === 'ACTIVE') {
      newActiveContracts.push({ contract: activeContract, emp, ed });
    }

    // Historical expired contract for employees who joined before 2026
    const joiningYear = new Date(ed.joining).getFullYear();
    if (joiningYear <= 2025 && !isOnboarding) {
      const histStart = new Date(ed.joining);
      const histEnd = new Date('2025-12-31');
      if (histStart < histEnd) {
        await prisma.contract.create({
          data: {
            reference: `CTR-HIST-${String(i + 1).padStart(4, '0')}`,
            employeeId: emp.id,
            status: 'EXPIRED',
            startDate: histStart,
            endDate: histEnd,
            wage: new Prisma.Decimal((parseFloat(ed.wage) * 0.85).toFixed(2)),
            wageType: 'MONTHLY',
            currency: 'INR',
            salaryStructureId: structure.id,
            jobPositionId: pos.id,
            departmentNameSnapshot: dept.name,
            jobTitleSnapshot: `${pos.title} (Previous)`,
          },
        });
        contractCount++;
      }
    }
  }
  console.log(`  ✓ Created ${contractCount} contracts (${newActiveContracts.length} active).`);

  // -------------------------------------------------------------------------
  // [4/9] Create leave allocations for active/notice employees
  // -------------------------------------------------------------------------
  console.log('\n[4/9] Creating leave allocations...');
  const allocMap = {}; // `${empId}_${typeCode}` → allocation
  let allocCount = 0;

  const ALLOC_TEMPLATES = [
    { type: 'PL', units: '20.000', taken: '2.000', notes: 'Annual privilege leave FY2026' },
    { type: 'SL', units: '12.000', taken: '1.000', notes: 'Sick & medical leave FY2026' },
    { type: 'CL', units: '8.000', taken: '1.000', notes: 'Casual leave FY2026' },
    { type: 'WFH', units: '24.000', taken: '4.000', notes: 'Remote work allocation FY2026' },
  ];

  for (const { emp, ed } of newEmps) {
    if (ed.status === 'EXITED') continue;

    for (const al of ALLOC_TEMPLATES) {
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
  console.log(`  ✓ Created ${allocCount} leave allocations.`);

  // -------------------------------------------------------------------------
  // [5/9] Create leave requests
  // -------------------------------------------------------------------------
  console.log('\n[5/9] Creating leave requests...');
  let requestCount = 0;
  let reqRefNum = 200; // start reference counter after existing ones

  // Statuses cycle: APPROVED, APPROVED, PENDING, PENDING, REFUSED
  const STATUS_CYCLE = ['APPROVED', 'APPROVED', 'PENDING', 'PENDING', 'REFUSED'];

  // Leave type cycle: PL, SL, CL, WFH, PL, SL ...
  const TYPE_CYCLE = ['PL', 'SL', 'CL', 'WFH', 'PL'];

  // Approved request base dates (spread over the last 6 months)
  const APPROVED_DATES = [
    { start: '2026-01-20', end: '2026-01-22', dur: '3.000' },
    { start: '2026-02-14', end: '2026-02-14', dur: '1.000' },
    { start: '2026-03-08', end: '2026-03-09', dur: '2.000' },
    { start: '2026-04-18', end: '2026-04-20', dur: '3.000' },
    { start: '2026-05-25', end: '2026-05-26', dur: '2.000' },
    { start: '2026-06-12', end: '2026-06-12', dur: '1.000' },
  ];
  // Pending request dates (near-future)
  const PENDING_DATES = [
    { start: '2026-09-20', end: '2026-09-22', dur: '3.000' },
    { start: '2026-10-06', end: '2026-10-07', dur: '2.000' },
    { start: '2026-10-15', end: '2026-10-15', dur: '1.000' },
    { start: '2026-11-03', end: '2026-11-05', dur: '3.000' },
  ];
  // Refused request dates (past months)
  const REFUSED_DATES = [
    { start: '2026-03-29', end: '2026-03-31', dur: '3.000' },
    { start: '2026-06-30', end: '2026-06-30', dur: '1.000' },
  ];

  for (let i = 0; i < newEmps.length; i++) {
    const { emp, ed } = newEmps[i];
    if (ed.status === 'EXITED' || ed.status === 'SUSPENDED') continue;

    const statusChoice = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const typeChoice = TYPE_CYCLE[i % TYPE_CYCLE.length];
    const alloc = allocMap[`${emp.id}_${typeChoice}`];

    let dateInfo;
    let approvedById = null;
    let approvedAt = null;
    let refusalReason = null;

    if (statusChoice === 'APPROVED') {
      dateInfo = APPROVED_DATES[i % APPROVED_DATES.length];
      approvedById = hrManagerUser?.id || null;
      approvedAt = new Date(dateInfo.start);
      approvedAt.setDate(approvedAt.getDate() - 3);
    } else if (statusChoice === 'PENDING') {
      dateInfo = PENDING_DATES[i % PENDING_DATES.length];
    } else {
      dateInfo = REFUSED_DATES[i % REFUSED_DATES.length];
      approvedById = hrManagerUser?.id || null;
      approvedAt = new Date(dateInfo.start);
      approvedAt.setDate(approvedAt.getDate() - 2);
      refusalReason = 'Critical business period — all hands required on-site.';
    }

    await prisma.timeOffRequest.create({
      data: {
        reference: `TOR-EXP-${String(reqRefNum).padStart(4, '0')}`,
        employeeId: emp.id,
        timeOffTypeId: leaveTypeMap[typeChoice].id,
        allocationId: alloc?.id || null,
        startDate: new Date(dateInfo.start),
        endDate: new Date(dateInfo.end),
        duration: new Prisma.Decimal(dateInfo.dur),
        unit: 'DAYS',
        status: statusChoice,
        reason: pickReason(typeChoice, i),
        approvedById,
        approvedAt,
        refusalReason,
      },
    });

    reqRefNum++;
    requestCount++;
  }
  console.log(`  ✓ Created ${requestCount} leave requests.`);

  // -------------------------------------------------------------------------
  // [6/9] Attendance records — 90 business days for new employees
  // -------------------------------------------------------------------------
  console.log('\n[6/9] Generating 90 days of attendance records for new employees...');

  // Only generate attendance for ACTIVE and ON_NOTICE employees (not EXITED, ONBOARDING, SUSPENDED)
  const attendanceEligible = newEmps.filter(({ ed }) =>
    ['ACTIVE', 'ON_NOTICE'].includes(ed.status)
  );

  const now = new Date();
  const attendancesToInsert = [];
  let businessDaysCount = 0;
  let dayOffset = 1;

  while (businessDaysCount < 90 && dayOffset < 135) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOffset);
    dayOffset++;

    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    businessDaysCount++;

    const dateOnly = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    for (let i = 0; i < attendanceEligible.length; i++) {
      const { emp, ed } = attendanceEligible[i];

      // Skip if employee hadn't joined yet
      const joiningDate = new Date(ed.joining);
      if (dateOnly < joiningDate) continue;

      const seedVal = (businessDaysCount * 11 + i * 17) % 100;

      let status = 'PRESENT';
      let checkInHour = 8;
      let checkInMinute = 55 + (seedVal % 15);
      let checkOutHour = 18;
      let checkOutMinute = 5 + (seedVal % 25);
      let workedHours = new Prisma.Decimal('8.50');
      let isManualCorrection = false;
      let correctionReason = null;
      let correctedById = null;

      if (seedVal < 5) {
        status = 'LATE';
        checkInHour = 9;
        checkInMinute = 40 + (seedVal % 20);
        workedHours = new Prisma.Decimal('7.25');
      } else if (seedVal < 9) {
        status = 'OVERTIME';
        checkOutHour = 20;
        checkOutMinute = 0;
        workedHours = new Prisma.Decimal('11.00');
      } else if (seedVal < 12) {
        status = 'EARLY_LEAVE';
        checkOutHour = 15;
        checkOutMinute = 30;
        workedHours = new Prisma.Decimal('5.75');
      } else if (seedVal < 14) {
        status = 'HALF_DAY';
        checkOutHour = 13;
        checkOutMinute = 0;
        workedHours = new Prisma.Decimal('4.00');
      } else if (seedVal === 17) {
        status = 'ABSENT';
        workedHours = new Prisma.Decimal('0.00');
      } else if (seedVal === 33) {
        status = 'ON_LEAVE';
        workedHours = new Prisma.Decimal('0.00');
      }

      // Occasional biometric correction
      if (seedVal === 6 || seedVal === 11) {
        isManualCorrection = true;
        correctionReason = seedVal === 6
          ? 'Biometric reader malfunction — card swipe not recorded'
          : 'Employee was on client premises; entry logged manually';
        correctedById = hrManagerUser?.id || null;
      }

      const checkInDate = !['ABSENT', 'ON_LEAVE'].includes(status) ? new Date(dateOnly) : null;
      if (checkInDate) checkInDate.setUTCHours(checkInHour, checkInMinute, 0, 0);

      const checkOutDate = !['ABSENT', 'ON_LEAVE'].includes(status) ? new Date(dateOnly) : null;
      if (checkOutDate) checkOutDate.setUTCHours(checkOutHour, checkOutMinute, 0, 0);

      attendancesToInsert.push({
        employeeId: emp.id,
        date: dateOnly,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workedHours,
        status,
        source: ['WEB', 'MOBILE', 'BIOMETRIC', 'WEB', 'WEB'][i % 5],
        isManualCorrection,
        correctionReason,
        correctedById,
      });
    }
  }

  // Batch insert in chunks of 500 to avoid parameter limits
  const CHUNK = 500;
  for (let i = 0; i < attendancesToInsert.length; i += CHUNK) {
    await prisma.attendance.createMany({ data: attendancesToInsert.slice(i, i + CHUNK) });
  }
  console.log(`  ✓ Created ${attendancesToInsert.length} attendance records across ${businessDaysCount} business days.`);

  // -------------------------------------------------------------------------
  // [7/9] Add new employees to existing payruns (payslips + lines)
  // -------------------------------------------------------------------------
  console.log('\n[7/9] Adding new employees to existing payruns...');

  // Only ACTIVE contract employees eligible for payroll
  const eligibleForPayroll = newActiveContracts;

  let totalPayslipsCreated = 0;
  let totalLinesCreated = 0;

  for (let pIdx = 0; pIdx < existingPayruns.length; pIdx++) {
    const payrun = existingPayruns[pIdx];
    const pStart = new Date(payrun.periodStart);
    const pEnd = new Date(payrun.periodEnd);

    let runGrossDelta = 0;
    let runNetDelta = 0;
    let runDeductionsDelta = 0;

    for (let cIdx = 0; cIdx < eligibleForPayroll.length; cIdx++) {
      const { contract, emp } = eligibleForPayroll[cIdx];

      // Skip if employee joined after this period ended
      if (new Date(emp.dateOfJoining) > pEnd) continue;

      const structure = structures.find((s) => s.id === contract.salaryStructureId) || structureMap.REGULAR;
      const rules = structure.rules;
      const workedDays = pEnd.getDate();

      const computation = computeSalaryRules(rules, {
        contractWage: contract.wage,
        periodDays: workedDays,
        workedDays,
        unpaidLeaveDays: 0,
      });

      // Build a unique reference: PR period label + employee index
      const psRef = `PS-EXP-${payrun.periodLabel}-${String(cIdx + 1).padStart(3, '0')}`;

      // Avoid duplicate (payrunId, employeeId) — skip if already exists
      const existing = await prisma.payslip.findFirst({
        where: { payrunId: payrun.id, employeeId: emp.id },
      });
      if (existing) continue;

      const payslip = await prisma.payslip.create({
        data: {
          reference: psRef,
          payrunId: payrun.id,
          employeeId: emp.id,
          contractId: contract.id,
          salaryStructureId: contract.salaryStructureId,
          periodStart: pStart,
          periodEnd: pEnd,
          periodLabel: payrun.periodLabel,
          status: payrun.status === 'PAID' ? 'PAID' : payrun.status === 'VALIDATED' ? 'VALIDATED' : payrun.status === 'COMPUTED' ? 'COMPUTED' : 'DRAFT',
          currency: 'INR',
          workedDays: new Prisma.Decimal(String(workedDays)),
          grossAmount: computation.grossAmount,
          netAmount: computation.netAmount,
        },
      });

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

      runGrossDelta += Number(computation.grossAmount);
      runNetDelta += Number(computation.netAmount);
      runDeductionsDelta += Number(computation.grossAmount) - Number(computation.netAmount);

      totalPayslipsCreated++;
      totalLinesCreated += computation.lines.length;
    }

    // Update payrun totals (add delta)
    if (runGrossDelta > 0) {
      const pr = await prisma.payrun.findUnique({ where: { id: payrun.id } });
      await prisma.payrun.update({
        where: { id: payrun.id },
        data: {
          totalGross: new Prisma.Decimal((Number(pr.totalGross) + runGrossDelta).toFixed(2)),
          totalNet: new Prisma.Decimal((Number(pr.totalNet) + runNetDelta).toFixed(2)),
          totalDeductions: new Prisma.Decimal((Number(pr.totalDeductions) + runDeductionsDelta).toFixed(2)),
          employeeCount: pr.employeeCount + eligibleForPayroll.filter(({ emp }) => new Date(emp.dateOfJoining) <= pEnd).length,
        },
      });
    }
  }
  console.log(`  ✓ Created ${totalPayslipsCreated} payslips with ${totalLinesCreated} itemized lines.`);

  // -------------------------------------------------------------------------
  // [8/9] Create user logins for select new employees (tech leads & managers)
  // -------------------------------------------------------------------------
  console.log('\n[8/9] Creating user login accounts for key new employees...');
  let loginCount = 0;

  const LOGIN_ROLES = ['SR_BE_ENG', 'FE_LEAD', 'SR_PM', 'CS_LEAD', 'DEVOPS_ENG', 'FIN_CTRL', 'TALENT_LEAD'];

  for (const { emp, ed } of newEmps) {
    if (!LOGIN_ROLES.includes(ed.posCode)) continue;
    if (ed.status === 'EXITED' || ed.status === 'SUSPENDED') continue;

    // Check if user already exists for this employee
    const existing = await prisma.user.findFirst({ where: { employeeId: emp.id } });
    if (existing) continue;

    const emailCheck = await prisma.user.findFirst({ where: { email: emp.workEmail } });
    if (emailCheck) continue;

    await prisma.user.create({
      data: {
        email: emp.workEmail,
        passwordHash,
        role: 'EMPLOYEE',
        isActive: true,
        employeeId: emp.id,
      },
    });
    loginCount++;
  }
  console.log(`  ✓ Created ${loginCount} user login accounts.`);

  // -------------------------------------------------------------------------
  // [9/9] Final summary
  // -------------------------------------------------------------------------
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`=== EXPANSION SEEDING COMPLETE IN ${elapsed}s ===`);
  console.log('='.repeat(60));
  console.log(`New Employees:         ${empCreatedCount}`);
  console.log(`New Contracts:         ${contractCount}`);
  console.log(`New Leave Allocs:      ${allocCount}`);
  console.log(`New Leave Requests:    ${requestCount}`);
  console.log(`New Attendance Logs:   ${attendancesToInsert.length}`);
  console.log(`New Payslips:          ${totalPayslipsCreated}`);
  console.log(`New Payslip Lines:     ${totalLinesCreated}`);
  console.log(`New User Logins:       ${loginCount}`);
  console.log('='.repeat(60));

  // Count totals
  const totalEmps = await prisma.employee.count();
  const totalContracts = await prisma.contract.count();
  const totalAttendance = await prisma.attendance.count();
  const totalPayslips = await prisma.payslip.count();
  const totalAllocations = await prisma.timeOffAllocation.count();
  const totalRequests = await prisma.timeOffRequest.count();
  const totalPayslipLines = await prisma.payslipLine.count();

  console.log('\n📊 DATABASE TOTALS (base + expansion):');
  console.log(`   Employees:         ${totalEmps}`);
  console.log(`   Contracts:         ${totalContracts}`);
  console.log(`   Attendance Logs:   ${totalAttendance}`);
  console.log(`   Leave Allocations: ${totalAllocations}`);
  console.log(`   Leave Requests:    ${totalRequests}`);
  console.log(`   Payslips:          ${totalPayslips}`);
  console.log(`   Payslip Lines:     ${totalPayslipLines}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Fatal expansion seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
