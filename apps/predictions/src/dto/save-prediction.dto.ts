import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { PatientDataDto } from './patient-data.dto';
import { PredictionDataDto } from './prediction-data.dto';

export class SavePredictionDto {
  @ValidateNested()
  patientData: PatientDataDto;

  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  predictionsData: PredictionDataDto[];
}
