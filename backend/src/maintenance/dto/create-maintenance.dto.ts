import { IsUUID, IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MaintenanceIssueType {
  HARDWARE_FAILURE = 'HARDWARE_FAILURE',
  SOFTWARE_ISSUE = 'SOFTWARE_ISSUE',
  PHYSICAL_DAMAGE = 'PHYSICAL_DAMAGE',
  PREVENTIVE = 'PREVENTIVE',
  BATTERY_REPLACEMENT = 'BATTERY_REPLACEMENT',
  THERMAL_ISSUE = 'THERMAL_ISSUE',
  STORAGE_FAILURE = 'STORAGE_FAILURE',
  OTHER = 'OTHER',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'uuid-of-asset' })
  @IsUUID()
  assetId!: string;

  @ApiProperty({ enum: MaintenanceIssueType })
  @IsEnum(MaintenanceIssueType)
  issueType!: MaintenanceIssueType;

  @ApiProperty({ example: 'Laptop overheating under sustained CPU load above 80%' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiPropertyOptional({ example: '2024-06-15', description: 'ISO date for scheduled maintenance' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;
}
