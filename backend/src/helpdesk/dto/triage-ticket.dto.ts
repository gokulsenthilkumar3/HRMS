import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriageTicketDto {
  @ApiProperty({ example: 'Laptop screen flickering on startup after Windows update' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: 'Laptop' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  assetType?: string;
}
