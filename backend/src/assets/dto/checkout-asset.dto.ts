import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutAssetDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Base64-encoded digital signature blob' })
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  signature?: string;
}
