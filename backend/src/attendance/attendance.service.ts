import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LEAVE_LIMITS: Record<string, number> = {
  'Annual Leave': 18, 'Casual Leave': 12, 'Sick Leave': 12,
  'Maternity Leave': 180, 'Paternity Leave': 15, 'LOP': 0,
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyAttendance(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);
    const logs  = await this.prisma.attendanceLog.findMany({ where: { userId, date: { gte: start, lte: end } }, orderBy: { date: 'asc' } });
    const leaves = await this.prisma.leaveRequest.findMany({
      where: { userId, status: 'APPROVED', startDate: { lte: end }, endDate: { gte: start } },
    });
    // Build calendar grid
    const calendar: any[] = [];
    for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
      const date = new Date(year, month - 1, d);
      const dow  = date.getDay();
      const log  = logs.find(l => new Date(l.date).getDate() === d);
      const leave = leaves.find(l => date >= new Date(l.startDate) && date <= new Date(l.endDate));
      calendar.push({ date: date.toISOString().split('T')[0], day: d, dayOfWeek: dow, isWeekend: dow===0||dow===6,
        status: log?.status ?? (leave ? 'LEAVE' : dow===0||dow===6 ? 'WEEKEND' : 'ABSENT'),
        clockIn: log?.clockIn, clockOut: log?.clockOut,
        hoursWorked: log?.clockIn && log?.clockOut ? +((+new Date(log.clockOut) - +new Date(log.clockIn))/3600000).toFixed(1) : 0,
        overtime: log?.clockIn && log?.clockOut ? Math.max(0, +((+new Date(log.clockOut)-+new Date(log.clockIn))/3600000).toFixed(1) - 9) : 0,
      });
    }
    return calendar;
  }

  async getLeaveBalance(userId: string) {
    const approved = await this.prisma.leaveRequest.findMany({ where: { userId, status: 'APPROVED' } });
    const used: Record<string, number> = {};
    for (const l of approved) used[l.type] = (used[l.type] ?? 0) + l.days;
    return Object.entries(LEAVE_LIMITS).map(([type, limit]) => ({ type, limit, used: used[type]??0, remaining: Math.max(0, limit-(used[type]??0)) }));
  }

  async requestLeave(userId: string, dto: { type: string; startDate: string; endDate: string; reason: string }) {
    const start = new Date(dto.startDate), end = new Date(dto.endDate);
    if (start > end) throw new BadRequestException('Start date must be before end date');
    const days = Math.ceil((+end - +start) / 86400000) + 1;
    // Balance check
    const balance = await this.getLeaveBalance(userId);
    const bal = balance.find(b => b.type === dto.type);
    if (bal && bal.remaining < days) throw new BadRequestException(`Insufficient ${dto.type} balance (${bal.remaining} days left, requested ${days})`);
    // Overlap check
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: { userId, status: { not: 'REJECTED' }, OR: [{ startDate: { lte: end }, endDate: { gte: start } }] },
    });
    if (overlap) throw new ConflictException('You already have an approved/pending leave for this period');
    // Backdated flag
    const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const isBackdated = start < twoDaysAgo;
    return this.prisma.leaveRequest.create({
      data: { userId, type: dto.type, startDate: start, endDate: end, days, reason: dto.reason, status: isBackdated ? 'PENDING' : 'PENDING', isBackdated },
    });
  }

  async clockIn(userId: string) {
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await this.prisma.attendanceLog.findFirst({ where: { userId, date: today } });
    if (existing?.clockIn) throw new ConflictException('Already clocked in today');
    if (existing) return this.prisma.attendanceLog.update({ where: { id: existing.id }, data: { clockIn: new Date(), status: 'PRESENT' } });
    return this.prisma.attendanceLog.create({ data: { userId, date: today, clockIn: new Date(), status: 'PRESENT' } });
  }

  async clockOut(userId: string) {
    const today = new Date(); today.setHours(0,0,0,0);
    const log = await this.prisma.attendanceLog.findFirst({ where: { userId, date: today } });
    if (!log?.clockIn) throw new BadRequestException('No clock-in record found for today');
    if (log.clockOut) throw new ConflictException('Already clocked out today');
    return this.prisma.attendanceLog.update({ where: { id: log.id }, data: { clockOut: new Date() } });
  }

  async biometricSync(records: { employeeId: string; timestamp: string; type: 'IN'|'OUT' }[]) {
    const results = [];
    for (const r of records) {
      const user = await this.prisma.user.findFirst({ where: { employeeId: r.employeeId } });
      if (!user) { results.push({ employeeId: r.employeeId, error: 'Not found' }); continue; }
      const ts = new Date(r.timestamp);
      const date = new Date(ts); date.setHours(0,0,0,0);
      const existing = await this.prisma.attendanceLog.findFirst({ where: { userId: user.id, date } });
      if (r.type === 'IN') {
        if (existing) await this.prisma.attendanceLog.update({ where:{id:existing.id}, data:{clockIn:ts,status:'PRESENT'} });
        else await this.prisma.attendanceLog.create({ data:{userId:user.id,date,clockIn:ts,status:'PRESENT'} });
      } else {
        if (existing) await this.prisma.attendanceLog.update({ where:{id:existing.id}, data:{clockOut:ts} });
      }
      results.push({ employeeId: r.employeeId, synced: true });
    }
    return { total: records.length, results };
  }
}
