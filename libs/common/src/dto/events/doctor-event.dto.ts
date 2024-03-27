import { IsString } from 'class-validator';

export class DoctorEditEventDto {
  @IsString()
  userId: string;

  @IsString()
  fullName: string;
}
