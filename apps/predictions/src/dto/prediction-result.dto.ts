import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class PercentageDto {
  @IsNumber()
  glioma: number;

  @IsNumber()
  meningioma: number;

  @IsNumber()
  noTumor: number;

  @IsNumber()
  pituitary: number;
}

export class PredictionResultDto {
  @IsUrl()
  imageUrl: string;

  @IsString()
  @IsOptional()
  imageIndex: number;

  @IsArray()
  @Type(() => PercentageDto)
  percentages: PercentageDto;
}
