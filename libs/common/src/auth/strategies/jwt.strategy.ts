import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('JWT_SECRET') jwtSecret: string) {
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
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(tokenPayload: TokenPayload) {
    return { ...tokenPayload };
  }
}
