import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import departmentRoutes from './department.routes.js';
import jobPositionRoutes from './jobPosition.routes.js';
import workingScheduleRoutes from './workingSchedule.routes.js';
import employeeRoutes from './employee.routes.js';
import contractRoutes from './contract.routes.js';
import attendanceRoutes from './attendance.routes.js';
import timeOffRoutes from './timeOff.routes.js';
import salaryRoutes from './salary.routes.js';
import payrunRoutes from './payrun.routes.js';
import payslipRoutes from './payslip.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/job-positions', jobPositionRoutes);
router.use('/working-schedules', workingScheduleRoutes);
router.use('/employees', employeeRoutes);
router.use('/contracts', contractRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/time-off', timeOffRoutes);
router.use('/salary-structures', salaryRoutes);
router.use('/payruns', payrunRoutes);
router.use('/payslips', payslipRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

export default router;
