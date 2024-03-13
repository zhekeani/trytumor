import {
  ArrayMinSize,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePatientDto {
  @IsUrl()
  profilePictureURL: string;

  @IsString()
  fullName: string;

  @IsDate()
  birthDate: Date;

  @IsNumber()
  weight: number;

  @IsNumber()
  height: number;

  @IsEmail()
  email: string;

  @IsString()
  address: string;

  @IsOptional()
  @ArrayMinSize(0)
  @IsString({ each: true })
  previousMedicalConditions: string[];

  @IsOptional()
  @ArrayMinSize(0)
  @IsString({ each: true })
  familyMedicalHistory: string[];

  @IsOptional()
  @ArrayMinSize(0)
  @IsString({ each: true })
  allergies: string[];
}
