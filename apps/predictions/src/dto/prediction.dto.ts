import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PatientDataDto } from './patient-data.dto';
import { PredictionDataDto } from './prediction-data.dto';

export class PredictionDto {
  @ValidateNested()
  patientData: PatientDataDto;

  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  @ValidateNested({ each: true })
  predictionsData: PredictionDataDto[];
}
