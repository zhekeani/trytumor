import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @Length(5, 20)
  @IsString()
  username: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  department: string;

  @IsString()
  @IsOptional()
  specialization: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;
}
