import { ExecutionContext, createParamDecorator } from '@nestjs/common';

const getRefreshTokenByContext = (context: ExecutionContext) => {
  return context.switchToHttp().getRequest().cookies.refresh_token;
};

export const RefreshToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getRefreshTokenByContext(context),
);
