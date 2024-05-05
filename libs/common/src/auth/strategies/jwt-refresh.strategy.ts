import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../interfaces';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(@Inject('JWT_REFRESH_SECRET') jwtRefreshSecret: string) {
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
            request?.cookies?.refresh_token || headerCookiesObj.refresh_token
          );
        },
      ]),
      secretOrKey: jwtRefreshSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(tokenPayload: TokenPayload) {
    return { ...tokenPayload };
  }
}
