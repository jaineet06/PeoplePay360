import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Landmark,
  ShieldAlert,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import { useEmployee } from './hooks/useEmployee';
import {
  useCreateEmployee,
  useUpdateEmployee,
} from './hooks/useEmployeeMutations';
import {
  useDepartmentsLookup,
  useJobPositionsLookup,
  useWorkingSchedulesLookup,
  useManagersLookup,
} from './hooks/useLookups';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { handleApiError } from '@/utils/handleApiError';
import { toast } from '@/components/ui/Toast';

const STATUSES = ['ONBOARDING', 'ACTIVE', 'ON_NOTICE', 'SUSPENDED', 'EXITED'];
const ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

const employeeFormSchema = z.object({
  employeeCode: z.string().trim().max(32).optional().or(z.literal('')),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  fullName: z.string().trim().max(160).optional().or(z.literal('')),
  workEmail: z.string().trim().min(1, 'Work email is required').email('Valid email required'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  status: z.enum(STATUSES).default('ONBOARDING'),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  dateOfExit: z.string().optional().or(z.literal('')),

  departmentId: z.string().optional().or(z.literal('')),
  jobPositionId: z.string().optional().or(z.literal('')),
  workingScheduleId: z.string().optional().or(z.literal('')),
  managerId: z.string().optional().or(z.literal('')),

  bankAccountName: z.string().trim().max(120).optional().or(z.literal('')),
  bankAccountNumber: z.string().trim().max(34).optional().or(z.literal('')),
  bankIfscCode: z.string().trim().max(11).optional().or(z.literal('')),
  bankName: z.string().trim().max(120).optional().or(z.literal('')),

  createUserAccount: z.boolean().default(false),
  userRole: z.enum(ROLES).default('EMPLOYEE'),
  userEmail: z.string().trim().optional().or(z.literal('')),
});

export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Lookups
  const { data: departments = [] } = useDepartmentsLookup();
  const { data: jobPositions = [] } = useJobPositionsLookup();
  const { data: workingSchedules = [] } = useWorkingSchedulesLookup();
  const { data: managers = [] } = useManagersLookup();

  // Existing employee query if edit mode
  const { data: existingEmployee, isLoading: isEmployeeLoading } = useEmployee(id);

  // Mutations
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  // Modal for temporary password on creation
  const [tempPasswordResult, setTempPasswordResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeCode: '',
      firstName: '',
      lastName: '',
      fullName: '',
      workEmail: '',
      phone: '',
      status: 'ONBOARDING',
      dateOfJoining: new Date().toISOString().split('T')[0],
      dateOfExit: '',
      departmentId: '',
      jobPositionId: '',
      workingScheduleId: '',
      managerId: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankName: '',
      createUserAccount: false,
      userRole: 'EMPLOYEE',
      userEmail: '',
    },
  });

  const createUserAccount = watch('createUserAccount');

  // Populate fields in edit mode
  useEffect(() => {
    if (isEditMode && existingEmployee) {
      reset({
        employeeCode: existingEmployee.employeeCode || '',
        firstName: existingEmployee.firstName || '',
        lastName: existingEmployee.lastName || '',
        fullName: existingEmployee.fullName || '',
        workEmail: existingEmployee.workEmail || '',
        phone: existingEmployee.phone || '',
        status: existingEmployee.status || 'ACTIVE',
        dateOfJoining: existingEmployee.dateOfJoining
          ? existingEmployee.dateOfJoining.split('T')[0]
          : '',
        dateOfExit: existingEmployee.dateOfExit
          ? existingEmployee.dateOfExit.split('T')[0]
          : '',
        departmentId: existingEmployee.departmentId || '',
        jobPositionId: existingEmployee.jobPositionId || '',
        workingScheduleId: existingEmployee.workingScheduleId || '',
        managerId: existingEmployee.managerId || '',
        bankAccountName: existingEmployee.bankAccountName || '',
        bankAccountNumber: existingEmployee.bankAccountNumber || '',
        bankIfscCode: existingEmployee.bankIfscCode || '',
        bankName: existingEmployee.bankName || '',
        createUserAccount: false,
        userRole: 'EMPLOYEE',
        userEmail: '',
      });
    }
  }, [isEditMode, existingEmployee, reset]);

  const onSubmit = async (data) => {
    // Format payload for backend schema
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName || undefined,
      workEmail: data.workEmail,
      phone: data.phone || null,
      status: data.status,
      dateOfJoining: data.dateOfJoining,
      dateOfExit: data.dateOfExit || null,
      departmentId: data.departmentId || null,
      jobPositionId: data.jobPositionId || null,
      workingScheduleId: data.workingScheduleId || null,
      managerId: data.managerId || null,
      bankAccountName: data.bankAccountName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankIfscCode: data.bankIfscCode || null,
      bankName: data.bankName || null,
    };

    if (data.employeeCode) {
      payload.employeeCode = data.employeeCode;
    }

    if (!isEditMode && data.createUserAccount) {
      payload.createUser = {
        role: data.userRole,
        ...(data.userEmail ? { email: data.userEmail } : {}),
      };
    }

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id, payload });
        navigate(`/employees/${id}`);
      } else {
        const result = await createMutation.mutateAsync(payload);
        if (result.tempPassword) {
          setTempPasswordResult(result);
        } else {
          navigate(`/employees/${result.employee.id}`);
        }
      }
    } catch (err) {
      handleApiError(err, setError);
    }
  };

  const handleCopyPassword = () => {
    if (tempPasswordResult?.tempPassword) {
      navigator.clipboard.writeText(tempPasswordResult.tempPassword);
      setCopied(true);
      toast.success('Temporary password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isEditMode && isEmployeeLoading) {
    return <PageSkeleton />;
  }

  // Format dropdown options
  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const jobPositionOptions = jobPositions.map((p) => ({
    value: p.id,
    label: `${p.title} (${p.code})`,
  }));

  const workingScheduleOptions = workingSchedules.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
    subtext: `${Number(s.hoursPerWeek || 40).toFixed(1)} hrs/wk • ${s.workingDaysPerWeek || 5} days/wk • ${s.timezone || 'Asia/Kolkata'}`,
  }));

  const managerOptions = managers
    .filter((m) => !isEditMode || m.id !== id) // Can't be own manager
    .map((m) => ({
      value: m.id,
      label: `${m.fullName} (${m.employeeCode})`,
      subtext: m.workEmail,
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(isEditMode ? `/employees/${id}` : '/employees')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {isEditMode
                ? `Edit Employee — ${existingEmployee?.fullName || ''}`
                : 'Register New Employee'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? 'Update personnel details, department allocation, and banking info.'
                : 'Create employee record with optional system login account.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(isEditMode ? `/employees/${id}` : '/employees')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={Save}
            onClick={handleSubmit(onSubmit)}
          >
            {isEditMode ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal & Core Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-brand-600" />
              <CardTitle>Personal &amp; Employment Details</CardTitle>
            </div>
            <CardDescription>
              Basic identity, contact information, and employment lifecycle status.
            </CardDescription>
          </CardHeader>

          <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Employee Code"
              placeholder="e.g. EMP-001 (Auto-generated if blank)"
              error={errors.employeeCode?.message}
              helperText="Unique reference code"
              {...register('employeeCode')}
            />

            <Input
              label="First Name"
              placeholder="Jane"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              placeholder="Doe"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />

            <Input
              label="Full Name (Optional override)"
              placeholder="Jane Doe"
              error={errors.fullName?.message}
              helperText="Leave empty to use First + Last name"
              {...register('fullName')}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="jane.doe@company.com"
              required
              error={errors.workEmail?.message}
              {...register('workEmail')}
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 012-3456"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Select
              label="Lifecycle Status"
              required
              error={errors.status?.message}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
              {...register('status')}
            />

            <Input
              label="Date of Joining"
              type="date"
              required
              error={errors.dateOfJoining?.message}
              {...register('dateOfJoining')}
            />

            <Input
              label="Date of Exit (if applicable)"
              type="date"
              error={errors.dateOfExit?.message}
              {...register('dateOfExit')}
            />
          </CardBody>
        </Card>

        {/* Section 2: Organization & Reporting Structure */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              <CardTitle>Organization &amp; Schedule</CardTitle>
            </div>
            <CardDescription>
              Department allocation, job position, weekly working hours, and direct reporting line.
            </CardDescription>
          </CardHeader>

          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Department"
                  value={field.value}
                  onChange={field.onChange}
                  options={departmentOptions}
                  placeholder="Select department..."
                  searchPlaceholder="Filter departments..."
                  error={errors.departmentId?.message}
                />
              )}
            />

            <Controller
              name="jobPositionId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Job Position"
                  value={field.value}
                  onChange={field.onChange}
                  options={jobPositionOptions}
                  placeholder="Select position..."
                  searchPlaceholder="Filter positions..."
                  error={errors.jobPositionId?.message}
                />
              )}
            />

            <Controller
              name="workingScheduleId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Working Schedule"
                  value={field.value}
                  onChange={field.onChange}
                  options={workingScheduleOptions}
                  placeholder="Select working pattern..."
                  searchPlaceholder="Filter schedules..."
                  error={errors.workingScheduleId?.message}
                />
              )}
            />

            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Direct Manager"
                  value={field.value}
                  onChange={field.onChange}
                  options={managerOptions}
                  placeholder="Select manager..."
                  searchPlaceholder="Filter staff..."
                  error={errors.managerId?.message}
                />
              )}
            />
          </CardBody>
        </Card>

        {/* Section 3: Bank Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Landmark className="h-4 w-4 text-brand-600" />
              <CardTitle>Bank Account Information</CardTitle>
            </div>
            <CardDescription>
              Direct deposit destination for automated payslip disbursements.
            </CardDescription>
          </CardHeader>

          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              placeholder="e.g. JPMorgan Chase, Wells Fargo"
              error={errors.bankName?.message}
              {...register('bankName')}
            />

            <Input
              label="Beneficiary / Account Name"
              placeholder="Full name as on bank account"
              error={errors.bankAccountName?.message}
              {...register('bankAccountName')}
            />

            <Input
              label="Account Number"
              placeholder="Account or IBAN number"
              error={errors.bankAccountNumber?.message}
              {...register('bankAccountNumber')}
            />

            <Input
              label="Routing / IFSC Code"
              placeholder="Routing number or IFSC code"
              error={errors.bankIfscCode?.message}
              {...register('bankIfscCode')}
            />
          </CardBody>
        </Card>

        {/* Section 4: Login Account (Create Mode Only) */}
        {!isEditMode && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-brand-600" />
                <CardTitle>Platform Login Account</CardTitle>
              </div>
              <CardDescription>
                Optionally provision credentials for this employee to access the portal.
              </CardDescription>
            </CardHeader>

            <CardBody className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  {...register('createUserAccount')}
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Provision login user for this employee
                  </span>
                  <p className="text-[11px] text-slate-500">
                    A temporary password will be securely generated and displayed once upon submission.
                  </p>
                </div>
              </label>

              {createUserAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 animate-in fade-in-50 duration-150">
                  <Select
                    label="Assigned System Role"
                    required
                    error={errors.userRole?.message}
                    options={ROLES.map((r) => ({
                      value: r,
                      label: r.replace(/_/g, ' '),
                    }))}
                    {...register('userRole')}
                  />

                  <Input
                    label="Login Email (Defaults to work email)"
                    type="email"
                    placeholder="Leave blank to use work email"
                    error={errors.userEmail?.message}
                    {...register('userEmail')}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate(isEditMode ? `/employees/${id}` : '/employees')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={Save}
          >
            {isEditMode ? 'Save Employee' : 'Create Employee'}
          </Button>
        </div>
      </form>

      {/* Temp Password Modal shown once upon user account creation */}
      <Modal
        isOpen={Boolean(tempPasswordResult)}
        onClose={() => {
          const empId = tempPasswordResult?.employee?.id;
          setTempPasswordResult(null);
          navigate(`/employees/${empId}`);
        }}
        title="Account Provisioned Successfully"
        description="Temporary login credentials generated"
        footer={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const empId = tempPasswordResult?.employee?.id;
              setTempPasswordResult(null);
              navigate(`/employees/${empId}`);
            }}
          >
            Done, Proceed to Profile
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Important Security Notice:</span>
              This temporary password is shown <strong>only once</strong> and is not stored in plain text. Securely communicate this to the employee.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="text-xs text-slate-500 font-medium">Temporary Password:</div>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2">
              <span className="font-mono text-sm font-semibold text-slate-900 tracking-wider">
                {tempPasswordResult?.tempPassword}
              </span>
              <Button
                variant="secondary"
                size="xs"
                leftIcon={copied ? Check : Copy}
                onClick={handleCopyPassword}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="text-[11px] text-slate-500">
              Assigned Role: <strong>{tempPasswordResult?.user?.role}</strong> | Email: <strong>{tempPasswordResult?.user?.email}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeeFormPage;
