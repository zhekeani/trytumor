import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { Request } from 'express';
import { TokenPayload } from '@app/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Specify where the jwt in the request
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Accommodate incase the cookie-parser doesn't works
          const headerCookies = request.headers.cookie;
          const headerCookiesObj: any = {};

          headerCookies?.split(';').map((cookie) => {
            const [cookieKey, cookieValue] = cookie.split('=');
            headerCookiesObj[cookieKey.trim()] = cookieValue;
          });

          // Get the token from the cookie
          return (
            request?.cookies?.Authentication || headerCookiesObj.Authentication
          );
        },
      ]),
      // Provide the jwt secret
      secretOrKey: configService.get('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate({ tokenPayload }: TokenPayload) {
    // request object will get populated with anything that being
    // returned by this method (in this case user)
    const { userId, username } = tokenPayload;

    return this.usersService.getUser({ _id: userId });
  }
}
