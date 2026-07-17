import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateAssetTypeDto {
  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 4, description: 'Expected lifespan in years' })
  @IsInt()
  @Min(1)
  @Max(30)
  @Transform(({ value }) => parseInt(value, 10))
  lifespanYears!: number;
}
