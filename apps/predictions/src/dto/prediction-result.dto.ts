import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsUrl } from 'class-validator';

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
  @IsOptional()
  imageUrl: string;

  @IsArray()
  @Type(() => PercentageDto)
  percentages: PercentageDto;
}
