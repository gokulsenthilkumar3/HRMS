import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'HQ Floor 3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '123 Anna Salai, Chennai, TN 600002' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;
}
