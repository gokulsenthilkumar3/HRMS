import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(
    private readonly hrService: HrService,
    private prisma: PrismaService
  ) {}

  @Get('updates')
  async getUpdates() {
    return this.hrService.getUpdates();
  }

  @Get('quotes/random')
  async getRandomQuote() {
    return this.hrService.getRandomQuote();
  }

  @Get('leave-requests')
  async getLeaveRequests(@Req() req: any) {
    const userId = req.user.sub;
    return this.hrService.getLeaveRequests(userId);
  }

  @Post('leave-requests')
  async createLeaveRequest(@Req() req: any, @Body() data: any) {
    const userId = req.user.sub;
    return this.hrService.createLeaveRequest(userId, data);
  }

  @Get('payslips')
  async getPayslips(@Req() req: any) {
    const userId = req.user.sub;
    return this.hrService.getPayslips(userId);
  }

  @Get('attendance/status')
  async getAttendanceStatus(@Req() req: any) {
    const userId = req.user.sub;
    return this.hrService.getAttendanceStatus(userId);
  }

  @Post('attendance/toggle')
  async toggleAttendance(@Req() req: any) {
    const userId = req.user.sub;
    return this.hrService.toggleAttendance(userId);
  }

  @Post('onboard')
  async onboardEmployee(@Body() data: { fullName: string; email: string; department: string; role: 'USER' | 'MANAGER' | 'ADMIN' }) {
    return this.hrService.onboardEmployee(data);
  }

  @Post('offboard')
  async offboardEmployee(@Body() data: { userId: string }) {
    return this.hrService.offboardEmployee(data.userId);
  }
}
