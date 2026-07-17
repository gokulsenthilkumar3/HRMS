import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')    stats()    { return this.dashboardService.getStats(); }
  @Get('trends')   trends()   { return this.dashboardService.getTrends(); }
  @Get('activity') activity() { return this.dashboardService.getRecentActivity(); }
}
