import {
  IsEmail,
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
  department?: string;

  @IsString()
  specialization?: string;

  @IsPhoneNumber()
  phoneNumber?: string;
}
