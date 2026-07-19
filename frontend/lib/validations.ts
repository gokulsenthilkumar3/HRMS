/**
 * Zod validation schemas for all HRMS forms.
 * Use with React Hook Form via zodResolver().
 * Resolves Issue #1, #4, #5, #6: Form validation across all modules
 */
import { z } from 'zod';

// ─── Auth ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only digits'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;

// ─── Employee ────────────────────────────────────────────────────────────────
const today = new Date();
const minDOB = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

export const employeeSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain letters only'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain letters only'),
  email: z.string().email('Enter a valid email address'),
  phone: z
    .string()
    .regex(
      /^(\+91[6-9]\d{9}|\+[1-9]\d{6,14})$/,
      'Enter a valid Indian mobile (+91XXXXXXXXXX) or international number'
    ),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const dob = new Date(val);
      return dob <= minDOB;
    }, 'Employee must be at least 18 years old')
    .refine((val) => new Date(val) <= today, 'Date of birth cannot be in the future'),
  aadhar: z
    .string()
    .regex(/^[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/, 'Enter a valid 12-digit Aadhar number')
    .optional()
    .or(z.literal('')),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Enter a valid PAN (e.g. ABCDE1234F)')
    .optional()
    .or(z.literal('')),
  department: z.enum(
    ['engineering', 'hr', 'finance', 'marketing', 'sales', 'operations', 'legal', 'design'] as const,
    { message: 'Select a valid department' }
  ),
  designation: z.string().min(2, 'Designation is required'),
  employmentType: z.enum(['fullTime', 'partTime', 'contract', 'intern']),
  dateOfJoining: z.string().refine((val) => new Date(val) <= today, 'Joining date cannot be in the future'),
  salary: z
    .number({ message: 'Salary must be a number' })
    .positive('Salary must be a positive number')
    .multipleOf(0.01, 'Max 2 decimal places'),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

// ─── Payroll / Bank Details ───────────────────────────────────────────────────
export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountNumber: z
    .string()
    .regex(/^[0-9]{9,18}$/, 'Account number must be 9-18 digits'),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g. SBIN0001234)'),
  bankName: z.string().min(2, 'Bank name is required'),
  branchName: z.string().min(2, 'Branch name is required'),
});

export type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

// ─── Attendance / Leave ───────────────────────────────────────────────────────
export const leaveRequestSchema = z
  .object({
    leaveType: z.enum(['casual', 'sick', 'earned', 'maternity', 'paternity', 'lop'] as const, {
      message: 'Select a valid leave type',
    }),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
    isHalfDay: z.boolean().default(false),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: 'End date must be on or after start date', path: ['endDate'] }
  );

export const attendanceEntrySchema = z
  .object({
    checkIn: z.string().min(1, 'Check-in time is required'),
    checkOut: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().max(200).optional(),
  })
  .refine(
    (data) => {
      if (!data.checkOut) return true;
      return data.checkOut > data.checkIn;
    },
    { message: 'Check-out must be after check-in', path: ['checkOut'] }
  );

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
export type AttendanceEntryFormData = z.infer<typeof attendanceEntrySchema>;

// ─── Job Posting (Recruitment) ────────────────────────────────────────────────
export const jobPostingSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(2, 'Location is required'),
  type: z.enum(['fullTime', 'partTime', 'contract', 'intern']),
  salaryMin: z.number().positive('Minimum salary must be positive'),
  salaryMax: z.number().positive('Maximum salary must be positive'),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  requirements: z.string().min(20, 'Requirements must be at least 20 characters'),
  deadline: z.string().refine((val) => new Date(val) > today, 'Deadline must be in the future'),
}).refine(
  (data) => data.salaryMax >= data.salaryMin,
  { message: 'Maximum salary must be >= minimum salary', path: ['salaryMax'] }
);

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;
