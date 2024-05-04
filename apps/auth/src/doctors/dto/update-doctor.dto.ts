import { IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateDoctorDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;
}
