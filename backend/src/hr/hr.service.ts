import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async getUpdates() {
    return this.prisma.companyUpdate.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    });
  }

  async getRandomQuote() {
    const count = await this.prisma.quote.count();
    if (count === 0) return { content: 'Have a great day!' };
    const skip = Math.floor(Math.random() * count);
    const quotes = await this.prisma.quote.findMany({
      take: 1,
      skip: skip,
    });
    return quotes[0];
  }

  async getLeaveRequests(userId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveRequest(userId: string, data: any) {
    return this.prisma.leaveRequest.create({
      data: {
        userId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        days: data.days || 1, // simplified calculation
        status: 'PENDING',
      },
    });
  }

  async getPayslips(userId: string) {
    return this.prisma.payslip.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async getAttendanceStatus(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const log = await this.prisma.attendanceLog.findFirst({
      where: {
        userId,
        clockIn: { gte: today },
      },
      orderBy: { clockIn: 'desc' },
    });
    return {
      isClockedIn: !!log && !log.clockOut,
      clockTime: log ? log.clockIn : null,
    };
  }

  async toggleAttendance(userId: string) {
    const status = await this.getAttendanceStatus(userId);
    if (status.isClockedIn) {
      // Clock out
      const log = await this.prisma.attendanceLog.findFirst({
        where: { userId, clockOut: null },
        orderBy: { clockIn: 'desc' },
      });
      if (log) {
        return this.prisma.attendanceLog.update({
          where: { id: log.id },
          data: { clockOut: new Date() },
        });
      }
    } else {
      // Clock in
      return this.prisma.attendanceLog.create({
        data: {
          userId,
          clockIn: new Date(),
        },
      });
    }
  }

  // Phase 4: Automated Onboarding / Offboarding Logic
  async onboardEmployee(data: { fullName: string; email: string; department: string; role: 'USER' | 'MANAGER' | 'ADMIN' }) {
    // 1. Create the user
    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        department: data.department,
        role: data.role,
        azureId: `AZ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        hireDate: new Date(),
      }
    });

    // 2. Generate an Onboarding Workflow Task for IT
    const task = await this.prisma.workflowTask.create({
      data: {
        title: `Provision IT Bundle for ${user.fullName} (${user.department})`,
        type: 'ONBOARD',
        targetUserId: user.id,
        // Mock assignedTo IT Admin (Just picking the first admin for simulation)
        assignedToId: (await this.prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || user.id
      }
    });

    return { user, task, message: 'Employee successfully synced from Azure AD and IT provisioning initiated.' };
  }

  async offboardEmployee(userId: string) {
    // 1. Fetch user and their current active assignments
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { assignments: { where: { returnedAt: null } } }
    });

    if (!user) throw new Error('User not found');

    // 2. Generate an Offboarding Workflow Task
    const task = await this.prisma.workflowTask.create({
      data: {
        title: `Revoke Access and Collect Assets for ${user.fullName}`,
        type: 'OFFBOARD',
        targetUserId: user.id,
        assignedToId: (await this.prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || user.id
      }
    });

    // Note: Actual asset returnedAt updates would happen when IT physically scans the items back in.
    return { user, task, pendingAssets: user.assignments.length, message: 'Offboarding workflow initiated successfully.' };
  }
}
