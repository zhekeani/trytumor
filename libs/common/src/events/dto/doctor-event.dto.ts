import { IsString } from 'class-validator';

export class DoctorUpdateEventDto {
  @IsString()
  doctorId: string;

  @IsString()
  fullName: string;
}
