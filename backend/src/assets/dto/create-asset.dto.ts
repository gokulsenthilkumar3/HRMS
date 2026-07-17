import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateAssetDto {
  @ApiProperty({ example: 'VIQ-LT-001', description: 'Unique physical tag ID on the asset' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, { message: 'tagId must be uppercase alphanumeric with dashes only' })
  tagId!: string;

  @ApiProperty({ example: 'SN-20240101-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber!: string;

  @ApiProperty({ example: 'ThinkPad X1 Carbon Gen 12' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  modelName!: string;

  @ApiProperty({ example: 'uuid-of-asset-type' })
  @IsUUID()
  typeId!: string;

  @ApiProperty({ example: 'uuid-of-location' })
  @IsUUID()
  locationId!: string;

  @ApiProperty({ example: 85000, description: 'Purchase price in smallest currency unit' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  purchasePrice!: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  purchaseDate!: string;
}
