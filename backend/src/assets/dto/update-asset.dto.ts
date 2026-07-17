import { IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ example: 'ThinkPad X1 Carbon Gen 12' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  modelName?: string;

  @ApiPropertyOptional({ example: 'uuid-of-location' })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ example: 'uuid-of-asset-type' })
  @IsUUID()
  @IsOptional()
  typeId?: string;
}
