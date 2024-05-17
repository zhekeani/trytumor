import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  @Length(8)
  fileName: string;

  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  additionalNotes: string[];
}
