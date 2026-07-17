import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [total, active, genderRaw, deptRaw, openJobs, newHires, leavePending] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.groupBy({ by: ['gender'], _count: { gender: true } }),
        this.prisma.user.groupBy({ by: ['department'], where: { isActive: true, department: { not: null } }, _count: { department: true }, orderBy: { _count: { department: 'desc' } }, take: 8 }),
        this.prisma.jobPosting.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { hireDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
        this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      ]);

    const inactive = total - active;
    const attritionRate = total > 0 ? +((inactive / total) * 100).toFixed(1) : 0;

    return {
      totalHeadcount: total,
      activeEmployees: active,
      attritionRate,
      openPositions: openJobs,
      newHiresThisMonth: newHires,
      pendingLeaveRequests: leavePending,
      genderDistribution: genderRaw.map(g => ({ name: g.gender ?? 'UNKNOWN', value: g._count.gender })),
      departmentBreakdown: deptRaw.map(d => ({ dept: d.department ?? 'Unknown', count: d._count.department })),
    };
  }

  async getTrends() {
    const months: { month: string; headcount: number; newJoinees: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const [headcount, newJoinees] = await Promise.all([
        this.prisma.user.count({ where: { isActive: true, hireDate: { lte: new Date(d.getFullYear(), d.getMonth() + 1, 0) } } }),
        this.prisma.user.count({ where: { hireDate: { gte: d, lte: new Date(d.getFullYear(), d.getMonth() + 1, 0) } } }),
      ]);
      months.push({ month: label, headcount, newJoinees });
    }
    return months;
  }

  async getRecentActivity() {
    const [leaves, tickets] = await Promise.all([
      this.prisma.leaveRequest.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true, employeeId: true, avatarUrl: true } } } }),
      this.prisma.helpdeskTicket.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true } } } }),
    ]);
    return { leaves, tickets };
  }
}
