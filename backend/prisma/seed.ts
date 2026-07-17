/**
 * HRMS Full Database Seed
 * Run: npx prisma db seed
 *
 * Credentials:
 *   ADMIN   : admin@company.com        / password123
 *   MANAGER : manager@company.com      / Manager@2026
 *   HR MGR  : hr.manager@company.com   / HrManager@26
 *   USER    : emp001@company.com       / Emp@001
 *             emp002@company.com       / Emp@002
 *             ... up to emp008@company.com / Emp@008
 */

import { PrismaClient, UserRole, Gender, EmploymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function hash(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function main() {
  console.log('\n🌱 Starting HRMS database seed...\n');

  // =====================================================================
  // 1. LOCATIONS
  // =====================================================================
  const hq = await prisma.location.upsert({
    where: { name: 'Corporate HQ — Chennai' },
    update: {},
    create: { name: 'Corporate HQ — Chennai', address: '24, Rajiv Gandhi Salai, OMR, Chennai — 600096' },
  });
  const bangalore = await prisma.location.upsert({
    where: { name: 'Bangalore Office' },
    update: {},
    create: { name: 'Bangalore Office', address: '5th Floor, Prestige Tech Park, Outer Ring Road, Bengaluru — 560103' },
  });
  const rnd = await prisma.location.upsert({
    where: { name: 'R&D Lab' },
    update: {},
    create: { name: 'R&D Lab', address: '12, SIPCOT IT Park, Siruseri, Chennai — 603103' },
  });

  console.log('✅ Locations seeded');

  // =====================================================================
  // 2. ASSET TYPES
  // =====================================================================
  const laptopType = await prisma.assetType.upsert({
    where: { name: 'LAPTOP' },
    update: {},
    create: { name: 'LAPTOP', lifespanYears: 3 },
  });
  const serverType = await prisma.assetType.upsert({
    where: { name: 'SERVER' },
    update: {},
    create: { name: 'SERVER', lifespanYears: 5 },
  });
  const monitorType = await prisma.assetType.upsert({
    where: { name: 'MONITOR' },
    update: {},
    create: { name: 'MONITOR', lifespanYears: 5 },
  });
  const phoneType = await prisma.assetType.upsert({
    where: { name: 'MOBILE_PHONE' },
    update: {},
    create: { name: 'MOBILE_PHONE', lifespanYears: 2 },
  });

  console.log('✅ Asset types seeded');

  // =====================================================================
  // 3. USERS (Admin + Managers + 8 Employees)
  // =====================================================================

  // --- ADMIN ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { passwordHash: await hash('password123') },
    create: {
      email: 'admin@company.com',
      passwordHash: await hash('password123'),
      fullName: 'Gokulnath Senthil',
      role: UserRole.ADMIN,
      azureId: 'admin-azure-001',
      department: 'Administration',
      designation: 'System Administrator',
      employeeId: 'EMP-001',
      employeeCode: 'HRMS-0001',
      phone: '+91 98765 00001',
      gender: Gender.MALE,
      employmentType: EmploymentType.FULL_TIME,
      hireDate: new Date('2023-01-01'),
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      isActive: true,
    },
  });

  // --- MANAGER 1 (Engineering) ---
  const manager1 = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: { passwordHash: await hash('Manager@2026') },
    create: {
      email: 'manager@company.com',
      passwordHash: await hash('Manager@2026'),
      fullName: 'Priya Ramachandran',
      role: UserRole.MANAGER,
      azureId: 'manager-azure-002',
      department: 'Engineering',
      designation: 'Engineering Manager',
      employeeId: 'EMP-002',
      employeeCode: 'HRMS-0002',
      phone: '+91 98765 00002',
      gender: Gender.FEMALE,
      employmentType: EmploymentType.FULL_TIME,
      hireDate: new Date('2023-03-15'),
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      isActive: true,
      performanceRating: 5,
    },
  });

  // --- MANAGER 2 (HR) ---
  const manager2 = await prisma.user.upsert({
    where: { email: 'hr.manager@company.com' },
    update: { passwordHash: await hash('HrManager@26') },
    create: {
      email: 'hr.manager@company.com',
      passwordHash: await hash('HrManager@26'),
      fullName: 'Meenakshi Sundaram',
      role: UserRole.MANAGER,
      azureId: 'manager-azure-003',
      department: 'Human Resources',
      designation: 'HR Manager',
      employeeId: 'EMP-003',
      employeeCode: 'HRMS-0003',
      phone: '+91 98765 00003',
      gender: Gender.FEMALE,
      employmentType: EmploymentType.FULL_TIME,
      hireDate: new Date('2023-02-01'),
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      isActive: true,
      performanceRating: 4,
    },
  });

  // --- 8 EMPLOYEES ---
  const employeeData = [
    {
      email: 'emp001@company.com', password: 'Emp@001',
      fullName: 'Arjun Krishnamurthy', department: 'Engineering', designation: 'Senior Frontend Engineer',
      employeeId: 'EMP-004', employeeCode: 'HRMS-0004', phone: '+91 98765 00004',
      gender: Gender.MALE, hireDate: new Date('2023-06-01'), city: 'Chennai', rating: 4, managerId: 'manager1',
      basicSalary: 95000,
    },
    {
      email: 'emp002@company.com', password: 'Emp@002',
      fullName: 'Sneha Iyer', department: 'Engineering', designation: 'Backend Engineer',
      employeeId: 'EMP-005', employeeCode: 'HRMS-0005', phone: '+91 98765 00005',
      gender: Gender.FEMALE, hireDate: new Date('2023-08-15'), city: 'Chennai', rating: 4, managerId: 'manager1',
      basicSalary: 85000,
    },
    {
      email: 'emp003@company.com', password: 'Emp@003',
      fullName: 'Rajan Venkatesh', department: 'Engineering', designation: 'DevOps Engineer',
      employeeId: 'EMP-006', employeeCode: 'HRMS-0006', phone: '+91 98765 00006',
      gender: Gender.MALE, hireDate: new Date('2024-01-10'), city: 'Bengaluru', rating: 3, managerId: 'manager1',
      basicSalary: 90000,
    },
    {
      email: 'emp004@company.com', password: 'Emp@004',
      fullName: 'Ananya Patel', department: 'Product', designation: 'Product Manager',
      employeeId: 'EMP-007', employeeCode: 'HRMS-0007', phone: '+91 98765 00007',
      gender: Gender.FEMALE, hireDate: new Date('2023-07-20'), city: 'Chennai', rating: 5, managerId: 'manager1',
      basicSalary: 110000,
    },
    {
      email: 'emp005@company.com', password: 'Emp@005',
      fullName: 'Kiran Shankar', department: 'Human Resources', designation: 'HR Executive',
      employeeId: 'EMP-008', employeeCode: 'HRMS-0008', phone: '+91 98765 00008',
      gender: Gender.MALE, hireDate: new Date('2024-02-01'), city: 'Bengaluru', rating: 4, managerId: 'manager2',
      basicSalary: 65000,
    },
    {
      email: 'emp006@company.com', password: 'Emp@006',
      fullName: 'Pooja Reddy', department: 'Finance', designation: 'Financial Analyst',
      employeeId: 'EMP-009', employeeCode: 'HRMS-0009', phone: '+91 98765 00009',
      gender: Gender.FEMALE, hireDate: new Date('2023-11-01'), city: 'Chennai', rating: 4, managerId: null,
      basicSalary: 78000,
    },
    {
      email: 'emp007@company.com', password: 'Emp@007',
      fullName: 'Manoj Kumar', department: 'Engineering', designation: 'QA Engineer',
      employeeId: 'EMP-010', employeeCode: 'HRMS-0010', phone: '+91 98765 00010',
      gender: Gender.MALE, hireDate: new Date('2024-03-15'), city: 'Chennai', rating: 3, managerId: 'manager1',
      basicSalary: 72000,
    },
    {
      email: 'emp008@company.com', password: 'Emp@008',
      fullName: 'Divya Subramaniam', department: 'Design', designation: 'UI/UX Designer',
      employeeId: 'EMP-011', employeeCode: 'HRMS-0011', phone: '+91 98765 00011',
      gender: Gender.FEMALE, hireDate: new Date('2023-09-01'), city: 'Bengaluru', rating: 5, managerId: 'manager1',
      basicSalary: 80000,
    },
  ];

  const createdEmployees: any[] = [];
  for (const emp of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: { passwordHash: await hash(emp.password) },
      create: {
        email: emp.email,
        passwordHash: await hash(emp.password),
        fullName: emp.fullName,
        role: UserRole.USER,
        department: emp.department,
        designation: emp.designation,
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        phone: emp.phone,
        gender: emp.gender,
        employmentType: EmploymentType.FULL_TIME,
        hireDate: emp.hireDate,
        city: emp.city,
        state: emp.city === 'Chennai' ? 'Tamil Nadu' : 'Karnataka',
        country: 'India',
        isActive: true,
        performanceRating: emp.rating,
        managerId:
          emp.managerId === 'manager1'
            ? manager1.id
            : emp.managerId === 'manager2'
              ? manager2.id
              : null,
      },
    });
    createdEmployees.push({ ...user, basicSalary: emp.basicSalary });
  }

  // Set managers' managerId to admin
  await prisma.user.update({ where: { id: manager1.id }, data: { managerId: admin.id } });
  await prisma.user.update({ where: { id: manager2.id }, data: { managerId: admin.id } });

  console.log('✅ Users seeded (1 Admin + 2 Managers + 8 Employees)');

  // =====================================================================
  // 4. PAYSLIPS (3 months for each employee)
  // =====================================================================
  const payPeriods = [
    { period: 'June 2026', date: new Date('2026-06-30') },
    { period: 'May 2026',  date: new Date('2026-05-31') },
    { period: 'April 2026', date: new Date('2026-04-30') },
  ];

  for (const emp of createdEmployees) {
    const basic = emp.basicSalary;
    const hra = Math.round(basic * 0.4);
    const allowances = Math.round(basic * 0.1);
    const deductions = Math.round(basic * 0.12); // PF
    // Indian New Tax Regime slab FY2026
    const gross = basic + hra + allowances - deductions;
    let tax = 0;
    if (gross > 1500000) tax = Math.round((gross - 1500000) * 0.3 + 150000 * 0.2 + 150000 * 0.15 + 100000 * 0.1);
    else if (gross > 1200000) tax = Math.round((gross - 1200000) * 0.2 + 150000 * 0.15 + 100000 * 0.1);
    else if (gross > 900000) tax = Math.round((gross - 900000) * 0.15 + 100000 * 0.1);
    else if (gross > 600000) tax = Math.round((gross - 600000) * 0.1);
    const monthlyTax = Math.round(tax / 12);
    const net = gross - monthlyTax;

    for (const pp of payPeriods) {
      await prisma.payslip.create({
        data: {
          userId: emp.id,
          period: pp.period,
          basicSalary: basic,
          hra,
          allowances,
          deductions,
          taxAmount: monthlyTax,
          netAmount: net,
          status: 'PAID',
          date: pp.date,
        },
      });
    }
  }

  console.log('✅ Payslips seeded (3 months × 8 employees)');

  // =====================================================================
  // 5. ATTENDANCE LOGS (last 30 days for first 4 employees)
  // =====================================================================
  const today = new Date();
  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'WFH', 'PRESENT', 'HALF_DAY'];

  for (const emp of createdEmployees.slice(0, 4)) {
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dow = date.getDay(); // 0=Sun, 6=Sat
      if (dow === 0 || dow === 6) continue; // skip weekends

      const status = d % 15 === 0 ? 'LEAVE' : d % 7 === 0 ? 'WFH' : 'PRESENT';
      const clockIn = new Date(date);
      clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      const clockOut = new Date(date);
      clockOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);

      await prisma.attendanceLog.create({
        data: {
          userId: emp.id,
          date,
          clockIn: status === 'LEAVE' ? null : clockIn,
          clockOut: status === 'LEAVE' ? null : clockOut,
          status,
        },
      });
    }
  }

  console.log('✅ Attendance logs seeded');

  // =====================================================================
  // 6. LEAVE REQUESTS
  // =====================================================================
  await prisma.leaveRequest.createMany({
    data: [
      { userId: createdEmployees[0].id, type: 'Annual Leave', startDate: new Date('2026-07-01'), endDate: new Date('2026-07-05'), days: 5, status: 'APPROVED', reason: 'Family vacation' },
      { userId: createdEmployees[0].id, type: 'Sick Leave',   startDate: new Date('2026-06-10'), endDate: new Date('2026-06-10'), days: 1, status: 'APPROVED', reason: 'Fever' },
      { userId: createdEmployees[1].id, type: 'Annual Leave', startDate: new Date('2026-08-20'), endDate: new Date('2026-08-25'), days: 6, status: 'PENDING',  reason: 'Personal trip' },
      { userId: createdEmployees[2].id, type: 'Casual Leave', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-16'), days: 2, status: 'APPROVED', reason: 'Personal work' },
      { userId: createdEmployees[3].id, type: 'Sick Leave',   startDate: new Date('2026-06-25'), endDate: new Date('2026-06-26'), days: 2, status: 'REJECTED', reason: 'Not feeling well' },
      { userId: createdEmployees[4].id, type: 'Annual Leave', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-07'), days: 7, status: 'PENDING',  reason: 'Wedding' },
    ],
  });

  console.log('✅ Leave requests seeded');

  // =====================================================================
  // 7. ASSETS
  // =====================================================================
  const macbook = await prisma.asset.upsert({
    where: { tagId: 'HQ-LT-001' },
    update: {},
    create: { tagId: 'HQ-LT-001', serialNumber: 'SN-MBP-M3-001', modelName: 'MacBook Pro M3 Max', typeId: laptopType.id, locationId: hq.id, status: 'ASSIGNED', purchasePrice: 249999, purchaseDate: new Date('2024-01-15') },
  });
  const dell = await prisma.asset.upsert({
    where: { tagId: 'HQ-LT-002' },
    update: {},
    create: { tagId: 'HQ-LT-002', serialNumber: 'SN-DELL-XPS-002', modelName: 'Dell XPS 15 9530', typeId: laptopType.id, locationId: hq.id, status: 'AVAILABLE', purchasePrice: 145000, purchaseDate: new Date('2024-03-10') },
  });
  const server = await prisma.asset.upsert({
    where: { tagId: 'RD-SV-001' },
    update: {},
    create: { tagId: 'RD-SV-001', serialNumber: 'SN-PE-R750-001', modelName: 'Dell PowerEdge R750', typeId: serverType.id, locationId: rnd.id, status: 'MAINTENANCE', purchasePrice: 985000, purchaseDate: new Date('2023-06-20') },
  });

  // Assign macbook to first employee
  const existingAssignment = await prisma.assetAssignment.findFirst({ where: { assetId: macbook.id } });
  if (!existingAssignment) {
    await prisma.assetAssignment.create({
      data: { assetId: macbook.id, userId: createdEmployees[0].id, conditionNotes: 'Good condition, minor scratches on lid' },
    });
  }

  await prisma.maintenanceRecord.create({
    data: { assetId: server.id, issueType: 'Fan Failure', description: 'System fan 3 failure causing thermal throttling in Rack B-04. Replacement ordered.', priority: 'HIGH', status: 'IN_PROGRESS', scheduledDate: new Date('2026-07-20') },
  });

  console.log('✅ Assets seeded');

  // =====================================================================
  // 8. HELPDESK TICKETS
  // =====================================================================
  await prisma.helpdeskTicket.createMany({
    data: [
      { title: 'Laptop not charging',        description: 'MacBook Pro charger stopped working. Need replacement.', status: 'OPEN',        priority: 'HIGH',   userId: createdEmployees[0].id, assetId: macbook.id },
      { title: 'VPN access issue',           description: 'Unable to connect to office VPN after system update.',   status: 'IN_PROGRESS', priority: 'MEDIUM', userId: createdEmployees[1].id },
      { title: 'Email quota exceeded',       description: 'Mailbox is full. Requesting storage increase to 50 GB.', status: 'RESOLVED',    priority: 'LOW',    userId: createdEmployees[2].id },
      { title: 'Software installation req',  description: 'Need Figma and Adobe XD installed on workstation.',       status: 'OPEN',        priority: 'LOW',    userId: createdEmployees[7].id },
    ],
  });

  console.log('✅ Helpdesk tickets seeded');

  // =====================================================================
  // 9. PERFORMANCE GOALS
  // =====================================================================
  await prisma.performanceGoal.createMany({
    data: [
      { userId: createdEmployees[0].id, title: 'Launch HRMS v2.0 frontend', description: 'Complete all UI redesign tasks and deploy to production', targetDate: new Date('2026-09-30'), progress: 65, status: 'IN_PROGRESS', cycle: 'Q3 FY2026' },
      { userId: createdEmployees[0].id, title: 'Improve page load time < 2s', description: 'Optimize bundle size and implement lazy loading', targetDate: new Date('2026-08-31'), progress: 40, status: 'IN_PROGRESS', cycle: 'Q3 FY2026' },
      { userId: createdEmployees[1].id, title: 'API response time < 200ms', description: 'Optimize database queries and add caching layer', targetDate: new Date('2026-09-15'), progress: 75, status: 'IN_PROGRESS', cycle: 'Q3 FY2026' },
      { userId: createdEmployees[3].id, title: 'Launch mobile app MVP',        description: 'Define requirements and launch React Native MVP',        targetDate: new Date('2026-10-01'), progress: 20, status: 'IN_PROGRESS', cycle: 'Q3 FY2026' },
      { userId: createdEmployees[4].id, title: 'Reduce hiring TAT by 20%',     description: 'Streamline recruitment pipeline using HRMS',              targetDate: new Date('2026-08-01'), progress: 100, status: 'ACHIEVED',    cycle: 'Q2 FY2026' },
      { userId: createdEmployees[7].id, title: 'Design system v2 completion',   description: 'Complete Figma component library for HRMS',               targetDate: new Date('2026-07-31'), progress: 90, status: 'IN_PROGRESS', cycle: 'Q3 FY2026' },
    ],
  });

  console.log('✅ Performance goals seeded');

  // =====================================================================
  // 10. TRAINING COURSES & ENROLLMENTS
  // =====================================================================
  const courses = await Promise.all([
    prisma.trainingCourse.create({ data: { title: 'React & Next.js Mastery', description: 'Advanced frontend patterns with React 19 and Next.js 15', category: 'Technical', durationHrs: 24 } }),
    prisma.trainingCourse.create({ data: { title: 'AWS Cloud Practitioner', description: 'Cloud fundamentals and AWS core services', category: 'Cloud', durationHrs: 40 } }),
    prisma.trainingCourse.create({ data: { title: 'HR Analytics & People Data', description: 'Data-driven HR decisions using modern analytics tools', category: 'HR', durationHrs: 16 } }),
    prisma.trainingCourse.create({ data: { title: 'POSH & Workplace Ethics', description: 'Prevention of Sexual Harassment compliance training', category: 'Compliance', durationHrs: 4 } }),
    prisma.trainingCourse.create({ data: { title: 'Leadership Essentials', description: 'Managing teams, giving feedback, and leading with empathy', category: 'Leadership', durationHrs: 20 } }),
  ]);

  await prisma.courseEnrollment.createMany({
    data: [
      { courseId: courses[0].id, userId: createdEmployees[0].id, status: 'IN_PROGRESS', progress: 60 },
      { courseId: courses[0].id, userId: createdEmployees[1].id, status: 'COMPLETED',   progress: 100, completedAt: new Date('2026-06-15') },
      { courseId: courses[1].id, userId: createdEmployees[2].id, status: 'IN_PROGRESS', progress: 35 },
      { courseId: courses[2].id, userId: createdEmployees[4].id, status: 'COMPLETED',   progress: 100, completedAt: new Date('2026-05-20') },
      { courseId: courses[3].id, userId: createdEmployees[0].id, status: 'COMPLETED',   progress: 100, completedAt: new Date('2026-04-01') },
      { courseId: courses[3].id, userId: createdEmployees[1].id, status: 'COMPLETED',   progress: 100, completedAt: new Date('2026-04-01') },
      { courseId: courses[4].id, userId: manager1.id,           status: 'IN_PROGRESS', progress: 50 },
    ],
  });

  console.log('✅ Training courses & enrollments seeded');

  // =====================================================================
  // 11. RECRUITMENT: JOB POSTINGS + APPLICANTS
  // =====================================================================
  const feJob = await prisma.jobPosting.create({
    data: { title: 'Senior React Developer', department: 'Engineering', location: 'Chennai / Remote', type: 'FULL_TIME', description: 'Looking for an experienced React developer to join our product team.', isActive: true },
  });
  const beJob = await prisma.jobPosting.create({
    data: { title: 'Node.js Backend Engineer', department: 'Engineering', location: 'Chennai', type: 'FULL_TIME', description: 'Backend engineer with NestJS/PostgreSQL experience.', isActive: true },
  });
  const hrJob = await prisma.jobPosting.create({
    data: { title: 'HR Business Partner', department: 'Human Resources', location: 'Bengaluru', type: 'FULL_TIME', description: 'Strategic HRBP to partner with our business units.', isActive: true },
  });

  await prisma.applicant.createMany({
    data: [
      { jobId: feJob.id, name: 'Vikram Nair',       email: 'vikram.nair@gmail.com',    phone: '+91 9000100001', source: 'LinkedIn',  stage: 'SCREENING',  rating: 4, appliedAt: new Date('2026-07-01') },
      { jobId: feJob.id, name: 'Lavanya Krishnan',  email: 'lavanya.k@gmail.com',      phone: '+91 9000100002', source: 'Naukri',    stage: 'INTERVIEW',  rating: 5, appliedAt: new Date('2026-06-28') },
      { jobId: feJob.id, name: 'Suresh Babu',       email: 'suresh.b@gmail.com',       phone: '+91 9000100003', source: 'Referral',  stage: 'OFFER',      rating: 5, appliedAt: new Date('2026-06-20') },
      { jobId: beJob.id, name: 'Deepak Sharma',     email: 'deepak.s@gmail.com',       phone: '+91 9000100004', source: 'LinkedIn',  stage: 'SCREENING',  rating: 3, appliedAt: new Date('2026-07-05') },
      { jobId: beJob.id, name: 'Nandini Gopal',     email: 'nandini.g@gmail.com',      phone: '+91 9000100005', source: 'Campus',    stage: 'INTERVIEW',  rating: 4, appliedAt: new Date('2026-07-02') },
      { jobId: beJob.id, name: 'Rahul Menon',       email: 'rahul.m@gmail.com',        phone: '+91 9000100006', source: 'Direct',    stage: 'JOINED',     rating: 5, appliedAt: new Date('2026-06-01') },
      { jobId: hrJob.id, name: 'Kavitha Rajan',     email: 'kavitha.r@gmail.com',      phone: '+91 9000100007', source: 'LinkedIn',  stage: 'OFFER',      rating: 4, appliedAt: new Date('2026-06-25') },
      { jobId: hrJob.id, name: 'Preethi Sundar',    email: 'preethi.s@gmail.com',      phone: '+91 9000100008', source: 'Naukri',    stage: 'SCREENING',  rating: 3, appliedAt: new Date('2026-07-08') },
    ],
  });

  console.log('✅ Recruitment jobs & applicants seeded');

  // =====================================================================
  // 12. COMPANY UPDATES
  // =====================================================================
  await prisma.companyUpdate.createMany({
    data: [
      { title: 'Q2 FY2026 Results — Record Growth!', content: 'We achieved 142% of our Q2 revenue target. A big thank you to the entire team! Bonuses will be processed with July payroll.', type: 'announcement', author: 'CEO Office', date: new Date('2026-07-10') },
      { title: 'HRMS 2.0 Goes Live — Explore the New Look', content: 'Your new HRMS platform is now live with redesigned UI, 3D dashboard, and biometric attendance. Explore it today!', type: 'update', author: 'IT Team', date: new Date('2026-07-15') },
      { title: 'New Health & Wellness Benefits', content: 'Starting August 2026, all employees get ₹10,000 annual wellness allowance for gym, yoga, or health subscriptions.', type: 'update', author: 'Meenakshi Sundaram (HR)', date: new Date('2026-07-12') },
      { title: 'Diwali Bonus Announcement', content: 'Diwali bonus equivalent to 15 days salary will be credited on October 20, 2026 for all employees with >6 months tenure.', type: 'announcement', author: 'HR Team', date: new Date('2026-07-08') },
      { title: 'Office Renovation — 4th Floor Complete', content: 'The 4th floor collaborative space is now open. New standing desks, breakout pods, and a café corner await you!', type: 'news', author: 'Facilities Team', date: new Date('2026-07-05') },
    ],
  });

  // =====================================================================
  // 13. QUOTES
  // =====================================================================
  await prisma.quote.createMany({
    data: [
      { content: 'The strength of the team is each individual member. The strength of each member is the team.', author: 'Phil Jackson' },
      { content: 'Alone we can do so little; together we can do so much.', author: 'Helen Keller' },
      { content: 'Coming together is a beginning, staying together is progress, and working together is success.', author: 'Henry Ford' },
      { content: 'Take care of your employees and they will take care of your business.', author: 'Richard Branson' },
      { content: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
    ],
  });

  // =====================================================================
  // 14. AUDIT LOG
  // =====================================================================
  await prisma.auditLog.create({
    data: { action: 'SYSTEM_SEED', userId: admin.id, details: 'HRMS v2.0 database seeded with 11 users, assets, payslips, attendance, recruitment, and training data.' },
  });

  console.log('✅ Company updates, quotes & audit log seeded');
  console.log('\n🎉 HRMS Seeding Complete!\n');
  console.log('='.repeat(60));
  console.log('🔑 CREDENTIALS SUMMARY');
  console.log('='.repeat(60));
  console.log('🔴 ADMIN');
  console.log('   Email    : admin@company.com');
  console.log('   Password : password123');
  console.log('   EmpID    : EMP-001');
  console.log('');
  console.log('🟠 MANAGER 1 (Engineering)');
  console.log('   Email    : manager@company.com');
  console.log('   Password : Manager@2026');
  console.log('   EmpID    : EMP-002');
  console.log('');
  console.log('🟠 MANAGER 2 (HR)');
  console.log('   Email    : hr.manager@company.com');
  console.log('   Password : HrManager@26');
  console.log('   EmpID    : EMP-003');
  console.log('');
  console.log('🟢 EMPLOYEES (8 users)');
  for (let i = 1; i <= 8; i++) {
    console.log(`   emp00${i}@company.com  /  Emp@00${i}  (EMP-00${i + 3})`);
  }
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
