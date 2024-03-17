import { IsDate, IsIn, IsString } from 'class-validator';
import { Gender } from '../../interfaces/gender.interface';
import { Type } from 'class-transformer';

export class PatientNewToPredictionsDto {
  @IsString()
  id: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsIn(['female', 'male'])
  gender: Gender;

  @IsDate()
  @Type(() => Date)
  birthDate: Date;
}
