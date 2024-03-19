import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  fileName: string;

  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  additionalNotes: string[];
}
