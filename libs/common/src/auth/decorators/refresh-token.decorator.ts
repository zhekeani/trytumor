import { ExecutionContext, createParamDecorator } from '@nestjs/common';

const getRefreshTokenByContext = (context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const headerCookies = request.headers.cookie;
  const headerCookiesObj: any = {};

  headerCookies?.split(';').map((cookie: string) => {
    const [cookieKey, cookieValue] = cookie.split('=');
    headerCookiesObj[cookieKey.trim()] = cookieValue;
  });

  return request.cookies?.refresh_token || headerCookiesObj.refresh_token;
};

export const RefreshToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getRefreshTokenByContext(context),
);
