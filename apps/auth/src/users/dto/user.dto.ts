import { Expose } from 'class-transformer';

// dto used represent user data that should be exposed
export class UserDto {
  @Expose()
  _id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;
}
