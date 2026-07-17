import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  @ApiPropertyOptional({ example: 'Replaced thermal paste and cleaned fan. Temperature stabilised at 62°C.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  technicianNotes?: string;
}
