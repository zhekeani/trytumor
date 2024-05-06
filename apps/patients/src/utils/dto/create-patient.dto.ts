import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDate,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Gender } from '@app/common';

export class CreatePatientDto {
  @IsUrl()
  @IsOptional()
  profilePicURL: string;

  @IsString()
  fullName: string;

  @IsDate()
  @Type(() => Date)
  birthDate: Date;

  @IsString()
  @IsNotEmpty()
  @IsIn(['female', 'male'])
  gender: Gender;

  @Transform(({ value }) => parseInt(value))
  @IsNumber({})
  height: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber({})
  weight: number;

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
