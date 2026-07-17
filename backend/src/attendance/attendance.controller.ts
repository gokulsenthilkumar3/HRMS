import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Get('calendar') calendar(@Request() req:any, @Query('year') y:string, @Query('month') m:string) {
    return this.svc.getMonthlyAttendance(req.user.sub, +(y||new Date().getFullYear()), +(m||new Date().getMonth()+1));
  }
  @Get('balance')  balance(@Request() req:any)  { return this.svc.getLeaveBalance(req.user.sub); }
  @Post('clock-in')  clockIn(@Request() req:any)  { return this.svc.clockIn(req.user.sub); }
  @Post('clock-out') clockOut(@Request() req:any) { return this.svc.clockOut(req.user.sub); }
  @Post('leave')   requestLeave(@Request() req:any, @Body() dto:any) { return this.svc.requestLeave(req.user.sub, dto); }

  @SkipThrottle()
  @Post('sync') biometricSync(@Body() body:{records:any[]}) { return this.svc.biometricSync(body.records); }
}
