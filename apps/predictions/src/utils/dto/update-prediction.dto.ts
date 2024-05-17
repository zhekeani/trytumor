import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdatePredictionDto {
  @IsString()
  @Length(8)
  @IsOptional()
  fileName: string;

  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  additionalNotes: string[];
}
