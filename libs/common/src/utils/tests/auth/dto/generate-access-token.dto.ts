import { IsString } from 'class-validator';

export class GenerateAccessTokenDto {
  @IsString()
  userId: string;

  @IsString()
  fullName: string;
}
