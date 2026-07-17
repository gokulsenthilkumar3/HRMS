import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckinAssetDto {
  @ApiPropertyOptional({ example: 'Minor scratch on lid. Trackpad functional.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  conditionNotes?: string;
}
