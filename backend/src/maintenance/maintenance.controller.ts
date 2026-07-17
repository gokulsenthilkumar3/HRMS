import { Controller, Get, Patch, Param, Body, UseGuards, Post, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { MaintenanceEngine } from './maintenance.engine';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private maintenanceEngine: MaintenanceEngine) {}

  @Get()
  @ApiOperation({ summary: 'List all maintenance records' })
  async findAll() {
    return this.maintenanceEngine.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Create a new maintenance record' })
  async create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceEngine.createRecord(dto);
  }

  @Get('triage')
  @ApiOperation({ summary: 'Get open/in-progress maintenance triage queue' })
  async getTriage() {
    return this.maintenanceEngine.getTriageQueue();
  }

  @Get(':id/forecast')
  @ApiOperation({ summary: 'Get predictive maintenance forecast for an asset' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  async getForecast(@Param('id', ParseUUIDPipe) assetId: string) {
    return this.maintenanceEngine.getForecast(assetId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Update a maintenance record status' })
  async updateRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceEngine.updateRecord(id, dto.status, dto.technicianNotes);
  }
}
