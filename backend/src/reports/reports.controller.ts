import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('audit-export')
  async exportAudit() {
    return this.reportsService.getAuditExport();
  }

  @Get('depreciation')
  async exportDepreciation() {
    return this.reportsService.getDepreciationExport();
  }
}
