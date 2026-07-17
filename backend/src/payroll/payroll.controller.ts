import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private svc: PayrollService) {}

  @Get('my') myPayslips(@Request() req: any) { return this.svc.getUserPayslips(req.user.sub); }
  @Get('user/:id') @UseGuards(RolesGuard) @Roles('ADMIN','MANAGER') userPayslips(@Param('id') id: string) { return this.svc.getUserPayslips(id); }

  @Post('calculate') calculate(@Body() body: { basicSalary: number }) {
    const salary = this.svc.calculateGrossSalary({ basicSalary: body.basicSalary });
    const tax    = this.svc.calculateTax(salary.gross * 12);
    return { salary, tax };
  }

  @Post('run') @UseGuards(RolesGuard) @Roles('ADMIN') run(@Body() body: { period: string }, @Request() req: any) { return this.svc.runPayroll(body.period, req.user.sub); }
  @Patch('approve/:period') @UseGuards(RolesGuard) @Roles('ADMIN','MANAGER') approve(@Param('period') p: string) { return this.svc.approvePayrun(p); }
  @Patch('process/:period') @UseGuards(RolesGuard) @Roles('ADMIN') process(@Param('period') p: string)  { return this.svc.processPayrun(p); }

  @Post('validate-bank') validateBank(@Body() b: { ifsc: string; accountNumber: string; pan: string }) { return this.svc.validateBankDetails(b.ifsc, b.accountNumber, b.pan); }
}
