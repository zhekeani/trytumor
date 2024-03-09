import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({ usernameField: 'usernameAndEmail' });
  }

  async validate(usernameAndEmail: string, password: string) {
    try {
      return this.usersService.verifyUser(usernameAndEmail, password);
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
