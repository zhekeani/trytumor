import { IsDate, IsIn, IsString } from 'class-validator';

import { Type } from 'class-transformer';
import { Gender } from '../interfaces/gender.interface';

export class PatientDataDto {
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
