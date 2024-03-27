import { IsArray, IsString, Length, ValidateNested } from 'class-validator';

export class EditPredictionDto {
  @IsString()
  @Length(8)
  fileName: string;

  @IsArray()
  additionalNotes: string[];
}
