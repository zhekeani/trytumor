import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  patientId: string;

  @IsString()
  fileName: string;

  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  @ValidateNested({ each: true })
  additionalNotes: string[];
}
