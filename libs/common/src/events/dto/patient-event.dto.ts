import { IsDate, IsIn, IsString } from 'class-validator';
import { Gender } from '../../common';
import { Type } from 'class-transformer';

export class PatientNewEventDto {
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

export class PatientDeleteEventDto {
  id: string;
}
