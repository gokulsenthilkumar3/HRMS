import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Locations
  const hq = await prisma.location.upsert({
    where: { name: 'Corporate HQ' },
    update: {},
    create: {
      name: 'Corporate HQ',
      address: '123 Tech Park, Innovation Way',
    },
  });

  const lab = await prisma.location.upsert({
    where: { name: 'R&D Lab' },
    update: {},
    create: {
      name: 'R&D Lab',
      address: '456 Science Blvd, Lab City',
    },
  });

  // 2. Create Asset Types
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

  // 3. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin.test@kangeyan.com' },
    update: {},
    create: {
      email: 'admin.test@kangeyan.com',
      fullName: 'Main Administrator',
      role: 'ADMIN',
      azureId: 'test-admin-sso',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager.test@kangeyan.com' },
    update: {},
    create: {
      email: 'manager.test@kangeyan.com',
      fullName: 'Regional Manager',
      role: 'MANAGER',
      azureId: 'test-manager-sso',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'user.test@kangeyan.com' },
    update: {},
    create: {
      email: 'user.test@kangeyan.com',
      fullName: 'General Staff',
      role: 'USER',
      azureId: 'test-user-sso',
    },
  });

  // 4. Create Assets
  const macbook = await prisma.asset.upsert({
    where: { tagId: 'VIQ-LT-001' },
    update: {},
    create: {
      tagId: 'VIQ-LT-001',
      serialNumber: 'SN-MBP-2024',
      modelName: 'MacBook Pro M3 Max',
      typeId: laptopType.id,
      locationId: hq.id,
      status: 'AVAILABLE',
      purchasePrice: 3499.00,
      purchaseDate: new Date('2024-01-15'),
    },
  });

  const dellServer = await prisma.asset.upsert({
    where: { tagId: 'VIQ-SV-001' },
    update: {},
    create: {
      tagId: 'VIQ-SV-001',
      serialNumber: 'SN-DELL-R750',
      modelName: 'PowerEdge R750',
      typeId: serverType.id,
      locationId: lab.id,
      status: 'MAINTENANCE',
      purchasePrice: 12500.00,
      purchaseDate: new Date('2023-06-20'),
    },
  });

  // 5. Create Maintenance Records
  await prisma.maintenanceRecord.create({
    data: {
      assetId: dellServer.id,
      issueType: 'High Thermal Throttling',
      description: 'System fan 3 failure causing heat spike in Rack B-04',
      status: 'OPEN',
      scheduledDate: new Date(),
    }
  });

  // 6. Create Audit Logs
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INIT',
      userId: admin.id,
      details: 'VaultIQ Core System Initialization and Seeding',
    }
  });

  // 7. Create HR Records
  await prisma.companyUpdate.createMany({
    data: [
      { title: 'Q3 Townhall Meeting Scheduled', content: 'Join us on Friday at 3 PM EST for the quarterly company all-hands meeting. We will discuss our Q3 growth and Q4 roadmap.', date: new Date('2026-10-12'), author: 'HR Communications', type: 'announcement' },
      { title: 'New Health Insurance Benefits', content: 'We have updated our premium health plan to include dental and vision with no extra co-pay. Check the portal for details.', date: new Date('2026-10-10'), author: 'Jane Smith (HR)', type: 'update' },
      { title: 'Office Renovation Complete', content: 'The 4th floor renovation is finally done. Feel free to use the new collaboration spaces starting Monday.', date: new Date('2026-10-05'), author: 'Facilities Team', type: 'news' }
    ]
  });

  await prisma.leaveRequest.createMany({
    data: [
      { userId: staff.id, type: 'Annual Leave', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-05'), days: 5, status: 'APPROVED' },
      { userId: staff.id, type: 'Sick Leave', startDate: new Date('2026-08-15'), endDate: new Date('2026-08-15'), days: 1, status: 'APPROVED' },
      { userId: staff.id, type: 'Outdoor Duty', startDate: new Date('2026-10-20'), endDate: new Date('2026-10-22'), days: 3, status: 'PENDING' },
    ]
  });

  await prisma.payslip.createMany({
    data: [
      { userId: staff.id, period: 'September 2026', amount: '$5,240.00', status: 'PAID', date: new Date('2026-09-30') },
      { userId: staff.id, period: 'August 2026', amount: '$5,240.00', status: 'PAID', date: new Date('2026-08-31') },
      { userId: staff.id, period: 'July 2026', amount: '$5,240.00', status: 'PAID', date: new Date('2026-07-31') },
    ]
  });

  await prisma.quote.createMany({
    data: [
      { content: '"The strength of the team is each individual member. The strength of each member is the team." – Phil Jackson' },
      { content: '"Success is not final, failure is not fatal: it is the courage to continue that counts." – Winston Churchill' },
      { content: '"Alone we can do so little; together we can do so much." – Helen Keller' }
    ]
  });

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
