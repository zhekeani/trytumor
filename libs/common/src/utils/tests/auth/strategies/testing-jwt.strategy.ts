import { Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../../../../interfaces';

export class TestingJwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('JWT_TESTING_SECRET') jwtTestingSecret: string) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Accommodate incase the cookie-parser doesn't works
          const headerCookies = request.headers.cookie;
          const headerCookiesObj: any = {};

          headerCookies?.split(';').map((cookie) => {
            const [cookieKey, cookieValue] = cookie.split('=');
            headerCookiesObj[cookieKey.trim()] = cookieValue;
          });

          return (
            request?.cookies?.Authentication || headerCookiesObj.Authentication
          );
        },
      ]),
      secretOrKey: jwtTestingSecret,
      algorithms: ['HS256'],
    });
  }

  async validate({ tokenPayload }: TokenPayload) {
    return { ...tokenPayload };
  }
}
