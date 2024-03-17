import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PercentageDto, PredictionResultDto } from './prediction-result.dto.js';

export class PredictionDataDto {
  @IsNumber()
  @Min(1)
  number: number;

  @IsString()
  userId: string;

  @IsString()
  doctorName: string;

  @IsDate()
  @Type(() => Date)
  dateAndTime: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PredictionResultDto)
  results: PredictionResultDto[];

  @ValidateNested()
  @Type(() => PercentageDto)
  resultsMean: PercentageDto;

  @IsString()
  fileName: string;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  additionalNotes: string[];
}
